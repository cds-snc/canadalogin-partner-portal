import uuid as uuid_pkg
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions.http_exceptions import NotFoundException
from ..repositories.partner_group_role_repository import partner_group_role_repository


class PartnerGroupRoleService:
    async def get_user_roles_for_partner_group(
        self,
        db: AsyncSession,
        user_uuid: uuid_pkg.UUID | str,
        partner_group_uuid: uuid_pkg.UUID | str,
    ) -> list[dict[str, Any]]:
        if not await partner_group_role_repository.active_user_exists(
            db=db,
            user_uuid=user_uuid,
        ):
            raise NotFoundException("User not found")

        if not await partner_group_role_repository.active_partner_group_exists(
            db=db,
            partner_group_uuid=partner_group_uuid,
        ):
            raise NotFoundException("Partner group not found")

        return await partner_group_role_repository.get_active_user_roles_for_partner_group(
            db=db,
            user_uuid=user_uuid,
            partner_group_uuid=partner_group_uuid,
        )

    async def get_user_roles_for_application(
        self,
        db: AsyncSession,
        user_uuid: uuid_pkg.UUID | str,
        application_uuid: uuid_pkg.UUID | str,
    ) -> list[dict[str, Any]]:
        partner_group_uuid = await partner_group_role_repository.get_active_application_partner_group_uuid(
            db=db,
            application_uuid=application_uuid,
        )
        if partner_group_uuid is None:
            raise NotFoundException("Application not found")

        return await self.get_user_roles_for_partner_group(
            db=db,
            user_uuid=user_uuid,
            partner_group_uuid=partner_group_uuid,
        )

    async def user_has_role_for_partner_group(
        self,
        db: AsyncSession,
        user_uuid: uuid_pkg.UUID | str,
        partner_group_uuid: uuid_pkg.UUID | str,
    ) -> bool:
        return bool(
            await self.get_user_roles_for_partner_group(
                db=db,
                user_uuid=user_uuid,
                partner_group_uuid=partner_group_uuid,
            )
        )

    async def user_has_role_for_application(
        self,
        db: AsyncSession,
        user_uuid: uuid_pkg.UUID | str,
        application_uuid: uuid_pkg.UUID | str,
    ) -> bool:
        return bool(
            await self.get_user_roles_for_application(
                db=db,
                user_uuid=user_uuid,
                application_uuid=application_uuid,
            )
        )
