from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field

from app.models.enums import AttemptType, ConceptStatus, ExerciseType, QuestStatus
from app.schemas.common import ApiModel
from app.schemas.diagnoses import DiagnosisEvidence, MisconceptionCode


class TestResults(ApiModel):
    passed: int = Field(ge=0)
    failed: int = Field(ge=0)
    cases: list[dict[str, Any]] = Field(default_factory=list)


class AttemptCreate(ApiModel):
    learner_id: str
    exercise_id: str
    submitted_code: str = Field(min_length=1, max_length=50_000)
    learner_explanation: str | None = Field(default=None, max_length=4_000)
    attempt_type: AttemptType = AttemptType.INITIAL
    parent_attempt_id: str | None = None
    test_results: TestResults


class ReassessmentCreate(AttemptCreate):
    intervention_id: str
    attempt_type: AttemptType


class AttemptRead(ApiModel):
    id: str
    learner_id: str
    exercise_id: str
    attempt_type: AttemptType
    parent_attempt_id: str | None
    created_at: datetime


class ExerciseRead(ApiModel):
    id: str
    concept_id: str
    title: str
    prompt: str
    difficulty: str
    starter_code: str
    test_cases: list[dict[str, Any]]
    exercise_type: ExerciseType


class DiagnosisRead(ApiModel):
    id: str
    misconception_code: MisconceptionCode
    learner_friendly_name: str
    confidence: float
    summary: str
    evidence: list[DiagnosisEvidence]
    class_probabilities: dict[str, float]
    model_version: str


class InterventionRead(ApiModel):
    id: str
    diagnosis_id: str
    type: str
    title: str
    estimated_minutes: int
    content: dict[str, Any]
    completed_at: datetime | None = None


class DiagnosisEnvelope(ApiModel):
    attempt_id: str
    diagnosis: DiagnosisRead
    intervention: InterventionRead
    reassessment_exercise_id: str | None = None
    concept_status: ConceptStatus | None = None


class InterventionComplete(ApiModel):
    learner_id: str = "learner-demo"


class InterventionCompletion(ApiModel):
    intervention_id: str
    completed: bool
    completed_at: datetime
    near_transfer_exercise_id: str | None = None
    far_transfer_exercise_id: str | None = None


class QuestComplete(ApiModel):
    learner_id: str = "learner-demo"


class QuestRead(ApiModel):
    id: str
    title: str
    description: str
    xp_reward: int
    quest_type: str
    status: QuestStatus
    progress: int
    completed_at: datetime | None = None


class QuestCompletion(ApiModel):
    quest: QuestRead
    learner_xp: int
    xp_awarded: int


class ConceptProgress(ApiModel):
    concept_id: str
    concept: str
    status: ConceptStatus
    mastery_score: float
    evidence_count: int
    last_misconception_code: str | None = None
    updated_at: datetime


class ProgressRead(ApiModel):
    learner_id: str
    concepts: list[ConceptProgress]


class LearnerRead(ApiModel):
    id: str
    name: str
    avatar: str
    xp: int
    streak: int
    level: int


class LearningModuleRead(ApiModel):
    id: str
    concept_code: str
    title: str
    description: str
    status: ConceptStatus
    progress: int
    display_order: int


class LearningStatistics(ApiModel):
    total_concepts: int
    mastered: int
    in_progress: int


class LearningPlanRead(ApiModel):
    learner: LearnerRead
    modules: list[LearningModuleRead]
    quests: list[QuestRead]
    statistics: LearningStatistics


class ModelMetricsRead(ApiModel):
    id: str
    name: str
    dataset_version: str
    metrics: dict[str, Any]
    created_at: datetime
