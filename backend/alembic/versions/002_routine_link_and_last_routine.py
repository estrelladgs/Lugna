"""routine and live class links, user last routine

Revision ID: 002
Revises: 001
Create Date: 2026-06-10 00:00:00
"""
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("routines", sa.Column("enlace", sa.String(), nullable=True))
    op.drop_column("routines", "postures")

    op.add_column("live_classes", sa.Column("enlace", sa.String(), nullable=True))

    op.add_column("users", sa.Column("last_routine_id", sa.String(), nullable=True))
    op.create_foreign_key(
        "fk_users_last_routine_id_routines",
        "users",
        "routines",
        ["last_routine_id"],
        ["id"],
    )


def downgrade():
    op.drop_constraint("fk_users_last_routine_id_routines", "users", type_="foreignkey")
    op.drop_column("users", "last_routine_id")

    op.drop_column("live_classes", "enlace")

    op.add_column(
        "routines",
        sa.Column("postures", JSONB(), nullable=False, server_default="[]"),
    )
    op.drop_column("routines", "enlace")
