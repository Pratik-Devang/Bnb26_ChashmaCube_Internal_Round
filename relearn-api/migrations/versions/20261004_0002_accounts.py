"""Accounts, revocable sessions, and per-learner world saves."""
from alembic import op
import sqlalchemy as sa

revision = "20261004_0002"
down_revision = "20261003_0001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("accounts", sa.Column("learner_id", sa.String(64), sa.ForeignKey("learners.id"), primary_key=True), sa.Column("email", sa.String(254), unique=True, nullable=False), sa.Column("password_hash", sa.String(256), nullable=False))
    op.create_table("account_sessions", sa.Column("token_hash", sa.String(64), primary_key=True), sa.Column("learner_id", sa.String(64), sa.ForeignKey("learners.id"), nullable=False), sa.Column("expires_at", sa.Integer(), nullable=False))
    op.create_index("ix_account_sessions_learner_id", "account_sessions", ["learner_id"])
    op.create_table("world_saves", sa.Column("learner_id", sa.String(64), sa.ForeignKey("learners.id"), primary_key=True), sa.Column("world_id", sa.String(64), primary_key=True), sa.Column("progress", sa.JSON(), nullable=False))


def downgrade():
    op.drop_table("world_saves")
    op.drop_index("ix_account_sessions_learner_id", "account_sessions")
    op.drop_table("account_sessions")
    op.drop_table("accounts")
