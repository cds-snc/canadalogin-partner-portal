from unittest.mock import AsyncMock, patch

import pytest

from src.app.core.authorization import CanonicalRoleCode
from src.app.core.exceptions.http_exceptions import OnboardingReportRequestException
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
)
from src.app.services.onboarding_oversight_service import OnboardingOversightService

CL_ADMIN = {
    "id": 1,
    AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
}


class TestOnboardingOversightService:
    @pytest.mark.asyncio
    async def test_list_queue_shapes_filters_and_sorts_rows(self, mock_db) -> None:
        service = OnboardingOversightService()

        with (
            patch("src.app.services.onboarding_oversight_service.crud_departments") as mock_departments,
            patch("src.app.services.onboarding_oversight_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.onboarding_oversight_service.crud_application_information") as mock_application_information,
            patch("src.app.services.onboarding_oversight_service.crud_rp_applications") as mock_rp_applications,
            patch("src.app.services.onboarding_oversight_service.crud_rp_application_promotion_requests") as mock_promotion_requests,
        ):
            mock_departments.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "id": 7,
                            "uuid": "018f6f83-0000-0000-0000-000000000111",
                            "name": "Employment and Social Development Canada",
                        }
                    ]
                }
            )
            mock_workspaces.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "id": 9,
                            "uuid": "018f6f83-0000-0000-0000-000000000201",
                            "name": "Benefits Workspace",
                            "department_id": 7,
                            "onboarding_state": "submitted",
                            "submitted_at": "2026-08-10T09:00:00+00:00",
                            "under_review_at": None,
                            "approved_at": None,
                            "launched_at": None,
                            "updated_at": None,
                            "created_at": "2026-08-01T09:00:00+00:00",
                        },
                        {
                            "id": 10,
                            "uuid": "018f6f83-0000-0000-0000-000000000202",
                            "name": "Draft Workspace",
                            "department_id": 7,
                            "onboarding_state": "draft",
                            "submitted_at": None,
                            "under_review_at": None,
                            "approved_at": None,
                            "launched_at": None,
                            "updated_at": None,
                            "created_at": "2026-08-01T09:00:00+00:00",
                        },
                    ]
                }
            )
            mock_application_information.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "id": 17,
                            "uuid": "018f6f83-0000-0000-0000-000000000301",
                            "workspace_id": 9,
                            "service_name_en": "Benefits application information",
                            "onboarding_state": "under_review",
                            "submitted_at": "2026-08-10T10:00:00+00:00",
                            "under_review_at": "2026-08-11T08:00:00+00:00",
                            "approved_at": None,
                            "launched_at": None,
                            "updated_at": None,
                            "created_at": "2026-08-01T10:00:00+00:00",
                        }
                    ]
                }
            )
            mock_rp_applications.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "id": 33,
                            "uuid": "018f6f83-0000-0000-0000-000000000401",
                            "workspace_id": 9,
                            "dnr_app_name": "Benefits staging registration",
                            "canada_login_environment": "staging",
                            "onboarding_state": "submitted",
                            "submitted_at": "2026-08-09T10:00:00+00:00",
                            "under_review_at": None,
                            "approved_at": None,
                            "launched_at": None,
                            "updated_at": None,
                            "created_at": "2026-08-01T11:00:00+00:00",
                        },
                        {
                            "id": 34,
                            "uuid": "018f6f83-0000-0000-0000-000000000402",
                            "workspace_id": 9,
                            "dnr_app_name": "Benefits production registration",
                            "canada_login_environment": "production",
                            "onboarding_state": "under_review",
                            "submitted_at": "2026-08-10T11:00:00+00:00",
                            "under_review_at": "2026-08-11T09:00:00+00:00",
                            "approved_at": None,
                            "launched_at": None,
                            "updated_at": None,
                            "created_at": "2026-08-01T11:00:00+00:00",
                        },
                    ]
                }
            )
            mock_promotion_requests.get = AsyncMock(
                side_effect=[
                    {
                        "rp_application_id": 34,
                        "target_environment": "production",
                        "status": "review_tracked",
                        "external_reference": "CAB-123",
                        "requested_at": "2026-08-11T12:30:00+00:00",
                        "reviewed_at": None,
                        "updated_at": None,
                        "created_at": "2026-08-11T12:30:00+00:00",
                    }
                ]
            )

            result = await service.list_queue(db=mock_db)

        assert [row["record_type"] for row in result] == [
            "production_progression",
            "rp_application",
            "application_information",
            "workspace",
            "rp_application",
        ]
        assert result[0]["primary_record_label"] == "Benefits production registration"
        assert result[0]["promotion_status"] == "review_tracked"
        assert result[0]["external_review_reference"] == "CAB-123"
        assert all(row["workspace_name"] == "Benefits Workspace" for row in result)
        assert all(row["department_name"] == "Employment and Social Development Canada" for row in result)
        assert all(row["primary_record_label"] != "Draft Workspace" for row in result)

        with (
            patch("src.app.services.onboarding_oversight_service.crud_departments") as mock_departments,
            patch("src.app.services.onboarding_oversight_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.onboarding_oversight_service.crud_application_information") as mock_application_information,
            patch("src.app.services.onboarding_oversight_service.crud_rp_applications") as mock_rp_applications,
            patch("src.app.services.onboarding_oversight_service.crud_rp_application_promotion_requests") as mock_promotion_requests,
        ):
            mock_departments.get_multi = AsyncMock(
                return_value={"data": [{"id": 7, "uuid": "018f6f83-0000-0000-0000-000000000111", "name": "Employment and Social Development Canada"}]}
            )
            mock_workspaces.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "id": 9,
                            "uuid": "018f6f83-0000-0000-0000-000000000201",
                            "name": "Benefits Workspace",
                            "department_id": 7,
                            "onboarding_state": "submitted",
                            "submitted_at": "2026-08-10T09:00:00+00:00",
                            "under_review_at": None,
                            "approved_at": None,
                            "launched_at": None,
                            "updated_at": None,
                            "created_at": "2026-08-01T09:00:00+00:00",
                        }
                    ]
                }
            )
            mock_application_information.get_multi = AsyncMock(return_value={"data": []})
            mock_rp_applications.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "id": 34,
                            "uuid": "018f6f83-0000-0000-0000-000000000402",
                            "workspace_id": 9,
                            "dnr_app_name": "Benefits production registration",
                            "canada_login_environment": "production",
                            "onboarding_state": "under_review",
                            "submitted_at": "2026-08-10T11:00:00+00:00",
                            "under_review_at": "2026-08-11T09:00:00+00:00",
                            "approved_at": None,
                            "launched_at": None,
                            "updated_at": None,
                            "created_at": "2026-08-01T11:00:00+00:00",
                        }
                    ]
                }
            )
            mock_promotion_requests.get = AsyncMock(
                return_value={
                    "rp_application_id": 34,
                    "target_environment": "production",
                    "status": "review_tracked",
                    "external_reference": "CAB-123",
                    "requested_at": "2026-08-11T12:30:00+00:00",
                    "reviewed_at": None,
                    "updated_at": None,
                    "created_at": "2026-08-11T12:30:00+00:00",
                }
            )

            filtered = await service.list_queue(
                db=mock_db,
                onboarding_state="under_review",
                record_type="production_progression",
                department="employment",
                workspace="benefits",
                environment="production",
                promotion_status="review_tracked",
            )

        assert len(filtered) == 1
        assert filtered[0]["record_type"] == "production_progression"
        assert filtered[0]["detail_path"] == "/workspaces/018f6f83-0000-0000-0000-000000000201/applications/018f6f83-0000-0000-0000-000000000402"

    @pytest.mark.asyncio
    async def test_get_report_builds_throughput_report(self, mock_db) -> None:
        service = OnboardingOversightService()

        with (
            patch("src.app.services.onboarding_oversight_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.onboarding_oversight_service.crud_application_information") as mock_application_information,
            patch("src.app.services.onboarding_oversight_service.crud_rp_applications") as mock_rp_applications,
        ):
            mock_workspaces.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "submitted_at": "2026-08-10T09:00:00+00:00",
                            "approved_at": None,
                            "launched_at": None,
                        }
                    ]
                }
            )
            mock_application_information.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "submitted_at": None,
                            "approved_at": "2026-08-11T10:00:00+00:00",
                            "launched_at": None,
                        }
                    ]
                }
            )
            mock_rp_applications.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "submitted_at": None,
                            "approved_at": None,
                            "launched_at": "2026-08-12T11:00:00+00:00",
                        }
                    ]
                }
            )

            result = await service.get_report(
                db=mock_db,
                metric="onboarding_throughput",
                start_date="2026-08-01",
                end_date="2026-08-31",
                group_by="week",
                current_user=CL_ADMIN,
            )

        assert result["metric"] == "onboarding_throughput"
        assert result["summary"]["submitted_count"] == 1
        assert result["summary"]["approved_count"] == 1
        assert result["summary"]["launched_count"] == 1
        assert len(result["rows"]) == 1
        assert result["rows"][0]["submitted_count"] == 1
        assert result["rows"][0]["approved_count"] == 1
        assert result["rows"][0]["launched_count"] == 1

    @pytest.mark.asyncio
    async def test_get_report_builds_invitation_conversion_report(self, mock_db) -> None:
        service = OnboardingOversightService()

        with patch("src.app.services.onboarding_oversight_service.crud_rp_application_developer_invitations") as mock_invitations:
            mock_invitations.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "created_at": "2026-08-03T09:00:00+00:00",
                            "accepted_at": "2026-08-05T09:00:00+00:00",
                        },
                        {
                            "created_at": "2026-08-12T09:00:00+00:00",
                            "accepted_at": None,
                        },
                        {
                            "created_at": "2026-07-30T09:00:00+00:00",
                            "accepted_at": "2026-08-02T09:00:00+00:00",
                        },
                    ]
                }
            )

            result = await service.get_report(
                db=mock_db,
                metric="invitation_conversion",
                start_date="2026-08-01",
                end_date="2026-08-31",
                group_by="month",
                current_user=CL_ADMIN,
            )

        assert result["metric"] == "invitation_conversion"
        assert result["summary"]["invitations_sent"] == 2
        assert result["summary"]["invitations_accepted"] == 1
        assert result["summary"]["conversion_rate"] == 50.0
        assert len(result["rows"]) == 1
        assert result["rows"][0]["invitations_sent"] == 2
        assert result["rows"][0]["invitations_accepted"] == 1
        assert result["rows"][0]["conversion_rate"] == 50.0

    @pytest.mark.asyncio
    async def test_get_report_builds_secret_rotation_hygiene_report(self, mock_db) -> None:
        service = OnboardingOversightService()

        with (
            patch("src.app.services.onboarding_oversight_service.crud_rp_applications") as mock_rp_applications,
            patch("src.app.services.onboarding_oversight_service.crud_audit_log") as mock_audit_log,
        ):
            mock_rp_applications.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {"uuid": "018f6f83-0000-0000-0000-000000000401"},
                        {"uuid": "018f6f83-0000-0000-0000-000000000402"},
                    ]
                }
            )
            mock_audit_log.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "target": "rp_application",
                            "target_uuid": "018f6f83-0000-0000-0000-000000000401",
                            "operation": "ROTATE_SECRET",
                            "created_at": "2026-08-15T09:00:00+00:00",
                        },
                        {
                            "target": "rp_application",
                            "target_uuid": "018f6f83-0000-0000-0000-000000000402",
                            "operation": "VIEW_ROTATED",
                            "created_at": "2026-08-16T09:00:00+00:00",
                        },
                    ]
                }
            )

            result = await service.get_report(
                db=mock_db,
                metric="secret_rotation_hygiene",
                start_date="2026-08-01",
                end_date="2026-08-31",
                current_user=CL_ADMIN,
            )

        assert result["metric"] == "secret_rotation_hygiene"
        assert result["summary"]["total_rp_applications"] == 2
        assert result["summary"]["compliant_rp_applications"] == 1
        assert result["summary"]["non_compliant_rp_applications"] == 1
        assert result["summary"]["hygiene_rate"] == 50.0
        assert result["summary"]["policy_window_days"] == 31
        assert len(result["rows"]) == 1
        assert result["rows"][0]["total_rp_applications"] == 2
        assert result["rows"][0]["compliant_rp_applications"] == 1

    @pytest.mark.asyncio
    async def test_get_report_rejects_invalid_filter_combinations(self, mock_db) -> None:
        service = OnboardingOversightService()

        with pytest.raises(OnboardingReportRequestException) as exc_info:
            await service.get_report(
                db=mock_db,
                metric="secret_rotation_hygiene",
                start_date="2026-08-01",
                end_date="2026-08-31",
                group_by="week",
                current_user=CL_ADMIN,
            )

        assert exc_info.value.code == "onboarding_report_invalid_filter_combination"
