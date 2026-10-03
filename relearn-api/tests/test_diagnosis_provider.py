import pytest

from app.schemas.diagnoses import AttemptForDiagnosis, MisconceptionCode
from app.services.diagnosis_service import RuleBasedDiagnosisProvider


@pytest.mark.asyncio
async def test_detects_excluded_range_endpoint() -> None:
    provider = RuleBasedDiagnosisProvider()
    attempt = AttemptForDiagnosis(
        exercise_id="inclusive-sum-01",
        prompt="Return the sum from 1 through n.",
        submitted_code="total = 0\nfor i in range(1, n):\n    total += i",
        test_results={"passed": 1, "failed": 2},
    )

    prediction = await provider.diagnose(attempt)

    assert prediction.misconception_code == MisconceptionCode.RANGE_ENDPOINT_EXCLUDED
    assert prediction.evidence[0].line == 2


@pytest.mark.asyncio
async def test_invalid_python_is_uncertain() -> None:
    provider = RuleBasedDiagnosisProvider()
    attempt = AttemptForDiagnosis(
        exercise_id="inclusive-sum-01",
        prompt="Return the sum from 1 through n.",
        submitted_code="for i in range(1, n)",
        test_results={"passed": 0, "failed": 0},
    )

    prediction = await provider.diagnose(attempt)

    assert prediction.misconception_code == MisconceptionCode.UNCERTAIN
