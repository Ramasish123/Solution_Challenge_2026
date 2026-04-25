from typing import Optional, Union

from pydantic import BaseModel


class DashboardMetric(BaseModel):
    label: str
    value: Union[float, int, str]
    delta: Optional[float] = None


class WorkloadPoint(BaseModel):
    faculty_name: str
    assigned_hours: int
    max_hours: int


class HeatmapCell(BaseModel):
    day: str
    hour: str
    utilization: float


class SuggestionItem(BaseModel):
    title: str
    description: str
    impact: str


class AnalyticsResponse(BaseModel):
    summary_cards: list[DashboardMetric]
    faculty_workload: list[WorkloadPoint]
    room_heatmap: list[HeatmapCell]
    suggestions: list[SuggestionItem]
