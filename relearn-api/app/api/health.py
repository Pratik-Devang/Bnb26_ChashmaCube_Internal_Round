from fastapi import APIRouter

from app.config import get_settings
from app.schemas.common import HealthResponse


router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        environment=settings.environment,
        code_review_provider="gemini" if settings.gemini_api_key else "deterministic",
        code_review_model=settings.gemini_model if settings.gemini_api_key else None,
    )
