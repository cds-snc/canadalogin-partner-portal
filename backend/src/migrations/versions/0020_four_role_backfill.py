"""Canonicalize four-role data without deriving access from legacy state.

Revision ID: 0020_four_role_backfill
Revises: 0019_four_role_expand
Create Date: 2026-08-11

``FOUR_ROLE_BACKFILL_MANIFEST`` may name a reviewed JSON manifest emitted from
the reconciliation script. Both legacy assignment lists must remain empty:
initial CL Admin and partner access are established later through the canonical
bootstrap and role-management flows.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
from collections.abc import Sequence
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Union
from uuid import UUID, uuid5

import sqlalchemy as sa
from alembic import op

try:
    from src.migrations.four_role_reconciliation_snapshot_v1 import (
        load_snapshot,
        snapshot_sha256,
    )
except ModuleNotFoundError:  # Alembic runs with backend/src on sys.path.
    from migrations.four_role_reconciliation_snapshot_v1 import (
        load_snapshot,
        snapshot_sha256,
    )

revision: str = "0020_four_role_backfill"
down_revision: Union[str, None] = "0019_four_role_expand"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CHANGE_ID = "define-four-role-authorization-model"
MANIFEST_ENVIRONMENT_VARIABLE = "FOUR_ROLE_BACKFILL_MANIFEST"
MANIFEST_SCHEMA_VERSION = 2
MAX_MANIFEST_BYTES = 1_000_000
BACKFILL_UUID_NAMESPACE = UUID("d6769847-8df4-5b85-baa2-5909ed596928")


def upgrade() -> None:
    bind = op.get_bind()

    # Keep reconciliation predicates stable while canonical values and the
    # zero-legacy-access decision are recorded in this migration transaction.
    bind.execute(
        sa.text(
            'LOCK TABLE "user", role, user_role, workspace_member, workspace, '
            "rp_application_access_grant, rp_application_developer_invitation "
            "IN SHARE ROW EXCLUSIVE MODE"
        )
    )

    locked_snapshot_sha256 = snapshot_sha256(load_snapshot(bind))
    manifest = _load_reviewed_manifest(bind, locked_snapshot_sha256)
    _reject_active_grant_parent_lifecycle_conflicts(bind)
    _canonicalize_known_partner_roles(bind)
    _persist_migration_decision(bind, manifest)


def downgrade() -> None:
    """Keep reviewed data changes intact.

    Reconstructing legacy display strings, role arrays, superuser flags, or
    revoked authority would invent access. Schema rollback remains available
    through the additive revisions, but reviewed data changes require a forward
    reconciliation or restore.
    """


def _load_reviewed_manifest(
    _bind: Any,
    locked_snapshot_sha256: str,
) -> dict[str, Any]:
    raw_path = os.getenv(MANIFEST_ENVIRONMENT_VARIABLE)
    if not raw_path:
        # The accepted migration policy is deterministic for every database:
        # legacy admin flags, role arrays, and workspace memberships grant no
        # canonical access. Keep the strict manifest shape internally so audit
        # provenance still binds the decision to the locked snapshot.
        return {
            "schemaVersion": MANIFEST_SCHEMA_VERSION,
            "changeId": CHANGE_ID,
            "reviewed": True,
            "reviewReference": "zero-legacy-access-backfill",
            "reportSha256": "0" * 64,
            "snapshotSha256": locked_snapshot_sha256,
            "clAdminAssignments": [],
            "workspaceMemberDispositions": [],
        }

    manifest_path = Path(raw_path).expanduser()
    if not manifest_path.is_file():
        raise RuntimeError(f"four-role backfill manifest does not exist: {manifest_path}")
    if manifest_path.stat().st_size > MAX_MANIFEST_BYTES:
        raise RuntimeError("four-role backfill manifest exceeds the maximum accepted size")

    try:
        payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError("four-role backfill manifest is not readable valid JSON") from exc

    manifest = _validate_manifest(payload)
    if manifest["snapshotSha256"] != locked_snapshot_sha256:
        raise RuntimeError("four-role backfill manifest snapshot digest does not match the locked current reconciliation snapshot")
    return manifest


def _validate_manifest(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise RuntimeError("four-role backfill manifest must be a JSON object")

    expected_keys = {
        "schemaVersion",
        "changeId",
        "reviewed",
        "reviewReference",
        "reportSha256",
        "snapshotSha256",
        "clAdminAssignments",
        "workspaceMemberDispositions",
    }
    if set(payload) != expected_keys:
        raise RuntimeError("four-role backfill manifest has missing or unexpected fields")
    if payload["schemaVersion"] != MANIFEST_SCHEMA_VERSION:
        raise RuntimeError("unsupported four-role backfill manifest schema version")
    if payload["changeId"] != CHANGE_ID:
        raise RuntimeError("four-role backfill manifest changeId does not match this migration")
    if payload["reviewed"] is not True:
        raise RuntimeError("four-role backfill manifest must record reviewed=true")
    if (
        not isinstance(payload["reviewReference"], str)
        or re.fullmatch(
            r"[A-Za-z0-9][A-Za-z0-9._:/#-]{0,127}",
            payload["reviewReference"],
        )
        is None
    ):
        raise RuntimeError("four-role backfill manifest requires a bounded safe reviewReference")
    if not isinstance(payload["reportSha256"], str) or re.fullmatch(r"[0-9a-f]{64}", payload["reportSha256"]) is None:
        raise RuntimeError("four-role backfill manifest requires a lowercase SHA-256 report digest")
    if (
        not isinstance(payload["snapshotSha256"], str)
        or re.fullmatch(
            r"[0-9a-f]{64}",
            payload["snapshotSha256"],
        )
        is None
    ):
        raise RuntimeError("four-role backfill manifest requires a lowercase SHA-256 snapshot digest")

    cl_admin_assignments = payload["clAdminAssignments"]
    if not isinstance(cl_admin_assignments, list):
        raise RuntimeError("clAdminAssignments must be a list")
    if cl_admin_assignments:
        raise RuntimeError("clAdminAssignments must be empty; legacy CL Admin backfill is prohibited")

    dispositions = payload["workspaceMemberDispositions"]
    if not isinstance(dispositions, list):
        raise RuntimeError("workspaceMemberDispositions must be a list")
    if dispositions:
        raise RuntimeError("workspaceMemberDispositions must be empty; legacy workspace membership backfill is prohibited")

    return payload


def _manifest_sha256(manifest: dict[str, Any]) -> str:
    encoded = json.dumps(
        manifest,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _persist_migration_decision(bind: Any, manifest: dict[str, Any]) -> None:
    """Persist minimized, deterministic provenance in the existing audit store."""

    manifest_digest = _manifest_sha256(manifest)
    decision = {
        "eventName": "authorization.migration_decision_applied",
        "eventVersion": 1,
        "changeId": CHANGE_ID,
        "revision": revision,
        "result": "succeeded",
        "reviewReference": manifest["reviewReference"],
        "reportSha256": manifest["reportSha256"],
        "snapshotSha256": manifest["snapshotSha256"],
        "manifestSha256": manifest_digest,
        "decisionCounts": {
            "clAdminAssignments": 0,
            "workspaceGrants": 0,
            "workspaceQuarantines": 0,
        },
    }
    description = json.dumps(
        decision,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )
    audit_uuid = uuid5(
        BACKFILL_UUID_NAMESPACE,
        f"migration-decision:{revision}:{manifest_digest}",
    )
    target_uuid = uuid5(
        BACKFILL_UUID_NAMESPACE,
        f"authorization-model:{CHANGE_ID}",
    )
    bind.execute(
        sa.text(
            """
            INSERT INTO audit_log (
                "user", user_uuid, target, target_uuid, operation,
                description, uuid, created_at
            ) VALUES (
                'system:migration', NULL, 'authorization_model',
                CAST(:target_uuid AS uuid), 'auth_migrate', :description,
                CAST(:audit_uuid AS uuid), :created_at
            )
            ON CONFLICT (uuid) DO NOTHING
            """
        ),
        {
            "target_uuid": str(target_uuid),
            "description": description,
            "audit_uuid": str(audit_uuid),
            "created_at": datetime.now(UTC),
        },
    )
    persisted_description = bind.execute(
        sa.text("SELECT description FROM audit_log WHERE uuid = CAST(:uuid AS uuid)"),
        {"uuid": str(audit_uuid)},
    ).scalar_one()
    if persisted_description != description:
        raise RuntimeError("conflicting four-role migration provenance record exists")


def _reject_active_grant_parent_lifecycle_conflicts(bind: Any) -> None:
    """Reject canonical authority whose owning user or workspace is inactive."""

    inactive_user_grant_count = bind.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM rp_application_access_grant AS grant_record
            LEFT JOIN "user" AS target_user
              ON target_user.id = grant_record.user_id
            WHERE grant_record.status = 'active'
              AND grant_record.is_deleted = FALSE
              AND (
                  target_user.id IS NULL
                  OR target_user.enabled = FALSE
                  OR target_user.is_deleted = TRUE
              )
            """
        )
    ).scalar_one()
    if inactive_user_grant_count:
        raise RuntimeError("active canonical partner grant references a disabled or deleted user")

    deleted_workspace_grant_count = bind.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM rp_application_access_grant AS grant_record
            LEFT JOIN workspace
              ON workspace.id = grant_record.workspace_id
            WHERE grant_record.status = 'active'
              AND grant_record.is_deleted = FALSE
              AND (
                  workspace.id IS NULL
                  OR workspace.is_deleted = TRUE
              )
            """
        )
    ).scalar_one()
    if deleted_workspace_grant_count:
        raise RuntimeError("active canonical partner grant references a deleted workspace")


def _canonicalize_known_partner_roles(bind: Any) -> None:
    invalid_grant_count = bind.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM rp_application_access_grant
            WHERE btrim(role) NOT IN (
                'rp_admin', 'rp_user_edit', 'read_only',
                'RP Admin', 'RP User (Edit)', 'Read Only'
            )
            """
        )
    ).scalar_one()
    invalid_invitation_count = bind.execute(
        sa.text(
            """
            SELECT COUNT(*)
            FROM rp_application_developer_invitation
            WHERE btrim(role) NOT IN (
                'rp_admin', 'rp_user_edit', 'read_only',
                'RP Admin', 'RP User (Edit)', 'Read Only'
            )
            """
        )
    ).scalar_one()
    if invalid_grant_count or invalid_invitation_count:
        raise RuntimeError("unknown partner role values remain; rerun reconciliation and resolve them explicitly")

    mapping_sql = """
        CASE btrim(role)
            WHEN 'RP Admin' THEN 'rp_admin'
            WHEN 'RP User (Edit)' THEN 'rp_user_edit'
            WHEN 'Read Only' THEN 'read_only'
            ELSE btrim(role)
        END
    """
    bind.execute(sa.text(f"UPDATE rp_application_access_grant SET role = {mapping_sql}"))
    bind.execute(sa.text(f"UPDATE rp_application_developer_invitation SET role = {mapping_sql}"))
