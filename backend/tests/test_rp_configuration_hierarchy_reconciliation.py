import uuid as uuid_pkg
from datetime import UTC, datetime

from src.migrations.rp_configuration_hierarchy_reconciliation_v1 import (
    build_candidate_manifest,
    build_report,
    has_blocking_findings,
    validate_reviewed_manifest,
)


def _snapshot() -> dict[str, list[dict[str, object]]]:
    workspace_uuid = uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000201")
    application_uuid = uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000501")
    rp_uuid = uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000701")
    return {
        "workspaces": [
            {
                "id": 9,
                "uuid": workspace_uuid,
                "department_id": 7,
                "is_deleted": False,
                "deleted_at": None,
            }
        ],
        "applications": [
            {
                "id": 17,
                "uuid": application_uuid,
                "workspace_id": 9,
                "is_deleted": False,
                "deleted_at": None,
            }
        ],
        "rpConfigurations": [
            {
                "id": 23,
                "uuid": rp_uuid,
                "workspace_id": 9,
                "department_id": 7,
                "application_information_id": None,
                "configuration_name": "Benefits Portal [018f6f83]",
                "canada_login_environment": None,
                "is_deleted": False,
                "deleted_at": None,
            }
        ],
    }


def test_report_inventory_is_minimized_stable_and_actionable() -> None:
    report = build_report(_snapshot())

    assert report["findingCounts"]["workspaceLinkedOrphans"] == 1
    assert report["findingCounts"]["missingCanadaLoginEnvironments"] == 1
    assert report["findingCounts"]["ancestryConflicts"] == 0
    assert has_blocking_findings(report) is True
    rendered = str(report)
    assert "Benefits Portal" not in rendered
    assert "configuration_name" not in rendered
    assert "provider" not in rendered.lower()


def test_candidate_manifest_requires_explicit_parent_and_environment_decisions() -> None:
    report = build_report(_snapshot())
    manifest = build_candidate_manifest(report)
    assert manifest["reviewed"] is False
    assert manifest["mappings"] == [
        {
            "rpConfigurationUuid": "018f6f83-0000-0000-0000-000000000701",
            "workspaceUuid": "018f6f83-0000-0000-0000-000000000201",
            "applicationUuid": None,
            "canadaLoginEnvironment": None,
        }
    ]

    manifest.update(reviewed=True, reviewReference="local-fixture-map-1")
    manifest["mappings"][0].update(
        applicationUuid="018f6f83-0000-0000-0000-000000000501",
        canadaLoginEnvironment="staging",
    )
    assert validate_reviewed_manifest(manifest, report) == []


def test_manifest_rejects_replacing_an_existing_parent() -> None:
    snapshot = _snapshot()
    snapshot["rpConfigurations"][0]["application_information_id"] = 17
    report = build_report(snapshot)
    manifest = build_candidate_manifest(report)
    manifest.update(reviewed=True, reviewReference="local-fixture-map-1")
    manifest["mappings"][0]["applicationUuid"] = "018f6f83-0000-0000-0000-000000000501"
    manifest["mappings"][0]["canadaLoginEnvironment"] = "test"

    errors = validate_reviewed_manifest(manifest, report)

    assert "mapping must not replace an existing Application parent" in errors


def test_report_detects_cross_workspace_and_inactive_parent_links() -> None:
    snapshot = _snapshot()
    snapshot["workspaces"].append(
        {
            "id": 10,
            "uuid": uuid_pkg.UUID("018f6f83-0000-0000-0000-000000000202"),
            "department_id": 8,
            "is_deleted": False,
            "deleted_at": None,
        }
    )
    snapshot["applications"][0]["workspace_id"] = 10
    snapshot["applications"][0]["is_deleted"] = True
    snapshot["applications"][0]["deleted_at"] = datetime.now(UTC)
    snapshot["rpConfigurations"][0]["application_information_id"] = 17
    snapshot["rpConfigurations"][0]["canada_login_environment"] = "test"

    report = build_report(snapshot)

    assert report["findingCounts"]["ancestryConflicts"] == 1
    assert report["findingCounts"]["inactiveApplicationParents"] == 1


def test_report_detects_same_workspace_public_uuid_collision() -> None:
    snapshot = _snapshot()
    snapshot["rpConfigurations"][0]["uuid"] = snapshot["applications"][0]["uuid"]

    report = build_report(snapshot)

    assert report["findingCounts"]["publicUuidCollisions"] == 1
    assert report["findings"]["publicUuidCollisions"] == [
        {
            "applicationUuid": "018f6f83-0000-0000-0000-000000000501",
            "rpConfigurationUuid": "018f6f83-0000-0000-0000-000000000501",
            "workspaceUuid": "018f6f83-0000-0000-0000-000000000201",
        }
    ]
    assert has_blocking_findings(report) is True
