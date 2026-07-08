"""camera consent table

Revision ID: 005
Revises: 004
Create Date: 2026-07-08 00:00:00
"""
import sqlalchemy as sa
from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "camera_consents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("policy_version", sa.String(), nullable=False),
        sa.Column("granted_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_camera_consents_user_id", "camera_consents", ["user_id"])


def downgrade():
    op.drop_index("ix_camera_consents_user_id", table_name="camera_consents")
    op.drop_table("camera_consents")
