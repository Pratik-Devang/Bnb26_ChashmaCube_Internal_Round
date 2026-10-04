from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class PredictionItem(BaseModel):
    id: int
    misconception: str
    score: float


class InterventionDetail(BaseModel):
    title: str
    explanation: str
    example: str
    check: str


class ReassessmentResult(BaseModel):
    status: Literal["resolved", "unresolved"]
    misconception_id: int


class DiagnoseRequest(BaseModel):
    code: str = Field(..., description="Student Python code to diagnose")
    previous_misconception_id: int | None = Field(
        default=None,
        description="Optional previous misconception ID to assess resolution against",
    )


class DiagnoseResponse(BaseModel):
    top_prediction: PredictionItem
    alternatives: list[PredictionItem]
    intervention: InterventionDetail
    reassessment: ReassessmentResult | None = None
