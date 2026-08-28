"""Add workspace-scoped RP application persistence fields.

Revision ID: 0013_workspace_scoped_rp_application_fields
Revises: 0012_rp_application_application_information_link
Create Date: 2026-07-30

"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0013_workspace_scoped_rp_application_fields"
down_revision: Union[str, None] = "0012_rp_application_application_information_link"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rp_application",
        sa.Column("workspace_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "rp_application",
        sa.Column("canada_login_environment", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "rp_application",
        sa.Column("status", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "rp_application",
        sa.Column("oidc_registration_payload", sa.JSON(), nullable=True),
    )
    op.create_foreign_key(
        "fk_rp_application_workspace_id",
        "rp_application",
        "workspace",
        ["workspace_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_rp_application_workspace_id"),
        "rp_application",
        ["workspace_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_rp_application_workspace_id"), table_name="rp_application")
    op.drop_constraint(
        "fk_rp_application_workspace_id",
        "rp_application",
        type_="foreignkey",
    )
    op.drop_column("rp_application", "oidc_registration_payload")
    op.drop_column("rp_application", "status")
    op.drop_column("rp_application", "canada_login_environment")
    op.drop_column("rp_application", "workspace_id")
