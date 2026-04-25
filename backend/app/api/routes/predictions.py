from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.services.prediction_service import compute_faculty_risk_scores


router = APIRouter(prefix="/predictions", tags=["predictions"])


class FacultyRisk(BaseModel):
    faculty_id: int
    faculty_name: str
    department: str
    leave_probability: float
    total_leaves: int
    recent_leaves: int
    predicted_risk_score: float
    risk_level: str


class FacultyRiskResponse(BaseModel):
    risks: list[FacultyRisk]


@router.get("/faculty-risk", response_model=FacultyRiskResponse)
def get_faculty_risk(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
) -> FacultyRiskResponse:
    risks = compute_faculty_risk_scores(db)
    return FacultyRiskResponse(risks=[FacultyRisk(**r) for r in risks])
