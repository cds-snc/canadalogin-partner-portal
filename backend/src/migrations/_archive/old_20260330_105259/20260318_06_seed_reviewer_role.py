"""Seed reviewer role and post workflow permissions.

Revision ID: 20260318_06
Revises: 20260318_05
Create Date: 2026-03-18 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

revision = "20260318_06"
down_revision = "20260318_05"
branch_labels = None
depends_on = None


REVIEWER_POLICIES = [
    ("reviewer", "posts", "approve"),
    ("reviewer", "posts", "reject"),
]

ADMIN_POST_POLICIES = [
    ("admin", "posts", "approve"),
    ("admin", "posts", "reject"),
]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("role"):
        role_table = sa.table(
            "role",
            sa.column("name", sa.String()),
            sa.column("description", sa.String()),
        )
        reviewer_exists = bind.execute(
            sa.select(role_table.c.name).where(role_table.c.name == "reviewer")
        ).scalar_one_or_none()
        if reviewer_exists is None:
            bind.execute(
                sa.insert(role_table).values(name="reviewer", description="Can review and approve posts")
            )

    if not inspector.has_table("access_policy"):
        return

    access_policy = sa.table(
        "access_policy",
        sa.column("subject", sa.String()),
        sa.column("resource", sa.String()),
        sa.column("action", sa.String()),
        sa.column("is_deleted", sa.Boolean()),
    )

    for subject, resource, action in [*REVIEWER_POLICIES, *ADMIN_POST_POLICIES]:
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

    if inspector.has_table("access_policy"):
        access_policy = sa.table(
            "access_policy",
            sa.column("subject", sa.String()),
            sa.column("resource", sa.String()),
            sa.column("action", sa.String()),
        )
        for subject, resource, action in [*REVIEWER_POLICIES, *ADMIN_POST_POLICIES]:
            bind.execute(
                sa.delete(access_policy).where(
                    access_policy.c.subject == subject,
                    access_policy.c.resource == resource,
                    access_policy.c.action == action,
                )
            )

    if inspector.has_table("role"):
        role_table = sa.table(
            "role",
            sa.column("name", sa.String()),
        )
        bind.execute(sa.delete(role_table).where(role_table.c.name == "reviewer"))
