from __future__ import annotations

from enum import StrEnum

from pydantic import Field

from app.schemas.common import ApiModel


class MisconceptionCode(StrEnum):
    CORRECT = "CORRECT"
    RANGE_ENDPOINT_EXCLUDED = "RANGE_ENDPOINT_EXCLUDED"
    WRONG_INITIALIZATION = "WRONG_INITIALIZATION"
    ACCUMULATOR_OVERWRITTEN = "ACCUMULATOR_OVERWRITTEN"
    WRONG_OR_MISSING_UPDATE = "WRONG_OR_MISSING_UPDATE"
    VARIABLE_ROLE_CONFUSION = "VARIABLE_ROLE_CONFUSION"
    UNCERTAIN = "UNCERTAIN"


class EvidenceType(StrEnum):
    CODE = "code"
    TEST = "test"
    AST = "ast"


class DiagnosisEvidence(ApiModel):
    type: EvidenceType
    message: str
    line: int | None = Field(default=None, ge=1)


class AttemptForDiagnosis(ApiModel):
    exercise_id: str
    prompt: str
    submitted_code: str
    test_results: dict[str, object]
    learner_explanation: str | None = None
    ast_features: dict[str, int | float | bool | str] | None = None


class DiagnosisPrediction(ApiModel):
    misconception_code: MisconceptionCode
    learner_friendly_name: str
    confidence: float = Field(ge=0, le=1)
    class_probabilities: dict[MisconceptionCode, float]
    evidence: list[DiagnosisEvidence]
    model_version: str
