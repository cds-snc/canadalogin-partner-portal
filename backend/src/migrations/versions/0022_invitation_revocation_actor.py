"""Retain the actor for invitation revocation transitions.

Revision ID: 0022_invitation_revocation_actor
Revises: 0021_four_role_constraints
Create Date: 2026-08-11

Existing historical revocations remain nullable because their actor cannot be
inferred safely. New authorized revocation and pending-reissue transitions set
the actor through the application service.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0022_invitation_revocation_actor"
down_revision: Union[str, None] = "0021_four_role_constraints"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rp_application_developer_invitation",
        sa.Column("revoked_by_user_id", sa.Integer(), nullable=True),
    )
    op.create_index(
        op.f("ix_rp_application_developer_invitation_revoked_by_user_id"),
        "rp_application_developer_invitation",
        ["revoked_by_user_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_rp_invitation_revoked_by_user",
        "rp_application_developer_invitation",
        "user",
        ["revoked_by_user_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_rp_invitation_revoked_by_user",
        "rp_application_developer_invitation",
        type_="foreignkey",
    )
    op.drop_index(
        op.f("ix_rp_application_developer_invitation_revoked_by_user_id"),
        table_name="rp_application_developer_invitation",
    )
    op.drop_column(
        "rp_application_developer_invitation",
        "revoked_by_user_id",
    )
