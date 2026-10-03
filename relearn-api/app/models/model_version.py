from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAtMixin
from app.models.types import JSON_DOCUMENT


class ModelVersion(CreatedAtMixin, Base):
    __tablename__ = "model_versions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    dataset_version: Mapped[str] = mapped_column(String(120), nullable=False)
    artifact_path: Mapped[str] = mapped_column(String(500), nullable=False)
    metrics: Mapped[dict[str, object]] = mapped_column(JSON_DOCUMENT, nullable=False)
