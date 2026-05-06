"""Add OIDC user fields and access policy table.

Revision ID: 20260316_01
Revises:
Create Date: 2026-03-16 00:00:00.000000
"""

from collections.abc import Iterable

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "20260316_01"
down_revision = None
branch_labels = None
depends_on = None


def get_column_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def get_index_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def drop_indices(table_name: str, index_names: Iterable[str], existing_indices: set[str]) -> None:
    for index_name in index_names:
        if index_name in existing_indices:
            op.drop_index(index_name, table_name=table_name)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("access_policy"):
        op.create_table(
            "access_policy",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("subject", sa.String(length=64), nullable=False),
            sa.Column("resource", sa.String(length=128), nullable=False),
            sa.Column("action", sa.String(length=32), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_access_policy_subject", "access_policy", ["subject"], unique=False)
        op.create_index("ix_access_policy_resource", "access_policy", ["resource"], unique=False)
        op.create_index("ix_access_policy_action", "access_policy", ["action"], unique=False)

    if not inspector.has_table("user"):
        return

    user_columns = get_column_names(inspector, "user")
    if "auth_provider" not in user_columns:
        op.add_column("user", sa.Column("auth_provider", sa.String(length=50), nullable=True))
    if "auth_subject" not in user_columns:
        op.add_column("user", sa.Column("auth_subject", sa.String(length=255), nullable=True))
    if "last_login_at" not in user_columns:
        op.add_column("user", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))
    if "hashed_password" in user_columns:
        op.alter_column("user", "hashed_password", existing_type=sa.String(), nullable=True)

    inspector = sa.inspect(bind)
    user_indexes = get_index_names(inspector, "user")
    if "ix_user_auth_provider" not in user_indexes:
        op.create_index("ix_user_auth_provider", "user", ["auth_provider"], unique=False)
    if "ix_user_auth_subject" not in user_indexes:
        op.create_index("ix_user_auth_subject", "user", ["auth_subject"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("user"):
        user_columns = get_column_names(inspector, "user")
        user_indexes = get_index_names(inspector, "user")
        drop_indices("user", ["ix_user_auth_provider", "ix_user_auth_subject"], user_indexes)

        if "last_login_at" in user_columns:
            op.drop_column("user", "last_login_at")
        if "auth_subject" in user_columns:
            op.drop_column("user", "auth_subject")
        if "auth_provider" in user_columns:
            op.drop_column("user", "auth_provider")

    if inspector.has_table("access_policy"):
        access_policy_indexes = get_index_names(inspector, "access_policy")
        drop_indices(
            "access_policy",
            ["ix_access_policy_subject", "ix_access_policy_resource", "ix_access_policy_action"],
            access_policy_indexes,
        )
        op.drop_table("access_policy")
