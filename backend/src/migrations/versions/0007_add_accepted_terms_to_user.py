"""Add accepted_terms_at and terms_version to user.

Revision ID: 0007_accepted_terms
Revises: 0006_audit_log_schema
Create Date: 2026-06-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0007_accepted_terms"
down_revision: Union[str, None] = "0006_audit_log_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("user", sa.Column("accepted_terms_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("user", sa.Column("terms_version", sa.String(length=20), nullable=True))


def downgrade() -> None:
    op.drop_column("user", "terms_version")
    op.drop_column("user", "accepted_terms_at")
