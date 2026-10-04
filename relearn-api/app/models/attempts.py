from __future__ import annotations

from sqlalchemy import Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, CreatedAtMixin
from app.models.enums import AttemptType
from app.models.types import JSON_DOCUMENT


class Attempt(CreatedAtMixin, Base):
    __tablename__ = "attempts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    learner_id: Mapped[str] = mapped_column(ForeignKey("learners.id"), index=True, nullable=False)
    exercise_id: Mapped[str] = mapped_column(ForeignKey("exercises.id"), index=True, nullable=False)
    parent_attempt_id: Mapped[str | None] = mapped_column(ForeignKey("attempts.id"), nullable=True)
    attempt_type: Mapped[AttemptType] = mapped_column(
        Enum(AttemptType, native_enum=False, length=32),
        nullable=False,
    )
    submitted_code: Mapped[str] = mapped_column(Text, nullable=False)
    learner_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    test_results: Mapped[dict[str, object]] = mapped_column(JSON_DOCUMENT, nullable=False)


class Diagnosis(CreatedAtMixin, Base):
    __tablename__ = "diagnoses"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    attempt_id: Mapped[str] = mapped_column(ForeignKey("attempts.id"), unique=True, nullable=False)
    misconception_id: Mapped[str] = mapped_column(ForeignKey("misconceptions.id"), nullable=False)
    model_version_id: Mapped[str] = mapped_column(ForeignKey("model_versions.id"), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    class_probabilities: Mapped[dict[str, float]] = mapped_column(JSON_DOCUMENT, nullable=False)
    evidence: Mapped[list[dict[str, object]]] = mapped_column(JSON_DOCUMENT, nullable=False)
