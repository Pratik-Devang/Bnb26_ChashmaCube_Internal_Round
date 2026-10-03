import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.diagnoses import AttemptForDiagnosis, MisconceptionCode
from app.services.diagnosis_service import RuleBasedDiagnosisProvider


def test_learning_api_surface_is_registered() -> None:
    paths = TestClient(app).get("/openapi.json").json()["paths"]
    expected = {
        "/api/v1/learning-plan",
        "/api/v1/exercises/{exercise_id}",
        "/api/v1/attempts",
        "/api/v1/attempts/{attempt_id}/diagnose",
        "/api/v1/diagnoses/{diagnosis_id}",
        "/api/v1/diagnoses/{diagnosis_id}/intervention",
        "/api/v1/interventions/{intervention_id}/complete",
        "/api/v1/reassessments",
        "/api/v1/learners/{learner_id}/progress",
        "/api/v1/learners/{learner_id}/quests",
        "/api/v1/quests/{quest_id}/complete",
        "/api/v1/model/metrics",
    }
    assert expected <= set(paths)


@pytest.mark.asyncio
async def test_all_passing_attempt_is_classified_as_correct() -> None:
    prediction = await RuleBasedDiagnosisProvider().diagnose(
        AttemptForDiagnosis(
            exercise_id="inclusive-sum-01",
            prompt="Return the sum from 1 through n.",
            submitted_code="total = sum(range(1, n + 1))",
            test_results={"passed": 3, "failed": 0},
        )
    )
    assert prediction.misconception_code == MisconceptionCode.CORRECT
    assert prediction.confidence >= 0.9
