"""Add RP application developer invitations.

Revision ID: 0005_rp_app_dev_invites
Revises: 0004_seed_roles
Create Date: 2026-04-22

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0005_rp_app_dev_invites"
down_revision: Union[str, None] = "0004_seed_roles"
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
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("gc_notify_notification_id", sa.String(length=64), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["invited_by"], ["user.id"]),
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
        op.f("ix_rp_application_developer_invitation_token_hash"),
        "rp_application_developer_invitation",
        ["token_hash"],
        unique=True,
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
        op.f("ix_rp_application_developer_invitation_token_hash"),
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