"""Seed essential roles (admin, application owners).

Revision ID: 0004_seed_roles
Revises: 0003_seed_superuser
Create Date: 2026-04-20

"""
from __future__ import annotations

from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op
from uuid6 import uuid7

revision = "0004_seed_roles"
down_revision = "0003_seed_superuser"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("role"):
        return

    roles = [
        {"name": "admin", "description": "Administrator role mapped from OIDC admin group"},
        {
            "name": "application owners",
            "description": "Application owners role mapped from OIDC groups",
        },
    ]

    for role in roles:
        existing = bind.execute(sa.text("SELECT id FROM role WHERE name = :name"), {"name": role["name"]}).first()
        if existing is None:
            bind.execute(
                sa.text(
                    "INSERT INTO role (name, description, uuid, created_at, deleted_at, is_deleted) VALUES (:name, :description, :uuid, :created_at, NULL, FALSE)"
                ),
                {
                    "name": role["name"],
                    "description": role["description"],
                    "uuid": str(uuid7()),
                    "created_at": datetime.now(UTC),
                },
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("role"):
        return

    names = ["admin", "application owners"]
    bind.execute(sa.text("DELETE FROM role WHERE name = ANY(:names)"), {"names": names})