import csv
import io
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.academics import (
    Batch,
    Classroom,
    ConstraintRule,
    Department,
    Faculty,
    FacultyAvailability,
    FacultySubject,
    Subject,
    TimeSlot,
)
from app.schemas.crud_schemas import (
    AvailabilityResponse,
    AvailabilitySlot,
    AvailabilityUpdate,
    BatchCreate,
    BatchListResponse,
    BatchResponse,
    BatchUpdate,
    ClassroomCreate,
    ClassroomListResponse,
    ClassroomResponse,
    ClassroomUpdate,
    ConstraintCreate,
    ConstraintListResponse,
    ConstraintResponse,
    ConstraintUpdate,
    DepartmentListResponse,
    DepartmentResponse,
    FacultyCreate,
    FacultyListResponse,
    FacultyResponse,
    FacultyUpdate,
    ImportResult,
    SubjectCreate,
    SubjectListResponse,
    SubjectResponse,
    SubjectUpdate,
    TimeslotListResponse,
    TimeslotResponse,
)

router = APIRouter(prefix="/data", tags=["data-management"])


# ── Helpers ──────────────────────────────────────────────────────────

def _faculty_to_response(faculty: Faculty) -> FacultyResponse:
    subject_ids = [fs.subject_id for fs in (faculty.subjects or [])]
    subject_names = [fs.subject.name for fs in (faculty.subjects or []) if fs.subject]
    dept_name = faculty.department.name if faculty.department else ""
    return FacultyResponse(
        id=faculty.id,
        name=faculty.name,
        email=faculty.email,
        department_id=faculty.department_id,
        department_name=dept_name,
        leave_probability=faculty.leave_probability,
        max_hours_per_week=faculty.max_hours_per_week,
        subject_ids=subject_ids,
        subject_names=subject_names,
    )


def _sync_faculty_subjects(db: Session, faculty_id: int, subject_ids: list[int]) -> None:
    db.query(FacultySubject).filter(FacultySubject.faculty_id == faculty_id).delete()
    for sid in subject_ids:
        db.add(FacultySubject(faculty_id=faculty_id, subject_id=sid))


# ── Departments (read-only) ─────────────────────────────────────────

@router.get("/departments", response_model=DepartmentListResponse)
def list_departments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    items = db.query(Department).order_by(Department.name).all()
    return DepartmentListResponse(
        items=[DepartmentResponse(id=d.id, name=d.name, code=d.code) for d in items]
    )


# ── Timeslots (read-only) ───────────────────────────────────────────

@router.get("/timeslots", response_model=TimeslotListResponse)
def list_timeslots(db: Session = Depends(get_db), _=Depends(get_current_user)):
    items = db.query(TimeSlot).order_by(TimeSlot.day, TimeSlot.start_time).all()
    return TimeslotListResponse(
        items=[
            TimeslotResponse(id=s.id, day=s.day, start_time=s.start_time, end_time=s.end_time, shift=s.shift)
            for s in items
        ]
    )


# ── Faculty CRUD ─────────────────────────────────────────────────────

@router.get("/faculty", response_model=FacultyListResponse)
def list_faculty(db: Session = Depends(get_db), _=Depends(get_current_user)):
    items = db.query(Faculty).order_by(Faculty.name).all()
    return FacultyListResponse(items=[_faculty_to_response(f) for f in items])


@router.post("/faculty", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED)
def create_faculty(
    payload: FacultyCreate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler", "teacher")),
):
    if db.query(Faculty).filter(Faculty.email == payload.email).first():
        raise HTTPException(status_code=409, detail="A faculty member with this email already exists.")
    faculty = Faculty(
        name=payload.name,
        email=payload.email,
        department_id=payload.department_id,
        leave_probability=payload.leave_probability,
        max_hours_per_week=payload.max_hours_per_week,
    )
    db.add(faculty)
    db.flush()
    if payload.subject_ids:
        _sync_faculty_subjects(db, faculty.id, payload.subject_ids)
    db.commit()
    db.refresh(faculty)
    return _faculty_to_response(faculty)


@router.get("/faculty/{faculty_id}", response_model=FacultyResponse)
def get_faculty(faculty_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found.")
    return _faculty_to_response(faculty)


@router.put("/faculty/{faculty_id}", response_model=FacultyResponse)
def update_faculty(
    faculty_id: int,
    payload: FacultyUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler", "teacher")),
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found.")
    if payload.email and payload.email != faculty.email:
        if db.query(Faculty).filter(Faculty.email == payload.email, Faculty.id != faculty_id).first():
            raise HTTPException(status_code=409, detail="Another faculty member already uses this email.")
    for field in ("name", "email", "department_id", "leave_probability", "max_hours_per_week"):
        value = getattr(payload, field)
        if value is not None:
            setattr(faculty, field, value)
    if payload.subject_ids is not None:
        _sync_faculty_subjects(db, faculty.id, payload.subject_ids)
    db.commit()
    db.refresh(faculty)
    return _faculty_to_response(faculty)


@router.delete("/faculty/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler")),
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found.")
    db.delete(faculty)
    db.commit()


# ── Faculty Availability ─────────────────────────────────────────────

@router.get("/faculty/{faculty_id}/availability", response_model=AvailabilityResponse)
def get_availability(faculty_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found.")
    records = db.query(FacultyAvailability).filter(FacultyAvailability.faculty_id == faculty_id).all()
    return AvailabilityResponse(
        faculty_id=faculty.id,
        faculty_name=faculty.name,
        slots=[AvailabilitySlot(timeslot_id=r.timeslot_id, is_available=r.is_available) for r in records],
    )


@router.put("/faculty/{faculty_id}/availability", response_model=AvailabilityResponse)
def update_availability(
    faculty_id: int,
    payload: AvailabilityUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler", "teacher")),
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found.")
    existing = {
        r.timeslot_id: r
        for r in db.query(FacultyAvailability).filter(FacultyAvailability.faculty_id == faculty_id).all()
    }
    for slot in payload.slots:
        if slot.timeslot_id in existing:
            existing[slot.timeslot_id].is_available = slot.is_available
        else:
            db.add(FacultyAvailability(faculty_id=faculty_id, timeslot_id=slot.timeslot_id, is_available=slot.is_available))
    db.commit()
    return get_availability(faculty_id, db, _)


# ── Subjects CRUD ────────────────────────────────────────────────────

@router.get("/subjects", response_model=SubjectListResponse)
def list_subjects(db: Session = Depends(get_db), _=Depends(get_current_user)):
    items = db.query(Subject).order_by(Subject.name).all()
    return SubjectListResponse(
        items=[SubjectResponse(id=s.id, name=s.name, code=s.code, hours_per_week=s.hours_per_week, is_heavy=s.is_heavy, is_lab=s.is_lab) for s in items]
    )


@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler", "teacher")),
):
    if db.query(Subject).filter(Subject.code == payload.code).first():
        raise HTTPException(status_code=409, detail="A subject with this code already exists.")
    subject = Subject(name=payload.name, code=payload.code, hours_per_week=payload.hours_per_week, is_heavy=payload.is_heavy, is_lab=payload.is_lab)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return SubjectResponse(id=subject.id, name=subject.name, code=subject.code, hours_per_week=subject.hours_per_week, is_heavy=subject.is_heavy, is_lab=subject.is_lab)


@router.get("/subjects/{subject_id}", response_model=SubjectResponse)
def get_subject(subject_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    return SubjectResponse(id=subject.id, name=subject.name, code=subject.code, hours_per_week=subject.hours_per_week, is_heavy=subject.is_heavy, is_lab=subject.is_lab)


@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler", "teacher")),
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    if payload.code and payload.code != subject.code:
        if db.query(Subject).filter(Subject.code == payload.code, Subject.id != subject_id).first():
            raise HTTPException(status_code=409, detail="Another subject already uses this code.")
    for field in ("name", "code", "hours_per_week", "is_heavy", "is_lab"):
        value = getattr(payload, field)
        if value is not None:
            setattr(subject, field, value)
    db.commit()
    db.refresh(subject)
    return SubjectResponse(id=subject.id, name=subject.name, code=subject.code, hours_per_week=subject.hours_per_week, is_heavy=subject.is_heavy, is_lab=subject.is_lab)


@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler")),
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    db.delete(subject)
    db.commit()


# ── Classrooms CRUD ──────────────────────────────────────────────────

@router.get("/classrooms", response_model=ClassroomListResponse)
def list_classrooms(db: Session = Depends(get_db), _=Depends(get_current_user)):
    items = db.query(Classroom).order_by(Classroom.name).all()
    return ClassroomListResponse(
        items=[
            ClassroomResponse(
                id=c.id, name=c.name, capacity=c.capacity, room_type=c.room_type,
                department_id=c.department_id, department_name=c.department.name if c.department else "",
            )
            for c in items
        ]
    )


@router.post("/classrooms", response_model=ClassroomResponse, status_code=status.HTTP_201_CREATED)
def create_classroom(
    payload: ClassroomCreate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler", "teacher")),
):
    if db.query(Classroom).filter(Classroom.name == payload.name).first():
        raise HTTPException(status_code=409, detail="A classroom with this name already exists.")
    room = Classroom(name=payload.name, capacity=payload.capacity, room_type=payload.room_type, department_id=payload.department_id)
    db.add(room)
    db.commit()
    db.refresh(room)
    return ClassroomResponse(
        id=room.id, name=room.name, capacity=room.capacity, room_type=room.room_type,
        department_id=room.department_id, department_name=room.department.name if room.department else "",
    )


@router.put("/classrooms/{classroom_id}", response_model=ClassroomResponse)
def update_classroom(
    classroom_id: int,
    payload: ClassroomUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler", "teacher")),
):
    room = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found.")
    if payload.name and payload.name != room.name:
        if db.query(Classroom).filter(Classroom.name == payload.name, Classroom.id != classroom_id).first():
            raise HTTPException(status_code=409, detail="Another classroom already uses this name.")
    for field in ("name", "capacity", "room_type", "department_id"):
        value = getattr(payload, field)
        if value is not None:
            setattr(room, field, value)
    db.commit()
    db.refresh(room)
    return ClassroomResponse(
        id=room.id, name=room.name, capacity=room.capacity, room_type=room.room_type,
        department_id=room.department_id, department_name=room.department.name if room.department else "",
    )


@router.delete("/classrooms/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classroom(
    classroom_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler")),
):
    room = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Classroom not found.")
    db.delete(room)
    db.commit()


# ── Batches CRUD ─────────────────────────────────────────────────────

@router.get("/batches", response_model=BatchListResponse)
def list_batches(db: Session = Depends(get_db), _=Depends(get_current_user)):
    items = db.query(Batch).order_by(Batch.name).all()
    return BatchListResponse(
        items=[
            BatchResponse(
                id=b.id, name=b.name, students=b.students, semester=b.semester,
                shift=b.shift, department_id=b.department_id,
                department_name=b.department.name if b.department else "",
            )
            for b in items
        ]
    )


@router.post("/batches", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(
    payload: BatchCreate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler", "teacher")),
):
    if db.query(Batch).filter(Batch.name == payload.name).first():
        raise HTTPException(status_code=409, detail="A batch with this name already exists.")
    batch = Batch(name=payload.name, students=payload.students, semester=payload.semester, shift=payload.shift, department_id=payload.department_id)
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return BatchResponse(
        id=batch.id, name=batch.name, students=batch.students, semester=batch.semester,
        shift=batch.shift, department_id=batch.department_id,
        department_name=batch.department.name if batch.department else "",
    )


@router.put("/batches/{batch_id}", response_model=BatchResponse)
def update_batch(
    batch_id: int,
    payload: BatchUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler", "teacher")),
):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    if payload.name and payload.name != batch.name:
        if db.query(Batch).filter(Batch.name == payload.name, Batch.id != batch_id).first():
            raise HTTPException(status_code=409, detail="Another batch already uses this name.")
    for field in ("name", "students", "semester", "shift", "department_id"):
        value = getattr(payload, field)
        if value is not None:
            setattr(batch, field, value)
    db.commit()
    db.refresh(batch)
    return BatchResponse(
        id=batch.id, name=batch.name, students=batch.students, semester=batch.semester,
        shift=batch.shift, department_id=batch.department_id,
        department_name=batch.department.name if batch.department else "",
    )


@router.delete("/batches/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler")),
):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    db.delete(batch)
    db.commit()


# ── Constraints CRUD ─────────────────────────────────────────────────

@router.get("/constraints", response_model=ConstraintListResponse)
def list_constraints(db: Session = Depends(get_db), _=Depends(get_current_user)):
    items = db.query(ConstraintRule).order_by(ConstraintRule.category, ConstraintRule.name).all()
    return ConstraintListResponse(
        items=[
            ConstraintResponse(id=c.id, name=c.name, category=c.category, weight=c.weight, scope=c.scope, rule_definition=c.rule_definition)
            for c in items
        ]
    )


@router.post("/constraints", response_model=ConstraintResponse, status_code=status.HTTP_201_CREATED)
def create_constraint(
    payload: ConstraintCreate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler")),
):
    if db.query(ConstraintRule).filter(ConstraintRule.name == payload.name).first():
        raise HTTPException(status_code=409, detail="A constraint with this name already exists.")
    constraint = ConstraintRule(name=payload.name, category=payload.category, weight=payload.weight, scope=payload.scope, rule_definition=payload.rule_definition)
    db.add(constraint)
    db.commit()
    db.refresh(constraint)
    return ConstraintResponse(id=constraint.id, name=constraint.name, category=constraint.category, weight=constraint.weight, scope=constraint.scope, rule_definition=constraint.rule_definition)


@router.put("/constraints/{constraint_id}", response_model=ConstraintResponse)
def update_constraint(
    constraint_id: int,
    payload: ConstraintUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler")),
):
    constraint = db.query(ConstraintRule).filter(ConstraintRule.id == constraint_id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Constraint not found.")
    for field in ("name", "category", "weight", "scope", "rule_definition"):
        value = getattr(payload, field)
        if value is not None:
            setattr(constraint, field, value)
    db.commit()
    db.refresh(constraint)
    return ConstraintResponse(id=constraint.id, name=constraint.name, category=constraint.category, weight=constraint.weight, scope=constraint.scope, rule_definition=constraint.rule_definition)


@router.delete("/constraints/{constraint_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_constraint(
    constraint_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler")),
):
    constraint = db.query(ConstraintRule).filter(ConstraintRule.id == constraint_id).first()
    if not constraint:
        raise HTTPException(status_code=404, detail="Constraint not found.")
    db.delete(constraint)
    db.commit()


# ── CSV Import ───────────────────────────────────────────────────────

@router.post("/faculty/import-csv", response_model=ImportResult)
async def import_faculty_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler")),
):
    content = (await file.read()).decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    imported, skipped, errors = 0, 0, []
    for row_num, row in enumerate(reader, start=2):
        try:
            name = row.get("name", "").strip()
            email = row.get("email", "").strip()
            dept_id = int(row.get("department_id", 0))
            if not name or not email or not dept_id:
                errors.append(f"Row {row_num}: missing required fields")
                skipped += 1
                continue
            if db.query(Faculty).filter(Faculty.email == email).first():
                skipped += 1
                continue
            faculty = Faculty(
                name=name, email=email, department_id=dept_id,
                leave_probability=float(row.get("leave_probability", 0)),
                max_hours_per_week=int(row.get("max_hours_per_week", 18)),
            )
            db.add(faculty)
            imported += 1
        except Exception as exc:
            errors.append(f"Row {row_num}: {str(exc)}")
            skipped += 1
    db.commit()
    return ImportResult(imported=imported, skipped=skipped, errors=errors)


@router.post("/subjects/import-csv", response_model=ImportResult)
async def import_subjects_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler")),
):
    content = (await file.read()).decode("utf-8")
    reader = csv.DictReader(io.StringIO(content))
    imported, skipped, errors = 0, 0, []
    for row_num, row in enumerate(reader, start=2):
        try:
            name = row.get("name", "").strip()
            code = row.get("code", "").strip()
            hours = int(row.get("hours_per_week", 0))
            if not name or not code or not hours:
                errors.append(f"Row {row_num}: missing required fields")
                skipped += 1
                continue
            if db.query(Subject).filter(Subject.code == code).first():
                skipped += 1
                continue
            subject = Subject(
                name=name, code=code, hours_per_week=hours,
                is_heavy=row.get("is_heavy", "false").lower() in ("true", "1", "yes"),
                is_lab=row.get("is_lab", "false").lower() in ("true", "1", "yes"),
            )
            db.add(subject)
            imported += 1
        except Exception as exc:
            errors.append(f"Row {row_num}: {str(exc)}")
            skipped += 1
    db.commit()
    return ImportResult(imported=imported, skipped=skipped, errors=errors)
