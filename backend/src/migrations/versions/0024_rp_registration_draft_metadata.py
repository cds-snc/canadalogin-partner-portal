"""Add RP application registration draft metadata.

Revision ID: 0024_registration_draft
Revises: 0023_authorization_im
Create Date: 2026-08-12

The existing RP application row and its registration JSON remain the only
draft aggregate. Existing rows receive version zero and no fabricated creation
key or completed-step marker.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0024_registration_draft"
down_revision: Union[str, None] = "0023_authorization_im"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rp_application",
        sa.Column(
            "registration_creation_key",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
    )
    op.add_column(
        "rp_application",
        sa.Column(
            "registration_draft_version",
            sa.Integer(),
            nullable=True,
        ),
    )
    op.add_column(
        "rp_application",
        sa.Column(
            "registration_last_completed_step",
            sa.String(length=32),
            nullable=True,
        ),
    )
    op.execute("UPDATE rp_application SET registration_draft_version = 0 WHERE registration_draft_version IS NULL")
    op.alter_column(
        "rp_application",
        "registration_draft_version",
        existing_type=sa.Integer(),
        nullable=False,
        server_default=sa.text("0"),
    )
    op.create_check_constraint(
        "ck_rp_application_registration_draft_version",
        "rp_application",
        "registration_draft_version >= 0",
    )
    op.create_check_constraint(
        "ck_rp_application_registration_last_completed_step",
        "rp_application",
        "registration_last_completed_step IS NULL OR "
        "registration_last_completed_step IN "
        "('basics', 'endpoints', 'client-and-access', 'signing', 'encryption')",
    )
    op.create_index(
        "uq_rp_application_registration_creation_key",
        "rp_application",
        ["registration_creation_key"],
        unique=True,
        postgresql_where=sa.text("registration_creation_key IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_rp_application_registration_creation_key",
        table_name="rp_application",
    )
    op.drop_constraint(
        "ck_rp_application_registration_last_completed_step",
        "rp_application",
        type_="check",
    )
    op.drop_constraint(
        "ck_rp_application_registration_draft_version",
        "rp_application",
        type_="check",
    )
    op.drop_column("rp_application", "registration_last_completed_step")
    op.drop_column("rp_application", "registration_draft_version")
    op.drop_column("rp_application", "registration_creation_key")
