import uuid
from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.api.v1.applications import read_current_user_applications
from src.app.services.application_service import ApplicationService


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


@pytest.mark.asyncio
async def test_read_current_user_applications_delegates_to_service(mock_db):
    user_uuid = uuid.uuid4()
    expected = {
        "data": [],
        "total_count": 0,
        "has_more": False,
        "page": 1,
        "items_per_page": 10,
    }
    mock_service = Mock()
    mock_service.list_current_user_applications = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(read_current_user_applications)(
        Mock(),
        mock_db,
        {"uuid": user_uuid},
        mock_service,
        page=1,
        items_per_page=10,
    )

    assert result == expected
    mock_service.list_current_user_applications.assert_awaited_once_with(
        db=mock_db,
        user_uuid=user_uuid,
        page=1,
        items_per_page=10,
    )


@pytest.mark.asyncio
async def test_application_service_uses_server_pagination(mock_db):
    applications = [
        {
            "uuid": uuid.uuid4(),
            "name_en": f"Application {application_number}",
            "environment_count": 0,
        }
        for application_number in range(1, 16)
    ]
    with patch(
        "src.app.services.application_service.application_repository"
    ) as repository:
        repository.list_for_user = AsyncMock(
            side_effect=(
                {
                    "data": applications[:10],
                    "total_count": len(applications),
                },
                {
                    "data": applications[10:],
                    "total_count": len(applications),
                },
            )
        )

        service = ApplicationService()
        first_page = await service.list_current_user_applications(
            db=mock_db,
            user_uuid=uuid.uuid4(),
            page=1,
            items_per_page=10,
        )
        second_page = await service.list_current_user_applications(
            db=mock_db,
            user_uuid=uuid.uuid4(),
            page=2,
            items_per_page=10,
        )

    assert len(first_page["data"]) == 10
    assert first_page["page"] == 1
    assert first_page["items_per_page"] == 10
    assert first_page["total_count"] == 15
    assert first_page["has_more"] is True
    assert len(second_page["data"]) == 5
    assert second_page["page"] == 2
    assert second_page["items_per_page"] == 10
    assert second_page["total_count"] == 15
    assert second_page["has_more"] is False
    assert repository.list_for_user.await_count == 2
    assert repository.list_for_user.await_args_list[0].kwargs["offset"] == 0
    assert repository.list_for_user.await_args_list[0].kwargs["limit"] == 10
    assert repository.list_for_user.await_args_list[1].kwargs["offset"] == 10
    assert repository.list_for_user.await_args_list[1].kwargs["limit"] == 10
