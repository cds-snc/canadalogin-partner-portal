"""Remap legacy roles to OIDC-mapped roles.

Revision ID: 0007_remap_oidc_roles
Revises: 0006_oidc_user_email
Create Date: 2026-06-10

"""
from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from uuid6 import uuid7


revision: str = "0007_remap_oidc_roles"
down_revision: Union[str, None] = "0006_oidc_user_email"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _ensure_role(bind: sa.Connection, *, name: str, description: str) -> int:
    existing = bind.execute(
        sa.text("SELECT id FROM role WHERE name = :name AND is_deleted = FALSE"),
        {"name": name},
    ).scalar_one_or_none()
    if existing is not None:
        return int(existing)

    bind.execute(
        sa.text(
            """
            INSERT INTO role (name, description, uuid, created_at, deleted_at, is_deleted)
            VALUES (:name, :description, :uuid, :created_at, NULL, FALSE)
            """
        ),
        {
            "name": name,
            "description": description,
            "uuid": str(uuid7()),
            "created_at": datetime.now(UTC),
        },
    )

    created = bind.execute(
        sa.text("SELECT id FROM role WHERE name = :name AND is_deleted = FALSE"),
        {"name": name},
    ).scalar_one()
    return int(created)


def _replace_role_ids(role_ids: object, replacements: dict[int, int]) -> tuple[list[int] | None, bool]:
    if not isinstance(role_ids, list):
        return None, False

    changed = False
    remapped: list[int] = []
    for value in role_ids:
        if not isinstance(value, int):
            continue

        mapped_value = replacements.get(value, value)
        if mapped_value != value:
            changed = True

        if mapped_value not in remapped:
            remapped.append(mapped_value)
        elif mapped_value != value:
            changed = True

    if remapped != role_ids:
        changed = True

    return remapped, changed


def _remap_user_role_ids(bind: sa.Connection, replacements: dict[int, int]) -> None:
    if len(replacements) == 0:
        return

    rows = bind.execute(sa.text('SELECT id, role_ids FROM "user"')).fetchall()
    for row in rows:
        remapped_role_ids, changed = _replace_role_ids(row.role_ids, replacements)
        if not changed:
            continue

        bind.execute(
            sa.text('UPDATE "user" SET role_ids = CAST(:role_ids AS JSON) WHERE id = :user_id'),
            {
                "role_ids": json.dumps(remapped_role_ids),
                "user_id": row.id,
            },
        )


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("role") or not inspector.has_table("user"):
        return

    admin_role_id = _ensure_role(
        bind,
        name="admin",
        description="Administrator role mapped from OIDC admin group",
    )
    app_owner_role_id = _ensure_role(
        bind,
        name="application owners",
        description="Application owners role mapped from OIDC groups",
    )

    legacy_superuser_role_id = bind.execute(
        sa.text("SELECT id FROM role WHERE name = :name"),
        {"name": "superuser"},
    ).scalar_one_or_none()
    legacy_workspace_admin_role_id = bind.execute(
        sa.text("SELECT id FROM role WHERE name = :name"),
        {"name": "workspace_admin"},
    ).scalar_one_or_none()

    replacements: dict[int, int] = {}
    if legacy_superuser_role_id is not None:
        replacements[int(legacy_superuser_role_id)] = admin_role_id
    if legacy_workspace_admin_role_id is not None:
        replacements[int(legacy_workspace_admin_role_id)] = app_owner_role_id

    _remap_user_role_ids(bind, replacements)

    bind.execute(
        sa.text("DELETE FROM role WHERE name = ANY(:names)"),
        {"names": ["superuser", "workspace_admin"]},
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("role") or not inspector.has_table("user"):
        return

    superuser_role_id = _ensure_role(
        bind,
        name="superuser",
        description="Full access superuser",
    )
    workspace_admin_role_id = _ensure_role(
        bind,
        name="workspace_admin",
        description="Workspace administrator",
    )

    admin_role_id = bind.execute(
        sa.text("SELECT id FROM role WHERE name = :name"),
        {"name": "admin"},
    ).scalar_one_or_none()
    app_owner_role_id = bind.execute(
        sa.text("SELECT id FROM role WHERE name = :name"),
        {"name": "application owners"},
    ).scalar_one_or_none()

    replacements: dict[int, int] = {}
    if admin_role_id is not None:
        replacements[int(admin_role_id)] = superuser_role_id
    if app_owner_role_id is not None:
        replacements[int(app_owner_role_id)] = workspace_admin_role_id

    _remap_user_role_ids(bind, replacements)

    bind.execute(
        sa.text("DELETE FROM role WHERE name = ANY(:names)"),
        {"names": ["admin", "application owners"]},
    )
