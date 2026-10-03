from fastapi import APIRouter

from app.api import health, learning


api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(learning.router)
