from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)


class Faculty(Base):
    __tablename__ = "faculties"

    id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    name: Mapped[str] = mapped_column(String(120), index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True)
    leave_probability: Mapped[float] = mapped_column(Float, default=0.0)
    max_hours_per_week: Mapped[int] = mapped_column(Integer, default=18)

    department = relationship("Department")
    subjects = relationship("FacultySubject", back_populates="faculty", cascade="all, delete-orphan")
    availabilities = relationship("FacultyAvailability", back_populates="faculty", cascade="all, delete-orphan")


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    hours_per_week: Mapped[int] = mapped_column(Integer)
    is_heavy: Mapped[bool] = mapped_column(Boolean, default=False)
    is_lab: Mapped[bool] = mapped_column(Boolean, default=False)


class Classroom(Base):
    __tablename__ = "classrooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    name: Mapped[str] = mapped_column(String(120), unique=True)
    capacity: Mapped[int] = mapped_column(Integer)
    room_type: Mapped[str] = mapped_column(String(20))

    department = relationship("Department")


class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    name: Mapped[str] = mapped_column(String(120), unique=True)
    students: Mapped[int] = mapped_column(Integer)
    semester: Mapped[int] = mapped_column(Integer)
    shift: Mapped[str] = mapped_column(String(20))

    department = relationship("Department")


class TimeSlot(Base):
    __tablename__ = "timeslots"
    __table_args__ = (UniqueConstraint("day", "start_time", "shift", name="uq_timeslot_day_start_shift"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    day: Mapped[str] = mapped_column(String(20), index=True)
    start_time: Mapped[str] = mapped_column(String(10))
    end_time: Mapped[str] = mapped_column(String(10))
    shift: Mapped[str] = mapped_column(String(20), index=True)


class FacultySubject(Base):
    __tablename__ = "faculty_subjects"
    __table_args__ = (UniqueConstraint("faculty_id", "subject_id", name="uq_faculty_subject"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id"))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))

    faculty = relationship("Faculty", back_populates="subjects")
    subject = relationship("Subject")


class FacultyAvailability(Base):
    __tablename__ = "faculty_availabilities"
    __table_args__ = (UniqueConstraint("faculty_id", "timeslot_id", name="uq_faculty_timeslot"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id"))
    timeslot_id: Mapped[int] = mapped_column(ForeignKey("timeslots.id"))
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    faculty = relationship("Faculty", back_populates="availabilities")
    timeslot = relationship("TimeSlot")


class ConstraintRule(Base):
    __tablename__ = "constraints"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    category: Mapped[str] = mapped_column(String(10))
    weight: Mapped[int] = mapped_column(Integer, default=0)
    scope: Mapped[str] = mapped_column(String(30))
    rule_definition: Mapped[str] = mapped_column(Text)


class FacultyLeaveEvent(Base):
    __tablename__ = "faculty_leave_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id"), index=True)
    leave_date: Mapped[str] = mapped_column(String(20))
    reason: Mapped[str] = mapped_column(String(120))

    faculty = relationship("Faculty")
