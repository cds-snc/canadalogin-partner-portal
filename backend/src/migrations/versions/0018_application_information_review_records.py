"""Create application-information review-note and checklist persistence.

Revision ID: 0018_application_information_review_records
Revises: 0017_rp_application_promotion_request_and_lifecycle_backfill
Create Date: 2026-08-11

"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0018_application_information_review_records"
down_revision: Union[str, None] = "0017_rp_application_promotion_request_and_lifecycle_backfill"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "application_information_review_note",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("application_information_id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["application_information_id"], ["application_information.id"]),
        sa.ForeignKeyConstraint(["author_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(
        op.f("ix_application_information_review_note_application_information_id"),
        "application_information_review_note",
        ["application_information_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_information_review_note_author_id"),
        "application_information_review_note",
        ["author_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_information_review_note_is_deleted"),
        "application_information_review_note",
        ["is_deleted"],
        unique=False,
    )

    op.create_table(
        "application_information_review_checklist",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("application_information_id", sa.Integer(), nullable=False),
        sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("review_disposition", sa.String(length=32), nullable=False),
        sa.Column("application_information_status", sa.String(length=32), nullable=False),
        sa.Column("contacts_status", sa.String(length=32), nullable=False),
        sa.Column("environment_registration_status", sa.String(length=32), nullable=False),
        sa.Column("promotion_metadata_status", sa.String(length=32), nullable=False),
        sa.Column("evidence_reference_status", sa.String(length=32), nullable=False),
        sa.Column("process_links_status", sa.String(length=32), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["application_information_id"], ["application_information.id"]),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "application_information_id",
            name="uq_app_info_review_checklist_app_info_id",
        ),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index(
        op.f("ix_application_information_review_checklist_application_information_id"),
        "application_information_review_checklist",
        ["application_information_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_information_review_checklist_reviewed_by_user_id"),
        "application_information_review_checklist",
        ["reviewed_by_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_information_review_checklist_review_disposition"),
        "application_information_review_checklist",
        ["review_disposition"],
        unique=False,
    )
    op.create_index(
        op.f("ix_application_information_review_checklist_is_deleted"),
        "application_information_review_checklist",
        ["is_deleted"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_application_information_review_checklist_is_deleted"),
        table_name="application_information_review_checklist",
    )
    op.drop_index(
        op.f("ix_application_information_review_checklist_review_disposition"),
        table_name="application_information_review_checklist",
    )
    op.drop_index(
        op.f("ix_application_information_review_checklist_reviewed_by_user_id"),
        table_name="application_information_review_checklist",
    )
    op.drop_index(
        op.f("ix_application_information_review_checklist_application_information_id"),
        table_name="application_information_review_checklist",
    )
    op.drop_table("application_information_review_checklist")

    op.drop_index(
        op.f("ix_application_information_review_note_is_deleted"),
        table_name="application_information_review_note",
    )
    op.drop_index(
        op.f("ix_application_information_review_note_author_id"),
        table_name="application_information_review_note",
    )
    op.drop_index(
        op.f("ix_application_information_review_note_application_information_id"),
        table_name="application_information_review_note",
    )
    op.drop_table("application_information_review_note")
