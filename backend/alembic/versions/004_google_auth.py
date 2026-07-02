"""google auth: google_id column, hashed_password nullable

Revision ID: 004
Revises: 003
Create Date: 2026-07-02 00:00:00
"""
import sqlalchemy as sa
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("google_id", sa.String(), nullable=True))
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)

    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("hashed_password", existing_type=sa.String(), nullable=True)


def downgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.alter_column("hashed_password", existing_type=sa.String(), nullable=False)

    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_column("users", "google_id")
