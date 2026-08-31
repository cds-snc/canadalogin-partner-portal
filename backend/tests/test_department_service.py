from unittest.mock import AsyncMock, patch

import pytest

from src.app.core.exceptions.http_exceptions import DuplicateValueException, NotFoundException
from src.app.schemas.department import DepartmentCreate, DepartmentUpdate
from src.app.services.department_service import DepartmentService


class TestDepartmentService:
	@pytest.mark.asyncio
	async def test_create_department_rejects_duplicate_name(self, mock_db) -> None:
		service = DepartmentService()

		with patch("src.app.services.department_service.crud_departments") as mock_departments:
			mock_departments.exists = AsyncMock(return_value=True)

			with pytest.raises(DuplicateValueException, match="Department name not available"):
				await service.create_department(db=mock_db, department=DepartmentCreate(name="Engineering"))

		mock_departments.exists.assert_awaited_once_with(db=mock_db, name="Engineering", is_deleted=False)

	@pytest.mark.asyncio
	async def test_list_departments_filters_out_soft_deleted_departments(self, mock_db) -> None:
		service = DepartmentService()

		with patch("src.app.services.department_service.crud_departments") as mock_departments:
			mock_departments.get_multi = AsyncMock(return_value={"data": [], "total_count": 0, "has_more": False, "page": 1, "items_per_page": 10})

			await service.list_departments(db=mock_db, page=1, items_per_page=10)

		mock_departments.get_multi.assert_awaited_once_with(
			db=mock_db,
			offset=0,
			limit=10,
			abbreviation__is_not=None,
			is_deleted=False,
			schema_to_select=service.list_departments.__globals__["DepartmentRead"],
		)

	@pytest.mark.asyncio
	async def test_get_department_by_uuid_raises_when_missing(self, mock_db) -> None:
		service = DepartmentService()

		with patch("src.app.services.department_service.crud_departments") as mock_departments:
			mock_departments.get = AsyncMock(return_value=None)

			with pytest.raises(NotFoundException, match="Department not found"):
				await service.get_department_by_uuid(db=mock_db, department_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501")

		mock_departments.get.assert_awaited_once_with(
			db=mock_db,
			uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501",
			is_deleted=False,
			schema_to_select=service.get_department_by_uuid.__globals__["DepartmentRead"],
		)

	@pytest.mark.asyncio
	async def test_update_department_updates_existing_department(self, mock_db) -> None:
		service = DepartmentService()
		department_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501"

		with patch("src.app.services.department_service.crud_departments") as mock_departments:
			mock_departments.get = AsyncMock(return_value={"id": 1, "uuid": department_uuid, "name": "Engineering"})
			mock_departments.update = AsyncMock(return_value=None)

			result = await service.update_department(
				db=mock_db,
				department_uuid=department_uuid,
				values=DepartmentUpdate(name="People Ops"),
			)

		assert result == {"message": "Department updated"}
