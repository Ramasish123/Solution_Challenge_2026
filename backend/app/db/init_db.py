from sqlalchemy import inspect, select, text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import (
    Batch,
    Classroom,
    ConstraintRule,
    Department,
    Faculty,
    FacultyAvailability,
    FacultyLeaveEvent,
    FacultySubject,
    Subject,
    TimeSlot,
    User,
)


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_user_schema()
    with SessionLocal() as db:
        seed_demo_data(db)


def ensure_user_schema() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    with engine.begin() as connection:
        if "username" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(60)"))
            existing_users = connection.execute(
                text("SELECT id, email, role FROM users ORDER BY id")
            ).fetchall()
            for row in existing_users:
                local_part = (row.email or f"user{row.id}").split("@")[0].lower()
                fallback_username = f"{local_part}_{row.id}"
                connection.execute(
                    text("UPDATE users SET username = :username WHERE id = :id"),
                    {"username": fallback_username, "id": row.id},
                )
            columns.add("username")

        if "created_at" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
            connection.execute(
                text("UPDATE users SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)")
            )
            columns.add("created_at")

        if "updated_at" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN updated_at DATETIME"))
            connection.execute(
                text("UPDATE users SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)")
            )
            columns.add("updated_at")

        if "last_login_at" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN last_login_at DATETIME"))


def seed_demo_data(db: Session) -> None:
    existing_user = db.scalar(select(User).limit(1))
    if existing_user:
        return

    cse = Department(name="Computer Science", code="CSE")
    ece = Department(name="Electronics", code="ECE")
    db.add_all([cse, ece])
    db.flush()

    admin = User(
        username="admin001",
        email=settings.demo_admin_email,
        full_name="System Admin",
        role="admin",
        hashed_password=get_password_hash(settings.demo_admin_password),
    )
    scheduler = User(
        username="teacher_demo",
        email="scheduler@smartclassroom.local",
        full_name="Academic Scheduler",
        role="scheduler",
        hashed_password=get_password_hash("Scheduler@123"),
    )
    viewer = User(
        username="student_demo",
        email="viewer@smartclassroom.local",
        full_name="Operations Viewer",
        role="viewer",
        hashed_password=get_password_hash("Viewer@123"),
    )
    db.add_all([admin, scheduler, viewer])

    subjects = [
        Subject(name="Algorithms", code="CS301", hours_per_week=4, is_heavy=True),
        Subject(name="Database Systems", code="CS302", hours_per_week=3, is_heavy=True),
        Subject(name="Operating Systems", code="CS303", hours_per_week=4, is_heavy=True),
        Subject(name="Software Engineering", code="CS304", hours_per_week=3, is_heavy=False),
        Subject(name="Digital Signal Processing", code="EC301", hours_per_week=3, is_heavy=True),
        Subject(name="Embedded Systems Lab", code="EC302L", hours_per_week=2, is_lab=True),
    ]
    db.add_all(subjects)
    db.flush()

    faculty_members = [
        Faculty(
            department_id=cse.id,
            name="Dr. Ananya Rao",
            email="ananya@university.local",
            leave_probability=0.08,
            max_hours_per_week=16,
        ),
        Faculty(
            department_id=cse.id,
            name="Prof. Vikram Shah",
            email="vikram@university.local",
            leave_probability=0.12,
            max_hours_per_week=18,
        ),
        Faculty(
            department_id=ece.id,
            name="Dr. Meera Iyer",
            email="meera@university.local",
            leave_probability=0.15,
            max_hours_per_week=14,
        ),
        Faculty(
            department_id=ece.id,
            name="Prof. Arjun Menon",
            email="arjun@university.local",
            leave_probability=0.1,
            max_hours_per_week=16,
        ),
    ]
    db.add_all(faculty_members)
    db.flush()

    subject_map = {subject.code: subject for subject in subjects}
    faculty_map = {faculty.name: faculty for faculty in faculty_members}
    db.add_all(
        [
            FacultySubject(faculty_id=faculty_map["Dr. Ananya Rao"].id, subject_id=subject_map["CS301"].id),
            FacultySubject(faculty_id=faculty_map["Dr. Ananya Rao"].id, subject_id=subject_map["CS302"].id),
            FacultySubject(faculty_id=faculty_map["Prof. Vikram Shah"].id, subject_id=subject_map["CS303"].id),
            FacultySubject(faculty_id=faculty_map["Prof. Vikram Shah"].id, subject_id=subject_map["CS304"].id),
            FacultySubject(faculty_id=faculty_map["Dr. Meera Iyer"].id, subject_id=subject_map["EC301"].id),
            FacultySubject(faculty_id=faculty_map["Prof. Arjun Menon"].id, subject_id=subject_map["EC302L"].id),
            FacultySubject(faculty_id=faculty_map["Prof. Arjun Menon"].id, subject_id=subject_map["EC301"].id),
        ]
    )

    db.add_all(
        [
            Classroom(name="LH-201", capacity=80, room_type="lecture", department_id=cse.id),
            Classroom(name="LH-202", capacity=75, room_type="lecture", department_id=cse.id),
            Classroom(name="LH-204", capacity=60, room_type="lecture", department_id=ece.id),
            Classroom(name="Lab-A", capacity=35, room_type="lab", department_id=cse.id),
            Classroom(name="Embedded Lab", capacity=30, room_type="lab", department_id=ece.id),
        ]
    )

    db.add_all(
        [
            Batch(name="CSE 6A", semester=6, students=72, department_id=cse.id, shift="morning"),
            Batch(name="CSE 6B", semester=6, students=64, department_id=cse.id, shift="morning"),
            Batch(name="ECE 6A", semester=6, students=58, department_id=ece.id, shift="afternoon"),
        ]
    )

    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    hours = [
        ("09:00", "10:00", "morning"),
        ("10:00", "11:00", "morning"),
        ("11:15", "12:15", "morning"),
        ("13:00", "14:00", "afternoon"),
        ("14:00", "15:00", "afternoon"),
        ("15:15", "16:15", "afternoon"),
    ]
    for day in days:
        for start_time, end_time, shift in hours:
            db.add(TimeSlot(day=day, start_time=start_time, end_time=end_time, shift=shift))

    db.flush()

    for faculty in faculty_members:
        restricted_day = "Friday" if faculty.name.startswith("Dr.") else "Wednesday"
        for slot in db.query(TimeSlot).all():
            available = not (slot.day == restricted_day and slot.shift == "afternoon")
            db.add(
                FacultyAvailability(
                    faculty_id=faculty.id,
                    timeslot_id=slot.id,
                    is_available=available,
                )
            )

    db.add_all(
        [
            FacultyLeaveEvent(faculty_id=faculty_map["Dr. Ananya Rao"].id, leave_date="2026-03-18", reason="Conference"),
            FacultyLeaveEvent(faculty_id=faculty_map["Dr. Ananya Rao"].id, leave_date="2026-03-25", reason="Conference"),
            FacultyLeaveEvent(faculty_id=faculty_map["Prof. Vikram Shah"].id, leave_date="2026-02-07", reason="Medical"),
            FacultyLeaveEvent(faculty_id=faculty_map["Dr. Meera Iyer"].id, leave_date="2026-01-10", reason="Workshop"),
        ]
    )

    db.add_all(
        [
            ConstraintRule(
                name="No faculty clash",
                category="hard",
                weight=1000,
                scope="global",
                rule_definition="A faculty member cannot teach two batches in the same timeslot.",
            ),
            ConstraintRule(
                name="Avoid heavy subject streaks",
                category="soft",
                weight=30,
                scope="batch",
                rule_definition="Avoid scheduling more than two heavy subjects back-to-back for a batch.",
            ),
            ConstraintRule(
                name="Minimize gaps",
                category="soft",
                weight=25,
                scope="faculty",
                rule_definition="Reduce idle gaps in faculty schedules across a day.",
            ),
        ]
    )

    db.commit()
