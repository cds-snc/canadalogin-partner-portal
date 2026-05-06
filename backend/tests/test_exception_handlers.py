from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Annotated, Any
from unittest.mock import Mock, patch

import casbin
from fastapi import APIRouter, Depends
from fastapi.testclient import TestClient
from pydantic import BaseModel
from starsessions import InMemoryStore

from src.app.api.dependencies import get_current_superuser, get_current_user
from src.app.core.access_control import CASBIN_MODEL_PATH, casbin_guard, database_enforcer_provider
from src.app.core.config import settings
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import BadRequestException
from src.app.core.exceptions.ibm_sv_exceptions import IBMVerifyBadRequest
from src.app.core.setup import create_application


class ValidationPayload(BaseModel):
    name: str


def make_enforcer(*policies: tuple[str, str, str]) -> casbin.Enforcer:
    enforcer = casbin.Enforcer(str(CASBIN_MODEL_PATH))
    if policies:
        enforcer.add_policies(list(policies))
    return enforcer


def build_test_client(
    router: APIRouter,
    *,
    dependency_overrides: dict[Any, Any] | None = None,
    raise_server_exceptions: bool = True,
) -> TestClient:
    @asynccontextmanager
    async def noop_lifespan(_: object) -> AsyncIterator[None]:
        yield

    with patch("src.app.core.setup.get_redis_session_store", return_value=InMemoryStore()):
        app = create_application(router, settings=settings, create_tables_on_start=False, lifespan=noop_lifespan)

    app.dependency_overrides[async_get_db] = lambda: Mock()
    if dependency_overrides is not None:
        app.dependency_overrides.update(dependency_overrides)

    return TestClient(app, raise_server_exceptions=raise_server_exceptions)


def build_router() -> APIRouter:
    router = APIRouter()

    @router.post("/validation")
    async def validation_route(payload: ValidationPayload) -> dict[str, bool]:
        return {"ok": True}

    @router.get("/auth")
    async def auth_route(current_user: Annotated[dict[str, Any], Depends(get_current_user)]) -> dict[str, Any]:
        return current_user

    @router.get("/superuser")
    async def superuser_route(current_user: Annotated[dict[str, Any], Depends(get_current_superuser)]) -> dict[str, Any]:
        return current_user

    @router.get("/casbin")
    @casbin_guard.require_permission("policies", "read")
    async def casbin_route() -> dict[str, bool]:
        return {"ok": True}

    @router.get("/ibm")
    async def ibm_route() -> None:
        raise IBMVerifyBadRequest(
            message="template validation failed",
            response_body={"message": "template validation failed", "trace": "ibm-trace-123"},
        )

    @router.get("/boom")
    async def boom_route() -> None:
        raise RuntimeError("unexpected crash")

    @router.get("/value-error")
    async def value_error_route() -> None:
        raise BadRequestException("department_uuid is required")

    return router


def assert_unified_error_response(
    payload: dict[str, Any], *, expected_code: str, expected_message: str, expected_request_id: str
) -> dict[str, Any]:
    assert payload["error"]["code"] == expected_code
    assert payload["error"]["message"] == expected_message
    assert payload["error"]["requestId"] == expected_request_id
    return payload["error"]


def test_validation_errors_return_unified_error_envelope() -> None:
    client = build_test_client(build_router())

    with client:
        response = client.post("/validation", json={}, headers={"X-Request-ID": "validation-test"})

    assert response.status_code == 422
    error = assert_unified_error_response(
        response.json(),
        expected_code="validation_error",
        expected_message="body.name: Field required",
        expected_request_id="validation-test",
    )
    assert error["details"][0]["loc"] == ["body", "name"]


def test_auth_dependency_errors_return_unified_error_envelope() -> None:
    client = build_test_client(build_router())

    with client:
        response = client.get("/auth", headers={"X-Request-ID": "auth-test"})

    assert response.status_code == 401
    assert_unified_error_response(
        response.json(),
        expected_code="unauthorized",
        expected_message="User not authenticated.",
        expected_request_id="auth-test",
    )


def test_superuser_permission_errors_return_unified_error_envelope() -> None:
    client = build_test_client(
        build_router(),
        dependency_overrides={
            get_current_user: lambda: {"is_superuser": False, "username": "member"},
        },
    )

    with client:
        response = client.get("/superuser", headers={"X-Request-ID": "superuser-test"})

    assert response.status_code == 403
    assert_unified_error_response(
        response.json(),
        expected_code="forbidden",
        expected_message="You do not have enough privileges.",
        expected_request_id="superuser-test",
    )


def test_casbin_permission_errors_return_unified_error_envelope() -> None:
    client = build_test_client(
        build_router(),
        dependency_overrides={
            get_current_user: lambda: {"is_superuser": False, "username": "member"},
            database_enforcer_provider: lambda: make_enforcer(),
        },
    )

    with client:
        response = client.get("/casbin", headers={"X-Request-ID": "casbin-test"})

    assert response.status_code == 403
    assert_unified_error_response(
        response.json(),
        expected_code="forbidden",
        expected_message="You do not have enough privileges.",
        expected_request_id="casbin-test",
    )


def test_ibm_verify_bad_request_keeps_upstream_message_in_unified_error_envelope() -> None:
    client = build_test_client(build_router())

    with client:
        response = client.get("/ibm", headers={"X-Request-ID": "ibm-test"})

    assert response.status_code == 400
    error = assert_unified_error_response(
        response.json(),
        expected_code="ibm_verify_bad_request",
        expected_message="template validation failed",
        expected_request_id="ibm-test",
    )
    assert error["details"]["responseBody"] == {
        "message": "template validation failed",
        "trace": "ibm-trace-123",
    }


def test_unexpected_errors_return_unified_safe_error_envelope() -> None:
    client = build_test_client(build_router(), raise_server_exceptions=False)

    with client:
        response = client.get("/boom", headers={"X-Request-ID": "boom-test"})

    assert response.status_code == 500
    assert_unified_error_response(
        response.json(),
        expected_code="internal_server_error",
        expected_message="An unexpected error occurred.",
        expected_request_id="boom-test",
    )


def test_bad_request_exceptions_from_api_or_service_validation_return_unified_bad_request_envelope() -> None:
    client = build_test_client(build_router())

    with client:
        response = client.get("/value-error", headers={"X-Request-ID": "value-error-test"})

    assert response.status_code == 400
    assert_unified_error_response(
        response.json(),
        expected_code="bad_request",
        expected_message="department_uuid is required",
        expected_request_id="value-error-test",
    )
