from typing import Optional

from pydantic import BaseModel, Field


# ── Faculty ──────────────────────────────────────────────────────────

class FacultyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=120)
    department_id: int
    leave_probability: float = Field(default=0.0, ge=0.0, le=1.0)
    max_hours_per_week: int = Field(default=18, ge=1, le=40)
    subject_ids: list[int] = Field(default_factory=list)


class FacultyCreate(FacultyBase):
    pass


class FacultyUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[str] = Field(default=None, min_length=5, max_length=120)
    department_id: Optional[int] = None
    leave_probability: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    max_hours_per_week: Optional[int] = Field(default=None, ge=1, le=40)
    subject_ids: Optional[list[int]] = None


class FacultyResponse(BaseModel):
    id: int
    name: str
    email: str
    department_id: int
    department_name: str = ""
    leave_probability: float
    max_hours_per_week: int
    subject_ids: list[int] = []
    subject_names: list[str] = []


# ── Subject ──────────────────────────────────────────────────────────

class SubjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    code: str = Field(..., min_length=2, max_length=20)
    hours_per_week: int = Field(..., ge=1, le=20)
    is_heavy: bool = False
    is_lab: bool = False


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    code: Optional[str] = Field(default=None, min_length=2, max_length=20)
    hours_per_week: Optional[int] = Field(default=None, ge=1, le=20)
    is_heavy: Optional[bool] = None
    is_lab: Optional[bool] = None


class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    hours_per_week: int
    is_heavy: bool
    is_lab: bool


# ── Classroom ────────────────────────────────────────────────────────

class ClassroomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    capacity: int = Field(..., ge=1)
    room_type: str = Field(..., pattern=r"^(lecture|lab)$")
    department_id: int


class ClassroomCreate(ClassroomBase):
    pass


class ClassroomUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    capacity: Optional[int] = Field(default=None, ge=1)
    room_type: Optional[str] = Field(default=None, pattern=r"^(lecture|lab)$")
    department_id: Optional[int] = None


class ClassroomResponse(BaseModel):
    id: int
    name: str
    capacity: int
    room_type: str
    department_id: int
    department_name: str = ""


# ── Batch ────────────────────────────────────────────────────────────

class BatchBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    students: int = Field(..., ge=1)
    semester: int = Field(..., ge=1, le=12)
    shift: str = Field(..., pattern=r"^(morning|afternoon)$")
    department_id: int


class BatchCreate(BatchBase):
    pass


class BatchUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    students: Optional[int] = Field(default=None, ge=1)
    semester: Optional[int] = Field(default=None, ge=1, le=12)
    shift: Optional[str] = Field(default=None, pattern=r"^(morning|afternoon)$")
    department_id: Optional[int] = None


class BatchResponse(BaseModel):
    id: int
    name: str
    students: int
    semester: int
    shift: str
    department_id: int
    department_name: str = ""


# ── Constraint ───────────────────────────────────────────────────────

class ConstraintBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    category: str = Field(..., pattern=r"^(hard|soft)$")
    weight: int = Field(default=0, ge=0)
    scope: str = Field(..., max_length=30)
    rule_definition: str


class ConstraintCreate(ConstraintBase):
    pass


class ConstraintUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    category: Optional[str] = Field(default=None, pattern=r"^(hard|soft)$")
    weight: Optional[int] = Field(default=None, ge=0)
    scope: Optional[str] = Field(default=None, max_length=30)
    rule_definition: Optional[str] = None


class ConstraintResponse(BaseModel):
    id: int
    name: str
    category: str
    weight: int
    scope: str
    rule_definition: str


# ── Faculty Availability ─────────────────────────────────────────────

class AvailabilitySlot(BaseModel):
    timeslot_id: int
    is_available: bool


class AvailabilityResponse(BaseModel):
    faculty_id: int
    faculty_name: str
    slots: list[AvailabilitySlot]


class AvailabilityUpdate(BaseModel):
    slots: list[AvailabilitySlot]


# ── Department (read-only listing) ───────────────────────────────────

class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str


# ── Timeslot (read-only listing) ─────────────────────────────────────

class TimeslotResponse(BaseModel):
    id: int
    day: str
    start_time: str
    end_time: str
    shift: str


# ── Generic list wrappers ────────────────────────────────────────────

class FacultyListResponse(BaseModel):
    items: list[FacultyResponse]


class SubjectListResponse(BaseModel):
    items: list[SubjectResponse]


class ClassroomListResponse(BaseModel):
    items: list[ClassroomResponse]


class BatchListResponse(BaseModel):
    items: list[BatchResponse]


class ConstraintListResponse(BaseModel):
    items: list[ConstraintResponse]


class DepartmentListResponse(BaseModel):
    items: list[DepartmentResponse]


class TimeslotListResponse(BaseModel):
    items: list[TimeslotResponse]


class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[str]
