from typing import Optional

from pydantic import BaseModel, Field


class GenerateTimetableRequest(BaseModel):
    population_size: int = Field(default=60, ge=20, le=300)
    generations: int = Field(default=120, ge=20, le=1000)
    mutation_rate: float = Field(default=0.12, ge=0.01, le=0.8)
    elite_count: int = Field(default=5, ge=1, le=20)
    solution_count: int = Field(default=5, ge=3, le=5)


class RescheduleRequest(BaseModel):
    timetable_id: int
    faculty_id: int
    unavailable_timeslot_ids: list[int]


class TimetableEntryPayload(BaseModel):
    id: int = 0
    batch_id: int
    batch_name: str
    subject_id: int
    subject_name: str
    faculty_id: int
    faculty_name: str
    classroom_id: int
    classroom_name: str
    timeslot_id: int
    day: str
    time_range: str
    shift: str
    department: str


class SuggestionPayload(BaseModel):
    title: str
    detail: str
    projected_gain: float


class TimetablePayload(BaseModel):
    timetable_id: int
    name: str
    fitness_score: float
    conflict_count: int
    utilization_percent: float
    faculty_load_balance: float
    entries: list[TimetableEntryPayload]
    suggestions: list[SuggestionPayload]


class DashboardStats(BaseModel):
    utilization_percent: float
    conflict_count: int
    faculty_load_balance: float
    mutation_rate: float
    generations_executed: int


# ── Explainable AI schemas ───────────────────────────────────────────

class ExplanationPayload(BaseModel):
    conflict_reduction_percent: float = 0
    workload_balance_score: float = 0
    utilization_improvement: float = 0
    constraint_satisfaction_rate: float = 0
    baseline_fitness: float = 0
    baseline_conflicts: float = 0
    baseline_utilization: float = 0


class GenerationHistoryPoint(BaseModel):
    generation: int
    best_fitness: float
    avg_fitness: float
    worst_fitness: float = 0
    mutation_rate: float


# ── Enhanced generation response ─────────────────────────────────────

class ScheduleGenerationResponse(BaseModel):
    stats: DashboardStats
    timetables: list[TimetablePayload]
    explanation: Optional[ExplanationPayload] = None
    generation_history: list[GenerationHistoryPoint] = []
    baseline_metrics: Optional[dict[str, float]] = None


# ── Reschedule response with before/after ────────────────────────────

class RescheduleResponse(BaseModel):
    stats: DashboardStats
    timetables: list[TimetablePayload]
    before_timetable: Optional[TimetablePayload] = None
    after_timetable: Optional[TimetablePayload] = None
    disruption_score: float = 0
    changed_slots_count: int = 0
    changed_slot_ids: list[int] = []
    generation_history: list[GenerationHistoryPoint] = []


class TimetableListResponse(BaseModel):
    timetables: list[TimetablePayload]
