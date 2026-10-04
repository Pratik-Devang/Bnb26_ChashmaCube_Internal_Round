from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_DATABASE_PATH = Path(__file__).resolve().parents[2] / "relearn-local.sqlite3"
API_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=API_ENV_PATH,
        env_file_encoding="utf-8",
        env_prefix="RELEARN_",
        extra="ignore",
    )

    environment: str = "development"
    database_url: str = f"sqlite+aiosqlite:///{LOCAL_DATABASE_PATH.as_posix()}"
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
        ]
    )
    diagnosis_provider: str = "rule-based"
    # Server-side only. With env_prefix this is RELEARN_GEMINI_API_KEY.
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_timeout_seconds: float = Field(default=12.0, ge=1, le=30)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip().startswith("["):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
