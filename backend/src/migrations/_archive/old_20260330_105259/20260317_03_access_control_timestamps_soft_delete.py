"""Add timestamps and soft delete columns to access control tables.

Revision ID: 20260317_03
Revises: 20260317_02
Create Date: 2026-03-17 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

revision = "20260317_03"
down_revision = "20260317_02"
branch_labels = None
depends_on = None


def get_column_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def get_index_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def add_lifecycle_columns(table_name: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table(table_name):
        return

    columns = get_column_names(inspector, table_name)
    if "created_at" not in columns:
        op.add_column(
            table_name,
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        )
    if "updated_at" not in columns:
        op.add_column(table_name, sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
    if "deleted_at" not in columns:
        op.add_column(table_name, sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    if "is_deleted" not in columns:
        op.add_column(
            table_name,
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        )

    inspector = sa.inspect(bind)
    indexes = get_index_names(inspector, table_name)
    index_name = f"ix_{table_name}_is_deleted"
    if index_name not in indexes:
        op.create_index(index_name, table_name, ["is_deleted"], unique=False)


def drop_lifecycle_columns(table_name: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table(table_name):
        return

    indexes = get_index_names(inspector, table_name)
    index_name = f"ix_{table_name}_is_deleted"
    if index_name in indexes:
        op.drop_index(index_name, table_name=table_name)

    columns = get_column_names(inspector, table_name)
    for column_name in ["is_deleted", "deleted_at", "updated_at", "created_at"]:
        if column_name in columns:
            op.drop_column(table_name, column_name)


def upgrade() -> None:
    add_lifecycle_columns("access_policy")
    add_lifecycle_columns("role")


def downgrade() -> None:
    drop_lifecycle_columns("role")
    drop_lifecycle_columns("access_policy")
