"""Add registration completion and canonical Production-review state.

Revision ID: 0033_registration_review
Revises: 0032_partner_environment
Create Date: 2026-08-25

This expand migration keeps the retired generic lifecycle columns and legacy
promotion status intact for retention and rollback.  Registration completion
is backfilled only from the explicit questionnaire-submission timestamp.  The
canonical review state is backfilled only where an existing, traceable review
record has an unambiguous legacy value.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0033_registration_review"
down_revision: Union[str, None] = "0032_partner_environment"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rp_application",
        sa.Column("registration_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        sa.text(
            """
            UPDATE rp_application
            SET registration_completed_at = submitted_at
            WHERE registration_completed_at IS NULL
              AND submitted_at IS NOT NULL
            """
        )
    )

    op.add_column(
        "rp_application_promotion_request",
        sa.Column("review_status", sa.String(length=32), nullable=True),
    )
    op.create_check_constraint(
        "ck_rp_application_promotion_request_review_status",
        "rp_application_promotion_request",
        "review_status IS NULL OR review_status IN ('pending', 'approved', 'rejected')",
    )
    op.create_index(
        "ix_rp_application_promotion_request_review_status",
        "rp_application_promotion_request",
        ["review_status"],
        unique=False,
    )
    op.execute(
        sa.text(
            """
            UPDATE rp_application_promotion_request
            SET review_status = CASE status
                WHEN 'review_tracked' THEN 'pending'
                WHEN 'approved' THEN 'approved'
                ELSE NULL
            END
            WHERE review_status IS NULL
              AND external_reference IS NOT NULL
              AND BTRIM(external_reference) <> ''
              AND (
                status = 'review_tracked'
                OR (
                  status = 'approved'
                  AND reviewed_at IS NOT NULL
                  AND decided_at IS NOT NULL
                  AND (
                    reviewed_by_user_id IS NOT NULL
                    OR (
                      reviewed_by_team IS NOT NULL
                      AND BTRIM(reviewed_by_team) <> ''
                    )
                  )
                )
              )
            """
        )
    )


def downgrade() -> None:
    op.drop_index(
        "ix_rp_application_promotion_request_review_status",
        table_name="rp_application_promotion_request",
    )
    op.drop_constraint(
        "ck_rp_application_promotion_request_review_status",
        "rp_application_promotion_request",
        type_="check",
    )
    op.drop_column("rp_application_promotion_request", "review_status")
    op.drop_column("rp_application", "registration_completed_at")
