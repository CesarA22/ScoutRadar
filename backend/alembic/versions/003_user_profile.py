"""Add user profile fields

Revision ID: 003
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(512), nullable=True))
    op.add_column("users", sa.Column("theme", sa.String(16), server_default="dark", nullable=False))
    op.add_column("users", sa.Column("language", sa.String(8), server_default="pt", nullable=False))
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_column("users", "language")
    op.drop_column("users", "theme")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "email")
