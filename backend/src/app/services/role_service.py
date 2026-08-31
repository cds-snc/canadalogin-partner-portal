import uuid as uuid_pkg
from typing import Any

from fastcrud import compute_offset, paginated_response
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions.http_exceptions import DuplicateValueException, NotFoundException
from ..repositories.crud_roles import crud_roles
from ..schemas.role import RoleCreate, RoleCreateInternal, RoleRead, RoleUpdate


class RoleService:
    async def create_role(self, db: AsyncSession, role: RoleCreate) -> dict[str, Any]:
        if await crud_roles.exists(db=db, name=role.name, is_deleted=False):
            raise DuplicateValueException("Role name not available")

        created_role = await crud_roles.create(
            db=db,
            object=RoleCreateInternal(**role.model_dump()),
            schema_to_select=RoleRead,
        )
        if created_role is None:
            raise NotFoundException("Failed to create role")
        return created_role

    async def list_roles(self, db: AsyncSession, page: int, items_per_page: int) -> dict[str, Any]:
        roles_data = await crud_roles.get_multi(
            db=db,
            offset=compute_offset(page, items_per_page),
            limit=items_per_page,
            is_deleted=False,
            schema_to_select=RoleRead,
        )
        return paginated_response(crud_data=roles_data, page=page, items_per_page=items_per_page)

    async def get_role_by_uuid(self, db: AsyncSession, role_uuid: uuid_pkg.UUID | str) -> dict[str, Any]:
        db_role = await crud_roles.get(db=db, uuid=role_uuid, is_deleted=False, schema_to_select=RoleRead)
        if db_role is None:
            raise NotFoundException("Role not found")
        return db_role

    async def update_role(self, db: AsyncSession, role_uuid: uuid_pkg.UUID | str, values: RoleUpdate) -> dict[str, str]:
        await self.get_role_by_uuid(db=db, role_uuid=role_uuid)
        await crud_roles.update(db=db, object=values, uuid=role_uuid)
        return {"message": "Role updated"}

    async def delete_role(self, db: AsyncSession, role_uuid: uuid_pkg.UUID | str) -> dict[str, str]:
        await self.get_role_by_uuid(db=db, role_uuid=role_uuid)
        await crud_roles.delete(db=db, uuid=role_uuid)
        return {"message": "Role deleted"}
