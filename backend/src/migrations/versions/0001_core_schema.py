"""Create the fresh core schema baseline.

Revision ID: 0001_core_schema
Revises:
Create Date: 2026-06-10

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0001_core_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "access_policy",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("subject", sa.String(length=64), nullable=False),
        sa.Column("resource", sa.String(length=128), nullable=False),
        sa.Column("action", sa.String(length=32), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_access_policy_action"), "access_policy", ["action"], unique=False)
    op.create_index(op.f("ix_access_policy_is_deleted"), "access_policy", ["is_deleted"], unique=False)
    op.create_index(op.f("ix_access_policy_resource"), "access_policy", ["resource"], unique=False)
    op.create_index(op.f("ix_access_policy_subject"), "access_policy", ["subject"], unique=False)

    op.create_table(
        "department",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("gc_org_id", sa.Integer(), nullable=True),
        sa.Column("name_fr", sa.String(length=128), nullable=True),
        sa.Column("abbreviation", sa.String(length=16), nullable=True),
        sa.Column("abbreviation_fr", sa.String(length=16), nullable=True),
        sa.Column("lead_department_name", sa.String(length=64), nullable=True),
        sa.Column("lead_department_name_fr", sa.String(length=192), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_department_gc_org_id"), "department", ["gc_org_id"], unique=True)
    op.create_index(op.f("ix_department_is_deleted"), "department", ["is_deleted"], unique=False)

    op.create_table(
        "role",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_role_is_deleted"), "role", ["is_deleted"], unique=False)
    op.create_index(op.f("ix_role_name"), "role", ["name"], unique=True)

    op.create_table(
        "tier",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("uuid"),
    )

    op.create_table(
        "rate_limit",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("tier_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("path", sa.String(), nullable=False),
        sa.Column("limit", sa.Integer(), nullable=False),
        sa.Column("period", sa.Integer(), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tier_id"], ["tier.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_rate_limit_tier_id"), "rate_limit", ["tier_id"], unique=False)

    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("auth_provider", sa.String(length=50), nullable=True),
        sa.Column("auth_subject", sa.String(length=255), nullable=True),
        sa.Column("profile_image_url", sa.String(), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.Column("is_superuser", sa.Boolean(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=True),
        sa.Column("tier_id", sa.Integer(), nullable=True),
        sa.Column("role_ids", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["department_id"], ["department.id"]),
        sa.ForeignKeyConstraint(["tier_id"], ["tier.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_user_auth_subject"), "user", ["auth_subject"], unique=True)
    op.create_index(op.f("ix_user_department_id"), "user", ["department_id"], unique=False)
    op.create_index(op.f("ix_user_email"), "user", ["email"], unique=True)
    op.create_index(op.f("ix_user_enabled"), "user", ["enabled"], unique=False)
    op.create_index(op.f("ix_user_is_deleted"), "user", ["is_deleted"], unique=False)
    op.create_index(op.f("ix_user_tier_id"), "user", ["tier_id"], unique=False)
    op.create_index(op.f("ix_user_username"), "user", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_username"), table_name="user")
    op.drop_index(op.f("ix_user_tier_id"), table_name="user")
    op.drop_index(op.f("ix_user_is_deleted"), table_name="user")
    op.drop_index(op.f("ix_user_enabled"), table_name="user")
    op.drop_index(op.f("ix_user_email"), table_name="user")
    op.drop_index(op.f("ix_user_department_id"), table_name="user")
    op.drop_index(op.f("ix_user_auth_subject"), table_name="user")
    op.drop_table("user")
    op.drop_index(op.f("ix_rate_limit_tier_id"), table_name="rate_limit")
    op.drop_table("rate_limit")
    op.drop_table("tier")
    op.drop_index(op.f("ix_role_name"), table_name="role")
    op.drop_index(op.f("ix_role_is_deleted"), table_name="role")
    op.drop_table("role")
    op.drop_index(op.f("ix_department_is_deleted"), table_name="department")
    op.drop_index(op.f("ix_department_gc_org_id"), table_name="department")
    op.drop_table("department")
    op.drop_index(op.f("ix_access_policy_subject"), table_name="access_policy")
    op.drop_index(op.f("ix_access_policy_resource"), table_name="access_policy")
    op.drop_index(op.f("ix_access_policy_is_deleted"), table_name="access_policy")
    op.drop_index(op.f("ix_access_policy_action"), table_name="access_policy")
    op.drop_table("access_policy")