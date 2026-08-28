from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID

import pytest
from src.app.core.authorization import CanonicalRoleCode
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)
from src.app.services.workspace_service import WorkspaceService

WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000201")
APPLICATION_UUID = UUID("018f6f83-0000-0000-0000-000000000401")


@pytest.mark.asyncio
async def test_cl_admin_checklist_is_status_only_and_excludes_contact_pii() -> None:
    service = WorkspaceService()
    db = Mock()
    db.execute = AsyncMock(
        return_value=Mock(
            all=Mock(
                return_value=[
                    (31, True),
                    (32, False),
                ]
            )
        )
    )
    application = {
        "id": 17,
        "uuid": APPLICATION_UUID,
        "workspace_id": 7,
        "service_name_en": "Benefits service",
        "service_name_fr": "Service de prestations",
        "overview": "Service overview",
        "technology_and_protocol": "OIDC",
        "security_and_privacy": "Protected B controls",
        "usage": "Public sign-in",
        "migration_or_transition_plan": "Phased migration",
    }
    current_user = {
        "id": 1,
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
    }

    with (
        patch("src.app.services.workspace_service.crud_workspaces") as workspaces,
        patch.object(
            service,
            "_get_workspace_application_information",
            new=AsyncMock(return_value=application),
        ),
    ):
        workspaces.get = AsyncMock(return_value={"id": 7, "uuid": WORKSPACE_UUID})
        result = await service.get_application_information_checklist(
            db=db,
            workspace_uuid=WORKSPACE_UUID,
            application_information_uuid=APPLICATION_UUID,
            current_user=current_user,
        )

    assert result["applicationNameEn"] == "Benefits service"
    assert result["applicationNameFr"] == "Service de prestations"
    assert result["catsEvidenceStatus"] == "not_configured"
    statuses = {item["key"]: item["status"] for item in result["items"]}
    assert statuses == {
        "service_identity": "provided",
        "business_context": "provided",
        "technical_integration": "provided",
        "security_posture": "provided",
        "migration_planning": "provided",
        "contacts": "attention_required",
    }
    serialized = str(result).lower()
    assert "email" not in serialized
    assert "first_name" not in serialized
    assert "last_name" not in serialized


@pytest.mark.asyncio
async def test_read_only_partner_can_read_the_status_only_checklist() -> None:
    service = WorkspaceService()
    db = Mock()
    db.execute = AsyncMock(return_value=Mock(all=Mock(return_value=[(31, True)])))
    application = {
        "id": 17,
        "uuid": APPLICATION_UUID,
        "workspace_id": 7,
        "service_name_en": "Benefits service",
        "service_name_fr": "Service de prestations",
        "overview": "Service overview",
        "technology_and_protocol": "OIDC",
        "security_and_privacy": "Protected B controls",
        "usage": "Public sign-in",
        "migration_or_transition_plan": "Phased migration",
    }
    current_user = {
        "id": 2,
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=7,
                    workspace_uuid=WORKSPACE_UUID,
                    role=CanonicalRoleCode.READ_ONLY,
                ),
            )
        ),
    }

    with (
        patch("src.app.services.workspace_service.crud_workspaces") as workspaces,
        patch.object(
            service,
            "_get_workspace_application_information",
            new=AsyncMock(return_value=application),
        ),
    ):
        workspaces.get = AsyncMock(return_value={"id": 7, "uuid": WORKSPACE_UUID})
        result = await service.get_application_information_checklist(
            db=db,
            workspace_uuid=WORKSPACE_UUID,
            application_information_uuid=APPLICATION_UUID,
            current_user=current_user,
        )

    assert result["applicationInformationUuid"] == APPLICATION_UUID
    assert result["catsEvidenceStatus"] == "not_configured"
    assert {item["key"]: item["status"] for item in result["items"]}["contacts"] == "provided"
    serialized = str(result).lower()
    assert "email" not in serialized
    assert "first_name" not in serialized
    assert "last_name" not in serialized
