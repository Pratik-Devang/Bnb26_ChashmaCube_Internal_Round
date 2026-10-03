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
