"""Create workspace schema and seed workspace policies.

Revision ID: 0009_workspace_schema
Revises: 0008_dnr_view_perm
Create Date: 2026-07-30

"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from uuid6 import uuid7


revision: str = "0009_workspace_schema"
down_revision: Union[str, None] = "0008_dnr_view_perm"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


POLICIES: list[tuple[str, str, str]] = [
    ("admin", "workspace", "read"),
    ("admin", "workspace", "write"),
]


def upgrade() -> None:
    op.create_table(
        "workspace",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("slug", sa.String(length=128), nullable=False),
        sa.Column("department_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["user.id"]),
        sa.ForeignKeyConstraint(["department_id"], ["department.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(op.f("ix_workspace_department_id"), "workspace", ["department_id"], unique=False)
    op.create_index(op.f("ix_workspace_is_deleted"), "workspace", ["is_deleted"], unique=False)
    op.create_index(op.f("ix_workspace_slug"), "workspace", ["slug"], unique=False)

    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("access_policy"):
        return

    for subject, resource, action in POLICIES:
        existing = bind.execute(
            sa.text(
                """
                SELECT id FROM access_policy
                WHERE subject = :subject
                  AND resource = :resource
                  AND action = :action
                  AND is_deleted = FALSE
                """
            ),
            {
                "subject": subject,
                "resource": resource,
                "action": action,
            },
        ).first()
        if existing is not None:
            continue

        bind.execute(
            sa.text(
                """
                INSERT INTO access_policy (
                    subject,
                    resource,
                    action,
                    uuid,
                    created_at,
                    updated_at,
                    deleted_at,
                    is_deleted
                ) VALUES (
                    :subject,
                    :resource,
                    :action,
                    :uuid,
                    :created_at,
                    NULL,
                    NULL,
                    FALSE
                )
                """
            ),
            {
                "subject": subject,
                "resource": resource,
                "action": action,
                "uuid": str(uuid7()),
                "created_at": datetime.now(UTC),
            },
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("access_policy"):
        for subject, resource, action in POLICIES:
            bind.execute(
                sa.text(
                    """
                    DELETE FROM access_policy
                    WHERE subject = :subject
                      AND resource = :resource
                      AND action = :action
                    """
                ),
                {
                    "subject": subject,
                    "resource": resource,
                    "action": action,
                },
            )

    op.drop_index(op.f("ix_workspace_slug"), table_name="workspace")
    op.drop_index(op.f("ix_workspace_is_deleted"), table_name="workspace")
    op.drop_index(op.f("ix_workspace_department_id"), table_name="workspace")
    op.drop_table("workspace")
