from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.schemas.ml_diagnosis import DiagnoseRequest, DiagnoseResponse
from app.services.ml_service import ModelLoadError, get_ml_diagnosis_service

router = APIRouter(tags=["diagnosis"])


@router.post(
    "/diagnose",
    response_model=DiagnoseResponse,
    summary="Diagnose programming misconceptions using the trained ML model",
)
async def diagnose(payload: DiagnoseRequest) -> DiagnoseResponse:
    if not payload.code or not payload.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "EMPTY_CODE", "message": "Code cannot be empty. Please provide Python code to diagnose."},
        )

    try:
        service = get_ml_diagnosis_service()
        return service.diagnose(
            code=payload.code,
            previous_misconception_id=payload.previous_misconception_id,
        )
    except ModelLoadError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "MODEL_UNAVAILABLE", "message": str(exc)},
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_INPUT", "message": str(exc)},
        ) from exc
    except Exception as exc:
        # Never expose unhandled raw python tracebacks directly
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DIAGNOSIS_FAILED", "message": "Failed to diagnose code. Please check your submission."},
        ) from exc
