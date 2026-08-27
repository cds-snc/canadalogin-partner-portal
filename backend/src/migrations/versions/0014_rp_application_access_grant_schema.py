"""Create RP application access grant schema.

Revision ID: 0014_rp_application_access_grant_schema
Revises: 0013_workspace_scoped_rp_application_fields
Create Date: 2026-08-10

"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0014_rp_application_access_grant_schema"
down_revision: Union[str, None] = "0013_workspace_scoped_rp_application_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rp_application_access_grant",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("source_invitation_uuid", sa.UUID(), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspace.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(
        op.f("ix_rp_application_access_grant_workspace_id"),
        "rp_application_access_grant",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_access_grant_user_id"),
        "rp_application_access_grant",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_access_grant_status"),
        "rp_application_access_grant",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_access_grant_is_deleted"),
        "rp_application_access_grant",
        ["is_deleted"],
        unique=False,
    )
    op.create_index(
        "uq_rp_application_access_grant_active_workspace_user",
        "rp_application_access_grant",
        ["workspace_id", "user_id"],
        unique=True,
        postgresql_where=sa.text("is_deleted = FALSE AND status = 'active'"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_rp_application_access_grant_active_workspace_user",
        table_name="rp_application_access_grant",
    )
    op.drop_index(op.f("ix_rp_application_access_grant_is_deleted"), table_name="rp_application_access_grant")
    op.drop_index(op.f("ix_rp_application_access_grant_status"), table_name="rp_application_access_grant")
    op.drop_index(op.f("ix_rp_application_access_grant_user_id"), table_name="rp_application_access_grant")
    op.drop_index(op.f("ix_rp_application_access_grant_workspace_id"), table_name="rp_application_access_grant")
    op.drop_table("rp_application_access_grant")
