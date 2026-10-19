"""Add DNR view.

Revision ID: 0008_dnr_view_perm
Revises: 0007_accepted_terms
Create Date: 2026-06-18 08:45:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op


revision: str = "0008_dnr_view_perm"
down_revision: Union[str, None] = "0007_accepted_terms"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


VIEW_NAME = "public.vw_dnr_read_rp_application"

# Database roles and grants are managed outside Alembic; existing DNR access needs manual cleanup.


def upgrade() -> None:
    op.execute(
        f"""
        CREATE OR REPLACE VIEW {VIEW_NAME} AS
        SELECT
            ra.dnr_app_name AS dnr_application_name,
            ra.ibm_sv_application_id AS ibm_application_id,
            d.gc_org_id AS department_id,
            d.abbreviation AS department_abbreviation,
            d.name AS department_name,
            d.abbreviation_fr AS department_abbreviation_fr,
            d.name_fr AS department_name_fr
        FROM public.rp_application ra
        LEFT JOIN public.department d ON ra.department_id = d.id
        WHERE ra.is_deleted = FALSE;
        """
    )


def downgrade() -> None:
    op.execute(f"DROP VIEW IF EXISTS {VIEW_NAME};")