from unittest.mock import AsyncMock, Mock

from fastapi.testclient import TestClient

from src.app.api.dependencies import get_current_user, get_onboarding_oversight_service
from src.app.core.db.database import async_get_db
from src.app.main import app

WORKSPACE_UUID = "018f6f83-0000-0000-0000-000000000201"


def _report() -> dict:
    return {
        "metric": "onboarding_throughput",
        "title": "Onboarding throughput",
        "generated_at": "2026-08-31T12:00:00+00:00",
        "applied_filters": {
            "metric": "onboarding_throughput",
            "start_date": "2026-08-01",
            "end_date": "2026-08-31",
            "group_by": "week",
        },
        "summary": {
            "submitted_count": 3,
            "approved_count": 1,
            "launched_count": 1,
        },
        "rows": [],
        "export_available": True,
    }


class TestWorkspaceReportsAPI:
    def test_report_binds_service_scope_to_path_workspace(self) -> None:
        service = Mock()
        service.get_report = AsyncMock(return_value=_report())
        current_user = {"id": 42, "username": "reader@example.gc.ca"}
        db = Mock()
        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_onboarding_oversight_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get(
                    f"/api/v1/workspaces/{WORKSPACE_UUID}/reports",
                    params={
                        "metric": "onboarding_throughput",
                        "start_date": "2026-08-01",
                        "end_date": "2026-08-31",
                        "group_by": "week",
                        "workspace_uuid": "018f6f83-0000-0000-0000-000000000999",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json()["appliedFilters"]["metric"] == "onboarding_throughput"
        service.get_report.assert_awaited_once_with(
            db=db,
            metric="onboarding_throughput",
            start_date="2026-08-01",
            end_date="2026-08-31",
            group_by="week",
            workspace_uuid=WORKSPACE_UUID,
            department_id=None,
            environment=None,
            current_user=current_user,
        )

    def test_export_reuses_shared_service_with_path_scope(self) -> None:
        service = Mock()
        service.export_report_csv = AsyncMock(
            return_value=(
                "bucket_label,submitted_count\n2026-08-25 to 2026-08-31,3\n",
                "onboarding_throughput-2026-08-01-2026-08-31.csv",
            )
        )
        current_user = {"id": 42, "username": "reader@example.gc.ca"}
        db = Mock()
        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_onboarding_oversight_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get(
                    f"/api/v1/workspaces/{WORKSPACE_UUID}/reports/export",
                    params={
                        "metric": "onboarding_throughput",
                        "start_date": "2026-08-01",
                        "end_date": "2026-08-31",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.headers["content-disposition"] == ('attachment; filename="onboarding_throughput-2026-08-01-2026-08-31.csv"')
        service.export_report_csv.assert_awaited_once_with(
            db=db,
            metric="onboarding_throughput",
            start_date="2026-08-01",
            end_date="2026-08-31",
            group_by=None,
            workspace_uuid=WORKSPACE_UUID,
            department_id=None,
            environment=None,
            current_user=current_user,
        )

    def test_openapi_exposes_no_second_workspace_query_selector(self) -> None:
        operation = app.openapi()["paths"]["/api/v1/workspaces/{workspace_uuid}/reports"]["get"]
        workspace_parameters = [parameter for parameter in operation["parameters"] if parameter["name"] == "workspace_uuid"]

        assert workspace_parameters == [
            {
                "in": "path",
                "name": "workspace_uuid",
                "required": True,
                "schema": {"title": "Workspace Uuid", "type": "string"},
            }
        ]
