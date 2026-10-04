from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base
from app.models.types import JSON_DOCUMENT


class Account(Base):
    __tablename__ = "accounts"
    learner_id: Mapped[str] = mapped_column(ForeignKey("learners.id"), primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)


class AccountSession(Base):
    __tablename__ = "account_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    learner_id: Mapped[str] = mapped_column(ForeignKey("learners.id"), index=True)
    expires_at: Mapped[int] = mapped_column(Integer, nullable=False)


class WorldSave(Base):
    __tablename__ = "world_saves"
    learner_id: Mapped[str] = mapped_column(ForeignKey("learners.id"), primary_key=True)
    world_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    progress: Mapped[dict] = mapped_column(JSON_DOCUMENT, nullable=False)
