from unittest.mock import AsyncMock, Mock

import pytest
from src.app.api.v1.departments import (
    read_department,
    read_department_by_id,
    read_departments,
)
from src.app.main import app


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


class TestDepartmentRoutes:
    @pytest.mark.asyncio
    async def test_read_departments_delegates_to_service(self, mock_db):
        mock_service = Mock()
        mock_service.list_departments = AsyncMock(return_value={"data": []})

        result = await unwrap_endpoint(read_departments)(
            Mock(),
            mock_db,
            mock_service,
            page=1,
            items_per_page=10,
        )

        assert result == {"data": []}
        mock_service.list_departments.assert_awaited_once_with(
            db=mock_db,
            page=1,
            items_per_page=10,
        )

    @pytest.mark.asyncio
    async def test_read_department_references_delegate_to_service(self, mock_db):
        department_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501"
        mock_service = Mock()
        mock_service.get_department_by_uuid = AsyncMock(return_value={"uuid": department_uuid, "name": "Engineering"})
        mock_service.get_department_by_id = AsyncMock(
            return_value={
                "id": 7,
                "uuid": department_uuid,
                "name": "Engineering",
            }
        )

        read_result = await unwrap_endpoint(read_department)(
            Mock(),
            department_uuid,
            mock_db,
            mock_service,
        )
        read_by_id_result = await unwrap_endpoint(read_department_by_id)(
            Mock(),
            7,
            mock_db,
            mock_service,
        )

        assert read_result == {"uuid": department_uuid, "name": "Engineering"}
        assert read_by_id_result == {
            "id": 7,
            "uuid": department_uuid,
            "name": "Engineering",
        }

    def test_department_catalog_routes_are_read_only(self) -> None:
        paths = app.openapi()["paths"]

        assert set(paths["/api/v1/departments"]) == {"get"}
        assert set(paths["/api/v1/department/{department_uuid}"]) == {"get"}
        assert set(paths["/api/v1/departments/by-id/{department_id}"]) == {"get"}
