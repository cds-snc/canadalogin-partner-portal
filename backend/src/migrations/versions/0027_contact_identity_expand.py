"""Expand Application contacts for locale-neutral person identity.

Revision ID: 0027_contact_identity_expand
Revises: 0026_rp_config_expand
Create Date: 2026-08-13

The migration preserves every legacy bilingual full-name value and adds only
nullable identity and confirmation metadata. It does not parse, translate, or
otherwise infer first and last names from retained records.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0027_contact_identity_expand"
down_revision: Union[str, None] = "0026_rp_config_expand"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "application_information_contact",
        sa.Column("first_name", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "application_information_contact",
        sa.Column("last_name", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "application_information_contact",
        sa.Column("alternate_phone_number", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "application_information_contact",
        sa.Column("identity_confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "application_information_contact",
        sa.Column(
            "identity_confirmed_by",
            sa.Integer(),
            sa.ForeignKey("user.id"),
            nullable=True,
        ),
    )
    op.create_index(
        op.f("ix_application_information_contact_identity_confirmed_by"),
        "application_information_contact",
        ["identity_confirmed_by"],
        unique=False,
    )
    op.alter_column(
        "application_information_contact",
        "name_en",
        existing_type=sa.String(length=255),
        nullable=True,
    )
    op.alter_column(
        "application_information_contact",
        "name_fr",
        existing_type=sa.String(length=255),
        nullable=True,
    )


def downgrade() -> None:
    connection = op.get_bind()
    missing_legacy_names = connection.execute(
        sa.text("SELECT COUNT(*) FROM application_information_contact WHERE name_en IS NULL OR name_fr IS NULL")
    ).scalar_one()
    if missing_legacy_names:
        raise RuntimeError("Cannot downgrade contact identity expansion while contacts depend on locale-neutral person names")

    op.drop_index(
        op.f("ix_application_information_contact_identity_confirmed_by"),
        table_name="application_information_contact",
    )
    op.drop_column("application_information_contact", "identity_confirmed_by")
    op.drop_column("application_information_contact", "identity_confirmed_at")
    op.drop_column("application_information_contact", "alternate_phone_number")
    op.drop_column("application_information_contact", "last_name")
    op.drop_column("application_information_contact", "first_name")
    op.alter_column(
        "application_information_contact",
        "name_fr",
        existing_type=sa.String(length=255),
        nullable=False,
    )
    op.alter_column(
        "application_information_contact",
        "name_en",
        existing_type=sa.String(length=255),
        nullable=False,
    )
