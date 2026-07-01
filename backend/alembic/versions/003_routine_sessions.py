"""routine sessions table

Revision ID: 003
Revises: 002
Create Date: 2026-07-01 00:00:00
"""
import sqlalchemy as sa
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "routine_sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "routine_id",
            sa.String(),
            sa.ForeignKey("routines.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("started_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_routine_sessions_user_id", "routine_sessions", ["user_id"])


def downgrade():
    op.drop_index("ix_routine_sessions_user_id", table_name="routine_sessions")
    op.drop_table("routine_sessions")
