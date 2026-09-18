import uuid as uuid_pkg
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.application import Application
from ..models.partner_group import PartnerGroup
from ..models.partner_group_role import PartnerGroupRole
from ..models.role import Role
from ..models.user import User
from ..models.user_role import UserRole


class PartnerGroupRoleRepository:
    async def get_active_user_roles_for_partner_group(
        self,
        db: AsyncSession,
        user_uuid: uuid_pkg.UUID | str,
        partner_group_uuid: uuid_pkg.UUID | str,
    ) -> list[dict[str, Any]]:
        user_id = await self._get_active_user_id(db=db, user_uuid=user_uuid)
        if user_id is None:
            return []

        partner_group_id = await self._get_active_partner_group_id(
            db=db,
            partner_group_uuid=partner_group_uuid,
        )
        if partner_group_id is None:
            return []

        statement = (
            select(
                Role.id,
                Role.uuid,
                Role.name,
                Role.description,
                Role.created_at,
                Role.updated_at,
                Role.deleted_at,
                Role.is_deleted,
            )
            .join(UserRole, UserRole.role_id == Role.id)
            .join(PartnerGroupRole, PartnerGroupRole.role_id == Role.id)
            .where(
                UserRole.user_id == user_id,
                UserRole.is_deleted.is_(False),
                PartnerGroupRole.partner_group_id == partner_group_id,
                PartnerGroupRole.is_deleted.is_(False),
                Role.is_deleted.is_(False),
            )
            .distinct()
        )
        result = await db.execute(statement)
        return [dict(row) for row in result.mappings().all()]

    async def get_active_application_partner_group_uuid(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID | str,
    ) -> uuid_pkg.UUID | None:
        statement = (
            select(PartnerGroup.uuid)
            .join(Application, Application.partner_group_id == PartnerGroup.id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                PartnerGroup.is_deleted.is_(False),
            )
        )
        return (await db.execute(statement)).scalar_one_or_none()

    async def active_user_exists(self, db: AsyncSession, user_uuid: uuid_pkg.UUID | str) -> bool:
        return await self._get_active_user_id(db=db, user_uuid=user_uuid) is not None

    async def active_partner_group_exists(
        self,
        db: AsyncSession,
        partner_group_uuid: uuid_pkg.UUID | str,
    ) -> bool:
        return (
            await self._get_active_partner_group_id(
                db=db,
                partner_group_uuid=partner_group_uuid,
            )
        ) is not None

    async def _get_active_user_id(self, db: AsyncSession, user_uuid: uuid_pkg.UUID | str) -> int | None:
        statement = select(User.id).where(User.uuid == user_uuid, User.is_deleted.is_(False))
        return (await db.execute(statement)).scalar_one_or_none()

    async def _get_active_partner_group_id(
        self,
        db: AsyncSession,
        partner_group_uuid: uuid_pkg.UUID | str,
    ) -> int | None:
        statement = select(PartnerGroup.id).where(
            PartnerGroup.uuid == partner_group_uuid,
            PartnerGroup.is_deleted.is_(False),
        )
        return (await db.execute(statement)).scalar_one_or_none()


partner_group_role_repository = PartnerGroupRoleRepository()
