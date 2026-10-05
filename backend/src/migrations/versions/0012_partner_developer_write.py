"""Grant partner developers application write access.

Revision ID: 0012_partner_developer_write
Revises: 0011_partner_group_roles
Create Date: 2026-10-04

"""

from __future__ import annotations

from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op
from uuid6 import uuid7

revision = "0012_partner_developer_write"
down_revision = "0011_partner_group_roles"
branch_labels = None
depends_on = None

POLICY = ("Partner Developer", "applications", "write")


def upgrade() -> None:
    bind = op.get_bind()
    subject, resource, action = POLICY
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
        return

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
    subject, resource, action = POLICY
    op.get_bind().execute(
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
