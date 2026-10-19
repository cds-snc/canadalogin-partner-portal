from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.dependencies.utils import get_dependant
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from src.app.api import dependencies, v1
from src.app.core.access_control import database_enforcer_provider
from src.app.core.db.database import async_get_db, async_get_reader_db, local_session

READER_GETS = {
    "/audit-logs",
    "/departments",
    "/department/{department_uuid}",
    "/departments/by-id/{department_id}",
    "/applications/{application_uuid}/environments",
    "/rp-applications",
}
ROUTES = [
    route
    for name, router in vars(v1).items()
    if name != "router" and isinstance(router, APIRouter)
    for route in router.routes
    if isinstance(route, APIRoute)
]


def walk_dependencies(dependant):
    for dependency in dependant.dependencies:
        yield dependency
        yield from walk_dependencies(dependency)


def test_reader_allowlist_matches_registered_gets():
    actual = {
        route.path
        for route in ROUTES
        if any(dep.call is async_get_reader_db for dep in route.dependant.dependencies)
    }
    assert actual == READER_GETS


@pytest.mark.parametrize("route", ROUTES, ids=lambda route: f"{','.join(sorted(route.methods))} {route.path}")
def test_route_database_matrix(route):
    for dep in route.dependant.dependencies:
        if dep.name == "db":
            expected = async_get_reader_db if route.methods == {"GET"} and route.path in READER_GETS else async_get_db
            assert dep.call is expected
        # Route data can use a reader, but all nested auth/permission dependencies stay writer.
        assert all(nested.call is not async_get_reader_db for nested in walk_dependencies(dep))
    if "GET" not in route.methods:
        assert all(dep.call is not async_get_reader_db for dep in walk_dependencies(route.dependant))


@pytest.mark.parametrize("provider", [dependencies.get_current_user, dependencies.get_optional_user, dependencies.rate_limiter_dependency])
def test_auth_and_rate_limiter_use_writer(provider):
    dependant = get_dependant(path="/", call=provider)
    db_dependencies = [dep for dep in walk_dependencies(dependant) if dep.name == "db"]
    assert db_dependencies
    assert all(dep.call is async_get_db for dep in db_dependencies)


def test_casbin_policy_provider_keeps_writer_session_factory():
    assert database_enforcer_provider._session_factory is local_session


def test_reader_route_keeps_auth_on_writer_and_passes_reader_to_service(monkeypatch):
    app = FastAPI()

    @app.middleware("http")
    async def accepted_session(request, call_next):
        request.scope["session"] = {"terms_accepted": True}
        return await call_next(request)

    app.include_router(v1.departments_router)
    writer, reader = object(), object()
    service = Mock()
    service.list_departments = AsyncMock(return_value={"data": [], "total_count": 0, "has_more": False})
    auth_lookup = AsyncMock(return_value={"id": 1})
    monkeypatch.setattr(dependencies, "get_user_from_session", auth_lookup)
    app.dependency_overrides[async_get_db] = lambda: writer
    app.dependency_overrides[async_get_reader_db] = lambda: reader
    app.dependency_overrides[dependencies.get_department_service] = lambda: service

    with TestClient(app) as client:
        assert client.get("/departments").status_code == 200

    assert auth_lookup.await_args.args[1] is writer
    service.list_departments.assert_awaited_once_with(db=reader, page=1, items_per_page=10)
