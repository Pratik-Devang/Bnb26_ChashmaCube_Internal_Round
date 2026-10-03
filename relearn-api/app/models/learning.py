from __future__ import annotations

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import ExerciseType
from app.models.types import JSON_DOCUMENT


class Concept(Base):
    __tablename__ = "concepts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)


class Misconception(Base):
    __tablename__ = "misconceptions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    learner_friendly_name: Mapped[str] = mapped_column(String(160), nullable=False)
    internal_description: Mapped[str] = mapped_column(Text, nullable=False)
    intervention_type: Mapped[str] = mapped_column(String(80), nullable=False)


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    concept_id: Mapped[str] = mapped_column(ForeignKey("concepts.id"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(40), nullable=False)
    starter_code: Mapped[str] = mapped_column(Text, nullable=False)
    test_cases: Mapped[list[dict[str, object]]] = mapped_column(JSON_DOCUMENT, nullable=False)
    exercise_type: Mapped[ExerciseType] = mapped_column(
        Enum(ExerciseType, native_enum=False, length=32),
        nullable=False,
    )
