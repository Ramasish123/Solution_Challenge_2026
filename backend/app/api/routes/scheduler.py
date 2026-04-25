from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.scheduler import (
    GenerateTimetableRequest,
    RescheduleRequest,
    RescheduleResponse,
    ScheduleGenerationResponse,
)
from app.services.scheduler_service import generate_timetables, reschedule_timetable


router = APIRouter(tags=["scheduler"])


@router.post("/generate-timetable", response_model=ScheduleGenerationResponse)
def generate_timetable(
    payload: GenerateTimetableRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "scheduler", "teacher")),
) -> ScheduleGenerationResponse:
    return generate_timetables(db, payload, current_user)


@router.post("/reschedule", response_model=RescheduleResponse)
def reschedule(
    payload: RescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "scheduler", "teacher")),
) -> RescheduleResponse:
    return reschedule_timetable(db, payload, current_user)

