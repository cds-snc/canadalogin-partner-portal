"""Seed Casbin policies for RP application CRUD.

Revision ID: 0005_rp_app_policies
Revises: 0004_seed_roles
Create Date: 2026-06-10

"""
from __future__ import annotations

from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op
from uuid6 import uuid7

revision = "0005_rp_app_policies"
down_revision = "0004_seed_roles"
branch_labels = None
depends_on = None


POLICIES: list[tuple[str, str, str]] = [
    ("application owners", "rp_applications", "read"),
    ("application owners", "rp_applications", "write"),
    ("application owners", "rp_client_secret", "read"),
    ("application owners", "rp_client_secret", "write"),
    ("application owners", "mau_report", "read"),
]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("access_policy"):
        return

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
            {
                "subject": subject,
                "resource": resource,
                "action": action,
            },
        ).first()
        if existing is not None:
            continue

        bind.execute(
            sa.text(
                """
                INSERT INTO access_policy (
                    subject,
                    resource,
                    action,
                    uuid,
                    created_at,
                    updated_at,
                    deleted_at,
                    is_deleted
                ) VALUES (
                    :subject,
                    :resource,
                    :action,
                    :uuid,
                    :created_at,
                    NULL,
                    NULL,
                    FALSE
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
    inspector = sa.inspect(bind)

    if not inspector.has_table("access_policy"):
        return

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
            {
                "subject": subject,
                "resource": resource,
                "action": action,
            },
        )
