"""Add soft-delete columns to department.

Revision ID: 20260323_10
Revises: 20260323_09
Create Date: 2026-03-23 00:00:01.000000
"""

import sqlalchemy as sa
from alembic import op

revision = "20260323_10"
down_revision = "20260323_09"
branch_labels = None
depends_on = None


def get_column_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def get_index_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("department"):
        return

    columns = get_column_names(inspector, "department")
    if "deleted_at" not in columns:
        op.add_column("department", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    if "is_deleted" not in columns:
        op.add_column(
            "department",
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        )
        op.alter_column("department", "is_deleted", server_default=None)

    inspector = sa.inspect(bind)
    indexes = get_index_names(inspector, "department")
    if "ix_department_is_deleted" not in indexes:
        op.create_index("ix_department_is_deleted", "department", ["is_deleted"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("department"):
        return

    indexes = get_index_names(inspector, "department")
    if "ix_department_is_deleted" in indexes:
        op.drop_index("ix_department_is_deleted", table_name="department")

    columns = get_column_names(inspector, "department")
    if "is_deleted" in columns:
        op.drop_column("department", "is_deleted")
    if "deleted_at" in columns:
        op.drop_column("department", "deleted_at")
