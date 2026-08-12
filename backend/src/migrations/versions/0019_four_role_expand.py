"""Expand persistence for the fixed four-role authorization model.

Revision ID: 0019_four_role_expand
Revises: 0018_application_information_review_records
Create Date: 2026-08-11

This revision is additive. Legacy authority columns and workspace membership
records remain in place for rollback until runtime parity is proven.
"""

from __future__ import annotations

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0019_four_role_expand"
down_revision: Union[str, None] = "0018_application_information_review_records"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CL_ADMIN_ROLE_UUID = "03caa6a0-9095-5e62-9cf6-7a0f0f73c49b"


def upgrade() -> None:
    op.add_column("role", sa.Column("code", sa.String(length=64), nullable=True))
    op.create_index(op.f("ix_role_code"), "role", ["code"], unique=True)

    # Do not promote or rename the legacy "admin" row. The canonical system
    # definition has a stable UUID and code distinct from mutable display names.
    op.execute(
        sa.text(
            """
            INSERT INTO role (
                name,
                code,
                description,
                uuid,
                created_at,
                updated_at,
                deleted_at,
                is_deleted
            )
            SELECT
                'CL Admin',
                'cl_admin',
                'Immutable CanadaLogin platform administrator role',
                CAST(:role_uuid AS uuid),
                CURRENT_TIMESTAMP,
                NULL,
                NULL,
                FALSE
            WHERE NOT EXISTS (SELECT 1 FROM role WHERE code = 'cl_admin')
            ON CONFLICT (name) DO NOTHING
            """
        ).bindparams(role_uuid=CL_ADMIN_ROLE_UUID)
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM role
                WHERE code = 'cl_admin'
                  AND uuid = '03caa6a0-9095-5e62-9cf6-7a0f0f73c49b'::uuid
                  AND is_deleted = FALSE
            ) THEN
                RAISE EXCEPTION
                    'canonical CL Admin role collision; run four-role reconciliation before retrying';
            END IF;
        END
        $$
        """
    )

    op.create_table(
        "user_role",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("assignment_source", sa.String(length=32), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("assigned_by_user_id", sa.Integer(), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_by_user_id", sa.Integer(), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('active', 'revoked')",
            name="ck_user_role_status",
        ),
        sa.CheckConstraint(
            "assignment_source IN ('migration', 'bootstrap', 'admin', 'local_fixture')",
            name="ck_user_role_assignment_source",
        ),
        sa.CheckConstraint(
            "assignment_source <> 'admin' OR assigned_by_user_id IS NOT NULL",
            name="ck_user_role_admin_actor",
        ),
        sa.CheckConstraint(
            "(status = 'active' AND revoked_at IS NULL AND revoked_by_user_id IS NULL) OR (status = 'revoked' AND revoked_at IS NOT NULL)",
            name="ck_user_role_lifecycle",
        ),
        sa.ForeignKeyConstraint(
            ["assigned_by_user_id"],
            ["user.id"],
            name="fk_user_role_assigned_by_user",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["revoked_by_user_id"],
            ["user.id"],
            name="fk_user_role_revoked_by_user",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["role.id"],
            name="fk_user_role_role",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["user.id"],
            name="fk_user_role_user",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("uuid", name="uq_user_role_uuid"),
    )
    op.create_index(op.f("ix_user_role_user_id"), "user_role", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_role_role_id"), "user_role", ["role_id"], unique=False)
    op.create_index(op.f("ix_user_role_status"), "user_role", ["status"], unique=False)
    op.create_index(
        op.f("ix_user_role_assignment_source"),
        "user_role",
        ["assignment_source"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_role_assigned_by_user_id"),
        "user_role",
        ["assigned_by_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_user_role_revoked_by_user_id"),
        "user_role",
        ["revoked_by_user_id"],
        unique=False,
    )
    op.create_index(
        "uq_user_role_active_user_role",
        "user_role",
        ["user_id", "role_id"],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )

    op.add_column(
        "rp_application_access_grant",
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "rp_application_access_grant",
        sa.Column("revoked_by_user_id", sa.Integer(), nullable=True),
    )
    # The legacy schema stored the revoked status but had no grant revocation
    # timestamp. Reconstruct a deterministic audit marker from timestamps the
    # record already owns, preferring updated_at because it most closely tracks
    # the legacy status transition. Do not infer a revocation actor.
    op.execute(
        """
        UPDATE rp_application_access_grant
        SET revoked_at = COALESCE(updated_at, created_at)
        WHERE status = 'revoked'
          AND revoked_at IS NULL
        """
    )
    op.create_index(
        op.f("ix_rp_application_access_grant_revoked_by_user_id"),
        "rp_application_access_grant",
        ["revoked_by_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rp_application_access_grant_source_invitation_uuid"),
        "rp_application_access_grant",
        ["source_invitation_uuid"],
        unique=False,
    )

    op.add_column(
        "rp_application_developer_invitation",
        sa.Column("revocation_reason", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "rp_application_developer_invitation",
        sa.Column("replaced_by_invitation_uuid", sa.UUID(), nullable=True),
    )
    op.create_index(
        op.f("ix_rp_application_developer_invitation_replaced_by_invitation_uuid"),
        "rp_application_developer_invitation",
        ["replaced_by_invitation_uuid"],
        unique=False,
    )

    # Existing rows are inventoried before these constraints are validated in
    # 0021. Compatibility role values keep current writers operational during
    # the expand/backfill release; canonical-only enforcement follows cutover.
    _add_not_valid_constraints()


def _add_not_valid_constraints() -> None:
    statements = (
        """
        ALTER TABLE rp_application_access_grant
        ADD CONSTRAINT fk_rp_access_grant_revoked_by_user
        FOREIGN KEY (revoked_by_user_id) REFERENCES "user" (id)
        ON DELETE RESTRICT NOT VALID
        """,
        """
        ALTER TABLE rp_application_access_grant
        ADD CONSTRAINT fk_rp_access_grant_source_invitation
        FOREIGN KEY (source_invitation_uuid)
        REFERENCES rp_application_developer_invitation (uuid)
        ON DELETE RESTRICT NOT VALID
        """,
        """
        ALTER TABLE rp_application_access_grant
        ADD CONSTRAINT ck_rp_access_grant_role_compatible
        CHECK (
            role IN (
                'rp_admin', 'rp_user_edit', 'read_only',
                'RP Admin', 'RP User (Edit)', 'Read Only'
            )
        ) NOT VALID
        """,
        """
        ALTER TABLE rp_application_access_grant
        ADD CONSTRAINT ck_rp_access_grant_status
        CHECK (status IN ('active', 'revoked')) NOT VALID
        """,
        """
        ALTER TABLE rp_application_access_grant
        ADD CONSTRAINT ck_rp_access_grant_soft_delete_metadata
        CHECK (
            (is_deleted = FALSE AND deleted_at IS NULL)
            OR (is_deleted = TRUE AND deleted_at IS NOT NULL)
        ) NOT VALID
        """,
        """
        ALTER TABLE rp_application_access_grant
        ADD CONSTRAINT ck_rp_access_grant_lifecycle
        CHECK (
            (
                status = 'active'
                AND is_deleted = FALSE
                AND deleted_at IS NULL
                AND revoked_at IS NULL
                AND revoked_by_user_id IS NULL
            )
            OR (
                status = 'revoked'
                AND is_deleted = FALSE
                AND deleted_at IS NULL
                AND revoked_at IS NOT NULL
            )
        ) NOT VALID
        """,
        """
        ALTER TABLE rp_application_developer_invitation
        ADD CONSTRAINT fk_rp_invitation_replaced_by_invitation
        FOREIGN KEY (replaced_by_invitation_uuid)
        REFERENCES rp_application_developer_invitation (uuid)
        ON DELETE RESTRICT NOT VALID
        """,
        """
        ALTER TABLE rp_application_developer_invitation
        ADD CONSTRAINT ck_rp_invitation_role_compatible
        CHECK (
            role IN (
                'rp_admin', 'rp_user_edit', 'read_only',
                'RP Admin', 'RP User (Edit)', 'Read Only'
            )
        ) NOT VALID
        """,
        """
        ALTER TABLE rp_application_developer_invitation
        ADD CONSTRAINT ck_rp_invitation_status
        CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')) NOT VALID
        """,
        """
        ALTER TABLE rp_application_developer_invitation
        ADD CONSTRAINT ck_rp_invitation_soft_delete_metadata
        CHECK (
            (is_deleted = FALSE AND deleted_at IS NULL)
            OR (is_deleted = TRUE AND deleted_at IS NOT NULL)
        ) NOT VALID
        """,
        """
        ALTER TABLE rp_application_developer_invitation
        ADD CONSTRAINT ck_rp_invitation_lifecycle
        CHECK (
            (
                status = 'pending'
                AND is_deleted = FALSE
                AND accepted_at IS NULL
                AND revoked_at IS NULL
            )
            OR (
                status = 'accepted'
                AND is_deleted = FALSE
                AND accepted_at IS NOT NULL
                AND revoked_at IS NULL
            )
            OR (
                status = 'expired'
                AND is_deleted = FALSE
                AND accepted_at IS NULL
                AND revoked_at IS NULL
            )
            OR (
                status = 'revoked'
                AND is_deleted = FALSE
                AND accepted_at IS NULL
                AND revoked_at IS NOT NULL
            )
        ) NOT VALID
        """,
        """
        ALTER TABLE rp_application_developer_invitation
        ADD CONSTRAINT ck_rp_invitation_replacement
        CHECK (
            replaced_by_invitation_uuid IS NULL
            OR (status = 'revoked' AND revocation_reason IS NOT NULL)
        ) NOT VALID
        """,
    )
    for statement in statements:
        op.execute(statement)


def downgrade() -> None:
    # Drop the new lineage edge before the invitation-side delegation edge can
    # be considered by any later contract migration. The existing
    # delegated_by_grant_uuid provenance column and FK are intentionally kept.
    constraint_names = (
        "fk_rp_access_grant_source_invitation",
        "fk_rp_access_grant_revoked_by_user",
        "ck_rp_access_grant_lifecycle",
        "ck_rp_access_grant_soft_delete_metadata",
        "ck_rp_access_grant_status",
        "ck_rp_access_grant_role_compatible",
    )
    for constraint_name in constraint_names:
        op.drop_constraint(
            constraint_name,
            "rp_application_access_grant",
            type_="foreignkey" if constraint_name.startswith("fk_") else "check",
        )

    invitation_constraint_names = (
        "fk_rp_invitation_replaced_by_invitation",
        "ck_rp_invitation_replacement",
        "ck_rp_invitation_lifecycle",
        "ck_rp_invitation_soft_delete_metadata",
        "ck_rp_invitation_status",
        "ck_rp_invitation_role_compatible",
    )
    for constraint_name in invitation_constraint_names:
        op.drop_constraint(
            constraint_name,
            "rp_application_developer_invitation",
            type_="foreignkey" if constraint_name.startswith("fk_") else "check",
        )

    op.drop_index(
        op.f("ix_rp_application_developer_invitation_replaced_by_invitation_uuid"),
        table_name="rp_application_developer_invitation",
    )
    op.drop_column("rp_application_developer_invitation", "replaced_by_invitation_uuid")
    op.drop_column("rp_application_developer_invitation", "revocation_reason")

    op.drop_index(
        op.f("ix_rp_application_access_grant_source_invitation_uuid"),
        table_name="rp_application_access_grant",
    )
    op.drop_index(
        op.f("ix_rp_application_access_grant_revoked_by_user_id"),
        table_name="rp_application_access_grant",
    )
    op.drop_column("rp_application_access_grant", "revoked_by_user_id")
    op.drop_column("rp_application_access_grant", "revoked_at")

    op.drop_index("uq_user_role_active_user_role", table_name="user_role")
    op.drop_index(op.f("ix_user_role_revoked_by_user_id"), table_name="user_role")
    op.drop_index(op.f("ix_user_role_assigned_by_user_id"), table_name="user_role")
    op.drop_index(op.f("ix_user_role_assignment_source"), table_name="user_role")
    op.drop_index(op.f("ix_user_role_status"), table_name="user_role")
    op.drop_index(op.f("ix_user_role_role_id"), table_name="user_role")
    op.drop_index(op.f("ix_user_role_user_id"), table_name="user_role")
    op.drop_table("user_role")

    op.execute(sa.text("DELETE FROM role WHERE code = 'cl_admin' AND uuid = CAST(:role_uuid AS uuid)").bindparams(role_uuid=CL_ADMIN_ROLE_UUID))
    op.drop_index(op.f("ix_role_code"), table_name="role")
    op.drop_column("role", "code")
