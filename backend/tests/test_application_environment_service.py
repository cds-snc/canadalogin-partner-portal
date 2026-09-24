import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest

from src.app.core.exceptions.http_exceptions import NotFoundException
from src.app.services.application_environment_service import ApplicationEnvironmentService


@pytest.mark.asyncio
async def test_list_application_environments_returns_application_and_page(mock_db):
    application_uuid = uuid.uuid4()
    application = {
        "uuid": application_uuid,
        "name_en": "Example application",
        "name_fr": "Application exemple",
    }
    environments = {
        "data": [
            {
                "uuid": uuid.uuid4(),
                "partner_label": "Production",
                "tenant_code": "production",
                "status_code": "published",
                "created_at": datetime.now(UTC),
                "updated_at": None,
            }
        ],
        "total_count": 1,
    }

    with patch(
        "src.app.services.application_environment_service.application_environment_repository"
    ) as repository:
        repository.get_application_summary = AsyncMock(return_value=application)
        repository.list_environments = AsyncMock(return_value=environments)

        result = await ApplicationEnvironmentService().list_application_environments(
            db=mock_db,
            application_uuid=application_uuid,
            page=1,
            items_per_page=10,
        )

    assert result["application"] == application
    assert result["data"] == environments["data"]
    assert result["total_count"] == 1
    assert result["has_more"] is False
    repository.list_environments.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        offset=0,
        limit=10,
    )


@pytest.mark.asyncio
async def test_list_application_environments_rejects_unknown_application(mock_db):
    with patch(
        "src.app.services.application_environment_service.application_environment_repository"
    ) as repository:
        repository.get_application_summary = AsyncMock(return_value=None)
        repository.list_environments = AsyncMock()

        with pytest.raises(NotFoundException, match="Application not found"):
            await ApplicationEnvironmentService().list_application_environments(
                db=mock_db,
                application_uuid=uuid.uuid4(),
                page=1,
                items_per_page=10,
            )

    repository.list_environments.assert_not_awaited()