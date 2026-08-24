from collections.abc import Iterator
from typing import Any
from unittest.mock import AsyncMock, Mock
from uuid import UUID

import pytest
from fastapi.dependencies.models import Dependant
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

import src.app.repositories.dependencies as ibm_dependencies_module
import src.app.services.rp_application_service as rp_application_module
from src.app.api.dependencies import get_current_user
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import NotFoundException
from src.app.main import app
from src.app.repositories.dependencies import (
    get_ibm_sv_admin_client,
    get_ibm_sv_admin_client_factory,
)
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)

RP_APPLICATION_UUID = UUID("018f6f83-0000-0000-0000-000000000333")
WORKSPACE_ALPHA_UUID = UUID("018f6f83-0000-0000-0000-000000000023")
WORKSPACE_BETA_UUID = UUID("018f6f83-0000-0000-0000-000000000024")

PROVIDER_BACKED_ACCESSIBLE_ROUTES = (
    ("GET", "/api/v1/rp-applications/accessible/{rp_application_uuid}/oauth-setup", None),
    ("GET", "/api/v1/rp-applications/accessible/{rp_application_uuid}/client", None),
    (
        "GET",
        "/api/v1/rp-applications/accessible/{rp_application_uuid}/client/rotated-secrets",
        None,
    ),
    (
        "POST",
        "/api/v1/rp-applications/accessible/{rp_application_uuid}/client/rotate-secret",
        {
            "deleteRotatedSecrets": False,
            "description": "",
            "rotatedSecretExpiredAt": 0,
        },
    ),
    (
        "POST",
        "/api/v1/rp-applications/accessible/{rp_application_uuid}/client/rotated-secrets",
        {
            "description": "30 days",
            "rotatedSecretExpiredAt": 1782345600,
        },
    ),
    (
        "DELETE",
        "/api/v1/rp-applications/accessible/{rp_application_uuid}/client/rotated-secrets",
        {"secretId": "/rotatedSecrets/0"},
    ),
)

PORTAL_LOCAL_REGISTRATION_ROUTES = (
    ("POST", "/api/v1/workspaces/{workspace_uuid}/applications"),
    (
        "GET",
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/registration-draft",
    ),
    (
        "GET",
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/configuration",
    ),
    (
        "PATCH",
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/registration-draft",
    ),
    (
        "POST",
        "/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/onboarding-state",
    ),
)


def _dependency_calls(dependant: Dependant) -> Iterator[Any]:
    for dependency in dependant.dependencies:
        yield dependency.call
        yield from _dependency_calls(dependency)


def _route(method: str, path: str) -> APIRoute:
    route = next(
        (route for route in app.routes if isinstance(route, APIRoute) and route.path == path and method in route.methods),
        None,
    )
    assert route is not None
    return route


def _partner_user(*, workspace_id: int, workspace_uuid: UUID) -> dict[str, Any]:
    return {
        "id": 77,
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=workspace_id,
                    workspace_uuid=workspace_uuid,
                    role=CanonicalRoleCode.RP_ADMIN,
                ),
            )
        ),
    }


def _cl_admin_user() -> dict[str, Any]:
    return {
        "id": 78,
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
            global_role=CanonicalRoleCode.CL_ADMIN,
        ),
    }


def _no_access_user() -> dict[str, Any]:
    return {
        "id": 79,
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(),
    }


def _local_application(*, department_id: int | None = 7) -> dict[str, Any]:
    return {
        "id": 30,
        "uuid": RP_APPLICATION_UUID,
        "workspace_id": 23,
        "department_id": department_id,
        "dnr_app_name": "Benefits Portal",
        "ibm_sv_application_id": "verify-app-333",
    }


@pytest.mark.parametrize(
    ("method", "path", "_payload"),
    PROVIDER_BACKED_ACCESSIBLE_ROUTES,
)
def test_provider_backed_accessible_routes_inject_a_lazy_client_factory(
    method: str,
    path: str,
    _payload: dict[str, Any] | None,
) -> None:
    dependency_calls = set(_dependency_calls(_route(method, path).dependant))

    assert get_ibm_sv_admin_client_factory in dependency_calls
    assert get_ibm_sv_admin_client not in dependency_calls


@pytest.mark.parametrize(
    ("method", "path", "_payload"),
    PROVIDER_BACKED_ACCESSIBLE_ROUTES,
)
def test_provider_backed_accessible_routes_document_unavailable_provider(
    method: str,
    path: str,
    _payload: dict[str, Any] | None,
) -> None:
    openapi_operation = app.openapi()["paths"][path][method.lower()]

    assert "503" in openapi_operation["responses"]


@pytest.mark.parametrize(("method", "path"), PORTAL_LOCAL_REGISTRATION_ROUTES)
def test_registration_routes_do_not_resolve_an_ibm_provider(
    method: str,
    path: str,
) -> None:
    dependency_calls = set(_dependency_calls(_route(method, path).dependant))

    assert get_ibm_sv_admin_client_factory not in dependency_calls
    assert get_ibm_sv_admin_client not in dependency_calls


@pytest.mark.parametrize(
    "current_user",
    [
        _partner_user(workspace_id=24, workspace_uuid=WORKSPACE_BETA_UUID),
        _cl_admin_user(),
        _no_access_user(),
    ],
    ids=["out-of-scope-partner", "cl-admin", "no-access"],
)
@pytest.mark.parametrize(
    ("method", "path", "payload"),
    PROVIDER_BACKED_ACCESSIBLE_ROUTES,
)
def test_excluded_actor_never_resolves_ibm_client_for_accessible_child_route(
    current_user: dict[str, Any],
    method: str,
    path: str,
    payload: dict[str, Any] | None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider_factory = AsyncMock(
        side_effect=AssertionError("IBM client must not be resolved before authorization"),
    )
    local_application_get = AsyncMock(return_value=_local_application())
    monkeypatch.setattr(
        ibm_dependencies_module,
        "get_ibm_sv_admin_client",
        provider_factory,
    )
    monkeypatch.setattr(
        rp_application_module.crud_rp_applications,
        "get",
        local_application_get,
    )

    app.dependency_overrides[get_current_user] = lambda: current_user
    app.dependency_overrides[async_get_db] = lambda: Mock()

    try:
        with TestClient(app) as client:
            response = client.request(
                method,
                path.format(rp_application_uuid=RP_APPLICATION_UUID),
                json=payload,
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
    local_application_get.assert_awaited_once()
    provider_factory.assert_not_awaited()


def test_oauth_missing_workspace_department_returns_local_not_found_before_client_resolution(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider_factory = AsyncMock(
        side_effect=AssertionError("IBM client must not be resolved before local preconditions"),
    )
    local_application_get = AsyncMock(
        return_value=_local_application(department_id=None),
    )
    monkeypatch.setattr(
        ibm_dependencies_module,
        "get_ibm_sv_admin_client",
        provider_factory,
    )
    monkeypatch.setattr(
        rp_application_module.crud_rp_applications,
        "get",
        local_application_get,
    )
    effective_department = AsyncMock(
        side_effect=NotFoundException("Workspace department is unavailable"),
    )
    monkeypatch.setattr(
        rp_application_module.RPApplicationService,
        "_get_effective_workspace_department",
        effective_department,
    )

    app.dependency_overrides[get_current_user] = lambda: _partner_user(
        workspace_id=23,
        workspace_uuid=WORKSPACE_ALPHA_UUID,
    )
    app.dependency_overrides[async_get_db] = lambda: Mock()

    try:
        with TestClient(app) as client:
            response = client.get(
                f"/api/v1/rp-applications/accessible/{RP_APPLICATION_UUID}/oauth-setup",
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
    local_application_get.assert_awaited_once()
    effective_department.assert_awaited_once()
    provider_factory.assert_not_awaited()


def test_workspace_mismatch_returns_not_found_before_credential_provider_resolution(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    provider_factory = AsyncMock(
        side_effect=AssertionError("IBM client must not be resolved for a mismatched workspace"),
    )
    local_application_get = AsyncMock(return_value=_local_application())
    monkeypatch.setattr(
        ibm_dependencies_module,
        "get_ibm_sv_admin_client",
        provider_factory,
    )
    monkeypatch.setattr(
        rp_application_module.crud_rp_applications,
        "get",
        local_application_get,
    )

    app.dependency_overrides[get_current_user] = lambda: _partner_user(
        workspace_id=23,
        workspace_uuid=WORKSPACE_ALPHA_UUID,
    )
    app.dependency_overrides[async_get_db] = lambda: Mock()

    try:
        with TestClient(app) as client:
            response = client.get(
                f"/api/v1/rp-applications/accessible/{RP_APPLICATION_UUID}/client",
                params={"workspaceUuid": str(WORKSPACE_BETA_UUID)},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
    local_application_get.assert_awaited_once()
    provider_factory.assert_not_awaited()
