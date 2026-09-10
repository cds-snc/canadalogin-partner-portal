"""Replace legacy role assignments with a normalized user-role mapping.

This migration intentionally discards legacy role assignments and Casbin policies.
Downgrade restores only the legacy structural column; discarded data cannot be recovered.

Revision ID: 0009_dynamic_user_roles
Revises: 0008_dnr_view_perm
Create Date: 2026-09-10

"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from uuid6 import uuid7

revision = "0009_dynamic_user_roles"
down_revision = "0008_dnr_view_perm"
branch_labels = None
depends_on = None

ROLES = [
    ("Partner Developer", "Develops partner integrations."),
    ("Partner Production Administrator", "Administers partner production integrations."),
    ("CanadaLogin Administrators", "Administers the CanadaLogin partner portal."),
]


def upgrade() -> None:
    op.create_table(
        "user_role",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "role_id", name="uq_user_role_user_id_role_id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_user_role_is_deleted"), "user_role", ["is_deleted"], unique=False)
    op.create_index(op.f("ix_user_role_role_id"), "user_role", ["role_id"], unique=False)
    op.create_index(op.f("ix_user_role_user_id"), "user_role", ["user_id"], unique=False)
    op.drop_column("user", "role_ids")

    bind = op.get_bind()
    bind.execute(sa.text("DELETE FROM access_policy"))
    bind.execute(sa.text("DELETE FROM role"))
    for name, description in ROLES:
        bind.execute(
            sa.text(
                "INSERT INTO role (name, description, uuid, created_at, deleted_at, is_deleted) "
                "VALUES (:name, :description, :uuid, CURRENT_TIMESTAMP, NULL, FALSE)"
            ),
            {"name": name, "description": description, "uuid": str(uuid7())},
        )


def downgrade() -> None:
    op.drop_index(op.f("ix_user_role_is_deleted"), table_name="user_role")
    op.drop_index(op.f("ix_user_role_user_id"), table_name="user_role")
    op.drop_index(op.f("ix_user_role_role_id"), table_name="user_role")
    op.drop_table("user_role")
    op.add_column("user", sa.Column("role_ids", sa.JSON(), nullable=True))