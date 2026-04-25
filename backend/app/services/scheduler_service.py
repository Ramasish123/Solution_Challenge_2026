import sys
from pathlib import Path

from sqlalchemy.orm import Session, joinedload

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from algorithm.genetic_scheduler import (
    GAConfig,
    GeneticScheduler,
    build_problem_data,
    create_suggestions,
)
from app.models import TimeSlot, Timetable, TimetableEntry
from app.schemas.scheduler import (
    DashboardStats,
    ExplanationPayload,
    GenerateTimetableRequest,
    GenerationHistoryPoint,
    RescheduleRequest,
    RescheduleResponse,
    ScheduleGenerationResponse,
    SuggestionPayload,
    TimetableEntryPayload,
    TimetableListResponse,
    TimetablePayload,
)


def generate_timetables(
    db: Session, payload: GenerateTimetableRequest, current_user
) -> ScheduleGenerationResponse:
    problem = build_problem_data(db)
    config = GAConfig(
        population_size=payload.population_size,
        generations=payload.generations,
        mutation_rate=payload.mutation_rate,
        elite_count=payload.elite_count,
        solution_count=payload.solution_count,
    )
    scheduler = GeneticScheduler(problem, config)
    result = scheduler.run()

    db.query(TimetableEntry).delete()
    db.query(Timetable).delete()
    db.commit()

    saved = []
    for index, solution in enumerate(result.top_solutions, start=1):
        timetable = Timetable(
            name=f"Optimized Schedule #{index}",
            status="optimized",
            generated_by=current_user.id,
            fitness_score=solution.fitness_score,
            conflict_count=solution.metrics["conflict_count"],
            utilization_percent=solution.metrics["utilization_percent"],
            load_balance_score=solution.metrics["faculty_load_balance"],
            notes="Generated via adaptive genetic optimization",
        )
        db.add(timetable)
        db.flush()

        for gene in solution.genes:
            entry = TimetableEntry(
                timetable_id=timetable.id,
                batch_id=gene.batch_id,
                subject_id=gene.subject_id,
                faculty_id=gene.faculty_id,
                classroom_id=gene.classroom_id,
                timeslot_id=gene.timeslot_id,
                department_id=problem.batch_by_id[gene.batch_id].department_id,
                shift=problem.batch_by_id[gene.batch_id].shift,
            )
            db.add(entry)
        saved.append(timetable)
    db.commit()

    timetables = _serialize_timetables(saved, db)
    best = result.top_solutions[0]

    # Build explanation payload from real GA metrics
    explanation = None
    if result.explanation:
        explanation = ExplanationPayload(**result.explanation)

    # Build generation history
    generation_history = [
        GenerationHistoryPoint(
            generation=snap.generation,
            best_fitness=snap.best_fitness,
            avg_fitness=snap.avg_fitness,
            worst_fitness=snap.worst_fitness,
            mutation_rate=snap.mutation_rate,
        )
        for snap in result.generation_history
    ]

    return ScheduleGenerationResponse(
        stats=DashboardStats(
            utilization_percent=best.metrics["utilization_percent"],
            conflict_count=best.metrics["conflict_count"],
            faculty_load_balance=best.metrics["faculty_load_balance"],
            mutation_rate=result.final_mutation_rate,
            generations_executed=result.generations_executed,
        ),
        timetables=timetables,
        explanation=explanation,
        generation_history=generation_history,
        baseline_metrics=result.baseline_metrics,
    )


def list_timetables(db: Session) -> TimetableListResponse:
    timetables = (
        db.query(Timetable)
        .options(
            joinedload(Timetable.entries).joinedload(TimetableEntry.batch),
            joinedload(Timetable.entries).joinedload(TimetableEntry.subject),
            joinedload(Timetable.entries).joinedload(TimetableEntry.faculty),
            joinedload(Timetable.entries).joinedload(TimetableEntry.classroom),
            joinedload(Timetable.entries).joinedload(TimetableEntry.timeslot),
            joinedload(Timetable.entries).joinedload(TimetableEntry.department),
        )
        .order_by(Timetable.fitness_score.desc())
        .all()
    )
    return TimetableListResponse(timetables=_serialize_timetables(timetables, db))


def reschedule_timetable(
    db: Session, payload: RescheduleRequest, current_user
) -> RescheduleResponse:
    timetable = (
        db.query(Timetable)
        .options(
            joinedload(Timetable.entries).joinedload(TimetableEntry.batch),
            joinedload(Timetable.entries).joinedload(TimetableEntry.subject),
            joinedload(Timetable.entries).joinedload(TimetableEntry.faculty),
            joinedload(Timetable.entries).joinedload(TimetableEntry.classroom),
            joinedload(Timetable.entries).joinedload(TimetableEntry.timeslot),
            joinedload(Timetable.entries).joinedload(TimetableEntry.department),
        )
        .filter(Timetable.id == payload.timetable_id)
        .first()
    )
    if not timetable:
        return RescheduleResponse(
            stats=DashboardStats(
                utilization_percent=0,
                conflict_count=0,
                faculty_load_balance=0,
                mutation_rate=0,
                generations_executed=0,
            ),
            timetables=[],
        )

    # Capture before snapshot
    before_timetable = _serialize_timetables([timetable], db)[0]

    problem = build_problem_data(db)
    fixed_genes = []
    genes_to_repair = []
    affected_entry_ids = []
    for entry in timetable.entries:
        gene = problem.entry_to_gene(entry)
        if (
            entry.faculty_id == payload.faculty_id
            and entry.timeslot_id in payload.unavailable_timeslot_ids
        ):
            genes_to_repair.append(gene)
            affected_entry_ids.append(entry.id)
        else:
            fixed_genes.append(gene)

    config = GAConfig(
        population_size=40,
        generations=80,
        mutation_rate=0.15,
        elite_count=4,
        solution_count=3,
    )
    scheduler = GeneticScheduler(problem, config)
    result = scheduler.run_partial(
        locked_genes=fixed_genes,
        genes_to_repair=genes_to_repair,
        blocked_pairs={(payload.faculty_id, timeslot_id) for timeslot_id in payload.unavailable_timeslot_ids},
    )

    db.query(TimetableEntry).filter(TimetableEntry.timetable_id == timetable.id).delete()
    timetable.fitness_score = result.top_solutions[0].fitness_score
    timetable.conflict_count = result.top_solutions[0].metrics["conflict_count"]
    timetable.utilization_percent = result.top_solutions[0].metrics["utilization_percent"]
    timetable.load_balance_score = result.top_solutions[0].metrics["faculty_load_balance"]
    timetable.notes = "Partially rescheduled for faculty unavailability"

    for gene in result.top_solutions[0].genes:
        db.add(
            TimetableEntry(
                timetable_id=timetable.id,
                batch_id=gene.batch_id,
                subject_id=gene.subject_id,
                faculty_id=gene.faculty_id,
                classroom_id=gene.classroom_id,
                timeslot_id=gene.timeslot_id,
                department_id=problem.batch_by_id[gene.batch_id].department_id,
                shift=problem.batch_by_id[gene.batch_id].shift,
            )
        )
    db.commit()
    db.refresh(timetable)

    serialized = _serialize_timetables([timetable], db)
    after_timetable = serialized[0] if serialized else None
    best = result.top_solutions[0]

    # Calculate disruption metrics
    changed_count = len(genes_to_repair)
    total_entries = len(result.top_solutions[0].genes)
    disruption_score = round(changed_count / max(total_entries, 1) * 100, 1)

    generation_history = [
        GenerationHistoryPoint(
            generation=snap.generation,
            best_fitness=snap.best_fitness,
            avg_fitness=snap.avg_fitness,
            worst_fitness=snap.worst_fitness,
            mutation_rate=snap.mutation_rate,
        )
        for snap in result.generation_history
    ]

    return RescheduleResponse(
        stats=DashboardStats(
            utilization_percent=best.metrics["utilization_percent"],
            conflict_count=best.metrics["conflict_count"],
            faculty_load_balance=best.metrics["faculty_load_balance"],
            mutation_rate=result.final_mutation_rate,
            generations_executed=result.generations_executed,
        ),
        timetables=serialized,
        before_timetable=before_timetable,
        after_timetable=after_timetable,
        disruption_score=disruption_score,
        changed_slots_count=changed_count,
        changed_slot_ids=affected_entry_ids,
        generation_history=generation_history,
    )


def _serialize_timetables(timetables: list[Timetable], db: Session) -> list[TimetablePayload]:
    serialized = []
    slot_lookup = {slot.id: slot for slot in db.query(TimeSlot).all()}

    for timetable in timetables:
        entries = sorted(
            timetable.entries,
            key=lambda entry: (
                entry.timeslot.day if entry.timeslot else slot_lookup[entry.timeslot_id].day,
                entry.timeslot.start_time if entry.timeslot else slot_lookup[entry.timeslot_id].start_time,
            ),
        )

        entry_payloads = [
            TimetableEntryPayload(
                id=entry.id,
                batch_id=entry.batch_id,
                batch_name=entry.batch.name,
                subject_id=entry.subject_id,
                subject_name=entry.subject.name,
                faculty_id=entry.faculty_id,
                faculty_name=entry.faculty.name,
                classroom_id=entry.classroom_id,
                classroom_name=entry.classroom.name,
                timeslot_id=entry.timeslot_id,
                day=(entry.timeslot or slot_lookup[entry.timeslot_id]).day,
                time_range=f"{(entry.timeslot or slot_lookup[entry.timeslot_id]).start_time}-{(entry.timeslot or slot_lookup[entry.timeslot_id]).end_time}",
                shift=entry.shift,
                department=entry.department.code,
            )
            for entry in entries
        ]

        suggestions = [
            SuggestionPayload(
                title=suggestion["title"],
                detail=suggestion["detail"],
                projected_gain=suggestion["projected_gain"],
            )
            for suggestion in create_suggestions(entry_payloads)
        ]

        serialized.append(
            TimetablePayload(
                timetable_id=timetable.id,
                name=timetable.name,
                fitness_score=round(timetable.fitness_score, 2),
                conflict_count=timetable.conflict_count,
                utilization_percent=round(timetable.utilization_percent, 2),
                faculty_load_balance=round(timetable.load_balance_score, 2),
                entries=entry_payloads,
                suggestions=suggestions,
            )
        )

    return serialized
