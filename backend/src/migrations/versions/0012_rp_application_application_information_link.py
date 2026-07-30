"""Link RP applications to application information.

Revision ID: 0012_rp_application_application_information_link
Revises: 0011_application_information_schema
Create Date: 2026-07-30

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0012_rp_application_application_information_link"
down_revision: Union[str, None] = "0011_application_information_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "rp_application",
        sa.Column("application_information_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_rp_application_application_information_id",
        "rp_application",
        "application_information",
        ["application_information_id"],
        ["id"],
    )
    op.create_index(
        op.f("ix_rp_application_application_information_id"),
        "rp_application",
        ["application_information_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_rp_application_application_information_id"),
        table_name="rp_application",
    )
    op.drop_constraint(
        "fk_rp_application_application_information_id",
        "rp_application",
        type_="foreignkey",
    )
    op.drop_column("rp_application", "application_information_id")