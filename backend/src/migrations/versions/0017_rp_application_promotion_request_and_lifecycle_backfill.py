"""Add RP-application promotion-request persistence and backfill lifecycle state.

Revision ID: 0017_rp_application_promotion_request_and_lifecycle_backfill
Revises: 0016_onboarding_lifecycle_state_columns
Create Date: 2026-08-11

"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0017_rp_application_promotion_request_and_lifecycle_backfill"
down_revision: Union[str, None] = "0016_onboarding_lifecycle_state_columns"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LIFECYCLE_TABLES = (
    "workspace",
    "application_information",
    "rp_application",
)


def upgrade() -> None:
    op.create_table(
        "rp_application_promotion_request",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("rp_application_id", sa.Integer(), nullable=False),
        sa.Column("target_environment", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("external_reference", sa.String(length=255), nullable=True),
        sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reviewed_by_team", sa.String(length=128), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["user.id"]),
        sa.ForeignKeyConstraint(["rp_application_id"], ["rp_application.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "rp_application_id",
            "target_environment",
            name="uq_rp_application_promotion_request_target_environment",
        ),
    )
    op.create_index(
        op.f("ix_rp_application_promotion_request_rp_application_id"),
        "rp_application_promotion_request",
        ["rp_application_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_promotion_request_target_environment"),
        "rp_application_promotion_request",
        ["target_environment"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_promotion_request_status"),
        "rp_application_promotion_request",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_promotion_request_reviewed_by_user_id"),
        "rp_application_promotion_request",
        ["reviewed_by_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_promotion_request_is_deleted"),
        "rp_application_promotion_request",
        ["is_deleted"],
        unique=False,
    )

    for table_name in LIFECYCLE_TABLES:
        op.execute(sa.text(f"UPDATE {table_name} SET onboarding_state = 'draft' WHERE onboarding_state IS NULL"))


def downgrade() -> None:
    op.drop_index(
        op.f("ix_rp_application_promotion_request_is_deleted"),
        table_name="rp_application_promotion_request",
    )
    op.drop_index(
        op.f("ix_rp_application_promotion_request_reviewed_by_user_id"),
        table_name="rp_application_promotion_request",
    )
    op.drop_index(
        op.f("ix_rp_application_promotion_request_status"),
        table_name="rp_application_promotion_request",
    )
    op.drop_index(
        op.f("ix_rp_application_promotion_request_target_environment"),
        table_name="rp_application_promotion_request",
    )
    op.drop_index(
        op.f("ix_rp_application_promotion_request_rp_application_id"),
        table_name="rp_application_promotion_request",
    )
    op.drop_table("rp_application_promotion_request")
