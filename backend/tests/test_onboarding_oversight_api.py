from unittest.mock import AsyncMock, Mock

from fastapi.testclient import TestClient

from src.app.api.dependencies import (
    get_current_user,
    get_onboarding_oversight_service,
)
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import OnboardingReportRequestException
from src.app.main import app
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
)


def _cl_admin() -> dict:
    return {
        "id": 1,
        "username": "admin@example.gc.ca",
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
    }


class TestOnboardingOversightQueueRoute:
    def test_queue_requires_superuser_access(self) -> None:
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
                response = client.get("/api/v1/onboarding-oversight/queue")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["message"] == "You do not have enough privileges."
        service.list_queue.assert_not_called()

    def test_queue_forwards_filters_and_returns_rows(self) -> None:
        service = Mock()
        service.list_queue = AsyncMock(
            return_value=[
                {
                    "record_type": "production_progression",
                    "record_uuid": "018f6f83-0000-0000-0000-000000000402",
                    "primary_record_label": "Benefits production",
                    "workspace_uuid": "018f6f83-0000-0000-0000-000000000201",
                    "workspace_name": "Benefits Workspace",
                    "department_uuid": "018f6f83-0000-0000-0000-000000000111",
                    "department_name": "Employment and Social Development Canada",
                    "onboarding_state": "under_review",
                    "current_environment": "production",
                    "target_environment": "production",
                    "promotion_status": "review_tracked",
                    "external_review_reference": "CAB-123",
                    "last_activity_at": "2026-08-11T12:30:00+00:00",
                    "detail_path": (
                        "/workspaces/018f6f83-0000-0000-0000-000000000201/"
                        "applications/018f6f83-0000-0000-0000-000000000301/"
                        "rp-configurations/018f6f83-0000-0000-0000-000000000402/production-review"
                    ),
                }
            ]
        )
        db = Mock()

        app.dependency_overrides[get_current_user] = _cl_admin
        app.dependency_overrides[get_onboarding_oversight_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/onboarding-oversight/queue",
                    params={
                        "department": "employment",
                        "environment": "production",
                        "onboarding_state": "under_review",
                        "promotion_status": "review_tracked",
                        "record_type": "production_progression",
                        "workspace": "benefits",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["recordType"] == "production_progression"
        assert body[0]["recordUuid"] == "018f6f83-0000-0000-0000-000000000402"
        assert body[0]["primaryRecordLabel"] == "Benefits production"
        assert body[0]["workspaceUuid"] == "018f6f83-0000-0000-0000-000000000201"
        assert body[0]["workspaceName"] == "Benefits Workspace"
        assert body[0]["departmentUuid"] == "018f6f83-0000-0000-0000-000000000111"
        assert body[0]["departmentName"] == "Employment and Social Development Canada"
        assert body[0]["onboardingState"] == "under_review"
        assert body[0]["currentEnvironment"] == "production"
        assert body[0]["targetEnvironment"] == "production"
        assert body[0]["promotionStatus"] == "review_tracked"
        assert body[0]["externalReviewReference"] == "CAB-123"
        assert body[0]["lastActivityAt"].startswith("2026-08-11T12:30:00")
        assert body[0]["detailPath"] == (
            "/workspaces/018f6f83-0000-0000-0000-000000000201/"
            "applications/018f6f83-0000-0000-0000-000000000301/"
            "rp-configurations/018f6f83-0000-0000-0000-000000000402/production-review"
        )
        service.list_queue.assert_awaited_once_with(
            db=db,
            onboarding_state="under_review",
            record_type="production_progression",
            department="employment",
            workspace="benefits",
            environment="production",
            promotion_status="review_tracked",
        )


class TestOnboardingOversightReportsRoute:
    def test_reports_delegate_authorization_to_scope_aware_service(self) -> None:
        service = Mock()
        service.get_report = AsyncMock(
            side_effect=OnboardingReportRequestException(
                code="onboarding_report_workspace_required",
                message="Partner reporting requires exactly one active workspace.",
            )
        )
        current_user = {
            "id": 42,
            "username": "member@example.gc.ca",
            AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(),
        }
        db = Mock()

        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_onboarding_oversight_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/onboarding-oversight/reports",
                    params={
                        "metric": "onboarding_throughput",
                        "start_date": "2026-08-01",
                        "end_date": "2026-08-31",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 400
        assert response.json()["error"]["code"] == "onboarding_report_workspace_required"
        service.get_report.assert_awaited_once_with(
            db=db,
            metric="onboarding_throughput",
            start_date="2026-08-01",
            end_date="2026-08-31",
            group_by=None,
            workspace_uuid=None,
            department_id=None,
            environment=None,
            current_user=current_user,
        )

    def test_reports_forward_filters_and_return_payload(self) -> None:
        service = Mock()
        service.get_report = AsyncMock(
            return_value={
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
                "rows": [
                    {
                        "bucket_label": "2026-08-25 to 2026-08-31",
                        "bucket_start": "2026-08-25",
                        "bucket_end": "2026-08-31",
                        "submitted_count": 3,
                        "approved_count": 1,
                        "launched_count": 1,
                    }
                ],
                "export_available": True,
            }
        )
        db = Mock()

        current_user = _cl_admin()
        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_onboarding_oversight_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/onboarding-oversight/reports",
                    params={
                        "metric": "onboarding_throughput",
                        "start_date": "2026-08-01",
                        "end_date": "2026-08-31",
                        "group_by": "week",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        body = response.json()
        assert body["metric"] == "onboarding_throughput"
        assert body["appliedFilters"]["metric"] == "onboarding_throughput"
        assert body["appliedFilters"]["groupBy"] == "week"
        assert body["summary"]["submittedCount"] == 3
        assert body["rows"][0]["bucketLabel"] == "2026-08-25 to 2026-08-31"
        service.get_report.assert_awaited_once_with(
            db=db,
            metric="onboarding_throughput",
            start_date="2026-08-01",
            end_date="2026-08-31",
            group_by="week",
            workspace_uuid=None,
            department_id=None,
            environment=None,
            current_user=current_user,
        )

    def test_report_export_returns_csv_attachment(self) -> None:
        service = Mock()
        service.export_report_csv = AsyncMock(
            return_value=(
                "bucket_label,submitted_count\n2026-08-25 to 2026-08-31,3\n",
                "onboarding_throughput-2026-08-01-2026-08-31.csv",
            )
        )
        db = Mock()

        current_user = _cl_admin()
        app.dependency_overrides[get_current_user] = lambda: current_user
        app.dependency_overrides[get_onboarding_oversight_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: db

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/onboarding-oversight/reports/export",
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
        assert "bucket_label,submitted_count" in response.text
        service.export_report_csv.assert_awaited_once_with(
            db=db,
            metric="onboarding_throughput",
            start_date="2026-08-01",
            end_date="2026-08-31",
            group_by=None,
            workspace_uuid=None,
            department_id=None,
            environment=None,
            current_user=current_user,
        )

    def test_reports_surface_stable_bad_request_codes(self) -> None:
        service = Mock()
        service.get_report = AsyncMock(
            side_effect=OnboardingReportRequestException(
                code="onboarding_report_invalid_date_range",
                message="Start date must be on or before end date.",
            )
        )

        app.dependency_overrides[get_current_user] = _cl_admin
        app.dependency_overrides[get_onboarding_oversight_service] = lambda: service
        app.dependency_overrides[async_get_db] = lambda: Mock()

        try:
            with TestClient(app) as client:
                response = client.get(
                    "/api/v1/onboarding-oversight/reports",
                    params={
                        "metric": "onboarding_throughput",
                        "start_date": "2026-08-31",
                        "end_date": "2026-08-01",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 400
        body = response.json()
        assert body["error"]["code"] == "onboarding_report_invalid_date_range"
        assert body["error"]["message"] == "Start date must be on or before end date."
