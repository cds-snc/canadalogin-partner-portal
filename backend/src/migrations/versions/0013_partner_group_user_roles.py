"""Scope partner-group roles to users.

Revision ID: 0013_partner_group_user_roles
Revises: 0012_partner_developer_write
Create Date: 2026-10-16

Downgrade collapses user-scoped grants to group/role rows. Scoped-only
authorization is therefore not preserved when downgrading.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import sqlalchemy as sa
from alembic import op
from uuid6 import uuid7

revision = "0013_partner_group_user_roles"
down_revision = "0012_partner_developer_write"
branch_labels = None
depends_on = None

OLD_UNIQUE_CONSTRAINT = "uq_partner_group_role_partner_group_id_role_id"
NEW_UNIQUE_CONSTRAINT = "uq_partner_group_role_partner_group_id_user_id_role_id"
USER_FOREIGN_KEY = "fk_partner_group_role_user_id_user"


def _backfill_active_user_memberships(bind: Any) -> None:
    assignments = bind.execute(
        sa.text(
            """
            SELECT
                partner_group_role.partner_group_id,
                user_role.user_id,
                partner_group_role.role_id,
                partner_group_role.created_at,
                user_role.created_at AS user_role_created_at
            FROM partner_group_role
            JOIN user_role
              ON user_role.role_id = partner_group_role.role_id
            JOIN partner_group
              ON partner_group.id = partner_group_role.partner_group_id
            JOIN "user" AS assigned_user
              ON assigned_user.id = user_role.user_id
            JOIN role
              ON role.id = partner_group_role.role_id
            WHERE partner_group_role.is_deleted = FALSE
              AND user_role.is_deleted = FALSE
              AND partner_group.is_deleted = FALSE
              AND assigned_user.is_deleted = FALSE
              AND role.is_deleted = FALSE
            ORDER BY
                partner_group_role.partner_group_id,
                user_role.user_id,
                partner_group_role.role_id
            """
        )
    ).mappings().all()

    bind.execute(sa.text("DELETE FROM partner_group_role"))

    rows = [
        {
            "partner_group_id": assignment["partner_group_id"],
            "user_id": assignment["user_id"],
            "role_id": assignment["role_id"],
            "uuid": uuid7(),
            "created_at": max(
                assignment["created_at"], assignment["user_role_created_at"]
            ),
            "updated_at": None,
            "deleted_at": None,
            "is_deleted": False,
        }
        for assignment in assignments
    ]
    if rows:
        bind.execute(
            sa.text(
                """
                INSERT INTO partner_group_role (
                    partner_group_id, user_id, role_id, uuid, created_at,
                    updated_at, deleted_at, is_deleted
                ) VALUES (
                    :partner_group_id, :user_id, :role_id, :uuid, :created_at,
                    :updated_at, :deleted_at, :is_deleted
                )
                """
            ),
            rows,
        )


def upgrade() -> None:
    op.add_column(
        "partner_group_role",
        sa.Column("user_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        USER_FOREIGN_KEY,
        "partner_group_role",
        "user",
        ["user_id"],
        ["id"],
    )
    op.drop_constraint(
        OLD_UNIQUE_CONSTRAINT,
        "partner_group_role",
        type_="unique",
    )

    _backfill_active_user_memberships(op.get_bind())

    op.alter_column("partner_group_role", "user_id", nullable=False)
    op.create_index(
        op.f("ix_partner_group_role_user_id"),
        "partner_group_role",
        ["user_id"],
        unique=False,
    )
    op.create_unique_constraint(
        NEW_UNIQUE_CONSTRAINT,
        "partner_group_role",
        ["partner_group_id", "user_id", "role_id"],
    )


def downgrade() -> None:
    bind = op.get_bind()
    memberships = bind.execute(
        sa.text(
            """
            SELECT partner_group_id, role_id, created_at, updated_at, deleted_at, is_deleted
            FROM partner_group_role
            ORDER BY partner_group_id, role_id, created_at
            """
        )
    ).mappings().all()

    group_roles: dict[tuple[int, int], dict[str, Any]] = {}
    for membership in memberships:
        key = (membership["partner_group_id"], membership["role_id"])
        existing = group_roles.get(key)
        if existing is None:
            group_roles[key] = {
                "partner_group_id": key[0],
                "role_id": key[1],
                "uuid": uuid7(),
                "created_at": membership["created_at"],
                "updated_at": membership["updated_at"],
                "deleted_at": membership["deleted_at"],
                "is_deleted": membership["is_deleted"],
            }
            continue

        existing["created_at"] = min(existing["created_at"], membership["created_at"])
        existing["is_deleted"] = existing["is_deleted"] and membership["is_deleted"]
        if not existing["is_deleted"]:
            existing["deleted_at"] = None

    op.drop_constraint(
        NEW_UNIQUE_CONSTRAINT,
        "partner_group_role",
        type_="unique",
    )
    op.drop_index(op.f("ix_partner_group_role_user_id"), table_name="partner_group_role")
    op.drop_constraint(USER_FOREIGN_KEY, "partner_group_role", type_="foreignkey")
    bind.execute(sa.text("DELETE FROM partner_group_role"))
    op.drop_column("partner_group_role", "user_id")

    rows = list(group_roles.values())
    if rows:
        bind.execute(
            sa.text(
                """
                INSERT INTO partner_group_role (
                    partner_group_id, role_id, uuid, created_at, updated_at,
                    deleted_at, is_deleted
                ) VALUES (
                    :partner_group_id, :role_id, :uuid, :created_at, :updated_at,
                    :deleted_at, :is_deleted
                )
                """
            ),
            rows,
        )

    op.create_unique_constraint(
        OLD_UNIQUE_CONSTRAINT,
        "partner_group_role",
        ["partner_group_id", "role_id"],
    )