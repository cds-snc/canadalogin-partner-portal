import hashlib
from copy import deepcopy
from uuid import UUID

from src.scripts.reconcile_four_role_authorization import (
    build_candidate_manifest,
    build_post_migration_report,
    build_report,
    report_sha256,
    validate_reviewed_manifest,
)


def _uuid(value: int) -> UUID:
    return UUID(f"00000000-0000-0000-0000-{value:012d}")


def _snapshot() -> dict:
    return {
        "roles": [
            {
                "id": 1,
                "uuid": _uuid(1),
                "name": "admin",
                "code": None,
                "is_deleted": False,
                "deleted_at": None,
            },
            {
                "id": 2,
                "uuid": _uuid(2),
                "name": "CL Admin",
                "code": "cl_admin",
                "is_deleted": False,
                "deleted_at": None,
            },
        ],
        "users": [
            {
                "id": 10,
                "uuid": _uuid(10),
                "email": "person@example.test",
                "enabled": True,
                "is_deleted": False,
                "is_superuser": True,
                "role_ids": [1, 1, 999],
            },
            {
                "id": 11,
                "uuid": _uuid(11),
                "email": "other@example.test",
                "enabled": True,
                "is_deleted": False,
                "is_superuser": False,
                "role_ids": None,
            },
        ],
        "workspaces": [
            {"id": 20, "uuid": _uuid(20), "is_deleted": False},
        ],
        "workspaceMembers": [
            {
                "id": 30,
                "uuid": _uuid(30),
                "user_id": 10,
                "workspace_id": 20,
                "role": "workspace_admin",
                "is_deleted": False,
                "deleted_at": None,
            }
        ],
        "grants": [
            {
                "id": 40,
                "uuid": _uuid(40),
                "user_id": 10,
                "workspace_id": 20,
                "role": " RP Admin ",
                "status": "active",
                "source_invitation_uuid": _uuid(50),
                "is_deleted": False,
                "deleted_at": None,
                "revoked_at": None,
                "revoked_by_user_id": None,
            },
            {
                "id": 41,
                "uuid": _uuid(41),
                "user_id": 11,
                "workspace_id": 20,
                "role": "read_only",
                "status": "active",
                "source_invitation_uuid": _uuid(50),
                "is_deleted": False,
                "deleted_at": None,
                "revoked_at": None,
                "revoked_by_user_id": None,
            },
        ],
        "invitations": [
            {
                "id": 50,
                "uuid": _uuid(50),
                "workspace_id": 20,
                "invited_email": "Person@Example.test",
                "role": "Read Only",
                "status": "pending",
                "delegated_by_grant_uuid": None,
                "accepted_at": None,
                "revoked_at": None,
                "is_deleted": False,
                "deleted_at": None,
                "revocation_reason": None,
                "replaced_by_invitation_uuid": None,
            },
            {
                "id": 51,
                "uuid": _uuid(51),
                "workspace_id": 20,
                "invited_email": " person@example.test ",
                "role": "read_only",
                "status": "pending",
                "delegated_by_grant_uuid": None,
                "accepted_at": None,
                "revoked_at": None,
                "is_deleted": False,
                "deleted_at": None,
                "revocation_reason": None,
                "replaced_by_invitation_uuid": None,
            },
        ],
    }


def test_report_is_stable_redacted_and_covers_high_risk_findings() -> None:
    report = build_report(_snapshot())

    assert report == build_report(deepcopy(_snapshot()))
    assert report["containsRawEmails"] is False
    assert "Person@Example.test" not in str(report)
    assert report["candidateCountsAfter"] is None
    assert report["findings"]["duplicateRoleIds"]
    assert report["findings"]["unknownRoleIds"]
    assert report["findings"]["mixedClAdminPartnerCandidates"]
    assert report["findings"]["duplicateGrantSourceInvitations"]
    assert len(report["findings"]["nonAcceptedGrantSourceInvitations"]) == 2
    assert report["findings"]["grantSourceRoleMismatches"]
    assert report["findings"]["grantSourceInviteeMismatches"]
    assert report["findings"]["workspaceMemberGrantConflicts"]
    disposition = report["findings"]["workspaceMemberDispositionsRequired"][0]
    assert disposition["userEnabled"] is True
    assert disposition["userDeleted"] is False
    assert disposition["workspaceDeleted"] is False

    pending_duplicate = report["findings"]["duplicatePendingInvitations"][0]
    assert pending_duplicate["normalizedEmailSha256"] == hashlib.sha256(b"person@example.test").hexdigest()


def test_semantic_invitation_lineage_categories_cover_missing_and_mismatched_links() -> None:
    snapshot = _snapshot()
    snapshot["invitations"][0].update(status="accepted", accepted_at="2026-08-11T12:00:00+00:00")
    snapshot["invitations"][1].update(status="accepted", accepted_at="2026-08-11T12:00:00+00:00")
    snapshot["grants"][0]["workspace_id"] = 999

    report = build_report(snapshot)

    assert report["findings"]["grantSourceWorkspaceMismatches"] == [
        {
            "grantUuid": str(_uuid(40)),
            "sourceInvitationUuid": str(_uuid(50)),
        }
    ]
    assert report["findings"]["grantSourceRoleMismatches"] == [
        {
            "grantUuid": str(_uuid(40)),
            "sourceInvitationUuid": str(_uuid(50)),
            "grantRole": "rp_admin",
            "invitationRole": "read_only",
        }
    ]
    assert report["findings"]["grantSourceInviteeMismatches"] == [
        {
            "grantUuid": str(_uuid(41)),
            "sourceInvitationUuid": str(_uuid(50)),
            "targetUserUuid": str(_uuid(11)),
        }
    ]
    assert report["findings"]["acceptedInvitationsWithoutSourceGrant"] == [{"invitationUuid": str(_uuid(51))}]


def test_workspace_member_parent_lifecycle_conflicts_are_reported() -> None:
    snapshot = _snapshot()
    snapshot["users"][0]["enabled"] = False
    snapshot["workspaces"][0]["is_deleted"] = True

    report = build_report(snapshot)

    conflict = report["findings"]["workspaceMemberParentLifecycleConflicts"][0]
    assert conflict["workspaceMemberUuid"] == str(_uuid(30))
    assert conflict["userEnabled"] is False
    assert conflict["userDeleted"] is False
    assert conflict["workspaceDeleted"] is True


def test_active_grant_parent_lifecycle_conflicts_are_reported() -> None:
    snapshot = _snapshot()
    snapshot["users"][0]["enabled"] = False
    snapshot["workspaces"][0]["is_deleted"] = True

    report = build_report(snapshot)

    assert report["findings"]["activeGrantUserLifecycleConflicts"] == [
        {
            "grantUuid": str(_uuid(40)),
            "userUuid": str(_uuid(10)),
            "userEnabled": False,
            "userDeleted": False,
        }
    ]
    assert {finding["grantUuid"] for finding in report["findings"]["activeGrantWorkspaceLifecycleConflicts"]} == {str(_uuid(40)), str(_uuid(41))}
    assert all(
        finding["workspaceUuid"] == str(_uuid(20)) and finding["workspaceDeleted"] is True
        for finding in report["findings"]["activeGrantWorkspaceLifecycleConflicts"]
    )


def test_candidate_manifest_is_unreviewed_and_contains_no_access_decisions() -> None:
    report = build_report(_snapshot())
    candidate = build_candidate_manifest(report)

    assert candidate["reviewed"] is False
    assert candidate["reportSha256"] == report_sha256(report)
    assert candidate["snapshotSha256"] == report["snapshotSha256"]
    assert candidate["workspaceMemberDispositions"] == []
    assert validate_reviewed_manifest(candidate, report)

    reviewed = deepcopy(candidate)
    reviewed["reviewed"] = True
    reviewed["reviewReference"] = "LOCAL-REVIEW-1"
    assert validate_reviewed_manifest(reviewed, report) == []


def test_reviewed_manifest_rejects_every_legacy_workspace_assignment() -> None:
    report = build_report(_snapshot())
    reviewed = build_candidate_manifest(report)
    reviewed.update(reviewed=True, reviewReference="LOCAL-REVIEW-1")
    reviewed["workspaceMemberDispositions"] = [
        {
            "workspaceMemberUuid": str(_uuid(30)),
            "action": "grant",
            "targetRole": "rp_admin",
        }
    ]

    assert "workspaceMemberDispositions must be empty; legacy workspace membership backfill is prohibited" in validate_reviewed_manifest(
        reviewed, report
    )


def test_reviewed_manifest_rejects_every_legacy_cl_admin_assignment() -> None:
    report = build_report(_snapshot())
    reviewed = build_candidate_manifest(report)
    reviewed.update(reviewed=True, reviewReference="LOCAL-REVIEW-1")
    reviewed["clAdminAssignments"] = [
        {"userUuid": str(_uuid(10))},
    ]

    assert "clAdminAssignments must be empty; legacy CL Admin backfill is prohibited" in validate_reviewed_manifest(
        reviewed,
        report,
    )


def test_reviewed_manifest_is_bound_to_the_current_report() -> None:
    report = build_report(_snapshot())
    reviewed = build_candidate_manifest(report)
    reviewed.update(reviewed=True, reviewReference="LOCAL-REVIEW-1")

    changed_report = deepcopy(report)
    changed_report["tableCountsBefore"]["users"] += 1
    assert "reportSha256 does not match the current dry-run report" in validate_reviewed_manifest(reviewed, changed_report)

    changed_snapshot = _snapshot()
    changed_snapshot["users"][0]["enabled"] = False
    changed_snapshot_report = build_report(changed_snapshot)
    assert "snapshotSha256 does not match the current reconciliation snapshot" in validate_reviewed_manifest(reviewed, changed_snapshot_report)


def test_post_migration_report_preserves_preflight_and_records_actual_after_counts() -> None:
    baseline = build_report(_snapshot())
    current_snapshot = _snapshot()
    current_snapshot["workspaceMembers"] = []
    current = build_report(current_snapshot)

    comparison = build_post_migration_report(baseline, current)

    assert comparison["mode"] == "post-migration"
    assert comparison["tableCountsBefore"] == baseline["tableCountsBefore"]
    assert comparison["candidateCountsBefore"] == baseline["candidateCountsBefore"]
    assert comparison["tableCountsAfter"] == current["tableCountsBefore"]
    assert comparison["candidateCountsAfter"] == current["candidateCountsBefore"]
    assert comparison["baselineReportSha256"] == report_sha256(baseline)
