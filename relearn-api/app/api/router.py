from fastapi import APIRouter

from app.api import accounts, diagnose, health, learning


api_router = APIRouter()
api_router.include_router(accounts.router)
api_router.include_router(health.router)
api_router.include_router(diagnose.router)
api_router.include_router(learning.router)
