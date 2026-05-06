"""Seed dedicated Casbin policies for role management.

Revision ID: 20260317_04
Revises: 20260317_03
Create Date: 2026-03-17 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

revision = "20260317_04"
down_revision = "20260317_03"
branch_labels = None
depends_on = None


ROLE_POLICIES = [
    ("admin", "roles", "read"),
    ("admin", "roles", "write"),
]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("access_policy"):
        return

    access_policy = sa.table(
        "access_policy",
        sa.column("subject", sa.String()),
        sa.column("resource", sa.String()),
        sa.column("action", sa.String()),
        sa.column("is_deleted", sa.Boolean()),
    )

    for subject, resource, action in ROLE_POLICIES:
        existing = bind.execute(
            sa.select(access_policy.c.subject).where(
                access_policy.c.subject == subject,
                access_policy.c.resource == resource,
                access_policy.c.action == action,
                sa.or_(access_policy.c.is_deleted.is_(False), access_policy.c.is_deleted.is_(None)),
            )
        ).scalar_one_or_none()
        if existing is None:
            bind.execute(
                sa.insert(access_policy).values(subject=subject, resource=resource, action=action)
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("access_policy"):
        return

    access_policy = sa.table(
        "access_policy",
        sa.column("subject", sa.String()),
        sa.column("resource", sa.String()),
        sa.column("action", sa.String()),
    )

    for subject, resource, action in ROLE_POLICIES:
        bind.execute(
            sa.delete(access_policy).where(
                access_policy.c.subject == subject,
                access_policy.c.resource == resource,
                access_policy.c.action == action,
            )
        )
