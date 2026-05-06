"""Add IBM Security Verify application ID to RP application.

Revision ID: 0006_rp_application_ibm_sv_id
Revises: 0005_seed_roles
Create Date: 2026-04-02
"""

import sqlalchemy as sa
from alembic import op

revision = "0006_rp_application_ibm_sv_id"
down_revision = "0005_seed_roles"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("rp_application"):
        return

    columns = {column["name"] for column in inspector.get_columns("rp_application")}
    if "ibm_sv_application_id" not in columns:
        op.add_column("rp_application", sa.Column("ibm_sv_application_id", sa.String(length=128), nullable=True))
        op.create_index(
            "ix_rp_application_ibm_sv_application_id",
            "rp_application",
            ["ibm_sv_application_id"],
            unique=False,
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("rp_application"):
        return

    columns = {column["name"] for column in inspector.get_columns("rp_application")}
    if "ibm_sv_application_id" in columns:
        indexes = {index["name"] for index in inspector.get_indexes("rp_application")}
        if "ix_rp_application_ibm_sv_application_id" in indexes:
            op.drop_index("ix_rp_application_ibm_sv_application_id", table_name="rp_application")
        op.drop_column("rp_application", "ibm_sv_application_id")