from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.departments import (
	erase_department,
	patch_department,
	read_department,
	read_departments,
	write_department,
)
from src.app.schemas.department import DepartmentCreate, DepartmentUpdate


def unwrap_endpoint(endpoint):
	current = endpoint
	while hasattr(current, "__wrapped__"):
		current = current.__wrapped__
	return current


class TestDepartmentRoutes:
	@pytest.mark.asyncio
	async def test_create_department_delegates_to_service(self, mock_db):
		mock_service = Mock()
		mock_service.create_department = AsyncMock(
			return_value={"uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501", "name": "Engineering", "created_at": "2026-03-23T00:00:00"}
		)

		result = await unwrap_endpoint(write_department)(Mock(), DepartmentCreate(name="Engineering"), mock_db, mock_service)

		assert result["name"] == "Engineering"
		mock_service.create_department.assert_awaited_once()

	@pytest.mark.asyncio
	async def test_read_departments_delegates_to_service(self, mock_db):
		mock_service = Mock()
		mock_service.list_departments = AsyncMock(return_value={"data": []})

		result = await unwrap_endpoint(read_departments)(Mock(), mock_db, mock_service, page=1, items_per_page=10)

		assert result == {"data": []}
		mock_service.list_departments.assert_awaited_once_with(db=mock_db, page=1, items_per_page=10)

	@pytest.mark.asyncio
	async def test_read_patch_delete_department_delegate_to_service(self, mock_db):
		department_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501"
		mock_service = Mock()
		mock_service.get_department_by_uuid = AsyncMock(return_value={"uuid": department_uuid, "name": "Engineering"})
		mock_service.update_department = AsyncMock(return_value={"message": "Department updated"})
		mock_service.delete_department = AsyncMock(return_value={"message": "Department deleted"})

		read_result = await unwrap_endpoint(read_department)(Mock(), department_uuid, mock_db, mock_service)
		patch_result = await unwrap_endpoint(patch_department)(Mock(), department_uuid, DepartmentUpdate(name="People Ops"), mock_db, mock_service)
		delete_result = await unwrap_endpoint(erase_department)(Mock(), department_uuid, mock_db, mock_service)

		assert read_result == {"uuid": department_uuid, "name": "Engineering"}
		assert patch_result == {"message": "Department updated"}
		assert delete_result == {"message": "Department deleted"}
