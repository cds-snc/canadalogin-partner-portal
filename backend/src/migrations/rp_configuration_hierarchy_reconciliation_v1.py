"""Frozen reconciliation contract for RP configuration hierarchy cutover."""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Mapping, Sequence
from datetime import UTC, date, datetime
from typing import Any
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.engine import Connection

CHANGE_ID = "organize-applications-and-rp-configurations"
SNAPSHOT_SCHEMA_VERSION = 1
REPORT_SCHEMA_VERSION = 1
MANIFEST_SCHEMA_VERSION = 1
CANADA_LOGIN_ENVIRONMENTS = frozenset({"test", "staging", "production"})


def load_snapshot(connection: Connection) -> dict[str, list[dict[str, Any]]]:
    """Load only public identifiers and hierarchy fields needed for decisions."""

    queries = {
        "workspaces": """
            SELECT id, uuid, department_id, is_deleted, deleted_at
            FROM workspace
            ORDER BY uuid
        """,
        "applications": """
            SELECT id, uuid, workspace_id, is_deleted, deleted_at
            FROM application_information
            ORDER BY uuid
        """,
        "rpConfigurations": """
            SELECT id, uuid, workspace_id, department_id,
                   application_information_id, configuration_name,
                   canada_login_environment, is_deleted, deleted_at
            FROM rp_application
            ORDER BY uuid
        """,
    }
    return {name: [dict(row) for row in connection.execute(sa.text(query)).mappings().all()] for name, query in queries.items()}


def snapshot_sha256(snapshot: Mapping[str, Sequence[Mapping[str, Any]]]) -> str:
    return _json_sha256(
        {
            "schemaVersion": SNAPSHOT_SCHEMA_VERSION,
            "snapshot": _normalize_json_value(snapshot),
        }
    )


def build_report(
    snapshot: Mapping[str, Sequence[Mapping[str, Any]]],
) -> dict[str, Any]:
    workspaces = list(snapshot.get("workspaces", ()))
    applications = list(snapshot.get("applications", ()))
    rp_configurations = list(snapshot.get("rpConfigurations", ()))
    workspaces_by_id = {row["id"]: row for row in workspaces}
    applications_by_id = {row["id"]: row for row in applications}
    applications_by_workspace_uuid = {(row.get("workspace_id"), str(row["uuid"])): row for row in applications if row.get("workspace_id") is not None}

    findings: dict[str, list[dict[str, Any]]] = {
        "workspaceLinkedOrphans": [],
        "missingCanadaLoginEnvironments": [],
        "missingConfigurationNames": [],
        "departmentContradictions": [],
        "ancestryConflicts": [],
        "inactiveWorkspaceRows": [],
        "inactiveApplicationParents": [],
        "rpLifecycleContradictions": [],
        "publicUuidCollisions": [],
    }

    for rp_configuration in rp_configurations:
        rp_uuid = str(rp_configuration["uuid"])
        workspace_id = rp_configuration.get("workspace_id")
        application_id = rp_configuration.get("application_information_id")
        is_active = not rp_configuration["is_deleted"] and rp_configuration.get("deleted_at") is None
        if bool(rp_configuration["is_deleted"]) != (rp_configuration.get("deleted_at") is not None):
            findings["rpLifecycleContradictions"].append({"rpConfigurationUuid": rp_uuid})

        workspace = workspaces_by_id.get(workspace_id)
        workspace_uuid = str(workspace["uuid"]) if workspace is not None else None
        application = applications_by_id.get(application_id)
        application_uuid = str(application["uuid"]) if application is not None else None
        colliding_application = applications_by_workspace_uuid.get((workspace_id, rp_uuid))
        if colliding_application is not None:
            findings["publicUuidCollisions"].append(
                {
                    "applicationUuid": str(colliding_application["uuid"]),
                    "rpConfigurationUuid": rp_uuid,
                    "workspaceUuid": workspace_uuid,
                }
            )

        configuration_name = rp_configuration.get("configuration_name")
        if not isinstance(configuration_name, str) or not configuration_name.strip():
            findings["missingConfigurationNames"].append(
                {
                    "rpConfigurationUuid": rp_uuid,
                    "workspaceUuid": workspace_uuid,
                }
            )

        if workspace_id is not None and application_id is None:
            findings["workspaceLinkedOrphans"].append(
                {
                    "rpConfigurationUuid": rp_uuid,
                    "workspaceUuid": workspace_uuid,
                }
            )

        if is_active and workspace_id is not None:
            if rp_configuration.get("canada_login_environment") not in CANADA_LOGIN_ENVIRONMENTS:
                findings["missingCanadaLoginEnvironments"].append(
                    {
                        "rpConfigurationUuid": rp_uuid,
                        "workspaceUuid": workspace_uuid,
                    }
                )
            if workspace is None or workspace["is_deleted"] or workspace.get("deleted_at") is not None:
                findings["inactiveWorkspaceRows"].append(
                    {
                        "rpConfigurationUuid": rp_uuid,
                        "workspaceUuid": workspace_uuid,
                    }
                )
            if application is not None and (application["is_deleted"] or application.get("deleted_at") is not None):
                findings["inactiveApplicationParents"].append(
                    {
                        "applicationUuid": application_uuid,
                        "rpConfigurationUuid": rp_uuid,
                        "workspaceUuid": workspace_uuid,
                    }
                )

        if workspace_id is not None and workspace is not None:
            department_id = rp_configuration.get("department_id")
            if department_id != workspace.get("department_id"):
                findings["departmentContradictions"].append(
                    {
                        "rpConfigurationUuid": rp_uuid,
                        "workspaceUuid": workspace_uuid,
                    }
                )

        if application_id is not None and (application is None or workspace_id is None or application.get("workspace_id") != workspace_id):
            application_workspace = workspaces_by_id.get(application.get("workspace_id")) if application is not None else None
            findings["ancestryConflicts"].append(
                {
                    "applicationUuid": application_uuid,
                    "applicationWorkspaceUuid": (str(application_workspace["uuid"]) if application_workspace is not None else None),
                    "rpConfigurationUuid": rp_uuid,
                    "workspaceUuid": workspace_uuid,
                }
            )

    for items in findings.values():
        items.sort(key=_stable_item_key)

    report: dict[str, Any] = {
        "schemaVersion": REPORT_SCHEMA_VERSION,
        "changeId": CHANGE_ID,
        "snapshotSha256": snapshot_sha256(snapshot),
        "counts": {
            "workspaces": len(workspaces),
            "applications": len(applications),
            "rpConfigurations": len(rp_configurations),
        },
        "findingCounts": {key: len(value) for key, value in findings.items()},
        "findings": findings,
    }
    report["reportSha256"] = _json_sha256(report)
    return report


def build_candidate_manifest(report: Mapping[str, Any]) -> dict[str, Any]:
    findings = report["findings"]
    unresolved: dict[str, dict[str, Any]] = {}
    for item in findings["workspaceLinkedOrphans"]:
        rp_uuid = item["rpConfigurationUuid"]
        unresolved.setdefault(
            rp_uuid,
            {
                "rpConfigurationUuid": rp_uuid,
                "workspaceUuid": item["workspaceUuid"],
                "applicationUuid": None,
                "canadaLoginEnvironment": None,
            },
        )
    for item in findings["missingCanadaLoginEnvironments"]:
        rp_uuid = item["rpConfigurationUuid"]
        unresolved.setdefault(
            rp_uuid,
            {
                "rpConfigurationUuid": rp_uuid,
                "workspaceUuid": item["workspaceUuid"],
                "applicationUuid": None,
                "canadaLoginEnvironment": None,
            },
        )

    return {
        "schemaVersion": MANIFEST_SCHEMA_VERSION,
        "changeId": CHANGE_ID,
        "reviewed": False,
        "reviewReference": "",
        "reportSha256": report["reportSha256"],
        "snapshotSha256": report["snapshotSha256"],
        "mappings": [unresolved[key] for key in sorted(unresolved)],
    }


def validate_reviewed_manifest(
    payload: Any,
    report: Mapping[str, Any],
) -> list[str]:
    errors: list[str] = []
    if not isinstance(payload, dict):
        return ["manifest must be a JSON object"]
    expected_keys = {
        "schemaVersion",
        "changeId",
        "reviewed",
        "reviewReference",
        "reportSha256",
        "snapshotSha256",
        "mappings",
    }
    if set(payload) != expected_keys:
        errors.append("manifest has missing or unexpected fields")
    if payload.get("schemaVersion") != MANIFEST_SCHEMA_VERSION:
        errors.append("unsupported manifest schema version")
    if payload.get("changeId") != CHANGE_ID:
        errors.append("manifest changeId does not match this migration")
    if payload.get("reviewed") is not True:
        errors.append("manifest must record reviewed=true")
    review_reference = payload.get("reviewReference")
    if (
        not isinstance(review_reference, str)
        or re.fullmatch(
            r"[A-Za-z0-9][A-Za-z0-9._:/#-]{0,127}",
            review_reference,
        )
        is None
    ):
        errors.append("manifest requires a bounded safe reviewReference")
    if payload.get("reportSha256") != report.get("reportSha256"):
        errors.append("manifest report digest does not match reconciliation")
    if payload.get("snapshotSha256") != report.get("snapshotSha256"):
        errors.append("manifest snapshot digest does not match reconciliation")

    mappings = payload.get("mappings")
    if not isinstance(mappings, list):
        errors.append("mappings must be a list")
        return errors
    expected_manifest = build_candidate_manifest(report)
    expected_by_uuid = {item["rpConfigurationUuid"]: item for item in expected_manifest["mappings"]}
    seen: set[str] = set()
    for mapping in mappings:
        if not isinstance(mapping, dict) or set(mapping) != {
            "rpConfigurationUuid",
            "workspaceUuid",
            "applicationUuid",
            "canadaLoginEnvironment",
        }:
            errors.append("each mapping must contain only the expected fields")
            continue
        rp_uuid = mapping.get("rpConfigurationUuid")
        if not isinstance(rp_uuid, str) or rp_uuid not in expected_by_uuid:
            errors.append("mapping references an unexpected RP configuration")
            continue
        if rp_uuid in seen:
            errors.append("mapping RP configuration UUIDs must be unique")
            continue
        seen.add(rp_uuid)
        if mapping.get("workspaceUuid") != expected_by_uuid[rp_uuid]["workspaceUuid"]:
            errors.append("mapping workspace does not match reconciliation")
        if any(item["rpConfigurationUuid"] == rp_uuid for item in report["findings"]["workspaceLinkedOrphans"]) and not _is_uuid_string(
            mapping.get("applicationUuid")
        ):
            errors.append("orphan mapping requires an Application UUID")
        if (
            not any(item["rpConfigurationUuid"] == rp_uuid for item in report["findings"]["workspaceLinkedOrphans"])
            and mapping.get("applicationUuid") is not None
        ):
            errors.append("mapping must not replace an existing Application parent")
        environment_missing = any(item["rpConfigurationUuid"] == rp_uuid for item in report["findings"]["missingCanadaLoginEnvironments"])
        environment = mapping.get("canadaLoginEnvironment")
        if environment_missing and environment not in CANADA_LOGIN_ENVIRONMENTS:
            errors.append("missing-environment mapping requires a supported value")
        if not environment_missing and environment is not None:
            errors.append("mapping must not replace an existing CanadaLogin environment")
    if seen != set(expected_by_uuid):
        errors.append("mappings must cover every unresolved RP configuration exactly once")
    return errors


def has_blocking_findings(report: Mapping[str, Any]) -> bool:
    return any(report["findingCounts"].values())


def has_mapping_findings(report: Mapping[str, Any]) -> bool:
    counts = report["findingCounts"]
    return bool(counts["workspaceLinkedOrphans"] or counts["missingCanadaLoginEnvironments"])


def _json_sha256(payload: Mapping[str, Any]) -> str:
    encoded = json.dumps(
        _normalize_json_value(payload),
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
    raise TypeError(f"unsupported reconciliation value: {type(value).__name__}")


def _stable_item_key(item: Mapping[str, Any]) -> str:
    return json.dumps(item, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def _is_uuid_string(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    try:
        UUID(value)
    except ValueError:
        return False
    return True
