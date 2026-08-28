"""Create RP application developer invitation schema.

Revision ID: 0015_rp_application_developer_invitation_schema
Revises: 0014_rp_application_access_grant_schema
Create Date: 2026-08-10

"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0015_rp_application_developer_invitation_schema"
down_revision: Union[str, None] = "0014_rp_application_access_grant_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rp_application_developer_invitation",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("rp_application_id", sa.Integer(), nullable=False),
        sa.Column("invited_email", sa.String(length=255), nullable=False),
        sa.Column("token_hash", sa.String(length=128), nullable=False),
        sa.Column("invite_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("invited_by", sa.Integer(), nullable=True),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("gc_notify_notification_id", sa.String(length=64), nullable=True),
        sa.Column("delegated_by_grant_uuid", sa.UUID(), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["invited_by"], ["user.id"]),
        sa.ForeignKeyConstraint(["delegated_by_grant_uuid"], ["rp_application_access_grant.uuid"]),
        sa.ForeignKeyConstraint(["rp_application_id"], ["rp_application.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspace.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(
        op.f("ix_rp_application_developer_invitation_workspace_id"),
        "rp_application_developer_invitation",
        ["workspace_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_developer_invitation_rp_application_id"),
        "rp_application_developer_invitation",
        ["rp_application_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_developer_invitation_invited_email"),
        "rp_application_developer_invitation",
        ["invited_email"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_developer_invitation_status"),
        "rp_application_developer_invitation",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_developer_invitation_delegated_by_grant_uuid"),
        "rp_application_developer_invitation",
        ["delegated_by_grant_uuid"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_developer_invitation_is_deleted"),
        "rp_application_developer_invitation",
        ["is_deleted"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_rp_application_developer_invitation_is_deleted"),
        table_name="rp_application_developer_invitation",
    )
    op.drop_index(
        op.f("ix_rp_application_developer_invitation_delegated_by_grant_uuid"),
        table_name="rp_application_developer_invitation",
    )
    op.drop_index(
        op.f("ix_rp_application_developer_invitation_status"),
        table_name="rp_application_developer_invitation",
    )
    op.drop_index(
        op.f("ix_rp_application_developer_invitation_invited_email"),
        table_name="rp_application_developer_invitation",
    )
    op.drop_index(
        op.f("ix_rp_application_developer_invitation_rp_application_id"),
        table_name="rp_application_developer_invitation",
    )
    op.drop_index(
        op.f("ix_rp_application_developer_invitation_workspace_id"),
        table_name="rp_application_developer_invitation",
    )
    op.drop_table("rp_application_developer_invitation")
