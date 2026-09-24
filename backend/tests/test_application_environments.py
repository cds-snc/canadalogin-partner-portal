import uuid
from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.application_environments import read_application_environments


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


@pytest.mark.asyncio
async def test_read_application_environments_delegates_to_service(mock_db):
    application_uuid = uuid.uuid4()
    expected = {
        "application": {
            "uuid": application_uuid,
            "name_en": "Example application",
            "name_fr": None,
        },
        "data": [],
        "total_count": 0,
        "has_more": False,
        "page": 1,
        "items_per_page": 10,
    }
    mock_service = Mock()
    mock_service.list_application_environments = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(read_application_environments)(
        Mock(),
        application_uuid,
        mock_db,
        mock_service,
        page=1,
        items_per_page=10,
    )

    assert result == expected
    mock_service.list_application_environments.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        page=1,
        items_per_page=10,
    )