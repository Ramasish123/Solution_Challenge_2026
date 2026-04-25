from sqlalchemy.orm import Session, joinedload

from app.models import Classroom, Faculty, FacultyAvailability, FacultySubject, TimeSlot, Timetable, TimetableEntry


def validate_slot_change(
    db: Session,
    timetable_id: int,
    entry_id: int,
    new_timeslot_id: int,
    new_classroom_id: int | None = None,
) -> dict:
    """Check whether moving an entry to a different timeslot/classroom causes conflicts."""

    entry = (
        db.query(TimetableEntry)
        .options(
            joinedload(TimetableEntry.batch),
            joinedload(TimetableEntry.subject),
            joinedload(TimetableEntry.faculty),
            joinedload(TimetableEntry.classroom),
            joinedload(TimetableEntry.timeslot),
        )
        .filter(TimetableEntry.id == entry_id, TimetableEntry.timetable_id == timetable_id)
        .first()
    )
    if not entry:
        return {"is_valid": False, "conflicts": [{"type": "not_found", "description": "Entry not found."}], "suggested_fixes": []}

    target_classroom_id = new_classroom_id or entry.classroom_id
    target_room = db.query(Classroom).filter(Classroom.id == target_classroom_id).first()
    target_slot = db.query(TimeSlot).filter(TimeSlot.id == new_timeslot_id).first()

    if not target_slot:
        return {"is_valid": False, "conflicts": [{"type": "invalid_slot", "description": "Target timeslot does not exist."}], "suggested_fixes": []}

    conflicts = []
    suggested_fixes = []

    # Faculty clash: is the faculty already teaching at the target timeslot?
    faculty_clash = (
        db.query(TimetableEntry)
        .filter(
            TimetableEntry.timetable_id == timetable_id,
            TimetableEntry.id != entry_id,
            TimetableEntry.faculty_id == entry.faculty_id,
            TimetableEntry.timeslot_id == new_timeslot_id,
        )
        .first()
    )
    if faculty_clash:
        conflicts.append({
            "type": "faculty_clash",
            "description": f"{entry.faculty.name} is already teaching at {target_slot.day} {target_slot.start_time}.",
        })
        # Suggest swapping the two slots
        suggested_fixes.append({
            "action": "swap",
            "detail": f"Swap with the existing class at {target_slot.day} {target_slot.start_time}.",
        })

    # Room clash: is the target room already occupied at the target timeslot?
    room_clash = (
        db.query(TimetableEntry)
        .filter(
            TimetableEntry.timetable_id == timetable_id,
            TimetableEntry.id != entry_id,
            TimetableEntry.classroom_id == target_classroom_id,
            TimetableEntry.timeslot_id == new_timeslot_id,
        )
        .first()
    )
    if room_clash:
        conflicts.append({
            "type": "room_clash",
            "description": f"Room {target_room.name if target_room else target_classroom_id} is already occupied at {target_slot.day} {target_slot.start_time}.",
        })
        # Suggest alternative rooms
        occupied_room_ids = [
            r.classroom_id
            for r in db.query(TimetableEntry)
            .filter(TimetableEntry.timetable_id == timetable_id, TimetableEntry.timeslot_id == new_timeslot_id)
            .all()
        ]
        free_rooms = (
            db.query(Classroom)
            .filter(
                Classroom.id.notin_(occupied_room_ids),
                Classroom.capacity >= entry.batch.students,
            )
            .limit(3)
            .all()
        )
        for room in free_rooms:
            suggested_fixes.append({
                "action": "use_room",
                "detail": f"Use {room.name} (capacity {room.capacity}) instead.",
            })

    # Batch clash: is the batch already scheduled at the target timeslot?
    batch_clash = (
        db.query(TimetableEntry)
        .filter(
            TimetableEntry.timetable_id == timetable_id,
            TimetableEntry.id != entry_id,
            TimetableEntry.batch_id == entry.batch_id,
            TimetableEntry.timeslot_id == new_timeslot_id,
        )
        .first()
    )
    if batch_clash:
        conflicts.append({
            "type": "batch_clash",
            "description": f"Batch {entry.batch.name} already has a class at {target_slot.day} {target_slot.start_time}.",
        })

    # Capacity check
    if target_room and target_room.capacity < entry.batch.students:
        conflicts.append({
            "type": "capacity_violation",
            "description": f"Room {target_room.name} (capacity {target_room.capacity}) is too small for {entry.batch.name} ({entry.batch.students} students).",
        })

    # Faculty availability check
    avail = (
        db.query(FacultyAvailability)
        .filter(FacultyAvailability.faculty_id == entry.faculty_id, FacultyAvailability.timeslot_id == new_timeslot_id)
        .first()
    )
    if avail and not avail.is_available:
        conflicts.append({
            "type": "faculty_unavailable",
            "description": f"{entry.faculty.name} is marked unavailable at {target_slot.day} {target_slot.start_time}.",
        })

    # Lab/lecture room type mismatch
    if target_room and entry.subject:
        if entry.subject.is_lab and target_room.room_type != "lab":
            conflicts.append({
                "type": "room_type_mismatch",
                "description": f"{entry.subject.name} is a lab course but {target_room.name} is a {target_room.room_type} room.",
            })

    return {
        "is_valid": len(conflicts) == 0,
        "conflicts": conflicts,
        "suggested_fixes": suggested_fixes,
    }


def apply_slot_change(
    db: Session,
    timetable_id: int,
    entry_id: int,
    new_timeslot_id: int,
    new_classroom_id: int | None = None,
) -> dict:
    """Apply a validated slot change to the timetable."""

    validation = validate_slot_change(db, timetable_id, entry_id, new_timeslot_id, new_classroom_id)
    if not validation["is_valid"]:
        return {"applied": False, **validation}

    entry = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id, TimetableEntry.timetable_id == timetable_id).first()
    if not entry:
        return {"applied": False, "conflicts": [{"type": "not_found", "description": "Entry not found."}], "suggested_fixes": []}

    entry.timeslot_id = new_timeslot_id
    if new_classroom_id:
        entry.classroom_id = new_classroom_id
    db.commit()
    return {"applied": True, "conflicts": [], "suggested_fixes": []}


def swap_slots(
    db: Session,
    timetable_id: int,
    entry_a_id: int,
    entry_b_id: int,
) -> dict:
    """Swap two timetable entries' timeslots and classrooms."""

    entry_a = db.query(TimetableEntry).filter(TimetableEntry.id == entry_a_id, TimetableEntry.timetable_id == timetable_id).first()
    entry_b = db.query(TimetableEntry).filter(TimetableEntry.id == entry_b_id, TimetableEntry.timetable_id == timetable_id).first()

    if not entry_a or not entry_b:
        return {"applied": False, "conflicts": [{"type": "not_found", "description": "One or both entries not found."}], "suggested_fixes": []}

    # Swap timeslots and classrooms
    entry_a.timeslot_id, entry_b.timeslot_id = entry_b.timeslot_id, entry_a.timeslot_id
    entry_a.classroom_id, entry_b.classroom_id = entry_b.classroom_id, entry_a.classroom_id
    db.commit()
    return {"applied": True, "conflicts": [], "suggested_fixes": []}
