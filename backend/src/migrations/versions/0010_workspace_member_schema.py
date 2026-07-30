"""Create workspace membership schema.

Revision ID: 0010_workspace_member_schema
Revises: 0009_workspace_schema
Create Date: 2026-07-30

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0010_workspace_member_schema"
down_revision: Union[str, None] = "0009_workspace_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "workspace_member",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("invited_by", sa.Integer(), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["invited_by"], ["user.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspace.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(
        op.f("ix_workspace_member_is_deleted"),
        "workspace_member",
        ["is_deleted"],
        unique=False,
    )
    op.create_index(
        op.f("ix_workspace_member_user_id"),
        "workspace_member",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_workspace_member_workspace_id"),
        "workspace_member",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        "uq_workspace_member_active_workspace_user",
        "workspace_member",
        ["workspace_id", "user_id"],
        unique=True,
        postgresql_where=sa.text("is_deleted = FALSE"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_workspace_member_active_workspace_user",
        table_name="workspace_member",
    )
    op.drop_index(op.f("ix_workspace_member_workspace_id"), table_name="workspace_member")
    op.drop_index(op.f("ix_workspace_member_user_id"), table_name="workspace_member")
    op.drop_index(op.f("ix_workspace_member_is_deleted"), table_name="workspace_member")
    op.drop_table("workspace_member")