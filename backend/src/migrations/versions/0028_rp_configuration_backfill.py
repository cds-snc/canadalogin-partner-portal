"""Backfill safe RP configuration labels and workspace Department context.

Revision ID: 0028_rp_config_backfill
Revises: 0027_contact_identity_expand
Create Date: 2026-08-13

The backfill uses only the retained public display name and stable RP UUID for
labels. It does not inspect provider payloads, infer an Application parent, or
invent a CanadaLogin environment. Workspace Department mismatches fail the
transaction before any row is changed.
"""

from __future__ import annotations

import unicodedata
import uuid as uuid_pkg
from collections.abc import Mapping, Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0028_rp_config_backfill"
down_revision: Union[str, None] = "0027_contact_identity_expand"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_MAX_NAME_LENGTH = 128
_REFERENCE_LENGTH = 8


def _default_configuration_name(row: Mapping[str, object]) -> str:
    stable_uuid = row["uuid"]
    if not isinstance(stable_uuid, uuid_pkg.UUID):
        stable_uuid = uuid_pkg.UUID(str(stable_uuid))
    raw_name = row.get("dnr_app_name")
    normalized_name = unicodedata.normalize(
        "NFC",
        raw_name.strip() if isinstance(raw_name, str) else "",
    )
    base_name = normalized_name or "RP configuration"
    suffix = f" [{stable_uuid.hex[:_REFERENCE_LENGTH]}]"
    bounded_base_name = base_name[: _MAX_NAME_LENGTH - len(suffix)].rstrip()
    if not bounded_base_name:
        bounded_base_name = "RP configuration"
    return f"{bounded_base_name}{suffix}"


def upgrade() -> None:
    connection = op.get_bind()
    contradictory_department_count = connection.execute(
        sa.text(
            "SELECT COUNT(*) "
            "FROM rp_application AS rp "
            "JOIN workspace AS w ON w.id = rp.workspace_id "
            "WHERE rp.workspace_id IS NOT NULL "
            "AND rp.department_id IS NOT NULL "
            "AND rp.department_id <> w.department_id"
        )
    ).scalar_one()
    if contradictory_department_count:
        raise RuntimeError(
            "Cannot backfill RP configuration hierarchy while "
            f"{contradictory_department_count} workspace-linked RP rows have "
            "contradictory Department values"
        )

    missing_names = connection.execute(
        sa.text(
            "SELECT id, uuid, dnr_app_name FROM rp_application "
            "WHERE configuration_name IS NULL "
            "OR length(trim(configuration_name)) = 0 "
            "ORDER BY id FOR UPDATE"
        )
    ).mappings()
    updates = [
        {
            "rp_application_id": row["id"],
            "configuration_name": _default_configuration_name(row),
        }
        for row in missing_names
    ]
    if updates:
        connection.execute(
            sa.text("UPDATE rp_application SET configuration_name = :configuration_name WHERE id = :rp_application_id"),
            updates,
        )

    connection.execute(
        sa.text(
            "UPDATE rp_application AS rp "
            "SET department_id = w.department_id "
            "FROM workspace AS w "
            "WHERE rp.workspace_id = w.id AND rp.department_id IS NULL"
        )
    )


def downgrade() -> None:
    # Labels may have been edited after backfill and Department values are
    # authoritative workspace context. Removing either would destroy data.
    pass
