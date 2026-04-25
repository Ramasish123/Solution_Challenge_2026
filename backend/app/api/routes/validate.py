from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.services.validation_service import apply_slot_change, swap_slots, validate_slot_change


router = APIRouter(tags=["validation"])


class SlotChangeRequest(BaseModel):
    timetable_id: int
    entry_id: int
    new_timeslot_id: int
    new_classroom_id: Optional[int] = None


class SlotSwapRequest(BaseModel):
    timetable_id: int
    entry_a_id: int
    entry_b_id: int


class ConflictItem(BaseModel):
    type: str
    description: str


class FixItem(BaseModel):
    action: str
    detail: str


class ValidationResponse(BaseModel):
    is_valid: bool
    conflicts: list[ConflictItem]
    suggested_fixes: list[FixItem]


class ApplyResponse(BaseModel):
    applied: bool
    conflicts: list[ConflictItem]
    suggested_fixes: list[FixItem]


@router.post("/validate-slot-change", response_model=ValidationResponse)
def validate_change(
    payload: SlotChangeRequest,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> ValidationResponse:
    result = validate_slot_change(
        db,
        timetable_id=payload.timetable_id,
        entry_id=payload.entry_id,
        new_timeslot_id=payload.new_timeslot_id,
        new_classroom_id=payload.new_classroom_id,
    )
    return ValidationResponse(**result)


@router.post("/apply-slot-change", response_model=ApplyResponse)
def apply_change(
    payload: SlotChangeRequest,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler", "teacher")),
) -> ApplyResponse:
    result = apply_slot_change(
        db,
        timetable_id=payload.timetable_id,
        entry_id=payload.entry_id,
        new_timeslot_id=payload.new_timeslot_id,
        new_classroom_id=payload.new_classroom_id,
    )
    return ApplyResponse(**result)


@router.post("/swap-slots", response_model=ApplyResponse)
def swap(
    payload: SlotSwapRequest,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin", "scheduler", "teacher")),
) -> ApplyResponse:
    result = swap_slots(
        db,
        timetable_id=payload.timetable_id,
        entry_a_id=payload.entry_a_id,
        entry_b_id=payload.entry_b_id,
    )
    return ApplyResponse(**result)
