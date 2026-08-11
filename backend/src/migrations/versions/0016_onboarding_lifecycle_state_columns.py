"""Add onboarding lifecycle columns to core onboarding tables.

Revision ID: 0016_onboarding_lifecycle_state_columns
Revises: 0015_rp_application_developer_invitation_schema
Create Date: 2026-08-11

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0016_onboarding_lifecycle_state_columns"
down_revision: Union[str, None] = "0015_rp_application_developer_invitation_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LIFECYCLE_TABLES = (
    "workspace",
    "application_information",
    "rp_application",
)


def upgrade() -> None:
    for table_name in LIFECYCLE_TABLES:
        op.add_column(
            table_name,
            sa.Column("onboarding_state", sa.String(length=32), nullable=True),
        )
        op.add_column(
            table_name,
            sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.add_column(
            table_name,
            sa.Column("under_review_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.add_column(
            table_name,
            sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.add_column(
            table_name,
            sa.Column("launched_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index(
            op.f(f"ix_{table_name}_onboarding_state"),
            table_name,
            ["onboarding_state"],
            unique=False,
        )


def downgrade() -> None:
    for table_name in reversed(LIFECYCLE_TABLES):
        op.drop_index(op.f(f"ix_{table_name}_onboarding_state"), table_name=table_name)
        op.drop_column(table_name, "launched_at")
        op.drop_column(table_name, "approved_at")
        op.drop_column(table_name, "under_review_at")
        op.drop_column(table_name, "submitted_at")
        op.drop_column(table_name, "onboarding_state")