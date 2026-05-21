"""Make user identities OIDC email-based.

Revision ID: 0006_oidc_user_email
Revises: 0005_rp_app_dev_invites
Create Date: 2026-05-21

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "0006_oidc_user_email"
down_revision: Union[str, None] = "0005_rp_app_dev_invites"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "user",
        "email",
        existing_type=sa.String(length=50),
        type_=sa.String(length=255),
        existing_nullable=False,
    )
    op.alter_column(
        "user",
        "username",
        existing_type=sa.String(length=20),
        type_=sa.String(length=255),
        existing_nullable=False,
    )
    op.execute(sa.text('UPDATE "user" SET email = lower(email), username = lower(email)'))
    op.drop_column("user", "hashed_password")


def downgrade() -> None:
    op.add_column("user", sa.Column("hashed_password", sa.String(), nullable=True))
    op.alter_column(
        "user",
        "username",
        existing_type=sa.String(length=255),
        type_=sa.String(length=20),
        existing_nullable=False,
    )
    op.alter_column(
        "user",
        "email",
        existing_type=sa.String(length=255),
        type_=sa.String(length=50),
        existing_nullable=False,
    )
