"""Validate four-role integrity and add post-reconciliation uniqueness.

Revision ID: 0021_four_role_constraints
Revises: 0020_four_role_backfill
Create Date: 2026-08-11

``role.code`` intentionally remains nullable until every uncoded legacy role
has an owner-approved retirement disposition and runtime parity is verified.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0021_four_role_constraints"
down_revision: Union[str, None] = "0020_four_role_backfill"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint(
        "ck_role_canonical_code",
        "role",
        "code IS NULL OR code = 'cl_admin'",
        postgresql_not_valid=True,
    )

    constraints_by_table = {
        "role": ("ck_role_canonical_code",),
        "rp_application_access_grant": (
            "fk_rp_access_grant_revoked_by_user",
            "fk_rp_access_grant_source_invitation",
            "ck_rp_access_grant_status",
            "ck_rp_access_grant_soft_delete_metadata",
            "ck_rp_access_grant_lifecycle",
        ),
        "rp_application_developer_invitation": (
            "fk_rp_invitation_replaced_by_invitation",
            "ck_rp_invitation_status",
            "ck_rp_invitation_soft_delete_metadata",
            "ck_rp_invitation_lifecycle",
            "ck_rp_invitation_replacement",
        ),
    }
    for table_name, constraint_names in constraints_by_table.items():
        for constraint_name in constraint_names:
            op.execute(f'ALTER TABLE "{table_name}" VALIDATE CONSTRAINT "{constraint_name}"')

    # 0019 temporarily permits known display labels so legacy writers remain
    # operational during expansion. 0020 canonicalizes those exact values;
    # cut over to machine keys here before runtime treats grants as authority.
    canonical_role_constraints = {
        "rp_application_access_grant": (
            "ck_rp_access_grant_role",
            "ck_rp_access_grant_role_compatible",
        ),
        "rp_application_developer_invitation": (
            "ck_rp_invitation_role",
            "ck_rp_invitation_role_compatible",
        ),
    }
    canonical_role_check = "role IN ('rp_admin', 'rp_user_edit', 'read_only')"
    for table_name, (
        canonical_constraint,
        compatibility_constraint,
    ) in canonical_role_constraints.items():
        op.create_check_constraint(
            canonical_constraint,
            table_name,
            canonical_role_check,
            postgresql_not_valid=True,
        )
        op.execute(f'ALTER TABLE "{table_name}" VALIDATE CONSTRAINT "{canonical_constraint}"')
        op.drop_constraint(
            compatibility_constraint,
            table_name,
            type_="check",
        )

    # The supporting non-unique index is replaced only after the unique index
    # succeeds, so a failed duplicate check does not remove query support.
    op.create_index(
        "uq_rp_access_grant_source_invitation",
        "rp_application_access_grant",
        ["source_invitation_uuid"],
        unique=True,
        postgresql_where=sa.text("source_invitation_uuid IS NOT NULL"),
    )
    op.drop_index(
        op.f("ix_rp_application_access_grant_source_invitation_uuid"),
        table_name="rp_application_access_grant",
    )
    op.create_index(
        "uq_rp_developer_invitation_pending_email_workspace",
        "rp_application_developer_invitation",
        ["workspace_id", sa.text("lower(btrim(invited_email))")],
        unique=True,
        postgresql_where=sa.text("status = 'pending' AND is_deleted = FALSE"),
    )

    # Coded definitions are system-owned. Display text remains editable, but a
    # canonical identity cannot be recoded, soft-deleted, or hard-deleted.
    op.execute(
        """
        CREATE FUNCTION protect_canonical_role_definition()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            IF TG_OP = 'DELETE' AND OLD.code IS NOT NULL THEN
                RAISE EXCEPTION 'canonical role definitions cannot be deleted';
            END IF;
            IF TG_OP = 'UPDATE'
               AND OLD.code IS NOT NULL
               AND (
                   NEW.code IS DISTINCT FROM OLD.code
                   OR NEW.is_deleted IS DISTINCT FROM FALSE
                   OR NEW.deleted_at IS NOT NULL
               ) THEN
                RAISE EXCEPTION 'canonical role identity is immutable';
            END IF;
            RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
        END
        $$
        """
    )
    op.execute(
        """
        CREATE TRIGGER trg_protect_canonical_role_definition
        BEFORE UPDATE OR DELETE ON role
        FOR EACH ROW
        EXECUTE FUNCTION protect_canonical_role_definition()
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_protect_canonical_role_definition ON role")
    op.execute("DROP FUNCTION IF EXISTS protect_canonical_role_definition()")

    op.drop_index(
        "uq_rp_developer_invitation_pending_email_workspace",
        table_name="rp_application_developer_invitation",
    )
    op.create_index(
        op.f("ix_rp_application_access_grant_source_invitation_uuid"),
        "rp_application_access_grant",
        ["source_invitation_uuid"],
        unique=False,
    )
    op.drop_index(
        "uq_rp_access_grant_source_invitation",
        table_name="rp_application_access_grant",
    )
    compatibility_role_check = "role IN ('rp_admin', 'rp_user_edit', 'read_only', 'RP Admin', 'RP User (Edit)', 'Read Only')"
    for table_name, compatibility_constraint, canonical_constraint in (
        (
            "rp_application_developer_invitation",
            "ck_rp_invitation_role_compatible",
            "ck_rp_invitation_role",
        ),
        (
            "rp_application_access_grant",
            "ck_rp_access_grant_role_compatible",
            "ck_rp_access_grant_role",
        ),
    ):
        op.create_check_constraint(
            compatibility_constraint,
            table_name,
            compatibility_role_check,
        )
        op.drop_constraint(
            canonical_constraint,
            table_name,
            type_="check",
        )
    op.drop_constraint("ck_role_canonical_code", "role", type_="check")
