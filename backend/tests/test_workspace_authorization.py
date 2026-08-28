from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID

import pytest
from src.app.core.authorization import CanonicalRoleCode, Capability
from src.app.core.exceptions.http_exceptions import (
    ForbiddenException,
    NotFoundException,
)
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)
from src.app.services.rp_application_service import RPApplicationService
from src.app.services.workspace_service import WorkspaceService

WORKSPACE_ALPHA_UUID = UUID("018f6f83-0000-0000-0000-000000000201")
WORKSPACE_BETA_UUID = UUID("018f6f83-0000-0000-0000-000000000202")
RP_APPLICATION_UUID = UUID("018f6f83-0000-0000-0000-000000000401")


def _cl_admin() -> dict:
    return {
        "id": 1,
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
    }


def _partner(
    role: CanonicalRoleCode,
    *,
    workspace_id: int = 7,
    workspace_uuid: UUID = WORKSPACE_ALPHA_UUID,
) -> dict:
    return {
        "id": 2,
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=workspace_id,
                    workspace_uuid=workspace_uuid,
                    role=role,
                ),
            )
        ),
    }


class TestWorkspaceAuthorizationBoundary:
    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        ("role", "capability"),
        [
            (CanonicalRoleCode.RP_ADMIN, Capability.RP_CONFIGURATION_WRITE),
            (CanonicalRoleCode.RP_USER_EDIT, Capability.RP_CONFIGURATION_WRITE),
            (CanonicalRoleCode.READ_ONLY, Capability.RP_CONFIGURATION_READ),
        ],
    )
    async def test_same_workspace_matrix_allows_expected_partner_capabilities(
        self,
        mock_db,
        role: CanonicalRoleCode,
        capability: Capability,
    ) -> None:
        service = WorkspaceService()
        workspace = {"id": 7, "uuid": WORKSPACE_ALPHA_UUID}

        with patch("src.app.services.workspace_service.crud_workspaces") as crud_workspaces:
            crud_workspaces.get = AsyncMock(return_value=workspace)
            resolved, decision = await service._require_workspace_capability(
                db=mock_db,
                workspace_uuid=WORKSPACE_ALPHA_UUID,
                current_user=_partner(role),
                capability=capability,
            )

        assert resolved == workspace
        assert decision.allowed is True
        assert decision.role is role

    @pytest.mark.asyncio
    async def test_cross_workspace_read_is_safe_not_found_before_repository_access(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as crud_workspaces:
            crud_workspaces.get = AsyncMock()
            with pytest.raises(NotFoundException, match="Workspace not found"):
                await service.list_workspace_application_information(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_BETA_UUID,
                    current_user=_partner(CanonicalRoleCode.READ_ONLY),
                )

        crud_workspaces.get.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_in_scope_read_only_mutation_is_forbidden_before_repository_access(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as crud_workspaces:
            crud_workspaces.get = AsyncMock()
            with pytest.raises(ForbiddenException, match="enough privileges"):
                await service._require_workspace_capability(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_ALPHA_UUID,
                    current_user=_partner(CanonicalRoleCode.READ_ONLY),
                    capability=Capability.RP_CONFIGURATION_WRITE,
                )

        crud_workspaces.get.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_legacy_superuser_and_workspace_member_state_are_not_authority(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()
        legacy_user = {
            "id": 9,
            "is_superuser": True,
            "workspace_role": "workspace_admin",
        }

        with patch("src.app.services.workspace_service.crud_workspaces") as crud_workspaces:
            crud_workspaces.get = AsyncMock()
            with pytest.raises(NotFoundException, match="Workspace not found"):
                await service.get_workspace_by_uuid(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_ALPHA_UUID,
                    current_user=legacy_user,
                )

        crud_workspaces.get.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_cl_admin_partner_mau_is_denied_before_external_call(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()
        ibm_service = Mock()
        ibm_service.get_application_total_logins = AsyncMock()

        with patch("src.app.services.workspace_service.crud_workspaces") as crud_workspaces:
            crud_workspaces.get = AsyncMock()
            with pytest.raises(ForbiddenException, match="enough privileges"):
                await service.get_workspace_rp_application_usage_summary(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_ALPHA_UUID,
                    rp_application_uuid=RP_APPLICATION_UUID,
                    current_user=_cl_admin(),
                    ibm_sv_admin_service=ibm_service,
                )

        crud_workspaces.get.assert_not_awaited()
        ibm_service.get_application_total_logins.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_cl_admin_can_read_cross_workspace_application_information_metadata(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()
        record = {
            "id": 17,
            "uuid": UUID("018f6f83-0000-0000-0000-000000000501"),
            "workspace_id": 7,
            "service_name_en": "Benefits",
        }

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as crud_workspaces,
            patch("src.app.services.workspace_service.crud_application_information") as crud_application_information,
        ):
            crud_workspaces.get = AsyncMock(return_value={"id": 7, "uuid": WORKSPACE_ALPHA_UUID})
            crud_application_information.get_multi = AsyncMock(return_value={"data": [record]})

            result = await service.list_workspace_application_information(
                db=mock_db,
                workspace_uuid=WORKSPACE_ALPHA_UUID,
                current_user=_cl_admin(),
            )

        assert result == [record]

    @pytest.mark.asyncio
    async def test_cl_admin_cannot_use_deprecated_partner_detail_to_read_questionnaire_answers(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()
        with patch.object(
            service,
            "_get_workspace_rp_application",
            new=AsyncMock(),
        ) as get_application:
            with pytest.raises(ForbiddenException):
                await service.get_workspace_rp_application(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_ALPHA_UUID,
                    rp_application_uuid=RP_APPLICATION_UUID,
                    current_user=_cl_admin(),
                )

        get_application.assert_not_awaited()


class TestPartnerSecretAuthorizationBoundary:
    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "current_user",
        [
            _cl_admin(),
            {
                "id": 3,
                AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(),
            },
            _partner(CanonicalRoleCode.READ_ONLY),
        ],
    )
    async def test_excluded_role_is_denied_before_any_verify_call(
        self,
        mock_db,
        current_user: dict,
    ) -> None:
        service = RPApplicationService()
        ibm_client = Mock()
        ibm_client.get_application_detail = AsyncMock()
        ibm_client.get_client_secret = AsyncMock()
        rp_application = {
            "id": 30,
            "uuid": RP_APPLICATION_UUID,
            "workspace_id": 7,
            "dnr_app_name": "Example RP",
            "ibm_sv_application_id": "verify-app-1",
        }

        with patch("src.app.services.rp_application_service.crud_rp_applications") as crud_rp_applications:
            crud_rp_applications.get = AsyncMock(return_value=rp_application)
            with pytest.raises(NotFoundException, match="RP application not found"):
                await service.get_accessible_rp_application_client_credentials(
                    db=mock_db,
                    rp_application_uuid=RP_APPLICATION_UUID,
                    current_user=current_user,
                    ibm_admin_client=ibm_client,
                )

        ibm_client.get_application_detail.assert_not_awaited()
        ibm_client.get_client_secret.assert_not_awaited()
