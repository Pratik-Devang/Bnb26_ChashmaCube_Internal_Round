from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import ConceptStatus
from app.models.types import JSON_DOCUMENT


class Intervention(Base):
    __tablename__ = "interventions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    diagnosis_id: Mapped[str] = mapped_column(ForeignKey("diagnoses.id"), unique=True, nullable=False)
    intervention_type: Mapped[str] = mapped_column(String(80), nullable=False)
    content: Mapped[dict[str, object]] = mapped_column(JSON_DOCUMENT, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class LearnerConceptState(Base):
    __tablename__ = "learner_concept_states"
    __table_args__ = (UniqueConstraint("learner_id", "concept_id", name="uq_learner_concept_state"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    learner_id: Mapped[str] = mapped_column(ForeignKey("learners.id"), index=True, nullable=False)
    concept_id: Mapped[str] = mapped_column(ForeignKey("concepts.id"), index=True, nullable=False)
    misconception_id: Mapped[str | None] = mapped_column(ForeignKey("misconceptions.id"), nullable=True)
    status: Mapped[ConceptStatus] = mapped_column(
        Enum(ConceptStatus, native_enum=False, length=32),
        default=ConceptStatus.UNTESTED,
        nullable=False,
    )
    evidence_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    mastery_score: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    last_attempt_id: Mapped[str | None] = mapped_column(ForeignKey("attempts.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
