"""
Seed essential roles (superuser, workplace_admin)

Revision ID: 0005_seed_roles
Revises: 0004_user_roles
Create Date: 2026-03-30

"""
from __future__ import annotations

from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op
from uuid6 import uuid7

revision = "0005_seed_roles"
down_revision = "0004_user_roles"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("role"):
        return

    roles = [
        {"name": "superuser", "description": "Full access superuser"},
        {"name": "workplace_admin", "description": "Workspace administrator"},
    ]

    for r in roles:
        existing = bind.execute(sa.text("SELECT id FROM role WHERE name = :name"), {"name": r["name"]}).first()
        if existing is None:
            bind.execute(
                sa.text(
                    "INSERT INTO role (name, description, uuid, created_at, deleted_at, is_deleted) VALUES (:name, :description, :uuid, :created_at, NULL, FALSE)"
                ),
                {
                    "name": r["name"],
                    "description": r["description"],
                    "uuid": str(uuid7()),
                    "created_at": datetime.now(UTC),
                },
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("role"):
        return

    names = ["superuser", "workplace_admin"]
    bind.execute(sa.text("DELETE FROM role WHERE name = ANY(:names)"), {"names": names})
