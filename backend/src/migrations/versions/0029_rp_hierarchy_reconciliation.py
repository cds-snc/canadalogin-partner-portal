"""Apply reviewed RP hierarchy mappings and preflight retained ancestry.

Revision ID: 0029_rp_hierarchy_reconcile
Revises: 0028_rp_config_backfill
Create Date: 2026-08-13

``RP_HIERARCHY_BACKFILL_MANIFEST`` must name a reviewed manifest when active
workspace-linked RP rows lack an Application parent or CanadaLogin environment.
The migration locks the hierarchy, binds decisions to the exact minimized
snapshot, applies public UUID mappings, and fails closed on every remaining
hierarchy finding.
"""

from __future__ import annotations

import json
import os
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any, Union

import sqlalchemy as sa
from alembic import op

try:
    from src.migrations.rp_configuration_hierarchy_reconciliation_v1 import (
        build_report,
        has_blocking_findings,
        has_mapping_findings,
        load_snapshot,
        validate_reviewed_manifest,
    )
except ModuleNotFoundError:  # Alembic runs with backend/src on sys.path.
    from migrations.rp_configuration_hierarchy_reconciliation_v1 import (
        build_report,
        has_blocking_findings,
        has_mapping_findings,
        load_snapshot,
        validate_reviewed_manifest,
    )

revision: str = "0029_rp_hierarchy_reconcile"
down_revision: Union[str, None] = "0028_rp_config_backfill"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

MANIFEST_ENVIRONMENT_VARIABLE = "RP_HIERARCHY_BACKFILL_MANIFEST"
MAX_MANIFEST_BYTES = 1_000_000


def upgrade() -> None:
    connection = op.get_bind()
    connection.execute(sa.text("LOCK TABLE workspace, application_information, rp_application IN SHARE ROW EXCLUSIVE MODE"))
    report = build_report(load_snapshot(connection))
    manifest = _load_reviewed_manifest(report)
    if manifest is not None:
        _apply_mappings(connection, manifest["mappings"])

    remaining_report = build_report(load_snapshot(connection))
    if has_blocking_findings(remaining_report):
        counts = remaining_report["findingCounts"]
        remaining = ", ".join(f"{key}={value}" for key, value in counts.items() if value)
        raise RuntimeError("RP hierarchy reconciliation has unresolved findings: " + remaining)


def downgrade() -> None:
    # Reviewed UUID mappings and environment decisions must not be erased.
    pass


def _load_reviewed_manifest(report: Mapping[str, Any]) -> dict[str, Any] | None:
    raw_path = os.getenv(MANIFEST_ENVIRONMENT_VARIABLE)
    if not raw_path:
        if has_mapping_findings(report):
            raise RuntimeError(f"{MANIFEST_ENVIRONMENT_VARIABLE} is required for unresolved RP hierarchy mappings")
        return None

    manifest_path = Path(raw_path).expanduser()
    if not manifest_path.is_file():
        raise RuntimeError("RP hierarchy backfill manifest does not exist")
    if manifest_path.stat().st_size > MAX_MANIFEST_BYTES:
        raise RuntimeError("RP hierarchy backfill manifest exceeds the maximum size")
    try:
        payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError("RP hierarchy backfill manifest is not readable valid JSON") from exc
    errors = validate_reviewed_manifest(payload, report)
    if errors:
        raise RuntimeError("RP hierarchy backfill manifest is invalid: " + "; ".join(errors))
    return payload


def _apply_mappings(
    connection: Any,
    mappings: Sequence[Mapping[str, Any]],
) -> None:
    for mapping in mappings:
        rp_configuration = (
            connection.execute(
                sa.text(
                    "SELECT id, workspace_id, application_information_id, "
                    "canada_login_environment FROM rp_application "
                    "WHERE uuid = CAST(:rp_uuid AS uuid) FOR UPDATE"
                ),
                {"rp_uuid": mapping["rpConfigurationUuid"]},
            )
            .mappings()
            .one_or_none()
        )
        if rp_configuration is None or rp_configuration["workspace_id"] is None:
            raise RuntimeError("mapped RP configuration is unavailable")

        workspace_uuid = connection.execute(
            sa.text("SELECT uuid FROM workspace WHERE id = :workspace_id"),
            {"workspace_id": rp_configuration["workspace_id"]},
        ).scalar_one_or_none()
        if str(workspace_uuid) != mapping["workspaceUuid"]:
            raise RuntimeError("mapped RP workspace changed after reconciliation")

        update_values: dict[str, Any] = {"rp_id": rp_configuration["id"]}
        assignments: list[str] = []
        if rp_configuration["application_information_id"] is None:
            application = connection.execute(
                sa.text(
                    "SELECT id FROM application_information WHERE uuid = CAST(:application_uuid AS uuid) AND workspace_id = :workspace_id FOR UPDATE"
                ),
                {
                    "application_uuid": mapping["applicationUuid"],
                    "workspace_id": rp_configuration["workspace_id"],
                },
            ).scalar_one_or_none()
            if application is None:
                raise RuntimeError("mapped Application is unavailable in the RP workspace")
            update_values["application_id"] = application
            assignments.append("application_information_id = :application_id")

        if rp_configuration["canada_login_environment"] is None:
            update_values["canada_login_environment"] = mapping["canadaLoginEnvironment"]
            assignments.append("canada_login_environment = :canada_login_environment")

        if assignments:
            connection.execute(
                sa.text("UPDATE rp_application SET " + ", ".join(assignments) + " WHERE id = :rp_id"),
                update_values,
            )
