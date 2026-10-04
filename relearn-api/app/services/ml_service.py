from __future__ import annotations

import os
import warnings
from pathlib import Path
from typing import Any

import joblib
import numpy as np

from app.schemas.ml_diagnosis import (
    DiagnoseResponse,
    InterventionDetail,
    PredictionItem,
    ReassessmentResult,
)


# Curated misconception catalog mapping McMiner class IDs to clear descriptions
MISCONCEPTION_CATALOG: dict[int, str] = {
    3: "Student confuses loop control flow and believes loop body executes unconditionally.",
    4: "Student incorrectly initializes loop accumulator or counter variable.",
    5: "Student uses incorrect conditional operator or boundary comparison in loop.",
    11: "Student believes return and print are interchangeable in functions.",
    12: "Student uses global variable when function parameter or local variable is expected.",
    13: "Student modifies iteration collection or sequence while iterating over it.",
    15: "Student believes Python sequences use 1-based indexing instead of 0-based indexing.",
    16: "Student assumes slicing upper bound is inclusive instead of exclusive.",
    17: "Student accesses dictionary key assuming implicit sorting or ordering.",
    18: "Student confuses string immutability with list mutability.",
    19: "Student uses integer division when floating-point division was intended.",
    20: "Student forgets to call function using parentheses or calls non-callable.",
    21: "Student believes variable assignment transfers data by reference implicitly.",
    22: "Student uses equality comparison operator '==' where assignment '=' was needed.",
    23: "Student attempts to concatenate non-string types with strings without conversion.",
    24: "Student forgets to return a value from a function that computes a result.",
    25: "Student accesses an index or slice beyond sequence length.",
    28: "Student places return statement inside loop prematurely during first iteration.",
    29: "Student confuses list append with list concatenation or reassigns None from append.",
    30: "Student assumes boolean expression chaining behaves like human language conjunction.",
    31: "Student believes that the `return` statement requires parentheses around its argument.",
    32: "Student confuses variable scope between nested blocks or function boundaries.",
    33: "Student mistakes range(stop) as including the stop index value.",
    34: "Student assumes default arguments are re-evaluated on each function call.",
    35: "Student uses break/continue outside of loop context or confuses their semantics.",
    40: "Student assumes recursion base case is automatically inferred by Python.",
    41: "Student creates unintended alias when copying mutable objects like lists.",
    46: "Student misplaces indentation causing block association errors.",
    47: "Student uses logical 'and'/'or' instead of bitwise operations or vice-versa.",
    50: "Student confuses class attributes with instance attributes in definitions.",
    51: "Student forgets 'self' parameter in instance method definition or invocation.",
    54: "Student redefines built-in function or identifier as a variable name.",
    55: "Student uses duplicate dictionary keys expecting multiple values to persist.",
    56: "Student uses incorrect argument count or mismatches positional and keyword arguments.",
    57: "Student assumes exception handling suppresses syntax errors.",
    58: "Student uses 'is' identity operator in place of '==' equality comparison.",
    59: "Student fails to unpack tuple or sequence elements correctly.",
    60: "Student uses generator or iterator expecting reusable sequence behavior.",
}

# Curated intervention knowledge base for reliable examples
INTERVENTIONS_KNOWLEDGE_BASE: dict[int, InterventionDetail] = {
    31: InterventionDetail(
        title="Understanding return statements",
        explanation="In Python, parentheses are not required around the value returned by a function.",
        example="return a + b",
        check="Try rewriting the return statement without parentheses.",
    ),
    15: InterventionDetail(
        title="Python uses zero-based indexing",
        explanation="The first element of a Python list is at index 0, not index 1.",
        example="numbers[0]",
        check="Which index accesses the first element?",
    ),
    11: InterventionDetail(
        title="return is different from print",
        explanation="print() displays a value, while return sends a value back from a function.",
        example="return result",
        check="What should you use when another part of the program needs the function's result?",
    ),
}


class ModelLoadError(RuntimeError):
    """Raised when the trained ML artifacts cannot be loaded."""
    pass


class MLDiagnosisService:
    def __init__(self) -> None:
        self.model: Any = None
        self.vectorizer: Any = None
        self._load_artifacts()

    def _find_model_paths(self) -> tuple[Path, Path]:
        base_candidates = [
            Path(__file__).resolve().parent.parent.parent.parent / "relearn-ml" / "models",
            Path(__file__).resolve().parent.parent.parent / "relearn-ml" / "models",
            Path.cwd() / "relearn-ml" / "models",
            Path.cwd().parent / "relearn-ml" / "models",
        ]

        env_path = os.getenv("RELEARN_ML_MODELS_DIR")
        if env_path:
            base_candidates.insert(0, Path(env_path))

        for base in base_candidates:
            model_path = base / "misconception_model.pkl"
            vec_path = base / "tfidf_vectorizer.pkl"
            if model_path.is_file() and vec_path.is_file():
                return model_path, vec_path

        checked_paths = [str(b) for b in base_candidates]
        raise ModelLoadError(
            f"Trained model artifacts 'misconception_model.pkl' and 'tfidf_vectorizer.pkl' "
            f"were not found. Checked locations: {checked_paths}"
        )

    def _load_artifacts(self) -> None:
        model_path, vec_path = self._find_model_paths()
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                self.model = joblib.load(model_path)
                self.vectorizer = joblib.load(vec_path)
        except Exception as exc:
            raise ModelLoadError(f"Failed loading ML model artifacts: {exc}") from exc

    def _get_description(self, class_id: int) -> str:
        return MISCONCEPTION_CATALOG.get(
            class_id,
            f"Programming misconception pattern associated with pattern ID {class_id}.",
        )

    def _get_intervention(self, class_id: int, description: str) -> InterventionDetail:
        if class_id in INTERVENTIONS_KNOWLEDGE_BASE:
            return INTERVENTIONS_KNOWLEDGE_BASE[class_id]

        # Generic intervention for other IDs
        return InterventionDetail(
            title=f"Reviewing pattern: Concept #{class_id}",
            explanation=description,
            example="# Review this segment to ensure standard Python conventions are applied",
            check="Verify this line against standard Python documentation and adjust your implementation.",
        )

    def diagnose(self, code: str, previous_misconception_id: int | None = None) -> DiagnoseResponse:
        clean_code = code.strip()
        if not clean_code:
            raise ValueError("Submitted code cannot be empty.")

        if self.model is None or self.vectorizer is None:
            raise ModelLoadError("ML model or vectorizer is not loaded.")

        # Transform code into TF-IDF representation
        X = self.vectorizer.transform([clean_code])
        decision = self.model.decision_function(X)
        if decision.ndim > 1:
            decision = decision[0]

        classes = self.model.classes_

        # Rank predictions in descending order of decision score
        sorted_indices = np.argsort(decision)[::-1]
        top3_indices = sorted_indices[:3]

        predictions: list[PredictionItem] = []
        for idx in top3_indices:
            cid = int(classes[idx])
            score = float(round(decision[idx], 3))
            desc = self._get_description(cid)
            predictions.append(PredictionItem(id=cid, misconception=desc, score=score))

        top_pred = predictions[0]
        alternatives = predictions[1:]
        intervention = self._get_intervention(top_pred.id, top_pred.misconception)

        # Handle reassessment if previous_misconception_id is supplied
        reassessment: ReassessmentResult | None = None
        if previous_misconception_id is not None:
            # A changed code-only prediction is not evidence that the earlier
            # misconception was resolved. Resolution requires a passing transfer task.
            status = "unresolved" if top_pred.id == previous_misconception_id else "uncertain"
            reassessment = ReassessmentResult(
                status=status,
                misconception_id=previous_misconception_id,
            )

        return DiagnoseResponse(
            top_prediction=top_pred,
            alternatives=alternatives,
            intervention=intervention,
            reassessment=reassessment,
        )


_service_instance: MLDiagnosisService | None = None


def get_ml_diagnosis_service() -> MLDiagnosisService:
    global _service_instance
    if _service_instance is None:
        _service_instance = MLDiagnosisService()
    return _service_instance
