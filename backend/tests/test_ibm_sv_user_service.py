from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID

import pytest
from ibm_verify_community_sdk.applications.models import Application, GetApplicationsResponse

from src.app.core.authorization import CanonicalRoleCode
from src.app.schemas.rp_application import RPApplicationRead
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)
from src.app.services.ibm_sv_user_service import IBMVerifyUserService
from src.app.services.rp_application_service import RPApplicationService


class TestIBMVerifyUserService:
    @pytest.mark.asyncio
    async def test_get_applications_normalizes_payload_and_checks_membership(self) -> None:
        client = Mock()
        client.fetch_applications = AsyncMock(
            return_value=GetApplicationsResponse(
                totalCount=2,
                applications=[
                    Application(
                        name="One",
                        links=[],
                        status=[],
                        category=[],
                        id="app-1",
                        discretionaryApp=False,
                    ),
                    Application(
                        name="Two",
                        links=[],
                        status=[],
                        category=[],
                        id="app-2",
                        discretionaryApp=False,
                    ),
                ],
            )
        )
        service = IBMVerifyUserService(client=client)

        applications = await service.get_applications()

        assert len(applications) == 2
        assert await service.has_application("app-2") is True
        assert await service.has_application("missing") is False


class TestRPApplicationServiceCurrentUserSync:
    @pytest.mark.parametrize(
        "authorization_state",
        [
            ResolvedAuthorizationState(),
            ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
        ],
        ids=["no-access", "cl-admin"],
    )
    @pytest.mark.asyncio
    async def test_list_accessible_rp_applications_returns_empty_without_partner_access(
        self,
        mock_db,
        authorization_state: ResolvedAuthorizationState,
    ) -> None:
        service = RPApplicationService()
        current_user = {
            "id": 11,
            "department_id": 7,
            AUTHORIZATION_STATE_KEY: authorization_state,
        }

        with patch("src.app.services.rp_application_service.crud_rp_applications") as mock_crud:
            mock_crud.get_multi = AsyncMock(return_value={"data": []})
            mock_crud.update = AsyncMock(return_value=None)
            mock_crud.create = AsyncMock(return_value=None)

            result = await service.list_accessible_rp_applications(
                db=mock_db,
                current_user=current_user,
            )

        assert result == []
        mock_crud.update.assert_not_awaited()
        mock_crud.create.assert_not_awaited()
        mock_crud.get_multi.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_list_accessible_rp_applications_ignores_owner_email_matches_without_grant(self, mock_db) -> None:
        service = RPApplicationService()
        current_user = {
            "id": 11,
            "email": "yiwei.wang@cds-snc.ca",
            AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(),
        }
        owner_matched_row = {
            "id": 3,
            "uuid": "018f6f83-0000-0000-0000-000000000103",
            "department_id": 7,
            "dnr_app_name": "Owner Matched App",
            "created_by": 2,
            "ibm_sv_application_id": "app-owner-match",
            "application_owner": {
                "owners": [
                    {"email": "yiwei.wang@cds-snc.ca"},
                    {"email": "yiwei.wang+0609@cds-snc.ca"},
                ]
            },
        }
        non_matched_row = {
            "id": 4,
            "uuid": "018f6f83-0000-0000-0000-000000000104",
            "department_id": 7,
            "dnr_app_name": "Not Owned",
            "created_by": 2,
            "ibm_sv_application_id": "app-not-owned",
            "application_owner": {
                "owners": [
                    {"email": "someone.else@cds-snc.ca"},
                ]
            },
        }

        with patch("src.app.services.rp_application_service.crud_rp_applications") as mock_crud:
            mock_crud.get_multi = AsyncMock(return_value={"data": [owner_matched_row, non_matched_row]})
            mock_crud.update = AsyncMock(return_value=None)
            mock_crud.create = AsyncMock(return_value=None)

            result = await service.list_accessible_rp_applications(
                db=mock_db,
                current_user=current_user,
            )

        assert result == []
        mock_crud.create.assert_not_awaited()

    @pytest.mark.parametrize(
        "role",
        [
            CanonicalRoleCode.RP_ADMIN,
            CanonicalRoleCode.RP_USER_EDIT,
            CanonicalRoleCode.READ_ONLY,
        ],
    )
    @pytest.mark.asyncio
    async def test_list_accessible_rp_applications_includes_granted_workspace_applications_for_every_partner_role(
        self,
        mock_db,
        role: CanonicalRoleCode,
    ) -> None:
        service = RPApplicationService()
        workspace_uuid = UUID("018f6f83-0000-0000-0000-000000000023")
        current_user = {
            "id": 11,
            AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
                partner_access=(
                    ResolvedPartnerAccess(
                        workspace_id=23,
                        workspace_uuid=workspace_uuid,
                        role=role,
                    ),
                )
            ),
        }
        workspace_granted_row = {
            "id": 5,
            "uuid": "018f6f83-0000-0000-0000-000000000105",
            "workspace_id": 23,
            "department_id": 7,
            "dnr_app_name": "Workspace Granted App",
            "created_by": 2,
            "ibm_sv_application_id": "app-workspace-grant",
            "canada_login_environment": "production",
            "onboarding_state": "under_review",
            "promotion_status": "review_tracked",
            "application_owner": {
                "owners": [
                    {"email": "someone.else@cds-snc.ca"},
                ]
            },
        }
        unrelated_row = {
            "id": 6,
            "uuid": "018f6f83-0000-0000-0000-000000000106",
            "workspace_id": 24,
            "department_id": 7,
            "dnr_app_name": "Other Workspace App",
            "created_by": 2,
            "ibm_sv_application_id": "app-other-workspace",
            "application_owner": {
                "owners": [
                    {"email": "someone.else@cds-snc.ca"},
                ]
            },
        }

        with (
            patch("src.app.services.rp_application_service.crud_rp_applications") as mock_crud,
            patch("src.app.services.rp_application_service.crud_workspaces") as mock_workspace_crud,
        ):
            mock_crud.get_multi = AsyncMock(return_value={"data": [workspace_granted_row, unrelated_row]})
            mock_workspace_crud.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "id": 23,
                            "name": "Benefits Workspace",
                            "uuid": workspace_uuid,
                        }
                    ]
                }
            )

            result = await service.list_accessible_rp_applications(
                db=mock_db,
                current_user=current_user,
            )

        assert len(result) == 1
        assert result[0]["serviceNameEn"] == "Workspace Granted App"
        assert result[0]["serviceNameFr"] == "Workspace Granted App"
        assert result[0]["workspaceName"] == "Benefits Workspace"
        assert result[0]["canadaLoginEnvironment"] == "production"
        assert result[0]["onboardingState"] == "under_review"
        assert result[0]["promotionStatus"] == "review_tracked"
        assert result[0]["workspaceUuid"] == workspace_uuid
        assert result[0]["role"] is role
        assert "id" not in result[0]
        assert "departmentId" not in result[0]
        assert "ibmSvApplicationId" not in result[0]
        mock_crud.get_multi.assert_awaited_once_with(
            db=mock_db,
            limit=None,
            return_total_count=False,
            sort_columns="id",
            sort_orders="asc",
            is_deleted=False,
            workspace_id__in=(23,),
            schema_to_select=RPApplicationRead,
        )

    @pytest.mark.asyncio
    async def test_list_accessible_rp_applications_does_not_truncate_granted_rows_after_one_hundred(self, mock_db) -> None:
        service = RPApplicationService()
        workspace_uuid = UUID("018f6f83-0000-0000-0000-000000000023")
        current_user = {
            "id": 11,
            AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
                partner_access=(
                    ResolvedPartnerAccess(
                        workspace_id=23,
                        workspace_uuid=workspace_uuid,
                        role=CanonicalRoleCode.READ_ONLY,
                    ),
                )
            ),
        }
        granted_rows = [
            {
                "id": index,
                "uuid": str(UUID(int=index)),
                "workspace_id": 23,
                "dnr_app_name": f"Granted application {index:03d}",
                "ibm_sv_application_id": f"app-{index:03d}",
            }
            for index in range(1, 102)
        ]

        async def get_multi_with_real_default_limit(**kwargs):
            limit = kwargs.get("limit", 100)
            data = granted_rows if limit is None else granted_rows[:limit]
            return {"data": data}

        with (
            patch("src.app.services.rp_application_service.crud_rp_applications") as mock_crud,
            patch("src.app.services.rp_application_service.crud_workspaces") as mock_workspace_crud,
        ):
            mock_crud.get_multi = AsyncMock(side_effect=get_multi_with_real_default_limit)
            mock_workspace_crud.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {
                            "id": 23,
                            "name": "Benefits Workspace",
                            "uuid": workspace_uuid,
                        }
                    ]
                }
            )

            result = await service.list_accessible_rp_applications(
                db=mock_db,
                current_user=current_user,
            )

        assert len(result) == 101
        assert result[-1]["uuid"] == UUID(int=101)
        assert result[-1]["workspaceUuid"] == workspace_uuid
        assert mock_crud.get_multi.await_args.kwargs["workspace_id__in"] == (23,)
        assert mock_crud.get_multi.await_args.kwargs["limit"] is None
