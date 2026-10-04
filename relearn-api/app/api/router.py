from fastapi import APIRouter

from app.api import accounts, adventures, diagnose, health, learning


api_router = APIRouter()
api_router.include_router(accounts.router)
api_router.include_router(adventures.router)
api_router.include_router(health.router)
api_router.include_router(diagnose.router)
api_router.include_router(learning.router)
