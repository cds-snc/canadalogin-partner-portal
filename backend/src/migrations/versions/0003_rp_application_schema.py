"""Create RP application schema.

Revision ID: 0003_rp_app_schema
Revises: 0002_seed_department_catalog
Create Date: 2026-06-10

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_rp_app_schema"
down_revision: Union[str, None] = "0002_seed_department_catalog"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rp_application",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=True),
        sa.Column("dnr_app_name", sa.String(length=128), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("ibm_sv_application_id", sa.String(length=128), nullable=True),
        sa.Column("application_owner", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"]),
        sa.ForeignKeyConstraint(["department_id"], ["department.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_rp_application_department_id"), "rp_application", ["department_id"], unique=False)
    op.create_index(op.f("ix_rp_application_ibm_sv_application_id"), "rp_application", ["ibm_sv_application_id"], unique=False)
    op.create_index(op.f("ix_rp_application_is_deleted"), "rp_application", ["is_deleted"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_rp_application_is_deleted"), table_name="rp_application")
    op.drop_index(op.f("ix_rp_application_ibm_sv_application_id"), table_name="rp_application")
    op.drop_index(op.f("ix_rp_application_department_id"), table_name="rp_application")
    op.drop_table("rp_application")