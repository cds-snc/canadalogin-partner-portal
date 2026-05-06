"""Seed superuser from environment variable

Revision ID: 0003_seed_superuser
Revises: 0002_seed_department_catalog
Create Date: 2026-03-30

This migration will create a superuser account when the environment variable
`SUPERUSER` is set to an email address. The seeded user will have
`is_superuser=True` and `enabled=True`. No password is set by this migration.
"""
from __future__ import annotations

import os
from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from uuid6 import uuid7

revision = "0003_seed_superuser"
down_revision = "0002_seed_department_catalog"
branch_labels = None
depends_on = None


def _normalize_username_from_email(email: str) -> str:
    # take local part and replace non-alnum with underscore
    local = email.split("@", 1)[0]
    return "".join([c if c.isalnum() else "_" for c in local])[:20]


def upgrade() -> None:
    superuser_email = os.getenv("SUPERUSER")
    if not superuser_email:
        # nothing to do
        return

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("user"):
        return

    # check for existing user by email
    # define a lightweight table representation including all columns we
    # insert so SQLAlchemy can compile the INSERT statement correctly.
    users_table = sa.table(
        "user",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.String()),
        sa.column("username", sa.String()),
        sa.column("email", sa.String()),
        sa.column("hashed_password", sa.String()),
        sa.column("auth_provider", sa.String()),
        sa.column("auth_subject", sa.String()),
        sa.column("profile_image_url", sa.String()),
        sa.column("uuid", postgresql.UUID(as_uuid=True)),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
        sa.column("last_login_at", sa.DateTime(timezone=True)),
        sa.column("deleted_at", sa.DateTime(timezone=True)),
        sa.column("is_deleted", sa.Boolean()),
        sa.column("is_superuser", sa.Boolean()),
        sa.column("enabled", sa.Boolean()),
        sa.column("department_id", sa.Integer()),
        sa.column("tier_id", sa.Integer()),
        sa.column("role_ids", postgresql.JSONB()),
    )

    existing = bind.execute(sa.select(users_table.c.id).where(users_table.c.email == superuser_email)).scalar_one_or_none()
    if existing is not None:
        return

    username = _normalize_username_from_email(superuser_email)
    now = datetime.now(UTC)

    bind.execute(
        sa.insert(users_table).values(
            name=username,
            username=username,
            email=superuser_email,
            hashed_password=None,
            auth_provider=None,
            auth_subject=None,
            profile_image_url="",
            uuid=uuid7(),
            created_at=now,
            updated_at=None,
            last_login_at=None,
            deleted_at=None,
            is_deleted=False,
            is_superuser=True,
            enabled=True,
            department_id=None,
            tier_id=None,
            role_ids=None,
        )
    )


def downgrade() -> None:
    superuser_email = os.getenv("SUPERUSER")
    if not superuser_email:
        return

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("user"):
        return

    users_table = sa.table("user", sa.column("email", sa.String()))
    bind.execute(sa.delete(users_table).where(users_table.c.email == superuser_email))
