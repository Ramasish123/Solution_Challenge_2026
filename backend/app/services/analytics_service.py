from collections import defaultdict

from sqlalchemy.orm import Session

from app.models import Classroom, Faculty, TimeSlot, Timetable
from app.schemas.analytics import (
    AnalyticsResponse,
    DashboardMetric,
    HeatmapCell,
    SuggestionItem,
    WorkloadPoint,
)


def build_analytics(db: Session) -> AnalyticsResponse:
    latest = db.query(Timetable).order_by(Timetable.fitness_score.desc()).first()
    classrooms = db.query(Classroom).count()
    faculty_members = db.query(Faculty).all()
    total_slots = db.query(TimeSlot).count()

    workload = defaultdict(int)
    room_usage = defaultdict(int)
    suggestions: list[SuggestionItem] = []

    if latest:
        for entry in latest.entries:
            workload[entry.faculty.name] += 1
            room_usage[(entry.timeslot.day, entry.timeslot.start_time)] += 1

        if latest.conflict_count > 0:
            suggestions.append(
                SuggestionItem(
                    title="Resolve remaining timetable clashes",
                    description="Target the flagged overlapping allocations before publishing the timetable.",
                    impact="High",
                )
            )
        if latest.load_balance_score < 75:
            suggestions.append(
                SuggestionItem(
                    title="Redistribute faculty load",
                    description="Move one or two sessions from overloaded faculty to qualified alternates.",
                    impact="Medium",
                )
            )

    summary_cards = [
        DashboardMetric(label="Total Classrooms", value=classrooms),
        DashboardMetric(
            label="Faculty Utilization",
            value=round(
                (
                    sum(workload.values()) / max(sum(f.max_hours_per_week for f in faculty_members), 1)
                )
                * 100,
                1,
            ),
        ),
        DashboardMetric(
            label="Conflicts Detected",
            value=latest.conflict_count if latest else 0,
        ),
        DashboardMetric(
            label="Active Timetables",
            value=db.query(Timetable).count(),
        ),
    ]

    faculty_workload = [
        WorkloadPoint(
            faculty_name=faculty.name,
            assigned_hours=workload.get(faculty.name, 0),
            max_hours=faculty.max_hours_per_week,
        )
        for faculty in faculty_members
    ]

    heatmap = []
    for slot in db.query(TimeSlot).all():
        utilization = (room_usage.get((slot.day, slot.start_time), 0) / max(classrooms, 1)) * 100
        heatmap.append(
            HeatmapCell(
                day=slot.day,
                hour=f"{slot.start_time}-{slot.end_time}",
                utilization=round(utilization, 1),
            )
        )

    if not suggestions:
        suggestions.append(
            SuggestionItem(
                title="Timetable is operating smoothly",
                description="Continue monitoring leave probability and room utilization for future adjustments.",
                impact="Low",
            )
        )

    return AnalyticsResponse(
        summary_cards=summary_cards,
        faculty_workload=faculty_workload,
        room_heatmap=heatmap,
        suggestions=suggestions,
    )
