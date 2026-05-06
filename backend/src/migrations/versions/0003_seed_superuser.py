"""Seed superuser from environment variable.

Revision ID: 0003_seed_superuser
Revises: 0002_seed_department_catalog
Create Date: 2026-04-20

This migration will create a superuser account when the environment variable
`SUPERUSER` is set to an email address. The seeded user will have
`is_superuser=True` and `enabled=True`. No password is set by this migration.
"""
from __future__ import annotations

import os
import re
from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op
from app.core.config import settings
from sqlalchemy.dialects import postgresql
from uuid6 import uuid7

revision = "0003_seed_superuser"
down_revision = "0002_seed_department_catalog"
branch_labels = None
depends_on = None


def _normalize_username_from_email(email: str) -> str:
    local = email.split("@", 1)[0]
    normalized = re.sub(r"[^a-z0-9]", "", local.lower())
    return normalized[:20] or "user"


def _resolve_superuser_email() -> str | None:
    superuser_email = os.getenv("SUPERUSER")
    if superuser_email:
        return superuser_email

    return settings.SUPERUSER


def upgrade() -> None:
    superuser_email = _resolve_superuser_email()
    if not superuser_email:
        return

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("user"):
        return

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
        sa.column("role_ids", sa.JSON()),
    )

    normalized_username = _normalize_username_from_email(superuser_email)
    existing = bind.execute(
        sa.select(users_table.c.id, users_table.c.username).where(users_table.c.email == superuser_email)
    ).one_or_none()
    if existing is not None:
        existing_id, existing_username = existing
        if existing_username != normalized_username:
            bind.execute(
                sa.update(users_table)
                .where(users_table.c.id == existing_id)
                .values(username=normalized_username)
            )
        return

    now = datetime.now(UTC)

    bind.execute(
        sa.insert(users_table).values(
            name=normalized_username,
            username=normalized_username,
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
    superuser_email = _resolve_superuser_email()
    if not superuser_email:
        return

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("user"):
        return

    users_table = sa.table("user", sa.column("email", sa.String()))
    bind.execute(sa.delete(users_table).where(users_table.c.email == superuser_email))
