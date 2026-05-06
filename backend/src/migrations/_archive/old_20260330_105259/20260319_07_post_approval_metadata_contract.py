"""Standardize post approval metadata contract.

Revision ID: 20260319_07
Revises: 20260318_06
Create Date: 2026-03-19 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from uuid6 import uuid7

revision = "20260319_07"
down_revision = "20260318_06"
branch_labels = None
depends_on = None


def get_column_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def get_index_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("post_approval"):
        return

    columns = get_column_names(inspector, "post_approval")

    if "uuid" not in columns:
        op.add_column("post_approval", sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=True))

    if "updated_at" not in columns:
        op.add_column("post_approval", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))

    if "deleted_at" not in columns:
        op.add_column("post_approval", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))

    if "is_deleted" not in columns:
        op.add_column(
            "post_approval",
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        )

    post_approval_table = sa.table(
        "post_approval",
        sa.column("id", sa.Integer()),
        sa.column("uuid", postgresql.UUID(as_uuid=True)),
        sa.column("is_deleted", sa.Boolean()),
    )

    missing_uuid_rows = bind.execute(
        sa.select(post_approval_table.c.id).where(post_approval_table.c.uuid.is_(None))
    ).fetchall()
    for row in missing_uuid_rows:
        bind.execute(
            sa.update(post_approval_table).where(post_approval_table.c.id == row.id).values(uuid=uuid7())
        )

    bind.execute(
        sa.update(post_approval_table).where(post_approval_table.c.is_deleted.is_(None)).values(is_deleted=False)
    )

    op.alter_column("post_approval", "uuid", nullable=False)

    inspector = sa.inspect(bind)
    indexes = get_index_names(inspector, "post_approval")

    if "ix_post_approval_uuid" not in indexes:
        op.create_index("ix_post_approval_uuid", "post_approval", ["uuid"], unique=True)

    if "ix_post_approval_is_deleted" not in indexes:
        op.create_index("ix_post_approval_is_deleted", "post_approval", ["is_deleted"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("post_approval"):
        return

    indexes = get_index_names(inspector, "post_approval")
    for index_name in ["ix_post_approval_is_deleted", "ix_post_approval_uuid"]:
        if index_name in indexes:
            op.drop_index(index_name, table_name="post_approval")

    columns = get_column_names(inspector, "post_approval")
    for column_name in ["is_deleted", "deleted_at", "updated_at", "uuid"]:
        if column_name in columns:
            op.drop_column("post_approval", column_name)
