"""Remove unused department catalog columns.

Revision ID: 20260323_12
Revises: 20260323_11
Create Date: 2026-03-23 00:00:03.000000
"""

import sqlalchemy as sa
from alembic import op

revision = "20260323_12"
down_revision = "20260323_11"
branch_labels = None
depends_on = None


def get_column_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("department"):
        return

    columns = get_column_names(inspector, "department")
    if "faa_lgfp" in columns:
        op.drop_column("department", "faa_lgfp")
    if "status_statut" in columns:
        op.drop_column("department", "status_statut")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("department"):
        return

    columns = get_column_names(inspector, "department")
    if "faa_lgfp" not in columns:
        op.add_column("department", sa.Column("faa_lgfp", sa.String(length=8), nullable=True))
    if "status_statut" not in columns:
        op.add_column("department", sa.Column("status_statut", sa.String(length=1), nullable=True))
