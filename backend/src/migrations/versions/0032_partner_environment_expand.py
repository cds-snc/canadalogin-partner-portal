"""Expand RP configurations with Partner environment metadata.

Revision ID: 0032_partner_environment
Revises: 0031_cross_namespace_uuid_guard
Create Date: 2026-08-13

The additive migration keeps retained records readable by allowing a missing
value while new application contracts adopt the field. It does not infer or
backfill a partner-side environment from configuration names, URLs, provider
metadata, sibling records, or the CanadaLogin target.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0032_partner_environment"
down_revision: Union[str, None] = "0031_cross_namespace_uuid_guard"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rp_application",
        sa.Column("partner_environment", sa.String(length=128), nullable=True),
    )
    op.create_check_constraint(
        "ck_rp_application_partner_environment_nonblank",
        "rp_application",
        "partner_environment IS NULL OR length(trim(partner_environment)) > 0",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_rp_application_partner_environment_nonblank",
        "rp_application",
        type_="check",
    )
    op.drop_column("rp_application", "partner_environment")
