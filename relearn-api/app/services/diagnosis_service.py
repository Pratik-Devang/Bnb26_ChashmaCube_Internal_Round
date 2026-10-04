from __future__ import annotations

import ast
import re
from typing import Protocol

from app.schemas.diagnoses import (
    AttemptForDiagnosis,
    DiagnosisEvidence,
    DiagnosisPrediction,
    EvidenceType,
    MisconceptionCode,
)


class DiagnosisProvider(Protocol):
    async def diagnose(self, attempt: AttemptForDiagnosis) -> DiagnosisPrediction:
        """Classify one normalized attempt without executing learner code."""
        ...


class RuleBasedDiagnosisProvider:
    """Temporary deterministic provider used until the trained artifact is ready."""

    model_version = "rule-based-demo-v1"

    async def diagnose(self, attempt: AttemptForDiagnosis) -> DiagnosisPrediction:
        syntax_evidence = self._syntax_evidence(attempt.submitted_code)
        if syntax_evidence is not None:
            return self._uncertain(syntax_evidence)

        if attempt.test_results.get("failed") == 0 and int(attempt.test_results.get("passed", 0)) > 0:
            return DiagnosisPrediction(
                misconception_code=MisconceptionCode.CORRECT,
                learner_friendly_name="Ready for the next step",
                confidence=0.99,
                class_probabilities={
                    MisconceptionCode.CORRECT: 0.99,
                    MisconceptionCode.UNCERTAIN: 0.01,
                },
                evidence=[
                    DiagnosisEvidence(
                        type=EvidenceType.TEST,
                        message="The submitted solution passed every predefined test.",
                    )
                ],
                model_version=self.model_version,
            )

        if attempt.exercise_id == "starting-value-01":
            cases = attempt.test_results.get("cases", [])
            actuals = [case.get("actual") for case in cases if isinstance(case, dict)]
            inputs = [case.get("args", [None])[0] for case in cases if isinstance(case, dict)]
            if actuals and actuals == inputs:
                return self._prediction(
                    MisconceptionCode.WRONG_OR_MISSING_UPDATE,
                    "The score was returned unchanged",
                    0.99,
                    "Your function keeps the starting score, but never adds the 10-point bonus.",
                )
            if actuals and all(value == 10 for value in actuals):
                return self._prediction(
                    MisconceptionCode.VARIABLE_ROLE_CONFUSION,
                    "The starting score was left out",
                    0.99,
                    "The result is always 10. Keep the score parameter and add the bonus to it.",
                )
            numeric_offsets = [
                actual - expected
                for actual, case in zip(actuals, cases)
                if isinstance(case, dict)
                and isinstance(actual, (int, float))
                and isinstance((expected := case.get("expected")), (int, float))
            ]
            if numeric_offsets and len(numeric_offsets) == len(cases) and len(set(numeric_offsets)) == 1:
                offset = numeric_offsets[0]
                return self._prediction(
                    MisconceptionCode.WRONG_INITIALIZATION,
                    "The bonus amount is off",
                    0.97,
                    f"Every result is {abs(offset):g} point{'s' if abs(offset) != 1 else ''} "
                    f"{'too high' if offset > 0 else 'too low'}. Add exactly 10 to score.",
                )

        boundary_match = re.search(
            r"range\s*\(\s*1\s*,\s*(?P<end>[A-Za-z_]\w*)\s*\)",
            attempt.submitted_code,
        )
        if boundary_match:
            end_name = boundary_match.group("end")
            return DiagnosisPrediction(
                misconception_code=MisconceptionCode.RANGE_ENDPOINT_EXCLUDED,
                learner_friendly_name="Boundary bug",
                confidence=0.95,
                class_probabilities={
                    MisconceptionCode.RANGE_ENDPOINT_EXCLUDED: 0.95,
                    MisconceptionCode.VARIABLE_ROLE_CONFUSION: 0.03,
                    MisconceptionCode.UNCERTAIN: 0.02,
                },
                evidence=[
                    DiagnosisEvidence(
                        type=EvidenceType.CODE,
                        line=self._line_number(attempt.submitted_code, boundary_match.start()),
                        message=f"range(1, {end_name}) stops before {end_name}.",
                    )
                ],
                model_version=self.model_version,
            )

        return self._uncertain(
            DiagnosisEvidence(
                type=EvidenceType.CODE,
                message="The temporary provider found no unambiguous supported pattern.",
            )
        )

    def _prediction(
        self,
        code: MisconceptionCode,
        name: str,
        confidence: float,
        message: str,
    ) -> DiagnosisPrediction:
        return DiagnosisPrediction(
            misconception_code=code,
            learner_friendly_name=name,
            confidence=confidence,
            class_probabilities={code: confidence, MisconceptionCode.UNCERTAIN: 1 - confidence},
            evidence=[DiagnosisEvidence(type=EvidenceType.TEST, message=message)],
            model_version=self.model_version,
        )

    @staticmethod
    def _syntax_evidence(code: str) -> DiagnosisEvidence | None:
        try:
            ast.parse(code)
        except SyntaxError as error:
            return DiagnosisEvidence(
                type=EvidenceType.AST,
                line=error.lineno,
                message="The code could not be parsed safely, so no misconception was selected.",
            )
        return None

    def _uncertain(self, evidence: DiagnosisEvidence) -> DiagnosisPrediction:
        return DiagnosisPrediction(
            misconception_code=MisconceptionCode.UNCERTAIN,
            learner_friendly_name="Let’s look a little closer",
            confidence=0.0,
            class_probabilities={MisconceptionCode.UNCERTAIN: 1.0},
            evidence=[evidence],
            model_version=self.model_version,
        )

    @staticmethod
    def _line_number(code: str, offset: int) -> int:
        return code.count("\n", 0, offset) + 1
