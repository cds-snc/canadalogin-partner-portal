"""Create audit_log table.

Revision ID: 0006_audit_log_schema
Revises: 0005_rp_app_policies
Create Date: 2026-06-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0006_audit_log_schema"
down_revision: Union[str, None] = "0005_rp_app_policies"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user", sa.String(length=255), nullable=False),
        sa.Column("user_uuid", UUID(as_uuid=True), nullable=True),
        sa.Column("target", sa.String(length=128), nullable=False),
        sa.Column("operation", sa.String(length=16), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("uuid", UUID(as_uuid=True), nullable=False),
        sa.Column("target_uuid", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_uuid"], ["user.uuid"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_audit_log_user_uuid"), "audit_log", ["user_uuid"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_log_user_uuid"), table_name="audit_log")
    op.drop_table("audit_log")
