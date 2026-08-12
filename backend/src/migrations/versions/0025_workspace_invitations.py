"""Allow workspace-owned invitations without RP application provenance.

Revision ID: 0025_workspace_invitations
Revises: 0024_registration_draft
Create Date: 2026-08-12

Existing invitation rows and their RP application links remain unchanged. New
workspace-only invitations may leave ``rp_application_id`` null. Downgrade
refuses to discard or fabricate provenance for those records.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0025_workspace_invitations"
down_revision: Union[str, None] = "0024_registration_draft"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "rp_application_developer_invitation",
        "rp_application_id",
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    connection = op.get_bind()
    workspace_only_count = connection.execute(
        sa.text("SELECT count(*) FROM rp_application_developer_invitation WHERE rp_application_id IS NULL")
    ).scalar_one()
    if workspace_only_count:
        raise RuntimeError(
            "Cannot downgrade 0025_workspace_invitations while workspace-only "
            "invitations exist; explicitly preserve or disposition those records first"
        )

    op.alter_column(
        "rp_application_developer_invitation",
        "rp_application_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
