"""Add UUID public identifiers to policy, role, tier, and rate limit tables.

Revision ID: 20260323_08
Revises: 20260319_07
Create Date: 2026-03-23 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from uuid6 import uuid7

revision = "20260323_08"
down_revision = "20260319_07"
branch_labels = None
depends_on = None


def get_column_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def get_index_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def ensure_uuid_column(bind: sa.Connection, inspector: sa.Inspector, table_name: str) -> None:
    if not inspector.has_table(table_name):
        return

    columns = get_column_names(inspector, table_name)
    if "uuid" not in columns:
        op.add_column(table_name, sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=True))

    table = sa.table(
        table_name,
        sa.column("id", sa.Integer()),
        sa.column("uuid", postgresql.UUID(as_uuid=True)),
    )
    missing_uuid_rows = bind.execute(sa.select(table.c.id).where(table.c.uuid.is_(None))).fetchall()
    for row in missing_uuid_rows:
        bind.execute(sa.update(table).where(table.c.id == row.id).values(uuid=uuid7()))

    op.alter_column(table_name, "uuid", nullable=False)

    refreshed_inspector = sa.inspect(bind)
    indexes = get_index_names(refreshed_inspector, table_name)
    index_name = f"ix_{table_name}_uuid"
    if index_name not in indexes:
        op.create_index(index_name, table_name, ["uuid"], unique=True)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    for table_name in ["access_policy", "rate_limit", "role", "tier"]:
        ensure_uuid_column(bind, inspector, table_name)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    for table_name in ["tier", "role", "rate_limit", "access_policy"]:
        if not inspector.has_table(table_name):
            continue

        indexes = get_index_names(inspector, table_name)
        index_name = f"ix_{table_name}_uuid"
        if index_name in indexes:
            op.drop_index(index_name, table_name=table_name)

        columns = get_column_names(inspector, table_name)
        if "uuid" in columns:
            op.drop_column(table_name, "uuid")
