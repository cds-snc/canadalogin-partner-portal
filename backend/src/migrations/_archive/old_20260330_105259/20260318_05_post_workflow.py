"""Add post workflow status and approval history.

Revision ID: 20260318_05
Revises: 20260317_04
Create Date: 2026-03-18 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

revision = "20260318_05"
down_revision = "20260317_04"
branch_labels = None
depends_on = None


def get_column_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def get_index_names(inspector: sa.Inspector, table_name: str) -> set[str]:
    return {index["name"] for index in inspector.get_indexes(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("post"):
        post_columns = get_column_names(inspector, "post")
        if "status" not in post_columns:
            op.add_column(
                "post",
                sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
            )

        inspector = sa.inspect(bind)
        post_indexes = get_index_names(inspector, "post")
        if "ix_post_status" not in post_indexes:
            op.create_index("ix_post_status", "post", ["status"], unique=False)

        post_table = sa.table(
            "post",
            sa.column("status", sa.String()),
        )
        bind.execute(
            sa.update(post_table).where(post_table.c.status.is_(None)).values(status="draft")
        )

    if not inspector.has_table("post_approval"):
        op.create_table(
            "post_approval",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("post_id", sa.Integer(), nullable=False),
            sa.Column("submitted_by_user_id", sa.Integer(), nullable=False),
            sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
            sa.Column("from_status", sa.String(length=32), nullable=False),
            sa.Column("to_status", sa.String(length=32), nullable=False),
            sa.Column("decision", sa.String(length=32), nullable=False),
            sa.Column("comment", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.ForeignKeyConstraint(["post_id"], ["post.id"]),
            sa.ForeignKeyConstraint(["submitted_by_user_id"], ["user.id"]),
            sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["user.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_post_approval_post_id", "post_approval", ["post_id"], unique=False)
        op.create_index("ix_post_approval_submitted_by_user_id", "post_approval", ["submitted_by_user_id"], unique=False)
        op.create_index("ix_post_approval_reviewed_by_user_id", "post_approval", ["reviewed_by_user_id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if inspector.has_table("post_approval"):
        post_approval_indexes = get_index_names(inspector, "post_approval")
        for index_name in [
            "ix_post_approval_reviewed_by_user_id",
            "ix_post_approval_submitted_by_user_id",
            "ix_post_approval_post_id",
        ]:
            if index_name in post_approval_indexes:
                op.drop_index(index_name, table_name="post_approval")
        op.drop_table("post_approval")

    if inspector.has_table("post"):
        post_columns = get_column_names(inspector, "post")
        post_indexes = get_index_names(inspector, "post")
        if "ix_post_status" in post_indexes:
            op.drop_index("ix_post_status", table_name="post")
        if "status" in post_columns:
            op.drop_column("post", "status")
