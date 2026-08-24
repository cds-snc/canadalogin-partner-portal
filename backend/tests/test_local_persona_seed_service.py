from __future__ import annotations

import json
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from src.app.core.local_persona_fixtures import LOCAL_ALPHA_WORKSPACE
from src.app.models.department import Department
from src.app.services.local_persona_seed_service import (
    EXPECTED_LOCAL_PERSONA_COUNTS,
    LocalPersonaCleanupConfirmationError,
    LocalPersonaFixtureStateError,
    LocalPersonaRecordCounts,
    LocalPersonaSeedGate,
    LocalPersonaSeedGateError,
    LocalPersonaSeedReport,
    LocalPersonaSeedService,
    _LoadedFixtureState,
)
from src.scripts import seed_local_personas

ENABLED_ENVIRONMENT = {
    "ENVIRONMENT": "local",
    "AUTH_MODE": "local_dev",
    "ENABLE_DEV_ROLE_SELECTOR": "true",
}


class GuardDatabase:
    def __init__(self) -> None:
        self.begin_called = False

    def begin(self):
        self.begin_called = True
        raise AssertionError("database transaction must not start")


class TransactionDatabase:
    def __init__(self) -> None:
        self.begin_count = 0

    @asynccontextmanager
    async def begin(self):
        self.begin_count += 1
        yield


@pytest.mark.parametrize(
    ("environment", "auth_mode", "selector"),
    [
        (None, "local_dev", "true"),
        ("local", None, "true"),
        ("local", "local_dev", None),
        ("LOCAL", "local_dev", "true"),
        ("local ", "local_dev", "true"),
        ("local", "LOCAL_DEV", "true"),
        ("local", "local_dev ", "true"),
        ("local", "local_dev", "TRUE"),
        ("local", "local_dev", "1"),
        ("production", "local_dev", "true"),
    ],
)
def test_seed_gate_requires_exact_raw_triple(
    environment: str | None,
    auth_mode: str | None,
    selector: str | None,
) -> None:
    with pytest.raises(LocalPersonaSeedGateError):
        LocalPersonaSeedGate(environment, auth_mode, selector).require_enabled()


def test_seed_gate_accepts_only_recorded_local_composition() -> None:
    gate = LocalPersonaSeedGate.from_environment(ENABLED_ENVIRONMENT)

    gate.require_enabled()
    assert gate == LocalPersonaSeedGate("local", "local_dev", "true")


@pytest.mark.asyncio
async def test_nonlocal_seed_fails_before_database_interaction() -> None:
    database = GuardDatabase()

    with pytest.raises(LocalPersonaSeedGateError):
        await LocalPersonaSeedService().seed(  # type: ignore[arg-type]
            database,
            gate=LocalPersonaSeedGate("production", "local_dev", "true"),
            terms_version="v1",
        )

    assert database.begin_called is False


@pytest.mark.asyncio
async def test_cleanup_requires_confirmation_before_database_interaction() -> None:
    database = GuardDatabase()

    with pytest.raises(LocalPersonaCleanupConfirmationError):
        await LocalPersonaSeedService().cleanup(  # type: ignore[arg-type]
            database,
            gate=LocalPersonaSeedGate("local", "local_dev", "true"),
            confirmed=False,
            terms_version="v1",
        )

    assert database.begin_called is False


@pytest.mark.asyncio
async def test_partial_state_is_rejected_without_seed_mutation(
    mocker,
) -> None:
    database = TransactionDatabase()
    partial_state = _LoadedFixtureState(
        cl_admin_role=None,
        departments=[
            Department(
                name=LOCAL_ALPHA_WORKSPACE.department.name,
                gc_org_id=None,
                uuid=LOCAL_ALPHA_WORKSPACE.department.uuid,
            )
        ],
        users=[],
        workspaces=[],
        applications=[],
        rp_applications=[],
        user_roles=[],
        partner_grants=[],
        workspace_members=[],
    )
    service = LocalPersonaSeedService()
    mocker.patch.object(service, "_lock_namespace", new=AsyncMock())
    mocker.patch.object(
        service,
        "_load_state",
        new=AsyncMock(return_value=partial_state),
    )
    create_fixtures = mocker.patch.object(
        service,
        "_create_fixtures",
        new=AsyncMock(),
    )

    with pytest.raises(LocalPersonaFixtureStateError, match="departments are incomplete"):
        await service.seed(  # type: ignore[arg-type]
            database,
            gate=LocalPersonaSeedGate("local", "local_dev", "true"),
            terms_version="v1",
        )

    assert database.begin_count == 1
    create_fixtures.assert_not_awaited()


def test_reports_have_stable_names_counts_and_namespace() -> None:
    assert EXPECTED_LOCAL_PERSONA_COUNTS == LocalPersonaRecordCounts(
        departments=2,
        users=5,
        workspaces=2,
        applications=2,
        rp_applications=2,
        user_roles=1,
        partner_grants=3,
    )
    assert EXPECTED_LOCAL_PERSONA_COUNTS.total == 17
    assert LocalPersonaSeedReport(
        action="seed",
        outcome="unchanged",
        counts=EXPECTED_LOCAL_PERSONA_COUNTS,
    ).to_dict() == {
        "action": "seed",
        "outcome": "unchanged",
        "namespace": "204fb450-dd86-55b5-9bc2-eb06b16e182c",
        "counts": {
            "departments": 2,
            "users": 5,
            "workspaces": 2,
            "applications": 2,
            "rpApplications": 2,
            "userRoles": 1,
            "partnerGrants": 3,
        },
    }


def test_mutable_user_profile_drift_does_not_invalidate_persona_catalog() -> None:
    user = SimpleNamespace(
        auth_subject="local-read-only",
        department_id=7,
        enabled=True,
        updated_at=datetime.now(UTC),
    )
    expected = {
        "auth_subject": "local-read-only",
        "department_id": 391,
        "enabled": True,
        "updated_at": None,
    }

    LocalPersonaSeedService._require_fields(
        user,
        expected,
        "user",
        allowed_drift=frozenset({"department_id", "updated_at"}),
    )

    user.enabled = False
    with pytest.raises(LocalPersonaFixtureStateError, match="user differs from the deterministic catalog: enabled"):
        LocalPersonaSeedService._require_fields(
            user,
            expected,
            "user",
            allowed_drift=frozenset({"department_id", "updated_at"}),
        )


def test_cli_nonlocal_failure_is_nonzero_and_never_opens_session(mocker) -> None:
    execute = mocker.patch.object(
        seed_local_personas,
        "_execute",
        new=AsyncMock(),
    )

    result = seed_local_personas.main([], environ={})

    assert result == 1
    execute.assert_not_awaited()


def test_cli_partial_state_failure_is_nonzero_and_safe(mocker) -> None:
    execute = mocker.patch.object(
        seed_local_personas,
        "_execute",
        new=AsyncMock(side_effect=LocalPersonaFixtureStateError("local persona state is partial or contains unexpected records")),
    )

    result = seed_local_personas.main([], environ=ENABLED_ENVIRONMENT)

    assert result == 1
    execute.assert_awaited_once()


def test_cli_success_emits_stable_json(mocker, capsys) -> None:
    report = LocalPersonaSeedReport(
        action="seed",
        outcome="created",
        counts=EXPECTED_LOCAL_PERSONA_COUNTS,
    )
    mocker.patch.object(
        seed_local_personas,
        "_execute",
        new=AsyncMock(return_value=report),
    )

    result = seed_local_personas.main([], environ=ENABLED_ENVIRONMENT)

    assert result == 0
    assert json.loads(capsys.readouterr().out) == report.to_dict()


def test_cleanup_cli_requires_both_switches() -> None:
    with pytest.raises(SystemExit) as exc_info:
        seed_local_personas.main(
            ["--confirm-cleanup"],
            environ=ENABLED_ENVIRONMENT,
        )

    assert exc_info.value.code == 2


def test_seed_is_not_wired_into_startup_configuration_or_migrations() -> None:
    backend_root = Path(__file__).parents[1]
    prohibited_paths = (
        backend_root / "src/app/core/config.py",
        backend_root / "src/app/core/setup.py",
        *sorted((backend_root / "src/migrations").rglob("*.py")),
    )

    for path in prohibited_paths:
        source = path.read_text(encoding="utf-8")
        assert "local_persona_seed_service" not in source, path
        assert "seed_local_personas" not in source, path
