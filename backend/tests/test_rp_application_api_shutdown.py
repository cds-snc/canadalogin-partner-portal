from unittest.mock import Mock

from casbin import Enforcer
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.app.api.dependencies import get_current_user, get_rp_application_service
from src.app.api.v1.rp_applications import router as rp_applications_router
from src.app.core.access_control import (
    CASBIN_MODEL_PATH,
    database_enforcer_provider,
)
from src.app.core.db.database import async_get_db


def test_legacy_rp_list_is_denied_even_for_superuser():
    app = FastAPI()
    app.include_router(rp_applications_router, prefix="/api/v1")
    service = Mock()
    enforcer = Enforcer(str(CASBIN_MODEL_PATH))
    enforcer.add_policy("admin", "*", ".*")
    app.dependency_overrides[database_enforcer_provider] = lambda: enforcer
    app.dependency_overrides[async_get_db] = lambda: Mock()
    app.dependency_overrides[get_current_user] = lambda: {
        "id": 1,
        "is_superuser": True,
        "uuid": "018f6f83-0000-0000-0000-000000000111",
    }
    app.dependency_overrides[get_rp_application_service] = lambda: service

    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/rp-applications")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    service.list_rp_applications.assert_not_called()


def test_legacy_secret_paths_are_removed_from_rp_router():
    paths = {route.path for route in rp_applications_router.routes}

    assert not any("/client" in path for path in paths)


def test_every_remaining_legacy_route_has_a_fixed_subject_permission_check():
    assert rp_applications_router.routes

    for route in rp_applications_router.routes:
        guard_dependencies = [
            dependency
            for dependency in route.dependant.dependencies
            if getattr(dependency.call, "__name__", "") == "user_provider"
            and not dependency.dependencies
        ]
        assert len(guard_dependencies) == 1, route.path
