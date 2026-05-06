"""Add role_ids JSONB column to user table and migrate roles.

Revision ID: 0004_user_roles
Revises: 0003_seed_superuser
Create Date: 2026-03-30
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0004_user_roles"
down_revision = "0003_seed_superuser"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # If user table is not present there's nothing to do
    if not inspector.has_table("user"):
        return

    cols = {c["name"] for c in inspector.get_columns("user")}

    # Drop legacy join table if present
    if inspector.has_table("user_roles"):
        op.drop_table("user_roles")

    # Add role_ids JSONB column if absent
    if "role_ids" not in cols:
        op.add_column("user", sa.Column("role_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=True))

    # If there is an existing role_id column, migrate its values
    if "role_id" in cols:
        conn = bind
        # Select all users with a non-null role_id
        result = conn.execute(sa.text('SELECT id, role_id FROM "user" WHERE role_id IS NOT NULL'))
        for user_id, role_id in result:
            # Use JSONB_BUILD_ARRAY to create an array with the single role id
            conn.execute(sa.text(f'UPDATE "user" SET role_ids = JSONB_BUILD_ARRAY({role_id}) WHERE id = {user_id}'))
        # drop the old column after migrating
        op.drop_column("user", "role_id")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("user"):
        return

    cols = {c["name"] for c in inspector.get_columns("user")}

    # Recreate role_id if missing
    if "role_ids" in cols and "role_id" not in cols:
        op.add_column("user", sa.Column("role_id", sa.Integer(), nullable=True))
        conn = bind
        result = conn.execute(sa.text('SELECT id, role_ids FROM "user" WHERE role_ids IS NOT NULL'))
        for user_id, role_ids in result:
            if role_ids and len(role_ids) > 0:
                # Restore first role id into role_id column
                conn.execute(sa.text(f'UPDATE "user" SET role_id = {role_ids[0]} WHERE id = {user_id}'))
    # drop role_ids column
    if "role_ids" in cols:
        op.drop_column("user", "role_ids")
