"""Drop RP application settings snapshot column.

Revision ID: 0007_drop_rp_app_settings
Revises: 0006_rp_application_ibm_sv_id
Create Date: 2026-04-02
"""

import sqlalchemy as sa
from alembic import op

revision = "0007_drop_rp_app_settings"
down_revision = "0006_rp_application_ibm_sv_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("rp_application"):
        return

    columns = {column["name"] for column in inspector.get_columns("rp_application")}
    if "settings" in columns:
        op.drop_column("rp_application", "settings")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("rp_application"):
        return

    columns = {column["name"] for column in inspector.get_columns("rp_application")}
    if "settings" not in columns:
        op.add_column("rp_application", sa.Column("settings", sa.JSON(), nullable=True))
