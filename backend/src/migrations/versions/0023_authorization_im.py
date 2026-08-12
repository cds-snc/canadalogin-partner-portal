"""Strengthen authorization provenance and audit discovery.

Revision ID: 0023_authorization_im
Revises: 0022_invitation_revocation_actor
Create Date: 2026-08-11

Historical invitation revocations with no retained actor are explicitly marked
``legacy_unknown`` rather than being mistaken for complete provenance.  New
user-initiated revocations must retain their restricted actor foreign key.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0023_authorization_im"
down_revision: Union[str, None] = "0022_invitation_revocation_actor"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

REVOCATION_ACTOR_CONSTRAINT = "ck_rp_invitation_revocation_actor"


def upgrade() -> None:
    op.add_column(
        "rp_application_developer_invitation",
        sa.Column("revocation_actor_source", sa.String(length=32), nullable=True),
    )
    op.execute(
        """
        UPDATE rp_application_developer_invitation
        SET revocation_actor_source = CASE
            WHEN revoked_by_user_id IS NOT NULL THEN 'user'
            ELSE 'legacy_unknown'
        END
        WHERE status = 'revoked'
        """
    )
    op.execute(
        f"""
        ALTER TABLE rp_application_developer_invitation
        ADD CONSTRAINT {REVOCATION_ACTOR_CONSTRAINT}
        CHECK (
            (status <> 'revoked'
                AND revoked_by_user_id IS NULL
                AND revocation_actor_source IS NULL)
            OR
            (status = 'revoked' AND (
                (revocation_actor_source = 'user'
                    AND revoked_by_user_id IS NOT NULL)
                OR
                (revocation_actor_source = 'legacy_unknown'
                    AND revoked_by_user_id IS NULL)
            ))
        ) NOT VALID
        """
    )
    op.execute(
        f"""
        ALTER TABLE rp_application_developer_invitation
        VALIDATE CONSTRAINT {REVOCATION_ACTOR_CONSTRAINT}
        """
    )

    op.create_index(
        "ix_audit_log_created_at",
        "audit_log",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "ix_audit_log_target_uuid_created_at",
        "audit_log",
        ["target_uuid", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_audit_log_target_operation_created_at",
        "audit_log",
        ["target", "operation", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_audit_log_target_operation_created_at",
        table_name="audit_log",
    )
    op.drop_index(
        "ix_audit_log_target_uuid_created_at",
        table_name="audit_log",
    )
    op.drop_index("ix_audit_log_created_at", table_name="audit_log")
    op.drop_constraint(
        REVOCATION_ACTOR_CONSTRAINT,
        "rp_application_developer_invitation",
        type_="check",
    )
    op.drop_column(
        "rp_application_developer_invitation",
        "revocation_actor_source",
    )
