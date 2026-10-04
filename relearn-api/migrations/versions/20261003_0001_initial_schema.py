"""Create the initial Re:Learn schema.

Revision ID: 20261003_0001
Revises:
Create Date: 2026-10-03 18:30:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20261003_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "learners",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("avatar", sa.String(length=255), nullable=False),
        sa.Column("xp", sa.Integer(), nullable=False),
        sa.Column("streak", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "concepts",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_concepts_code", "concepts", ["code"])
    op.create_table(
        "misconceptions",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("learner_friendly_name", sa.String(length=160), nullable=False),
        sa.Column("internal_description", sa.Text(), nullable=False),
        sa.Column("intervention_type", sa.String(length=80), nullable=False),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_misconceptions_code", "misconceptions", ["code"])
    op.create_table(
        "model_versions",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False, unique=True),
        sa.Column("dataset_version", sa.String(length=120), nullable=False),
        sa.Column("artifact_path", sa.String(length=500), nullable=False),
        sa.Column("metrics", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "exercises",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("concept_id", sa.String(length=64), sa.ForeignKey("concepts.id"), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("difficulty", sa.String(length=40), nullable=False),
        sa.Column("starter_code", sa.Text(), nullable=False),
        sa.Column("test_cases", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("exercise_type", sa.String(length=32), nullable=False),
    )
    op.create_index("ix_exercises_concept_id", "exercises", ["concept_id"])
    op.create_table(
        "quests",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("xp_reward", sa.Integer(), nullable=False),
        sa.Column("quest_type", sa.String(length=80), nullable=False),
        sa.Column("requirements", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    )
    op.create_table(
        "attempts",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("learner_id", sa.String(length=64), sa.ForeignKey("learners.id"), nullable=False),
        sa.Column("exercise_id", sa.String(length=64), sa.ForeignKey("exercises.id"), nullable=False),
        sa.Column("parent_attempt_id", sa.String(length=64), sa.ForeignKey("attempts.id"), nullable=True),
        sa.Column("attempt_type", sa.String(length=32), nullable=False),
        sa.Column("submitted_code", sa.Text(), nullable=False),
        sa.Column("learner_explanation", sa.Text(), nullable=True),
        sa.Column("test_results", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_attempts_learner_id", "attempts", ["learner_id"])
    op.create_index("ix_attempts_exercise_id", "attempts", ["exercise_id"])
    op.create_table(
        "diagnoses",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("attempt_id", sa.String(length=64), sa.ForeignKey("attempts.id"), nullable=False, unique=True),
        sa.Column("misconception_id", sa.String(length=64), sa.ForeignKey("misconceptions.id"), nullable=False),
        sa.Column("model_version_id", sa.String(length=64), sa.ForeignKey("model_versions.id"), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("class_probabilities", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("evidence", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "interventions",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("diagnosis_id", sa.String(length=64), sa.ForeignKey("diagnoses.id"), nullable=False, unique=True),
        sa.Column("intervention_type", sa.String(length=80), nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "learner_concept_states",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("learner_id", sa.String(length=64), sa.ForeignKey("learners.id"), nullable=False),
        sa.Column("concept_id", sa.String(length=64), sa.ForeignKey("concepts.id"), nullable=False),
        sa.Column("misconception_id", sa.String(length=64), sa.ForeignKey("misconceptions.id"), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("evidence_count", sa.Integer(), nullable=False),
        sa.Column("mastery_score", sa.Float(), nullable=False),
        sa.Column("last_attempt_id", sa.String(length=64), sa.ForeignKey("attempts.id"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("learner_id", "concept_id", name="uq_learner_concept_state"),
    )
    op.create_index("ix_learner_concept_states_learner_id", "learner_concept_states", ["learner_id"])
    op.create_index("ix_learner_concept_states_concept_id", "learner_concept_states", ["concept_id"])
    op.create_table(
        "learner_quests",
        sa.Column("learner_id", sa.String(length=64), sa.ForeignKey("learners.id"), primary_key=True),
        sa.Column("quest_id", sa.String(length=64), sa.ForeignKey("quests.id"), primary_key=True),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("learner_quests")
    op.drop_index("ix_learner_concept_states_concept_id", table_name="learner_concept_states")
    op.drop_index("ix_learner_concept_states_learner_id", table_name="learner_concept_states")
    op.drop_table("learner_concept_states")
    op.drop_table("interventions")
    op.drop_table("diagnoses")
    op.drop_index("ix_attempts_exercise_id", table_name="attempts")
    op.drop_index("ix_attempts_learner_id", table_name="attempts")
    op.drop_table("attempts")
    op.drop_table("quests")
    op.drop_index("ix_exercises_concept_id", table_name="exercises")
    op.drop_table("exercises")
    op.drop_table("model_versions")
    op.drop_index("ix_misconceptions_code", table_name="misconceptions")
    op.drop_table("misconceptions")
    op.drop_index("ix_concepts_code", table_name="concepts")
    op.drop_table("concepts")
    op.drop_table("learners")
