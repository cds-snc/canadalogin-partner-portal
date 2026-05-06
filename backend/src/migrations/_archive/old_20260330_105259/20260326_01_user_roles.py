"""Add role_ids JSON column to user table.

Revision ID: 20260326_01
Revises: 20260323_12
Create Date: 2026-03-26 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import JSON, ForeignKey, Integer

revision = "20260326_01"
down_revision = "20260323_12"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())

    if not inspector.has_table("user"):
        return

    user_cols = {col["name"] for col in inspector.get_columns("user")}

    if inspector.has_table("user_roles"):
        op.drop_table("user_roles")

    if "role_ids" not in user_cols:
        op.add_column("user", sa.Column("role_ids", JSON(), nullable=True))

    if "role_id" in user_cols:
        conn = op.get_bind()
        result = conn.execute(
            sa.text('SELECT "user".id, "user".role_id FROM "user" WHERE "user".role_id IS NOT NULL')
        )
        for user_id, role_id in result:
            conn.execute(
                sa.text(f'UPDATE "user" SET role_ids = JSONB_BUILD_ARRAY({role_id}) WHERE id = {user_id}')
            )
        op.drop_column("user", "role_id")


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())

    if not inspector.has_table("user"):
        return

    user_cols = {col["name"] for col in inspector.get_columns("user")}

    if "role_ids" not in user_cols:
        return

    if "role_id" not in user_cols:
        op.add_column("user", sa.Column("role_id", Integer, ForeignKey("role.id"), nullable=True))

    conn = op.get_bind()
    result = conn.execute(
        sa.text('SELECT "user".id, "user".role_ids FROM "user" WHERE "user".role_ids IS NOT NULL')
    )
    for user_id, role_ids in result:
        if role_ids and len(role_ids) > 0:
            conn.execute(
                sa.text(f'UPDATE "user" SET role_id = {role_ids[0]} WHERE id = {user_id}')
            )

    op.drop_column("user", "role_ids")
