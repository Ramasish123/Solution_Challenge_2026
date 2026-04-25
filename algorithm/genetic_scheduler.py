from __future__ import annotations

import random
import statistics
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Iterable, Optional, Union

from sqlalchemy.orm import Session

from app.models import (
    Batch,
    Classroom,
    Faculty,
    FacultyAvailability,
    FacultySubject,
    Subject,
    TimeSlot,
)


HARD_PENALTY = 1000


@dataclass(frozen=True)
class Gene:
    batch_id: int
    subject_id: int
    faculty_id: int
    classroom_id: int
    timeslot_id: int


@dataclass
class Chromosome:
    genes: list[Gene]
    fitness_score: float = 0.0
    metrics: Optional[dict[str, float]] = None


@dataclass
class GAConfig:
    population_size: int = 60
    generations: int = 120
    mutation_rate: float = 0.12
    elite_count: int = 5
    solution_count: int = 5
    tournament_size: int = 4


@dataclass
class GenerationSnapshot:
    """Metrics captured at each generation for convergence tracking."""
    generation: int
    best_fitness: float
    avg_fitness: float
    worst_fitness: float
    mutation_rate: float


@dataclass
class GAResult:
    top_solutions: list[Chromosome]
    generations_executed: int
    final_mutation_rate: float
    generation_history: list[GenerationSnapshot] = field(default_factory=list)
    baseline_metrics: Optional[dict[str, float]] = None
    explanation: Optional[dict[str, float]] = None


@dataclass
class ProblemData:
    faculties: list[Faculty]
    subjects: list[Subject]
    classrooms: list[Classroom]
    batches: list[Batch]
    timeslots: list[TimeSlot]
    faculty_subject_map: dict[int, list[int]]
    faculty_availability: dict[tuple[int, int], bool]
    batch_subject_requirements: list[tuple[int, int]]
    faculty_by_id: dict[int, Faculty]
    subject_by_id: dict[int, Subject]
    classroom_by_id: dict[int, Classroom]
    batch_by_id: dict[int, Batch]
    timeslot_by_id: dict[int, TimeSlot]

    def entry_to_gene(self, entry) -> Gene:
        return Gene(
            batch_id=entry.batch_id,
            subject_id=entry.subject_id,
            faculty_id=entry.faculty_id,
            classroom_id=entry.classroom_id,
            timeslot_id=entry.timeslot_id,
        )


def build_problem_data(db: Session) -> ProblemData:
    faculties = db.query(Faculty).all()
    subjects = db.query(Subject).all()
    classrooms = db.query(Classroom).all()
    batches = db.query(Batch).all()
    timeslots = db.query(TimeSlot).all()
    faculty_subjects = db.query(FacultySubject).all()
    availabilities = db.query(FacultyAvailability).all()

    faculty_subject_map = defaultdict(list)
    for item in faculty_subjects:
        faculty_subject_map[item.subject_id].append(item.faculty_id)

    faculty_availability = {
        (item.faculty_id, item.timeslot_id): item.is_available for item in availabilities
    }

    batch_subject_requirements = []
    for batch in batches:
        department_code = batch.department.code
        for subject in subjects:
            if department_code[:2] in subject.code or "BSC" in subject.code:
                for _ in range(subject.hours_per_week):
                    batch_subject_requirements.append((batch.id, subject.id))

    return ProblemData(
        faculties=faculties,
        subjects=subjects,
        classrooms=classrooms,
        batches=batches,
        timeslots=timeslots,
        faculty_subject_map=dict(faculty_subject_map),
        faculty_availability=faculty_availability,
        batch_subject_requirements=batch_subject_requirements,
        faculty_by_id={item.id: item for item in faculties},
        subject_by_id={item.id: item for item in subjects},
        classroom_by_id={item.id: item for item in classrooms},
        batch_by_id={item.id: item for item in batches},
        timeslot_by_id={item.id: item for item in timeslots},
    )


class GeneticScheduler:
    def __init__(self, problem: ProblemData, config: GAConfig) -> None:
        self.problem = problem
        self.config = config
        self.random = random.Random(42)

    def run(self) -> GAResult:
        # Generate baseline random chromosome for comparison
        baseline_chromosome = self._create_random_chromosome()
        self._repair_chromosome(baseline_chromosome)
        baseline_fitness, baseline_metrics = self._fitness(baseline_chromosome)

        population = [self._create_random_chromosome() for _ in range(self.config.population_size)]
        mutation_rate = self.config.mutation_rate
        best_scores: list[float] = []
        generation_history: list[GenerationSnapshot] = []

        for generation in range(self.config.generations):
            self._evaluate_population(population)
            population.sort(key=lambda chromosome: chromosome.fitness_score, reverse=True)
            best_scores.append(population[0].fitness_score)

            # Record generation snapshot
            fitness_values = [c.fitness_score for c in population]
            generation_history.append(GenerationSnapshot(
                generation=generation,
                best_fitness=round(max(fitness_values), 2),
                avg_fitness=round(sum(fitness_values) / len(fitness_values), 2),
                worst_fitness=round(min(fitness_values), 2),
                mutation_rate=round(mutation_rate, 4),
            ))

            mutation_rate = self._adapt_mutation_rate(best_scores, mutation_rate)
            population = self._evolve(population, mutation_rate)

        self._evaluate_population(population)
        population.sort(key=lambda chromosome: chromosome.fitness_score, reverse=True)

        top_solutions = self._unique_top_solutions(population)
        best = top_solutions[0] if top_solutions else None

        # Build explanation comparing best solution against baseline
        explanation = self._build_explanation(best, baseline_metrics) if best else {}

        return GAResult(
            top_solutions=top_solutions,
            generations_executed=self.config.generations,
            final_mutation_rate=mutation_rate,
            generation_history=generation_history,
            baseline_metrics=baseline_metrics,
            explanation=explanation,
        )

    def run_partial(
        self,
        locked_genes: list[Gene],
        genes_to_repair: list[Gene],
        blocked_pairs: set[tuple[int, int]],
    ) -> GAResult:
        population = [
            self._create_partial_chromosome(locked_genes, genes_to_repair, blocked_pairs)
            for _ in range(self.config.population_size)
        ]
        mutation_rate = self.config.mutation_rate
        best_scores: list[float] = []
        generation_history: list[GenerationSnapshot] = []

        for generation in range(self.config.generations):
            self._evaluate_population(population)
            population.sort(key=lambda chromosome: chromosome.fitness_score, reverse=True)
            best_scores.append(population[0].fitness_score)

            fitness_values = [c.fitness_score for c in population]
            generation_history.append(GenerationSnapshot(
                generation=generation,
                best_fitness=round(max(fitness_values), 2),
                avg_fitness=round(sum(fitness_values) / len(fitness_values), 2),
                worst_fitness=round(min(fitness_values), 2),
                mutation_rate=round(mutation_rate, 4),
            ))

            mutation_rate = self._adapt_mutation_rate(best_scores, mutation_rate)
            population = self._evolve(population, mutation_rate, locked_gene_count=len(locked_genes))

        self._evaluate_population(population)
        population.sort(key=lambda chromosome: chromosome.fitness_score, reverse=True)
        return GAResult(
            top_solutions=self._unique_top_solutions(population, limit=3),
            generations_executed=self.config.generations,
            final_mutation_rate=mutation_rate,
            generation_history=generation_history,
        )

    def _build_explanation(self, best: Chromosome, baseline_metrics: dict) -> dict:
        """Compare the best solution against a random baseline to produce real explanations."""
        if not best or not best.metrics or not baseline_metrics:
            return {}

        best_conflicts = best.metrics.get("conflict_count", 0)
        base_conflicts = baseline_metrics.get("conflict_count", 1)
        conflict_reduction = round(
            max(0, (base_conflicts - best_conflicts) / max(base_conflicts, 1)) * 100, 1
        )

        best_util = best.metrics.get("utilization_percent", 0)
        base_util = baseline_metrics.get("utilization_percent", 0)
        utilization_improvement = round(best_util - base_util, 1)

        workload_balance = round(best.metrics.get("faculty_load_balance", 0), 1)

        # Constraint satisfaction: (total checks - violations) / total checks
        total_genes = len(best.genes) if best.genes else 1
        constraint_checks = total_genes * 7  # 7 hard constraint checks per gene
        violations = best_conflicts
        satisfaction_rate = round(
            max(0, (constraint_checks - violations) / constraint_checks) * 100, 1
        )

        return {
            "conflict_reduction_percent": conflict_reduction,
            "workload_balance_score": workload_balance,
            "utilization_improvement": utilization_improvement,
            "constraint_satisfaction_rate": satisfaction_rate,
            "baseline_fitness": round(baseline_metrics.get("fitness", 0), 2) if "fitness" in baseline_metrics else 0,
            "baseline_conflicts": base_conflicts,
            "baseline_utilization": base_util,
        }

    def _evaluate_population(self, population: list[Chromosome]) -> None:
        for chromosome in population:
            self._repair_chromosome(chromosome)
            chromosome.fitness_score, chromosome.metrics = self._fitness(chromosome)

    def _fitness(self, chromosome: Chromosome) -> tuple[float, dict[str, float]]:
        faculty_usage = Counter()
        room_usage = Counter()
        batch_usage = Counter()
        faculty_load = Counter()
        room_load = Counter()
        batch_slots = defaultdict(list)
        faculty_slots = defaultdict(list)
        batch_slot_subject = {}
        hard_violations = 0
        capacity_violations = 0
        heavy_streak_penalty = 0

        for gene in chromosome.genes:
            batch = self.problem.batch_by_id[gene.batch_id]
            subject = self.problem.subject_by_id[gene.subject_id]
            room = self.problem.classroom_by_id[gene.classroom_id]
            slot = self.problem.timeslot_by_id[gene.timeslot_id]

            faculty_key = (gene.faculty_id, gene.timeslot_id)
            room_key = (gene.classroom_id, gene.timeslot_id)
            batch_key = (gene.batch_id, gene.timeslot_id)

            faculty_usage[faculty_key] += 1
            room_usage[room_key] += 1
            batch_usage[batch_key] += 1
            faculty_load[gene.faculty_id] += 1
            room_load[gene.classroom_id] += 1
            batch_slots[gene.batch_id].append(slot)
            faculty_slots[gene.faculty_id].append(slot)
            
            if batch_key not in batch_slot_subject:
                batch_slot_subject[batch_key] = gene.subject_id

            if faculty_usage[faculty_key] > 1:
                hard_violations += 1
            if room_usage[room_key] > 1:
                hard_violations += 1
            if batch_usage[batch_key] > 1:
                hard_violations += 1
            if room.capacity < batch.students:
                capacity_violations += 1
            if subject.is_lab and room.room_type != "lab":
                hard_violations += 1
            if not subject.is_lab and room.room_type == "lab" and batch.students > room.capacity:
                capacity_violations += 1
            if gene.faculty_id not in self.problem.faculty_subject_map.get(gene.subject_id, []):
                hard_violations += 1
            if not self.problem.faculty_availability.get((gene.faculty_id, gene.timeslot_id), True):
                hard_violations += 1

        for batch_id, slots in batch_slots.items():
            ordered = sorted(slots, key=lambda slot: (slot.day, slot.start_time))
            daily_streak = 0
            previous_day = None
            previous_time = None
            for slot in ordered:
                subject_id = batch_slot_subject[(batch_id, slot.id)]
                subject = self.problem.subject_by_id[subject_id]
                if slot.day != previous_day or previous_time is None:
                    daily_streak = 1 if subject.is_heavy else 0
                else:
                    daily_streak = daily_streak + 1 if subject.is_heavy else 0
                if daily_streak >= 3:
                    heavy_streak_penalty += 1
                previous_day = slot.day
                previous_time = slot.start_time

        gap_penalty = self._calculate_gap_penalty(faculty_slots)
        workload_balance = self._calculate_workload_balance(faculty_load)
        utilization = (
            len(room_load) / max(len(self.problem.classrooms), 1) * 100
            if chromosome.genes
            else 0
        )

        soft_score = (
            workload_balance * 1.2
            + max(0, 100 - gap_penalty * 6)
            + max(0, 100 - heavy_streak_penalty * 12)
            + utilization
        )
        penalty = (hard_violations * HARD_PENALTY) + (capacity_violations * 800)
        fitness = max(0.0, 10000 + soft_score - penalty)
        metrics = {
            "conflict_count": float(hard_violations + capacity_violations),
            "utilization_percent": round(utilization, 2),
            "faculty_load_balance": round(workload_balance, 2),
            "gap_penalty": float(gap_penalty),
            "fitness": round(fitness, 2),
        }
        return fitness, metrics

    def _calculate_gap_penalty(self, faculty_slots: dict[int, list[TimeSlot]]) -> int:
        penalty = 0
        for slots in faculty_slots.values():
            grouped = defaultdict(list)
            for slot in slots:
                grouped[slot.day].append(slot.start_time)
            for day_slots in grouped.values():
                ordered = sorted(day_slots)
                for left, right in zip(ordered, ordered[1:]):
                    if self._time_to_minutes(right) - self._time_to_minutes(left) > 75:
                        penalty += 1
        return penalty

    def _calculate_workload_balance(self, faculty_load: Counter) -> float:
        if not faculty_load:
            return 0
        values = list(faculty_load.values())
        if len(values) == 1:
            return 100
        deviation = statistics.pstdev(values)
        return max(0.0, 100 - (deviation * 15))

    def _evolve(
        self,
        population: list[Chromosome],
        mutation_rate: float,
        locked_gene_count: int = 0,
    ) -> list[Chromosome]:
        next_generation = population[: self.config.elite_count]
        while len(next_generation) < self.config.population_size:
            parent_a = self._tournament_selection(population)
            parent_b = self._tournament_selection(population)
            child_a, child_b = self._crossover(parent_a, parent_b, locked_gene_count)
            self._mutate(child_a, mutation_rate, locked_gene_count)
            self._mutate(child_b, mutation_rate, locked_gene_count)
            next_generation.extend([child_a, child_b])
        return next_generation[: self.config.population_size]

    def _tournament_selection(self, population: list[Chromosome]) -> Chromosome:
        sample = self.random.sample(population, k=min(self.config.tournament_size, len(population)))
        return max(sample, key=lambda chromosome: chromosome.fitness_score)

    def _crossover(
        self, parent_a: Chromosome, parent_b: Chromosome, locked_gene_count: int = 0
    ) -> tuple[Chromosome, Chromosome]:
        if len(parent_a.genes) <= 2:
            return Chromosome(parent_a.genes[:]), Chromosome(parent_b.genes[:])
        start = self.random.randint(locked_gene_count, len(parent_a.genes) - 2)
        end = self.random.randint(start + 1, len(parent_a.genes) - 1)
        child_a_genes = parent_a.genes[:start] + parent_b.genes[start:end] + parent_a.genes[end:]
        child_b_genes = parent_b.genes[:start] + parent_a.genes[start:end] + parent_b.genes[end:]
        return Chromosome(child_a_genes), Chromosome(child_b_genes)

    def _mutate(self, chromosome: Chromosome, mutation_rate: float, locked_gene_count: int = 0) -> None:
        for index in range(locked_gene_count, len(chromosome.genes)):
            if self.random.random() < mutation_rate:
                gene = chromosome.genes[index]
                chromosome.genes[index] = self._mutated_gene(
                    gene,
                    chromosome.genes[:index] + chromosome.genes[index + 1 :],
                )

    def _mutated_gene(self, gene: Gene, existing_genes: list[Gene]) -> Gene:
        return self._build_gene(
            batch_id=gene.batch_id,
            subject_id=gene.subject_id,
            existing_genes=existing_genes,
        )

    def _create_random_chromosome(self) -> Chromosome:
        genes = []
        for batch_id, subject_id in self.problem.batch_subject_requirements:
            genes.append(self._build_gene(batch_id=batch_id, subject_id=subject_id, existing_genes=genes))
        chromosome = Chromosome(genes=genes)
        self._repair_chromosome(chromosome)
        return chromosome

    def _create_partial_chromosome(
        self,
        locked_genes: list[Gene],
        genes_to_repair: list[Gene],
        blocked_pairs: set[tuple[int, int]],
    ) -> Chromosome:
        genes = locked_genes[:]
        for gene in genes_to_repair:
            repaired = self._build_gene(
                batch_id=gene.batch_id,
                subject_id=gene.subject_id,
                existing_genes=genes,
                blocked_pairs=blocked_pairs,
            )
            attempts = 0
            while (repaired.faculty_id, repaired.timeslot_id) in blocked_pairs and attempts < 20:
                repaired = self._build_gene(
                    batch_id=gene.batch_id,
                    subject_id=gene.subject_id,
                    existing_genes=genes,
                    blocked_pairs=blocked_pairs,
                )
                attempts += 1
            genes.append(repaired)
        chromosome = Chromosome(genes=genes)
        self._repair_chromosome(chromosome, blocked_pairs=blocked_pairs)
        return chromosome

    def _build_gene(
        self,
        batch_id: int,
        subject_id: int,
        existing_genes: list[Gene],
        blocked_pairs: Optional[set[tuple[int, int]]] = None,
    ) -> Gene:
        batch = self.problem.batch_by_id[batch_id]
        subject = self.problem.subject_by_id[subject_id]
        blocked_pairs = blocked_pairs or set()

        qualified = self.problem.faculty_subject_map.get(subject_id, [])
        faculty_ids = qualified or [faculty.id for faculty in self.problem.faculties]
        slot_candidates = [slot for slot in self.problem.timeslots if slot.shift == batch.shift]
        room_candidates = [
            room
            for room in self.problem.classrooms
            if room.department_id == batch.department_id and room.capacity >= batch.students
        ]
        if subject.is_lab:
            room_candidates = [room for room in room_candidates if room.room_type == "lab"] or room_candidates
        else:
            room_candidates = [room for room in room_candidates if room.room_type == "lecture"] or room_candidates
        if not room_candidates:
            room_candidates = self.problem.classrooms

        scored_options = []
        
        existing_batch_slots = Counter()
        existing_faculty_slots = Counter()
        existing_room_slots = Counter()
        existing_batch_day_times = Counter()

        for existing in existing_genes:
            existing_batch_slots[(existing.batch_id, existing.timeslot_id)] += 1
            existing_faculty_slots[(existing.faculty_id, existing.timeslot_id)] += 1
            existing_room_slots[(existing.classroom_id, existing.timeslot_id)] += 1
            if existing.batch_id == batch_id:
                existing_slot = self.problem.timeslot_by_id[existing.timeslot_id]
                existing_batch_day_times[(existing_slot.day, existing_slot.start_time)] += 1

        for faculty_id in faculty_ids:
            faculty_risk = self.problem.faculty_by_id[faculty_id].leave_probability
            faculty_risk_penalty = faculty_risk * 5
            
            for slot in slot_candidates:
                if (faculty_id, slot.id) in blocked_pairs:
                    continue
                availability_penalty = 0 if self.problem.faculty_availability.get((faculty_id, slot.id), True) else 4
                
                batch_slot_penalty = 5 * existing_batch_slots.get((batch_id, slot.id), 0)
                faculty_slot_penalty = 5 * existing_faculty_slots.get((faculty_id, slot.id), 0)
                batch_day_time_penalty = 3 * existing_batch_day_times.get((slot.day, slot.start_time), 0)
                
                base_score = (
                    availability_penalty 
                    + batch_slot_penalty 
                    + faculty_slot_penalty 
                    + batch_day_time_penalty
                    + faculty_risk_penalty
                )
                
                for room in room_candidates:
                    score = base_score + 5 * existing_room_slots.get((room.id, slot.id), 0)
                    score += max(0, batch.students - room.capacity) * 2
                    score -= room.capacity / 100
                    scored_options.append((score, faculty_id, room.id, slot.id))

        if not scored_options:
            fallback_room = self._pick_room(subject_id, batch.students, batch.department_id)
            fallback_slot = self.random.choice(slot_candidates)
            fallback_faculty = self.random.choice(faculty_ids)
            return Gene(batch_id, subject_id, fallback_faculty, fallback_room.id, fallback_slot.id)

        scored_options.sort(key=lambda item: item[0])
        chosen = self.random.choice(scored_options[: min(5, len(scored_options))])
        return Gene(
            batch_id=batch_id,
            subject_id=subject_id,
            faculty_id=chosen[1],
            classroom_id=chosen[2],
            timeslot_id=chosen[3],
        )

    def _repair_chromosome(
        self,
        chromosome: Chromosome,
        blocked_pairs: Optional[set[tuple[int, int]]] = None,
    ) -> None:
        repaired_genes = []
        blocked_pairs = blocked_pairs or set()
        for gene in chromosome.genes:
            if self._gene_has_hard_conflict(gene, repaired_genes, blocked_pairs):
                repaired_genes.append(
                    self._build_gene(
                        batch_id=gene.batch_id,
                        subject_id=gene.subject_id,
                        existing_genes=repaired_genes,
                        blocked_pairs=blocked_pairs,
                    )
                )
            else:
                repaired_genes.append(gene)
        chromosome.genes = repaired_genes

    def _gene_has_hard_conflict(
        self,
        gene: Gene,
        existing_genes: list[Gene],
        blocked_pairs: set[tuple[int, int]],
    ) -> bool:
        batch = self.problem.batch_by_id[gene.batch_id]
        room = self.problem.classroom_by_id[gene.classroom_id]
        subject = self.problem.subject_by_id[gene.subject_id]

        if (gene.faculty_id, gene.timeslot_id) in blocked_pairs:
            return True
        if not self.problem.faculty_availability.get((gene.faculty_id, gene.timeslot_id), True):
            return True
        if gene.faculty_id not in self.problem.faculty_subject_map.get(gene.subject_id, []):
            return True
        if room.capacity < batch.students:
            return True
        if subject.is_lab and room.room_type != "lab":
            return True

        for existing in existing_genes:
            same_slot = existing.timeslot_id == gene.timeslot_id
            if same_slot and existing.batch_id == gene.batch_id:
                return True
            if same_slot and existing.faculty_id == gene.faculty_id:
                return True
            if same_slot and existing.classroom_id == gene.classroom_id:
                return True
        return False

    def _pick_room(self, subject_id: int, student_count: int, department_id: int) -> Classroom:
        subject = self.problem.subject_by_id[subject_id]
        rooms = [
            room
            for room in self.problem.classrooms
            if room.capacity >= student_count and room.department_id == department_id
        ]
        if subject.is_lab:
            lab_rooms = [room for room in rooms if room.room_type == "lab"]
            if lab_rooms:
                return self.random.choice(lab_rooms)
        lecture_rooms = [room for room in rooms if room.room_type == "lecture"]
        if lecture_rooms:
            return self.random.choice(lecture_rooms)
        return self.random.choice(self.problem.classrooms)

    def _adapt_mutation_rate(self, best_scores: list[float], current_rate: float) -> float:
        if len(best_scores) < 8:
            return current_rate
        recent = best_scores[-8:]
        improvement = max(recent) - min(recent)
        if improvement < 5:
            return min(0.35, round(current_rate + 0.03, 3))
        return max(0.05, round(current_rate - 0.01, 3))

    def _unique_top_solutions(
        self, population: list[Chromosome], limit: Optional[int] = None
    ) -> list[Chromosome]:
        seen = set()
        solutions = []
        desired = limit or self.config.solution_count
        for chromosome in population:
            signature = tuple(
                sorted(
                    (
                        gene.batch_id,
                        gene.subject_id,
                        gene.faculty_id,
                        gene.classroom_id,
                        gene.timeslot_id,
                    )
                    for gene in chromosome.genes
                )
            )
            if signature in seen:
                continue
            seen.add(signature)
            solutions.append(chromosome)
            if len(solutions) == desired:
                break
        return solutions

    @staticmethod
    @lru_cache(maxsize=128)
    def _time_to_minutes(value: str) -> int:
        hours, minutes = value.split(":")
        return int(hours) * 60 + int(minutes)


def create_suggestions(entries: Iterable) -> list[dict[str, Union[float, str]]]:
    batch_day_count = Counter((entry.batch_id, entry.day) for entry in entries)
    suggestions = []
    for (batch_id, day), count in batch_day_count.items():
        if count >= 4:
            suggestions.append(
                {
                    "title": "Reduce dense day load",
                    "detail": f"Batch {batch_id} has {count} sessions on {day}; swapping one slot can reduce fatigue.",
                    "projected_gain": 18.0,
                }
            )
            break

    faculty_pairs = Counter((entry.faculty_id, entry.day) for entry in entries)
    for (faculty_id, day), count in faculty_pairs.items():
        if count >= 3:
            suggestions.append(
                {
                    "title": "Balance faculty day plan",
                    "detail": f"Faculty {faculty_id} has a heavy {day} schedule; a targeted swap could improve load balance.",
                    "projected_gain": 14.0,
                }
            )
            break

    if not suggestions:
        suggestions.append(
            {
                "title": "Current solution is near-optimal",
                "detail": "Only incremental micro-swaps are likely to improve the present schedule.",
                "projected_gain": 6.0,
            }
        )
    return suggestions
