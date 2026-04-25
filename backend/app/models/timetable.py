from typing import Optional

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Timetable(Base):
    __tablename__ = "timetables"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30), default="draft")
    generated_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    fitness_score: Mapped[float] = mapped_column(Float, default=0.0)
    conflict_count: Mapped[int] = mapped_column(Integer, default=0)
    utilization_percent: Mapped[float] = mapped_column(Float, default=0.0)
    load_balance_score: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    entries = relationship("TimetableEntry", back_populates="timetable", cascade="all, delete-orphan")


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    timetable_id: Mapped[int] = mapped_column(ForeignKey("timetables.id"), index=True)
    batch_id: Mapped[int] = mapped_column(ForeignKey("batches.id"))
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id"))
    classroom_id: Mapped[int] = mapped_column(ForeignKey("classrooms.id"))
    timeslot_id: Mapped[int] = mapped_column(ForeignKey("timeslots.id"))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    shift: Mapped[str] = mapped_column(String(20))

    timetable = relationship("Timetable", back_populates="entries")
    batch = relationship("Batch")
    subject = relationship("Subject")
    faculty = relationship("Faculty")
    classroom = relationship("Classroom")
    timeslot = relationship("TimeSlot")
    department = relationship("Department")
