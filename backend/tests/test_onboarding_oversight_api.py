from unittest.mock import AsyncMock, Mock

from fastapi.testclient import TestClient
from src.app.api.dependencies import (
    get_current_cl_admin,
    get_current_user,
    get_onboarding_oversight_service,
)
from src.app.core.db.database import async_get_db
from src.app.main import app


def _cl_admin() -> dict:
    return {
        "id": 1,
        "username": "admin@example.gc.ca",
        "is_superuser": True,
    }


class TestProductionReviewQueueRoute:
    def test_queue_requires_cl_admin_access(self) -> None:
        service = Mock()
        service.list_queue = AsyncMock(return_value=[])

        app.dependency_overrides[get_current_user] = lambda: {
            "id": 42,
            "username": "member@example.gc.ca",
            "is_superuser": False,
        }
        app.dependency_overrides[get_onboarding_oversight_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get("/api/v1/onboarding-oversight/production-reviews")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        service.list_queue.assert_not_awaited()

    def test_queue_forwards_only_production_review_filters_and_returns_rows(self) -> None:
        service = Mock()
        service.list_queue = AsyncMock(
            return_value=[
                {
                    "rp_configuration_uuid": "018f6f83-0000-0000-0000-000000000402",
                    "configuration_name": "Benefits production",
                    "source_rp_configuration_uuid": "018f6f83-0000-0000-0000-000000000401",
                    "application_information_uuid": "018f6f83-0000-0000-0000-000000000301",
                    "application_name_en": "Benefits application",
                    "application_name_fr": "Demande de prestations",
                    "workspace_uuid": "018f6f83-0000-0000-0000-000000000201",
                    "workspace_name": "Benefits Workspace",
                    "department_uuid": "018f6f83-0000-0000-0000-000000000111",
                    "department_name": "Employment and Social Development Canada",
                    "review_status": "pending",
                    "external_review_reference": "CAB-123",
                    "reviewed_by_user_uuid": None,
                    "reviewed_by_team": None,
                    "requested_at": "2026-08-11T12:30:00+00:00",
                    "reviewed_at": None,
                    "decided_at": None,
                    "updated_at": None,
                    "detail_path": (
                        "/workspaces/018f6f83-0000-0000-0000-000000000201/"
                        "applications/018f6f83-0000-0000-0000-000000000301/"
                        "rp-configurations/018f6f83-0000-0000-0000-000000000402/production-review"
                    ),
                }
            ]
        )
        db = Mock()

        app.dependency_overrides[get_current_cl_admin] = _cl_admin
        app.dependency_overrides[get_onboarding_oversight_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/onboarding-oversight/production-reviews",
                    params={
                        "department": "employment",
                        "review_status": "pending",
                        "workspace": "benefits",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()[0]["reviewStatus"] == "pending"
        assert response.json()[0]["applicationNameEn"] == "Benefits application"
        assert response.json()[0]["applicationNameFr"] == "Demande de prestations"
        assert "onboardingState" not in response.json()[0]
        assert response.json()[0]["detailPath"].endswith("/rp-configurations/018f6f83-0000-0000-0000-000000000402/production-review")
        service.list_queue.assert_awaited_once_with(
            db=db,
            department="employment",
            workspace="benefits",
            review_status="pending",
        )

    def test_generic_lifecycle_queue_route_is_retired(self) -> None:
        with TestClient(app) as client:
            response = client.get("/api/v1/onboarding-oversight/queue")

        assert response.status_code == 404
