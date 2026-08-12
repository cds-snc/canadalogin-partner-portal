"""Inventory legacy authorization data without changing it.

Run from the ``backend`` directory with:

    UV_PROJECT_ENVIRONMENT=../.venv uv run python -m src.scripts.reconcile_four_role_authorization

The command is dry-run only. It emits stable, sorted JSON using public UUIDs
and hashes normalized invitation emails instead of printing email addresses.
Use ``--candidate-manifest`` to create an unreviewed provenance template. A
human may bind it to the current report by setting ``reviewed`` to true and
adding a review reference. Both ``clAdminAssignments`` and
``workspaceMemberDispositions`` must remain empty: legacy state is inventory,
not a source of canonical access.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

import sqlalchemy as sa

from ..app.core.config import settings
from ..migrations.four_role_reconciliation_snapshot_v1 import (
    load_snapshot,
    snapshot_sha256,
)

CHANGE_ID = "define-four-role-authorization-model"
REPORT_SCHEMA_VERSION = 2
MANIFEST_SCHEMA_VERSION = 2
CANONICAL_PARTNER_ROLES = frozenset({"rp_admin", "rp_user_edit", "read_only"})
DISPLAY_TO_CANONICAL_ROLE = {
    "RP Admin": "rp_admin",
    "RP User (Edit)": "rp_user_edit",
    "Read Only": "read_only",
}
COMPATIBLE_PARTNER_ROLES = CANONICAL_PARTNER_ROLES | DISPLAY_TO_CANONICAL_ROLE.keys()
INVITATION_STATUSES = frozenset({"pending", "accepted", "expired", "revoked"})
GRANT_STATUSES = frozenset({"active", "revoked"})


def build_report(  # noqa: C901 - the categories intentionally share one stable snapshot
    snapshot: Mapping[str, Sequence[Mapping[str, Any]]],
) -> dict[str, Any]:
    """Build a stable report from a database snapshot."""

    roles = list(snapshot.get("roles", ()))
    users = list(snapshot.get("users", ()))
    workspaces = list(snapshot.get("workspaces", ()))
    workspace_members = list(snapshot.get("workspaceMembers", ()))
    grants = list(snapshot.get("grants", ()))
    invitations = list(snapshot.get("invitations", ()))

    roles_by_id = {role["id"]: role for role in roles}
    users_by_id = {user["id"]: user for user in users}
    workspaces_by_id = {workspace["id"]: workspace for workspace in workspaces}
    workspace_uuid_by_id = {workspace["id"]: str(workspace["uuid"]) for workspace in workspaces}
    invitations_by_uuid = {str(invitation["uuid"]): invitation for invitation in invitations}
    invitation_uuids = {str(invitation["uuid"]) for invitation in invitations}
    grant_uuids = {str(grant["uuid"]) for grant in grants}
    active_grants_by_user_workspace = {
        (grant["user_id"], grant["workspace_id"]): grant for grant in grants if grant["status"] == "active" and not grant["is_deleted"]
    }

    findings: dict[str, list[dict[str, Any]]] = {
        "malformedRoleIds": [],
        "duplicateRoleIds": [],
        "unknownRoleIds": [],
        "deletedRoleAssignments": [],
        "superuserUsers": [],
        "adminRoleOnlyUsers": [],
        "disabledLegacyAdminCandidates": [],
        "deletedLegacyAdminCandidates": [],
        "mixedClAdminPartnerCandidates": [],
        "roleIdentityCollisions": [],
        "grantRoleCanonicalizationCandidates": [],
        "invalidGrantRoles": [],
        "invalidGrantStatuses": [],
        "contradictoryGrantLifecycle": [],
        "activeGrantUserLifecycleConflicts": [],
        "activeGrantWorkspaceLifecycleConflicts": [],
        "orphanGrantSourceInvitations": [],
        "duplicateGrantSourceInvitations": [],
        "nonAcceptedGrantSourceInvitations": [],
        "grantSourceWorkspaceMismatches": [],
        "grantSourceRoleMismatches": [],
        "grantSourceInviteeMismatches": [],
        "acceptedInvitationsWithoutSourceGrant": [],
        "invitationRoleCanonicalizationCandidates": [],
        "invalidInvitationRoles": [],
        "invalidInvitationStatuses": [],
        "contradictoryInvitationLifecycle": [],
        "orphanInvitationReplacements": [],
        "orphanDelegationGrants": [],
        "duplicatePendingInvitations": [],
        "workspaceMemberDispositionsRequired": [],
        "workspaceMemberGrantConflicts": [],
        "workspaceMemberParentLifecycleConflicts": [],
    }

    for user in users:
        user_uuid = str(user["uuid"])
        role_ids = user.get("role_ids")
        well_formed_role_ids = role_ids is None or (
            isinstance(role_ids, list) and all(isinstance(value, int) and not isinstance(value, bool) for value in role_ids)
        )
        if not well_formed_role_ids:
            findings["malformedRoleIds"].append({"userUuid": user_uuid})
            normalized_role_ids: list[int] = []
        else:
            normalized_role_ids = list(role_ids or [])
            duplicate_ids = sorted(role_id for role_id, count in Counter(normalized_role_ids).items() if count > 1)
            if duplicate_ids:
                findings["duplicateRoleIds"].append({"userUuid": user_uuid, "roleIds": duplicate_ids})

            unknown_ids = sorted(role_id for role_id in set(normalized_role_ids) if role_id not in roles_by_id)
            if unknown_ids:
                findings["unknownRoleIds"].append({"userUuid": user_uuid, "roleIds": unknown_ids})

            deleted_role_uuids = sorted(
                str(roles_by_id[role_id]["uuid"])
                for role_id in set(normalized_role_ids)
                if role_id in roles_by_id and roles_by_id[role_id]["is_deleted"]
            )
            if deleted_role_uuids:
                findings["deletedRoleAssignments"].append({"userUuid": user_uuid, "roleUuids": deleted_role_uuids})

        has_admin_role = any(
            role_id in roles_by_id and roles_by_id[role_id]["name"] == "admin" and not roles_by_id[role_id]["is_deleted"]
            for role_id in normalized_role_ids
        )
        is_superuser = bool(user["is_superuser"])
        is_legacy_admin_candidate = is_superuser or has_admin_role
        if is_superuser:
            findings["superuserUsers"].append({"userUuid": user_uuid})
        if has_admin_role and not is_superuser:
            findings["adminRoleOnlyUsers"].append({"userUuid": user_uuid})
        if is_legacy_admin_candidate and not user["enabled"]:
            findings["disabledLegacyAdminCandidates"].append({"userUuid": user_uuid})
        if is_legacy_admin_candidate and user["is_deleted"]:
            findings["deletedLegacyAdminCandidates"].append({"userUuid": user_uuid})

        active_partner_workspaces = sorted(
            workspace_uuid_by_id.get(grant["workspace_id"], f"internal:{grant['workspace_id']}")
            for grant in grants
            if grant["user_id"] == user["id"] and grant["status"] == "active" and not grant["is_deleted"]
        )
        if is_legacy_admin_candidate and active_partner_workspaces:
            findings["mixedClAdminPartnerCandidates"].append({"userUuid": user_uuid, "workspaceUuids": active_partner_workspaces})

    cl_admin_identity_rows = [
        role for role in roles if str(role["name"]).strip().lower().replace("_", " ") == "cl admin" or role.get("code") == "cl_admin"
    ]
    canonical_rows = [role for role in cl_admin_identity_rows if role.get("code") == "cl_admin"]
    if len(cl_admin_identity_rows) != 1 or len(canonical_rows) != 1 or canonical_rows[0]["is_deleted"]:
        findings["roleIdentityCollisions"].append(
            {
                "roleUuids": sorted(str(role["uuid"]) for role in cl_admin_identity_rows),
                "canonicalRowCount": len(canonical_rows),
            }
        )

    source_grants: dict[str, list[str]] = defaultdict(list)
    for grant in grants:
        grant_uuid = str(grant["uuid"])
        _classify_role_value(
            findings=findings,
            record_kind="Grant",
            record_uuid=grant_uuid,
            raw_role=grant["role"],
        )
        if grant["status"] not in GRANT_STATUSES:
            findings["invalidGrantStatuses"].append({"grantUuid": grant_uuid, "status": grant["status"]})
        if _grant_lifecycle_is_contradictory(grant):
            findings["contradictoryGrantLifecycle"].append({"grantUuid": grant_uuid})

        if grant["status"] == "active" and not grant["is_deleted"]:
            target_user = users_by_id.get(grant["user_id"])
            if target_user is None or not target_user["enabled"] or target_user["is_deleted"]:
                findings["activeGrantUserLifecycleConflicts"].append(
                    {
                        "grantUuid": grant_uuid,
                        "userUuid": (str(target_user["uuid"]) if target_user is not None else None),
                        "userEnabled": bool(target_user and target_user["enabled"]),
                        "userDeleted": bool(target_user is None or target_user["is_deleted"]),
                    }
                )

            target_workspace = workspaces_by_id.get(grant["workspace_id"])
            if target_workspace is None or target_workspace["is_deleted"]:
                findings["activeGrantWorkspaceLifecycleConflicts"].append(
                    {
                        "grantUuid": grant_uuid,
                        "workspaceUuid": (str(target_workspace["uuid"]) if target_workspace is not None else None),
                        "workspaceDeleted": bool(target_workspace is None or target_workspace["is_deleted"]),
                    }
                )

        source_invitation_uuid = grant.get("source_invitation_uuid")
        if source_invitation_uuid is not None:
            source_uuid = str(source_invitation_uuid)
            source_grants[source_uuid].append(grant_uuid)
            if source_uuid not in invitation_uuids:
                findings["orphanGrantSourceInvitations"].append({"grantUuid": grant_uuid, "sourceInvitationUuid": source_uuid})
                continue

            source_invitation = invitations_by_uuid[source_uuid]
            if source_invitation["status"] != "accepted":
                findings["nonAcceptedGrantSourceInvitations"].append(
                    {
                        "grantUuid": grant_uuid,
                        "sourceInvitationUuid": source_uuid,
                        "sourceStatus": source_invitation["status"],
                    }
                )
            if grant["workspace_id"] != source_invitation["workspace_id"]:
                findings["grantSourceWorkspaceMismatches"].append(
                    {
                        "grantUuid": grant_uuid,
                        "sourceInvitationUuid": source_uuid,
                    }
                )

            grant_role = _canonical_partner_role(grant["role"])
            invitation_role = _canonical_partner_role(source_invitation["role"])
            if grant_role is not None and invitation_role is not None and grant_role != invitation_role:
                findings["grantSourceRoleMismatches"].append(
                    {
                        "grantUuid": grant_uuid,
                        "sourceInvitationUuid": source_uuid,
                        "grantRole": grant_role,
                        "invitationRole": invitation_role,
                    }
                )

            target_user = users_by_id.get(grant["user_id"])
            target_email = _normalized_email(target_user.get("email") if target_user is not None else None)
            invited_email = _normalized_email(source_invitation.get("invited_email"))
            if target_email is None or invited_email is None or target_email != invited_email:
                findings["grantSourceInviteeMismatches"].append(
                    {
                        "grantUuid": grant_uuid,
                        "sourceInvitationUuid": source_uuid,
                        "targetUserUuid": (str(target_user["uuid"]) if target_user is not None else None),
                    }
                )
    for source_uuid, sourced_grants in source_grants.items():
        if len(sourced_grants) > 1:
            findings["duplicateGrantSourceInvitations"].append(
                {
                    "sourceInvitationUuid": source_uuid,
                    "grantUuids": sorted(sourced_grants),
                }
            )

    for invitation in invitations:
        invitation_uuid = str(invitation["uuid"])
        if invitation["status"] == "accepted" and invitation_uuid not in source_grants:
            findings["acceptedInvitationsWithoutSourceGrant"].append({"invitationUuid": invitation_uuid})

    pending_invitations: dict[tuple[int, str], list[str]] = defaultdict(list)
    for invitation in invitations:
        invitation_uuid = str(invitation["uuid"])
        _classify_role_value(
            findings=findings,
            record_kind="Invitation",
            record_uuid=invitation_uuid,
            raw_role=invitation["role"],
        )
        if invitation["status"] not in INVITATION_STATUSES:
            findings["invalidInvitationStatuses"].append({"invitationUuid": invitation_uuid, "status": invitation["status"]})
        if _invitation_lifecycle_is_contradictory(invitation):
            findings["contradictoryInvitationLifecycle"].append({"invitationUuid": invitation_uuid})

        replacement_uuid = invitation.get("replaced_by_invitation_uuid")
        if replacement_uuid is not None and str(replacement_uuid) not in invitation_uuids:
            findings["orphanInvitationReplacements"].append(
                {
                    "invitationUuid": invitation_uuid,
                    "replacementInvitationUuid": str(replacement_uuid),
                }
            )
        delegation_uuid = invitation.get("delegated_by_grant_uuid")
        if delegation_uuid is not None and str(delegation_uuid) not in grant_uuids:
            findings["orphanDelegationGrants"].append({"invitationUuid": invitation_uuid, "delegatedByGrantUuid": str(delegation_uuid)})
        if invitation["status"] == "pending" and not invitation["is_deleted"]:
            normalized_email = str(invitation["invited_email"]).strip().lower()
            pending_invitations[(invitation["workspace_id"], normalized_email)].append(invitation_uuid)

    for (workspace_id, normalized_email), invitation_ids in pending_invitations.items():
        if len(invitation_ids) > 1:
            findings["duplicatePendingInvitations"].append(
                {
                    "workspaceUuid": workspace_uuid_by_id.get(workspace_id, f"internal:{workspace_id}"),
                    "normalizedEmailSha256": hashlib.sha256(normalized_email.encode("utf-8")).hexdigest(),
                    "invitationUuids": sorted(invitation_ids),
                }
            )

    for membership in workspace_members:
        if membership["is_deleted"]:
            continue
        membership_uuid = str(membership["uuid"])
        active_grant = active_grants_by_user_workspace.get((membership["user_id"], membership["workspace_id"]))
        parent_user = users_by_id.get(membership["user_id"])
        parent_workspace = workspaces_by_id.get(membership["workspace_id"])
        disposition = {
            "workspaceMemberUuid": membership_uuid,
            "workspaceUuid": workspace_uuid_by_id.get(membership["workspace_id"], f"internal:{membership['workspace_id']}"),
            "legacyRole": membership["role"],
            "userEnabled": bool(parent_user and parent_user.get("enabled")),
            "userDeleted": bool(parent_user is None or parent_user.get("is_deleted")),
            "workspaceDeleted": bool(parent_workspace is None or parent_workspace.get("is_deleted")),
        }
        findings["workspaceMemberDispositionsRequired"].append(disposition)
        if not disposition["userEnabled"] or disposition["userDeleted"] or disposition["workspaceDeleted"]:
            findings["workspaceMemberParentLifecycleConflicts"].append(disposition)
        if active_grant is not None:
            findings["workspaceMemberGrantConflicts"].append(
                {
                    **disposition,
                    "activeGrantUuid": str(active_grant["uuid"]),
                    "activeGrantRole": active_grant["role"],
                }
            )

    stable_findings = {name: sorted(items, key=_stable_item_key) for name, items in findings.items()}
    table_counts = {
        "roles": len(roles),
        "users": len(users),
        "workspaces": len(workspaces),
        "workspaceMembers": len(workspace_members),
        "grants": len(grants),
        "invitations": len(invitations),
    }
    return {
        "schemaVersion": REPORT_SCHEMA_VERSION,
        "changeId": CHANGE_ID,
        "mode": "dry-run",
        "containsRawEmails": False,
        "snapshotSha256": snapshot_sha256(snapshot),
        "tableCountsBefore": table_counts,
        "candidateCountsBefore": {name: len(items) for name, items in stable_findings.items()},
        "tableCountsAfter": None,
        "candidateCountsAfter": None,
        "findings": stable_findings,
    }


def report_sha256(report: Mapping[str, Any]) -> str:
    encoded = json.dumps(
        report,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def build_post_migration_report(baseline: Mapping[str, Any], current: Mapping[str, Any]) -> dict[str, Any]:
    """Attach actual post-migration counts to a saved preflight report."""

    if baseline.get("schemaVersion") != REPORT_SCHEMA_VERSION:
        raise ValueError("baseline report schemaVersion is not supported")
    if baseline.get("changeId") != CHANGE_ID:
        raise ValueError("baseline report changeId does not match")
    comparison = dict(current)
    comparison["mode"] = "post-migration"
    comparison["tableCountsBefore"] = baseline.get("tableCountsBefore")
    comparison["candidateCountsBefore"] = baseline.get("candidateCountsBefore")
    comparison["tableCountsAfter"] = current.get("tableCountsBefore")
    comparison["candidateCountsAfter"] = current.get("candidateCountsBefore")
    comparison["baselineReportSha256"] = report_sha256(baseline)
    return comparison


def build_candidate_manifest(report: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "schemaVersion": MANIFEST_SCHEMA_VERSION,
        "changeId": CHANGE_ID,
        "reviewed": False,
        "reviewReference": "",
        "reportSha256": report_sha256(report),
        "snapshotSha256": report["snapshotSha256"],
        "clAdminAssignments": [],
        "workspaceMemberDispositions": [],
    }


def validate_reviewed_manifest(manifest: Mapping[str, Any], report: Mapping[str, Any]) -> list[str]:
    errors: list[str] = []
    if manifest.get("schemaVersion") != MANIFEST_SCHEMA_VERSION:
        errors.append("unsupported schemaVersion")
    if manifest.get("changeId") != CHANGE_ID:
        errors.append("changeId does not match")
    if manifest.get("reviewed") is not True:
        errors.append("reviewed must be true")
    review_reference = manifest.get("reviewReference")
    if (
        not isinstance(review_reference, str)
        or re.fullmatch(
            r"[A-Za-z0-9][A-Za-z0-9._:/#-]{0,127}",
            review_reference,
        )
        is None
    ):
        errors.append("reviewReference must be a bounded safe reference")
    if manifest.get("reportSha256") != report_sha256(report):
        errors.append("reportSha256 does not match the current dry-run report")
    if manifest.get("snapshotSha256") != report.get("snapshotSha256"):
        errors.append("snapshotSha256 does not match the current reconciliation snapshot")

    dispositions = manifest.get("workspaceMemberDispositions")
    if not isinstance(dispositions, list):
        errors.append("workspaceMemberDispositions must be a list")
    elif dispositions:
        errors.append("workspaceMemberDispositions must be empty; legacy workspace membership backfill is prohibited")

    assignments = manifest.get("clAdminAssignments")
    if not isinstance(assignments, list):
        errors.append("clAdminAssignments must be a list")
    elif assignments:
        errors.append("clAdminAssignments must be empty; legacy CL Admin backfill is prohibited")
    return sorted(set(errors))


def _classify_role_value(
    *,
    findings: dict[str, list[dict[str, Any]]],
    record_kind: str,
    record_uuid: str,
    raw_role: Any,
) -> None:
    value = str(raw_role)
    stripped_value = value.strip()
    uuid_key = f"{record_kind[0].lower()}{record_kind[1:]}Uuid"
    if stripped_value not in COMPATIBLE_PARTNER_ROLES:
        findings[f"invalid{record_kind}Roles"].append({uuid_key: record_uuid, "role": value})
        return
    canonical_value = DISPLAY_TO_CANONICAL_ROLE.get(stripped_value, stripped_value)
    if value != canonical_value:
        findings[f"{record_kind.lower()}RoleCanonicalizationCandidates"].append({uuid_key: record_uuid, "from": value, "to": canonical_value})


def _canonical_partner_role(value: Any) -> str | None:
    stripped_value = str(value).strip()
    if stripped_value not in COMPATIBLE_PARTNER_ROLES:
        return None
    return DISPLAY_TO_CANONICAL_ROLE.get(stripped_value, stripped_value)


def _normalized_email(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip().lower()
    return normalized or None


def _grant_lifecycle_is_contradictory(grant: Mapping[str, Any]) -> bool:
    soft_delete_mismatch = bool(grant["is_deleted"]) != (grant.get("deleted_at") is not None)
    if soft_delete_mismatch:
        return True
    if grant["status"] == "active":
        return bool(grant["is_deleted"]) or grant.get("revoked_at") is not None or grant.get("revoked_by_user_id") is not None
    if grant["status"] == "revoked":
        return bool(grant["is_deleted"]) or grant.get("revoked_at") is None
    return False


def _invitation_lifecycle_is_contradictory(invitation: Mapping[str, Any]) -> bool:
    soft_delete_mismatch = bool(invitation["is_deleted"]) != (invitation.get("deleted_at") is not None)
    if soft_delete_mismatch or invitation["is_deleted"]:
        return True
    status = invitation["status"]
    accepted_at = invitation.get("accepted_at")
    revoked_at = invitation.get("revoked_at")
    if status == "pending":
        invalid = accepted_at is not None or revoked_at is not None
    elif status == "accepted":
        invalid = accepted_at is None or revoked_at is not None
    elif status == "expired":
        invalid = accepted_at is not None or revoked_at is not None
    elif status == "revoked":
        invalid = accepted_at is not None or revoked_at is None
    else:
        invalid = False
    has_replacement = invitation.get("replaced_by_invitation_uuid") is not None
    invalid_replacement = has_replacement and (status != "revoked" or not invitation.get("revocation_reason"))
    return invalid or invalid_replacement


def _stable_item_key(item: Mapping[str, Any]) -> str:
    return json.dumps(item, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def _write_json(path: Path | None, payload: Mapping[str, Any]) -> None:
    rendered = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if path is None:
        print(rendered, end="")
        return
    path.write_text(rendered, encoding="utf-8")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Write the dry-run report to this path")
    parser.add_argument(
        "--candidate-manifest",
        type=Path,
        help="Write an unreviewed explicit-decision manifest template",
    )
    parser.add_argument(
        "--reviewed-manifest",
        type=Path,
        help="Validate a reviewed manifest against the current dry-run report",
    )
    parser.add_argument(
        "--baseline-report",
        type=Path,
        help="Compare current actual counts with a saved pre-migration report",
    )
    parser.add_argument(
        "--fail-on-findings",
        action="store_true",
        help="Exit non-zero when any reconciliation finding remains",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    database_url = settings.POSTGRES_SYNC_PREFIX + settings.POSTGRES_URI
    engine = sa.create_engine(database_url)
    try:
        with engine.connect() as connection:
            report = build_report(load_snapshot(connection))
    finally:
        engine.dispose()

    if args.baseline_report is not None:
        try:
            baseline_report = json.loads(args.baseline_report.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise SystemExit("baseline report is not readable valid JSON") from exc
        try:
            report = build_post_migration_report(baseline_report, report)
        except ValueError as exc:
            raise SystemExit(str(exc)) from exc

    _write_json(args.output, report)
    if args.candidate_manifest is not None:
        _write_json(args.candidate_manifest, build_candidate_manifest(report))

    if args.reviewed_manifest is not None:
        try:
            manifest = json.loads(args.reviewed_manifest.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise SystemExit("reviewed manifest is not readable valid JSON") from exc
        errors = validate_reviewed_manifest(manifest, report)
        if errors:
            raise SystemExit("reviewed manifest is invalid: " + "; ".join(errors))

    if args.fail_on_findings and any(report["candidateCountsBefore"].values()):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
