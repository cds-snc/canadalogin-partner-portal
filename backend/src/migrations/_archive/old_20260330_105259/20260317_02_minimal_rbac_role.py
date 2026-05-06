"""Add minimal RBAC role table and user role reference.

Revision ID: 20260317_02
Revises: 20260316_01
Create Date: 2026-03-17 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

revision = "20260317_02"
down_revision = "20260316_01"
branch_labels = None
depends_on = None


def get_column_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def get_index_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("role"):
        op.create_table(
            "role",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("name", sa.String(length=64), nullable=False),
            sa.Column("description", sa.String(length=255), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_role_name", "role", ["name"], unique=True)

    role_table = sa.table(
        "role",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.String()),
        sa.column("description", sa.String()),
    )

    admin_role_id = bind.execute(sa.select(role_table.c.id).where(role_table.c.name == "admin")).scalar_one_or_none()
    if admin_role_id is None:
        bind.execute(
            sa.insert(role_table).values(name="admin", description="Built-in administrator role for Casbin policies")
        )
        admin_role_id = bind.execute(sa.select(role_table.c.id).where(role_table.c.name == "admin")).scalar_one()

    if inspector.has_table("user"):
        user_columns = get_column_names(inspector, "user")
        if "role_id" not in user_columns:
            op.add_column("user", sa.Column("role_id", sa.Integer(), nullable=True))
            op.create_foreign_key("fk_user_role_id_role", "user", "role", ["role_id"], ["id"])

        inspector = sa.inspect(bind)
        user_indexes = get_index_names(inspector, "user")
        if "ix_user_role_id" not in user_indexes:
            op.create_index("ix_user_role_id", "user", ["role_id"], unique=False)

        user_table = sa.table(
            "user",
            sa.column("id", sa.Integer()),
            sa.column("is_superuser", sa.Boolean()),
            sa.column("role_id", sa.Integer()),
        )
        bind.execute(
            sa.update(user_table)
            .where(user_table.c.is_superuser.is_(True))
            .where(user_table.c.role_id.is_(None))
            .values(role_id=admin_role_id)
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("user"):
        user_columns = get_column_names(inspector, "user")
        user_indexes = get_index_names(inspector, "user")
        if "ix_user_role_id" in user_indexes:
            op.drop_index("ix_user_role_id", table_name="user")
        if "role_id" in user_columns:
            op.drop_constraint("fk_user_role_id_role", "user", type_="foreignkey")
            op.drop_column("user", "role_id")

    if inspector.has_table("role"):
        role_indexes = get_index_names(inspector, "role")
        if "ix_role_name" in role_indexes:
            op.drop_index("ix_role_name", table_name="role")
        op.drop_table("role")
