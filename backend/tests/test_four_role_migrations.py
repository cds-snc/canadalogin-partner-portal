import importlib.util
import json
from pathlib import Path

import pytest

MIGRATION_ROOT = Path(__file__).parents[1] / "src" / "migrations" / "versions"


def _load_migration(filename: str):
    path = MIGRATION_ROOT / filename
    spec = importlib.util.spec_from_file_location(filename.removesuffix(".py"), path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_four_role_revision_chain_is_linear_and_fits_version_storage() -> None:
    expand = _load_migration("0019_four_role_expand.py")
    backfill = _load_migration("0020_four_role_backfill.py")
    constraints = _load_migration("0021_four_role_constraints.py")
    revocation_actor = _load_migration("0022_invitation_revocation_actor.py")
    im_provenance = _load_migration("0023_authorization_im.py")

    assert expand.down_revision == "0018_application_information_review_records"
    assert backfill.down_revision == expand.revision
    assert constraints.down_revision == backfill.revision
    assert revocation_actor.down_revision == constraints.revision
    assert im_provenance.down_revision == revocation_actor.revision
    assert all(
        len(module.revision) <= 32
        for module in (
            expand,
            backfill,
            constraints,
            revocation_actor,
            im_provenance,
        )
    )


def test_invitation_revocation_actor_migration_is_additive_and_non_inferential() -> None:
    source = (MIGRATION_ROOT / "0022_invitation_revocation_actor.py").read_text(encoding="utf-8")

    assert 'sa.Column("revoked_by_user_id", sa.Integer(), nullable=True)' in source
    assert '"fk_rp_invitation_revoked_by_user"' in source
    assert 'ondelete="RESTRICT"' in source
    assert "UPDATE rp_application_developer_invitation" not in source


def test_im_provenance_migration_classifies_unknown_history_and_indexes_discovery() -> None:
    source = (MIGRATION_ROOT / "0023_authorization_im.py").read_text(encoding="utf-8")

    assert 'sa.Column("revocation_actor_source", sa.String(length=32)' in source
    assert "'legacy_unknown'" in source
    assert "ck_rp_invitation_revocation_actor" in source
    assert "ix_audit_log_created_at" in source
    assert "ix_audit_log_target_uuid_created_at" in source
    assert "ix_audit_log_target_operation_created_at" in source


def test_backfill_manifest_rejects_inferred_or_unreviewed_access() -> None:
    backfill = _load_migration("0020_four_role_backfill.py")
    payload = {
        "schemaVersion": 2,
        "changeId": "define-four-role-authorization-model",
        "reviewed": True,
        "reviewReference": "LOCAL-REVIEW-1",
        "reportSha256": "a" * 64,
        "snapshotSha256": "b" * 64,
        "clAdminAssignments": [],
        "workspaceMemberDispositions": [],
    }
    assert backfill._validate_manifest(payload) == payload

    payload["reviewed"] = False
    with pytest.raises(RuntimeError, match="reviewed=true"):
        backfill._validate_manifest(payload)


def test_backfill_manifest_rejects_every_legacy_workspace_assignment() -> None:
    backfill = _load_migration("0020_four_role_backfill.py")
    payload = {
        "schemaVersion": 2,
        "changeId": "define-four-role-authorization-model",
        "reviewed": True,
        "reviewReference": "LOCAL-REVIEW-1",
        "reportSha256": "a" * 64,
        "snapshotSha256": "b" * 64,
        "clAdminAssignments": [],
        "workspaceMemberDispositions": [
            {
                "workspaceMemberUuid": "00000000-0000-0000-0000-000000000001",
                "action": "grant",
                "targetRole": "rp_admin",
            }
        ],
    }

    with pytest.raises(RuntimeError, match="legacy workspace membership backfill is prohibited"):
        backfill._validate_manifest(payload)


def test_backfill_manifest_rejects_every_legacy_cl_admin_assignment() -> None:
    backfill = _load_migration("0020_four_role_backfill.py")
    payload = {
        "schemaVersion": 2,
        "changeId": "define-four-role-authorization-model",
        "reviewed": True,
        "reviewReference": "LOCAL-REVIEW-1",
        "reportSha256": "a" * 64,
        "snapshotSha256": "b" * 64,
        "clAdminAssignments": [{"userUuid": "00000000-0000-0000-0000-000000000001"}],
        "workspaceMemberDispositions": [],
    }

    with pytest.raises(RuntimeError, match="legacy CL Admin backfill is prohibited"):
        backfill._validate_manifest(payload)


def test_database_upgrade_does_not_require_an_empty_manifest(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    backfill = _load_migration("0020_four_role_backfill.py")
    monkeypatch.delenv(backfill.MANIFEST_ENVIRONMENT_VARIABLE, raising=False)

    manifest = backfill._load_reviewed_manifest(object(), "b" * 64)

    assert manifest["reviewReference"] == "zero-legacy-access-backfill"
    assert manifest["snapshotSha256"] == "b" * 64
    assert manifest["clAdminAssignments"] == []
    assert manifest["workspaceMemberDispositions"] == []


def test_implicit_zero_backfill_does_not_query_legacy_candidates(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    backfill = _load_migration("0020_four_role_backfill.py")
    monkeypatch.delenv(backfill.MANIFEST_ENVIRONMENT_VARIABLE, raising=False)

    class NoLegacyCandidateQuery:
        def execute(self, *_args, **_kwargs):
            raise AssertionError("the zero-backfill policy must not query for grant candidates")

    manifest = backfill._load_reviewed_manifest(NoLegacyCandidateQuery(), "b" * 64)

    assert manifest["workspaceMemberDispositions"] == []
    assert manifest["clAdminAssignments"] == []


def test_backfill_source_has_no_legacy_workspace_grant_path() -> None:
    source = (MIGRATION_ROOT / "0020_four_role_backfill.py").read_text(encoding="utf-8")

    assert "_apply_workspace_member_dispositions" not in source
    assert "workspace-member:" not in source


@pytest.mark.parametrize(
    ("query_results", "expected_error"),
    (
        ([1], "disabled or deleted user"),
        ([0, 1], "deleted workspace"),
    ),
)
def test_backfill_rejects_active_grants_with_inactive_parents(
    query_results: list[int],
    expected_error: str,
) -> None:
    backfill = _load_migration("0020_four_role_backfill.py")

    class ScalarBind:
        def __init__(self, results: list[int]) -> None:
            self.results = iter(results)

        def execute(self, _statement):
            value = next(self.results)

            class Result:
                def scalar_one(self) -> int:
                    return value

            return Result()

    with pytest.raises(RuntimeError, match=expected_error):
        backfill._reject_active_grant_parent_lifecycle_conflicts(ScalarBind(query_results))


def test_backfill_accepts_active_grants_with_active_parents() -> None:
    backfill = _load_migration("0020_four_role_backfill.py")

    class ScalarBind:
        results = iter((0, 0))

        def execute(self, _statement):
            value = next(self.results)

            class Result:
                def scalar_one(self) -> int:
                    return value

            return Result()

    backfill._reject_active_grant_parent_lifecycle_conflicts(ScalarBind())


def test_reviewed_manifest_must_match_locked_snapshot(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    backfill = _load_migration("0020_four_role_backfill.py")
    manifest_path = tmp_path / "reviewed.json"
    manifest_path.write_text(
        """{
          "schemaVersion": 2,
          "changeId": "define-four-role-authorization-model",
          "reviewed": true,
          "reviewReference": "LOCAL-REVIEW-1",
          "reportSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "snapshotSha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          "clAdminAssignments": [],
          "workspaceMemberDispositions": []
        }""",
        encoding="utf-8",
    )
    monkeypatch.setenv(backfill.MANIFEST_ENVIRONMENT_VARIABLE, str(manifest_path))

    with pytest.raises(RuntimeError, match="locked current reconciliation snapshot"):
        backfill._load_reviewed_manifest(object(), "c" * 64)


def test_migration_decision_audit_records_zero_legacy_cl_admin_assignments() -> None:
    backfill = _load_migration("0020_four_role_backfill.py")

    class RecordingBind:
        description = ""

        def execute(self, statement, parameters=None):
            if "INSERT INTO audit_log" in str(statement):
                self.description = parameters["description"]

            class Result:
                def __init__(self, owner):
                    self.owner = owner

                def scalar_one(self):
                    return self.owner.description

            return Result(self)

    manifest = {
        "schemaVersion": 2,
        "changeId": "define-four-role-authorization-model",
        "reviewed": True,
        "reviewReference": "LOCAL-REVIEW-1",
        "reportSha256": "a" * 64,
        "snapshotSha256": "b" * 64,
        "clAdminAssignments": [],
        "workspaceMemberDispositions": [],
    }
    bind = RecordingBind()

    backfill._persist_migration_decision(bind, manifest)

    persisted = json.loads(bind.description)
    assert persisted["decisionCounts"] == {
        "clAdminAssignments": 0,
        "workspaceGrants": 0,
        "workspaceQuarantines": 0,
    }
    assert persisted["reportSha256"] == "a" * 64
    assert persisted["snapshotSha256"] == "b" * 64
    assert "00000000-0000-0000-0000-000000000001" not in bind.description


def test_migrations_keep_legacy_authority_columns_and_both_provenance_links() -> None:
    expand_source = (MIGRATION_ROOT / "0019_four_role_expand.py").read_text(encoding="utf-8")
    constraints_source = (MIGRATION_ROOT / "0021_four_role_constraints.py").read_text(encoding="utf-8")

    assert 'drop_column("user", "role_ids")' not in expand_source
    assert 'drop_column("user", "is_superuser")' not in expand_source
    assert 'drop_column("rp_application_developer_invitation", "delegated_by_grant_uuid")' not in expand_source
    assert "fk_rp_access_grant_source_invitation" in expand_source
    assert "uq_rp_access_grant_source_invitation" in constraints_source
    assert "uq_rp_developer_invitation_pending_email_workspace" in constraints_source
    assert "ck_rp_access_grant_role_compatible" in constraints_source
    assert "ck_rp_access_grant_role" in constraints_source
    assert "ck_rp_invitation_role" in constraints_source
    assert "role IN ('rp_admin', 'rp_user_edit', 'read_only')" in constraints_source
    assert "role.code`` intentionally remains nullable" in constraints_source


def test_expand_reconstructs_legacy_revoked_grant_timestamp_without_actor() -> None:
    expand_source = (MIGRATION_ROOT / "0019_four_role_expand.py").read_text(encoding="utf-8")

    assert "SET revoked_at = COALESCE(updated_at, created_at)" in expand_source
    assert "WHERE status = 'revoked'" in expand_source
    assert "SET revoked_by_user_id" not in expand_source
