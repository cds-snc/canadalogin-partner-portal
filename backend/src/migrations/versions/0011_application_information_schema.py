"""Create application information schema.

Revision ID: 0011_application_information_schema
Revises: 0010_workspace_member_schema
Create Date: 2026-07-30

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0011_application_information_schema"
down_revision: Union[str, None] = "0010_workspace_member_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "alembic_version",
        "version_num",
        existing_type=sa.String(length=32),
        type_=sa.String(length=64),
        existing_nullable=False,
    )

    op.create_table(
        "application_information",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("workspace_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("service_name_en", sa.String(length=255), nullable=False),
        sa.Column("service_name_fr", sa.String(length=255), nullable=False),
        sa.Column("overview", sa.Text(), nullable=False),
        sa.Column("technology_and_protocol", sa.Text(), nullable=False),
        sa.Column("security_and_privacy", sa.Text(), nullable=False),
        sa.Column("usage", sa.Text(), nullable=False),
        sa.Column("migration_or_transition_plan", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"]),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspace.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(
        op.f("ix_application_information_is_deleted"),
        "application_information",
        ["is_deleted"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_information_workspace_id"),
        "application_information",
        ["workspace_id"],
        unique=False,
    )

    op.create_table(
        "application_information_contact",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("application_information_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("name_en", sa.String(length=255), nullable=False),
        sa.Column("name_fr", sa.String(length=255), nullable=False),
        sa.Column("responsibility_en", sa.String(length=255), nullable=False),
        sa.Column("responsibility_fr", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone_number", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["application_information_id"], ["application_information.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(
        op.f("ix_application_information_contact_application_information_id"),
        "application_information_contact",
        ["application_information_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_information_contact_is_deleted"),
        "application_information_contact",
        ["is_deleted"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_application_information_contact_is_deleted"),
        table_name="application_information_contact",
    )
    op.drop_index(
        op.f("ix_application_information_contact_application_information_id"),
        table_name="application_information_contact",
    )
    op.drop_table("application_information_contact")

    op.drop_index(
        op.f("ix_application_information_workspace_id"),
        table_name="application_information",
    )
    op.drop_index(
        op.f("ix_application_information_is_deleted"),
        table_name="application_information",
    )
    op.drop_table("application_information")