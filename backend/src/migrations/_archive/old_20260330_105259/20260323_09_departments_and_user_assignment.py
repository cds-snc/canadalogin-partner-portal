"""Add departments and user department assignment.

Revision ID: 20260323_09
Revises: 20260323_08
Create Date: 2026-03-23 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from uuid6 import uuid7

revision = "20260323_09"
down_revision = "20260323_08"
branch_labels = None
depends_on = None


DEPARTMENT_POLICIES = [
    ("admin", "departments", "read"),
    ("admin", "departments", "write"),
]


def get_column_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def get_index_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def ensure_department_table(bind: sa.Connection, inspector: sa.Inspector) -> None:
    if not inspector.has_table("department"):
        op.create_table(
            "department",
            sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
            sa.Column("name", sa.String(), nullable=False, unique=True),
            sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_department_uuid", "department", ["uuid"], unique=True)

    department = sa.table(
        "department",
        sa.column("id", sa.Integer()),
        sa.column("uuid", postgresql.UUID(as_uuid=True)),
    )
    missing_uuid_rows = bind.execute(sa.select(department.c.id).where(department.c.uuid.is_(None))).fetchall()
    for row in missing_uuid_rows:
        bind.execute(sa.update(department).where(department.c.id == row.id).values(uuid=uuid7()))


def ensure_user_department_column(bind: sa.Connection, inspector: sa.Inspector) -> None:
    if not inspector.has_table("user"):
        return

    columns = get_column_names(inspector, "user")
    if "department_id" not in columns:
        op.add_column("user", sa.Column("department_id", sa.Integer(), nullable=True))
        op.create_foreign_key("fk_user_department_id_department", "user", "department", ["department_id"], ["id"])
        op.create_index("ix_user_department_id", "user", ["department_id"], unique=False)


def ensure_department_policies(bind: sa.Connection, inspector: sa.Inspector) -> None:
    if not inspector.has_table("access_policy"):
        return

    access_policy = sa.table(
        "access_policy",
        sa.column("subject", sa.String()),
        sa.column("resource", sa.String()),
        sa.column("action", sa.String()),
        sa.column("uuid", postgresql.UUID(as_uuid=True)),
        sa.column("is_deleted", sa.Boolean()),
    )

    for subject, resource, action in DEPARTMENT_POLICIES:
        existing = bind.execute(
            sa.select(access_policy.c.subject).where(
                access_policy.c.subject == subject,
                access_policy.c.resource == resource,
                access_policy.c.action == action,
                sa.or_(access_policy.c.is_deleted.is_(False), access_policy.c.is_deleted.is_(None)),
            )
        ).scalar_one_or_none()
        if existing is None:
            bind.execute(sa.insert(access_policy).values(subject=subject, resource=resource, action=action, uuid=uuid7()))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    ensure_department_table(bind, inspector)
    inspector = sa.inspect(bind)
    ensure_user_department_column(bind, inspector)
    inspector = sa.inspect(bind)
    ensure_department_policies(bind, inspector)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("access_policy"):
        access_policy = sa.table(
            "access_policy",
            sa.column("subject", sa.String()),
            sa.column("resource", sa.String()),
            sa.column("action", sa.String()),
        )
        for subject, resource, action in DEPARTMENT_POLICIES:
            bind.execute(
                sa.delete(access_policy).where(
                    access_policy.c.subject == subject,
                    access_policy.c.resource == resource,
                    access_policy.c.action == action,
                )
            )

    if inspector.has_table("user"):
        indexes = get_index_names(inspector, "user")
        if "ix_user_department_id" in indexes:
            op.drop_index("ix_user_department_id", table_name="user")
        columns = get_column_names(inspector, "user")
        if "department_id" in columns:
            op.drop_constraint("fk_user_department_id_department", "user", type_="foreignkey")
            op.drop_column("user", "department_id")

    inspector = sa.inspect(bind)
    if inspector.has_table("department"):
        indexes = get_index_names(inspector, "department")
        if "ix_department_uuid" in indexes:
            op.drop_index("ix_department_uuid", table_name="department")
        op.drop_table("department")
