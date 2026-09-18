"""Create partner-group role mappings and seed application permissions.

Revision ID: 0011_partner_group_roles
Revises: 0010_application_erd_tables
Create Date: 2026-09-18

"""
from __future__ import annotations

from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op
from uuid6 import uuid7

revision = "0011_partner_group_roles"
down_revision = "0010_application_erd_tables"
branch_labels = None
depends_on = None

POLICIES: list[tuple[str, str, str]] = [
    ("Partner Developer", "applications", "read"),
    ("Partner Production Administrator", "applications", "read"),
    ("Partner Production Administrator", "applications", "write"),
    ("CanadaLogin Administrators", "roles", "read"),
    ("CanadaLogin Administrators", "roles", "write"),
    ("CanadaLogin Administrators", "applications", "read"),
]


def upgrade() -> None:
    op.create_table(
        "partner_group_role",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("partner_group_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["partner_group_id"], ["partner_group.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "partner_group_id",
            "role_id",
            name="uq_partner_group_role_partner_group_id_role_id",
        ),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_partner_group_role_is_deleted"), "partner_group_role", ["is_deleted"], unique=False)
    op.create_index(op.f("ix_partner_group_role_partner_group_id"), "partner_group_role", ["partner_group_id"], unique=False)
    op.create_index(op.f("ix_partner_group_role_role_id"), "partner_group_role", ["role_id"], unique=False)

    bind = op.get_bind()
    for subject, resource, action in POLICIES:
        existing = bind.execute(
            sa.text(
                """
                SELECT id FROM access_policy
                WHERE subject = :subject
                  AND resource = :resource
                  AND action = :action
                  AND is_deleted = FALSE
                """
            ),
            {"subject": subject, "resource": resource, "action": action},
        ).first()
        if existing is not None:
            continue

        bind.execute(
            sa.text(
                """
                INSERT INTO access_policy (
                    subject, resource, action, uuid, created_at, updated_at, deleted_at, is_deleted
                ) VALUES (
                    :subject, :resource, :action, :uuid, :created_at, NULL, NULL, FALSE
                )
                """
            ),
            {
                "subject": subject,
                "resource": resource,
                "action": action,
                "uuid": str(uuid7()),
                "created_at": datetime.now(UTC),
            },
        )


def downgrade() -> None:
    bind = op.get_bind()
    for subject, resource, action in POLICIES:
        bind.execute(
            sa.text(
                """
                DELETE FROM access_policy
                WHERE subject = :subject
                  AND resource = :resource
                  AND action = :action
                """
            ),
            {"subject": subject, "resource": resource, "action": action},
        )

    op.drop_index(op.f("ix_partner_group_role_role_id"), table_name="partner_group_role")
    op.drop_index(op.f("ix_partner_group_role_partner_group_id"), table_name="partner_group_role")
    op.drop_index(op.f("ix_partner_group_role_is_deleted"), table_name="partner_group_role")
    op.drop_table("partner_group_role")
