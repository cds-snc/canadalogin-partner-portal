from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

import pytest
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.exceptions.http_exceptions import NotFoundException
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)
from src.app.services.rp_application_service import RPApplicationService


@pytest.mark.asyncio
async def test_get_accessible_rp_application_by_uuid_returns_match(mock_db):
    service = RPApplicationService()
    application_uuid = uuid4()
    workspace_uuid = uuid4()
    application_information_uuid = uuid4()
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
    application_information_result = Mock()
    application_information_result.mappings.return_value.all.return_value = [
        {
            "id": 17,
            "uuid": application_information_uuid,
            "workspace_id": 23,
            "service_name_en": "Test service",
            "service_name_fr": "Service de test",
        }
    ]
    mock_db.execute = AsyncMock(return_value=application_information_result)

    with patch("src.app.services.rp_application_service.crud_rp_applications") as mock_crud:
        mock_crud.get = AsyncMock(
            return_value={
                "uuid": str(application_uuid),
                "workspace_id": 23,
                "application_information_id": 17,
                "dnr_app_name": "Test DNR App",
            }
        )

        result = await service.get_accessible_rp_application_by_uuid(
            db=mock_db,
            current_user=current_user,
            rp_application_uuid=application_uuid,
        )

    assert result["dnrAppName"] == "Test DNR App"
    assert result["workspaceUuid"] == workspace_uuid
    assert result["applicationInformationUuid"] == application_information_uuid
    mock_crud.get.assert_awaited_once()
    mock_crud.get_multi.assert_not_called()


@pytest.mark.asyncio
async def test_get_accessible_rp_application_by_uuid_raises_not_found(mock_db):
    service = RPApplicationService()
    with patch("src.app.services.rp_application_service.crud_rp_applications") as mock_crud:
        mock_crud.get = AsyncMock(return_value=None)

        with pytest.raises(NotFoundException):
            await service.get_accessible_rp_application_by_uuid(
                db=mock_db,
                current_user={"email": "owner@example.gc.ca"},
                rp_application_uuid=uuid4(),
            )

    mock_crud.get_multi.assert_not_called()
