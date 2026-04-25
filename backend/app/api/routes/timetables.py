from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.scheduler import TimetableListResponse
from app.services.scheduler_service import list_timetables


router = APIRouter(prefix="/timetables", tags=["timetables"])


@router.get("", response_model=TimetableListResponse)
def get_timetables(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TimetableListResponse:
    return list_timetables(db)
