from fastapi import APIRouter

from app.config import get_settings
from app.schemas.common import HealthResponse


router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", environment=settings.environment)
