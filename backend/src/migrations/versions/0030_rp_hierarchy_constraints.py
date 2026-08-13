"""Activate RP configuration hierarchy constraints.

Revision ID: 0030_rp_hierarchy_constraints
Revises: 0029_rp_hierarchy_reconcile
Create Date: 2026-08-13

This contract revision repeats the locked minimized preflight before requiring
configuration labels, candidate/partner parent pairing, and active partner
Department/environment fields. Same-workspace ancestry remains protected by
the locked service boundary because it spans two tables.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

try:
    from src.migrations.rp_configuration_hierarchy_reconciliation_v1 import (
        build_report,
        has_blocking_findings,
        load_snapshot,
    )
except ModuleNotFoundError:  # Alembic runs with backend/src on sys.path.
    from migrations.rp_configuration_hierarchy_reconciliation_v1 import (
        build_report,
        has_blocking_findings,
        load_snapshot,
    )

revision: str = "0030_rp_hierarchy_constraints"
down_revision: Union[str, None] = "0029_rp_hierarchy_reconcile"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    connection.execute(sa.text("LOCK TABLE workspace, application_information, rp_application IN SHARE ROW EXCLUSIVE MODE"))
    report = build_report(load_snapshot(connection))
    if has_blocking_findings(report):
        raise RuntimeError("Cannot activate RP hierarchy constraints while reconciliation findings remain")

    op.alter_column(
        "rp_application",
        "configuration_name",
        existing_type=sa.String(length=128),
        nullable=False,
    )
    op.create_check_constraint(
        "ck_rp_application_hierarchy_pair",
        "rp_application",
        "(workspace_id IS NULL AND application_information_id IS NULL) OR (workspace_id IS NOT NULL AND application_information_id IS NOT NULL)",
    )
    op.create_check_constraint(
        "ck_rp_application_configuration_name_nonblank",
        "rp_application",
        "length(trim(configuration_name)) > 0",
    )
    op.create_check_constraint(
        "ck_rp_application_partner_required_fields",
        "rp_application",
        "workspace_id IS NULL OR is_deleted OR deleted_at IS NOT NULL OR "
        "(department_id IS NOT NULL AND canada_login_environment IS NOT NULL AND "
        "canada_login_environment IN "
        "('test', 'staging', 'production') AND "
        "length(trim(configuration_name)) > 0)",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_rp_application_partner_required_fields",
        "rp_application",
        type_="check",
    )
    op.drop_constraint(
        "ck_rp_application_configuration_name_nonblank",
        "rp_application",
        type_="check",
    )
    op.drop_constraint(
        "ck_rp_application_hierarchy_pair",
        "rp_application",
        type_="check",
    )
    op.alter_column(
        "rp_application",
        "configuration_name",
        existing_type=sa.String(length=128),
        nullable=True,
    )
