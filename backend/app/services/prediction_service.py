from collections import Counter
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Faculty, FacultyLeaveEvent


def compute_faculty_risk_scores(db: Session) -> list[dict]:
    """Build per-faculty absence risk scores based on historical leave data."""

    faculties = db.query(Faculty).order_by(Faculty.name).all()
    leave_events = db.query(FacultyLeaveEvent).all()

    leave_counts: Counter = Counter()
    recent_leave_counts: Counter = Counter()
    cutoff_date = datetime.now() - timedelta(days=90)

    for event in leave_events:
        leave_counts[event.faculty_id] += 1
        try:
            event_date = datetime.strptime(event.leave_date, "%Y-%m-%d")
            if event_date >= cutoff_date:
                recent_leave_counts[event.faculty_id] += 1
        except (ValueError, TypeError):
            pass

    # Total possible teaching days in a semester (~90 working days)
    total_possible_days = 90

    results = []
    for faculty in faculties:
        total_leaves = leave_counts.get(faculty.id, 0)
        recent_leaves = recent_leave_counts.get(faculty.id, 0)

        # Weighted risk: 60% from stored leave_probability, 25% from historical rate, 15% from recent trend
        historical_rate = min(total_leaves / max(total_possible_days, 1), 1.0)
        recent_rate = min(recent_leaves / 15, 1.0)  # 15 is approx working days in recent window

        predicted_risk = round(
            0.6 * faculty.leave_probability + 0.25 * historical_rate + 0.15 * recent_rate,
            3,
        )

        if predicted_risk >= 0.15:
            risk_level = "high"
        elif predicted_risk >= 0.08:
            risk_level = "medium"
        else:
            risk_level = "low"

        results.append({
            "faculty_id": faculty.id,
            "faculty_name": faculty.name,
            "department": faculty.department.name if faculty.department else "",
            "leave_probability": faculty.leave_probability,
            "total_leaves": total_leaves,
            "recent_leaves": recent_leaves,
            "predicted_risk_score": predicted_risk,
            "risk_level": risk_level,
        })

    results.sort(key=lambda x: x["predicted_risk_score"], reverse=True)
    return results
