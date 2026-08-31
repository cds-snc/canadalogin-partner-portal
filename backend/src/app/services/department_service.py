import uuid as uuid_pkg
from typing import Any

from fastcrud import compute_offset, paginated_response
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions.http_exceptions import DuplicateValueException, NotFoundException
from ..repositories.crud_departments import crud_departments
from ..schemas.department import DepartmentCreate, DepartmentCreateInternal, DepartmentRead, DepartmentUpdate


class DepartmentService:
    async def create_department(self, db: AsyncSession, department: DepartmentCreate) -> dict[str, Any]:
        if await crud_departments.exists(db=db, name=department.name, is_deleted=False):
            raise DuplicateValueException("Department name not available")
        if department.gc_org_id is not None and await crud_departments.exists(
            db=db,
            gc_org_id=department.gc_org_id,
            is_deleted=False,
        ):
            raise DuplicateValueException("Department gc_org_id not available")

        created_department = await crud_departments.create(
            db=db,
            object=DepartmentCreateInternal(**department.model_dump()),
            schema_to_select=DepartmentRead,
        )
        if created_department is None:
            raise NotFoundException("Failed to create department")
        return created_department

    async def list_departments(self, db: AsyncSession, page: int, items_per_page: int) -> dict[str, Any]:
        departments_data = await crud_departments.get_multi(
            db=db,
            offset=compute_offset(page, items_per_page),
            limit=items_per_page,
            abbreviation__is_not=None,
            is_deleted=False,
            schema_to_select=DepartmentRead,
        )
        return paginated_response(crud_data=departments_data, page=page, items_per_page=items_per_page)

    async def get_department_by_uuid(self, db: AsyncSession, department_uuid: uuid_pkg.UUID | str) -> dict[str, Any]:
        db_department = await crud_departments.get(
            db=db,
            uuid=department_uuid,
            is_deleted=False,
            schema_to_select=DepartmentRead,
        )
        if db_department is None:
            raise NotFoundException("Department not found")
        return db_department

    async def get_department_by_id(self, db: AsyncSession, department_id: int) -> dict[str, Any]:
        db_department = await crud_departments.get(
            db=db,
            id=department_id,
            is_deleted=False,
            schema_to_select=DepartmentRead,
        )
        if db_department is None:
            raise NotFoundException("Department not found")
        return db_department

    async def update_department(self, db: AsyncSession, department_uuid: uuid_pkg.UUID | str, values: DepartmentUpdate) -> dict[str, str]:
        await self.get_department_by_uuid(db=db, department_uuid=department_uuid)
        await crud_departments.update(db=db, object=values, uuid=department_uuid)
        return {"message": "Department updated"}

    async def delete_department(self, db: AsyncSession, department_uuid: uuid_pkg.UUID | str) -> dict[str, str]:
        await self.get_department_by_uuid(db=db, department_uuid=department_uuid)
        await crud_departments.delete(db=db, uuid=department_uuid)
        return {"message": "Department deleted"}
