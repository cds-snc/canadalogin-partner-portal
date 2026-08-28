"""Add optional RP configuration naming and clone-lineage metadata.

Revision ID: 0026_rp_config_expand
Revises: 0025_workspace_invitations
Create Date: 2026-08-13

This expand-only revision adds nullable descriptive and lineage metadata. It
does not invent names or clone sources for retained RP records, and it does
not activate the later required-name or same-Application clone contract.
Backfill and contract constraints remain separate revisions.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0026_rp_config_expand"
down_revision: Union[str, None] = "0025_workspace_invitations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rp_application",
        sa.Column("configuration_name", sa.String(length=128), nullable=True),
    )
    op.add_column(
        "rp_application",
        sa.Column(
            "source_rp_configuration_id",
            sa.Integer(),
            sa.ForeignKey("rp_application.id"),
            nullable=True,
        ),
    )
    op.create_index(
        op.f("ix_rp_application_source_rp_configuration_id"),
        "rp_application",
        ["source_rp_configuration_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_rp_application_source_rp_configuration_id"),
        table_name="rp_application",
    )
    op.drop_column("rp_application", "source_rp_configuration_id")
    op.drop_column("rp_application", "configuration_name")
