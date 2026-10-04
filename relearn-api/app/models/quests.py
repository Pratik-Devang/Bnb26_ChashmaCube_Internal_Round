from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import QuestStatus
from app.models.types import JSON_DOCUMENT


class Quest(Base):
    __tablename__ = "quests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False)
    quest_type: Mapped[str] = mapped_column(String(80), nullable=False)
    requirements: Mapped[dict[str, object]] = mapped_column(JSON_DOCUMENT, nullable=False)


class LearnerQuest(Base):
    __tablename__ = "learner_quests"

    learner_id: Mapped[str] = mapped_column(ForeignKey("learners.id"), primary_key=True)
    quest_id: Mapped[str] = mapped_column(ForeignKey("quests.id"), primary_key=True)
    status: Mapped[QuestStatus] = mapped_column(
        Enum(QuestStatus, native_enum=False, length=24),
        default=QuestStatus.OPEN,
        nullable=False,
    )
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
