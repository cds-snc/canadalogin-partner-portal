from unittest.mock import AsyncMock, patch

import pytest
from src.app.services.onboarding_oversight_service import OnboardingOversightService


class TestOnboardingOversightService:
    @pytest.mark.asyncio
    async def test_list_queue_contains_only_explicit_canonical_production_reviews(self, mock_db) -> None:
        service = OnboardingOversightService()

        with (
            patch("src.app.services.onboarding_oversight_service.crud_departments") as departments,
            patch("src.app.services.onboarding_oversight_service.crud_workspaces") as workspaces,
            patch("src.app.services.onboarding_oversight_service.crud_application_information") as applications,
            patch("src.app.services.onboarding_oversight_service.crud_rp_applications") as rp_applications,
            patch("src.app.services.onboarding_oversight_service.crud_rp_application_promotion_requests") as reviews,
            patch("src.app.services.onboarding_oversight_service.crud_users") as users,
        ):
            departments.get_multi = AsyncMock(
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
            workspaces.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "id": 9,
                            "uuid": "018f6f83-0000-0000-0000-000000000201",
                            "name": "Benefits Workspace",
                            "department_id": 7,
                        }
                    ]
                }
            )
            applications.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "id": 17,
                            "uuid": "018f6f83-0000-0000-0000-000000000301",
                            "workspace_id": 9,
                            "service_name_en": "Benefits application",
                            "service_name_fr": "Demande de prestations",
                        }
                    ]
                }
            )
            rp_applications.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "id": 33,
                            "uuid": "018f6f83-0000-0000-0000-000000000401",
                            "workspace_id": 9,
                            "application_information_id": 17,
                            "configuration_name": "Benefits staging",
                            "canada_login_environment": "staging",
                        },
                        {
                            "id": 34,
                            "uuid": "018f6f83-0000-0000-0000-000000000402",
                            "workspace_id": 9,
                            "application_information_id": 17,
                            "source_rp_configuration_id": 33,
                            "configuration_name": "Benefits production",
                            "canada_login_environment": "production",
                        },
                        {
                            "id": 35,
                            "uuid": "018f6f83-0000-0000-0000-000000000403",
                            "workspace_id": 9,
                            "application_information_id": 17,
                            "source_rp_configuration_id": None,
                            "configuration_name": "Independent production",
                            "canada_login_environment": "production",
                        },
                    ]
                }
            )
            reviews.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "rp_application_id": 34,
                            "target_environment": "production",
                            "status": "review_tracked",
                            "review_status": "pending",
                            "external_reference": "CAB-123",
                            "reviewed_by_user_id": None,
                            "reviewed_by_team": None,
                            "requested_at": "2026-08-11T12:30:00+00:00",
                            "reviewed_at": None,
                            "decided_at": None,
                            "updated_at": None,
                        },
                        {
                            "rp_application_id": 35,
                            "target_environment": "production",
                            "status": "review_tracked",
                            "review_status": "rejected",
                            "external_reference": "CAB-124",
                            "reviewed_by_user_id": 1,
                            "reviewed_by_team": "CanadaLogin",
                            "requested_at": "2026-08-10T12:30:00+00:00",
                            "reviewed_at": "2026-08-12T12:30:00+00:00",
                            "decided_at": "2026-08-12T12:30:00+00:00",
                            "updated_at": "2026-08-12T12:30:00+00:00",
                        },
                        {
                            "rp_application_id": 34,
                            "target_environment": "production",
                            "status": "launched",
                            "review_status": None,
                            "requested_at": "2026-08-01T12:30:00+00:00",
                        },
                        {
                            "rp_application_id": 34,
                            "target_environment": "production",
                            "review_status": "pending",
                            "external_reference": "  ",
                            "requested_at": "2026-08-01T12:30:00+00:00",
                        },
                    ]
                }
            )
            users.get = AsyncMock(
                return_value={
                    "id": 1,
                    "uuid": "018f6f83-0000-0000-0000-000000000001",
                }
            )

            result = await service.list_queue(db=mock_db)
            pending_only = await service.list_queue(
                db=mock_db,
                review_status="pending",
                department="employment",
                workspace="benefits",
            )

        assert [row["review_status"] for row in result] == ["pending", "rejected"]
        assert result[0]["application_name_en"] == "Benefits application"
        assert result[0]["application_name_fr"] == "Demande de prestations"
        assert str(result[0]["source_rp_configuration_uuid"]) == "018f6f83-0000-0000-0000-000000000401"
        assert result[1]["source_rp_configuration_uuid"] is None
        assert str(result[1]["reviewed_by_user_uuid"]) == "018f6f83-0000-0000-0000-000000000001"
        assert result[0]["detail_path"].endswith("/rp-configurations/018f6f83-0000-0000-0000-000000000402/production-review")
        assert "onboarding_state" not in result[0]
        assert "record_type" not in result[0]
        assert len(pending_only) == 1
        assert pending_only[0]["review_status"] == "pending"
