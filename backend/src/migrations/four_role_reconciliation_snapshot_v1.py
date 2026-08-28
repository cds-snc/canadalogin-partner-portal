"""Frozen snapshot contract shared by four-role reconciliation and migration 0020.

Keep this module backward compatible.  Its digest binds a reviewed manifest to
the exact rows migration 0020 locks before applying authorization decisions.
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping, Sequence
from datetime import UTC, date, datetime
from typing import Any
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.engine import Connection

SNAPSHOT_SCHEMA_VERSION = 1


def load_snapshot(connection: Connection) -> dict[str, list[dict[str, Any]]]:
    """Load the stable, minimized row set used for four-role reconciliation."""

    inspector = sa.inspect(connection)

    def has_column(table_name: str, column_name: str) -> bool:
        return column_name in {column["name"] for column in inspector.get_columns(table_name)}

    role_code = "code" if has_column("role", "code") else "NULL AS code"
    grant_revoked_at = "revoked_at" if has_column("rp_application_access_grant", "revoked_at") else "NULL AS revoked_at"
    grant_revoked_by = "revoked_by_user_id" if has_column("rp_application_access_grant", "revoked_by_user_id") else "NULL AS revoked_by_user_id"
    invitation_reason = "revocation_reason" if has_column("rp_application_developer_invitation", "revocation_reason") else "NULL AS revocation_reason"
    invitation_replacement = (
        "replaced_by_invitation_uuid"
        if has_column(
            "rp_application_developer_invitation",
            "replaced_by_invitation_uuid",
        )
        else "NULL AS replaced_by_invitation_uuid"
    )

    queries = {
        "roles": f"""
            SELECT id, uuid, name, is_deleted, deleted_at, {role_code}
            FROM role
            ORDER BY uuid
        """,
        "users": """
            SELECT id, uuid, email, enabled, is_deleted, is_superuser, role_ids
            FROM "user"
            ORDER BY uuid
        """,
        "workspaces": """
            SELECT id, uuid, is_deleted
            FROM workspace
            ORDER BY uuid
        """,
        "workspaceMembers": """
            SELECT id, uuid, user_id, workspace_id, role, is_deleted, deleted_at
            FROM workspace_member
            ORDER BY uuid
        """,
        "grants": f"""
            SELECT id, uuid, user_id, workspace_id, role, status,
                   source_invitation_uuid, is_deleted, deleted_at,
                   {grant_revoked_at}, {grant_revoked_by}
            FROM rp_application_access_grant
            ORDER BY uuid
        """,
        "invitations": f"""
            SELECT id, uuid, workspace_id, invited_email, role, status,
                   delegated_by_grant_uuid, accepted_at, revoked_at,
                   is_deleted, deleted_at, {invitation_reason},
                   {invitation_replacement}
            FROM rp_application_developer_invitation
            ORDER BY uuid
        """,
    }

    snapshot: dict[str, list[dict[str, Any]]] = {}
    for name, query in queries.items():
        snapshot[name] = [dict(row) for row in connection.execute(sa.text(query)).mappings().all()]
    return snapshot


def snapshot_sha256(
    snapshot: Mapping[str, Sequence[Mapping[str, Any]]],
) -> str:
    """Return a deterministic digest without emitting snapshot values."""

    encoded = json.dumps(
        {
            "schemaVersion": SNAPSHOT_SCHEMA_VERSION,
            "snapshot": _normalize_json_value(snapshot),
        },
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _normalize_json_value(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {str(key): _normalize_json_value(item) for key, item in sorted(value.items(), key=lambda pair: str(pair[0]))}
    if isinstance(value, Sequence) and not isinstance(value, str | bytes | bytearray):
        return [_normalize_json_value(item) for item in value]
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, datetime):
        normalized = value.astimezone(UTC) if value.tzinfo is not None else value
        return normalized.isoformat(timespec="microseconds")
    if isinstance(value, date):
        return value.isoformat()
    if value is None or isinstance(value, bool | int | float | str):
        return value
    raise TypeError(f"unsupported reconciliation snapshot value: {type(value).__name__}")
