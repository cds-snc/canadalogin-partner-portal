from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from src.app.core.exceptions.http_exceptions import NotFoundException
from src.app.services.rp_application_service import RPApplicationService


@pytest.mark.asyncio
async def test_get_current_user_rp_application_by_uuid_returns_match(mock_db):
    service = RPApplicationService()
    application_uuid = uuid4()
    current_user = {"email": "owner@example.gc.ca"}
    ibm_user_service = object()
    service.list_current_user_rp_applications = AsyncMock(  # type: ignore[method-assign]
        return_value=[
            {
                "uuid": str(application_uuid),
                "dnr_app_name": "Test DNR App",
            }
        ]
    )

    result = await service.get_current_user_rp_application_by_uuid(
        db=mock_db,
        current_user=current_user,
        rp_application_uuid=application_uuid,
        ibm_user_service=ibm_user_service,  # type: ignore[arg-type]
    )

    assert result["dnr_app_name"] == "Test DNR App"
    service.list_current_user_rp_applications.assert_awaited_once_with(
        db=mock_db,
        current_user=current_user,
        ibm_user_service=ibm_user_service,
    )


@pytest.mark.asyncio
async def test_get_current_user_rp_application_by_uuid_raises_not_found(mock_db):
    service = RPApplicationService()
    service.list_current_user_rp_applications = AsyncMock(  # type: ignore[method-assign]
        return_value=[]
    )

    with pytest.raises(NotFoundException):
        await service.get_current_user_rp_application_by_uuid(
            db=mock_db,
            current_user={"email": "owner@example.gc.ca"},
            rp_application_uuid=uuid4(),
            ibm_user_service=object(),  # type: ignore[arg-type]
        )
