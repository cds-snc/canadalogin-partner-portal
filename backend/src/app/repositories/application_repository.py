import uuid as uuid_pkg
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.application import Application
from ..models.application_configuration import ApplicationConfiguration
from ..models.partner_group import PartnerGroup
from ..models.partner_group_role import PartnerGroupRole
from ..models.role import Role
from ..models.user import User
from ..models.user_role import UserRole

PARTNER_DEVELOPER_ROLE = "Partner Developer"


class ApplicationRepository:
    async def list_for_user(
        self,
        db: AsyncSession,
        user_uuid: uuid_pkg.UUID | str,
        offset: int,
        limit: int,
    ) -> dict[str, Any]:
        environment_counts = (
            select(
                ApplicationConfiguration.application_id.label("application_id"),
                func.count(ApplicationConfiguration.id).label("environment_count"),
            )
            .where(ApplicationConfiguration.is_deleted.is_(False))
            .group_by(ApplicationConfiguration.application_id)
            .subquery()
        )
        conditions = self._access_conditions(user_uuid)
        statement = (
            self._with_access_joins(
                select(
                    Application.uuid,
                    Application.name_en,
                    Application.name_fr,
                    func.coalesce(environment_counts.c.environment_count, 0).label("environment_count"),
                )
            )
            .outerjoin(environment_counts, environment_counts.c.application_id == Application.id)
            .where(*conditions)
            .distinct()
            .order_by(Application.name_en.asc(), Application.uuid.asc())
            .offset(offset)
            .limit(limit)
        )
        count_statement = (
            self._with_access_joins(select(func.count(func.distinct(Application.id))))
            .where(*conditions)
        )

        applications = (await db.execute(statement)).mappings().all()
        total_count = (await db.execute(count_statement)).scalar_one()
        return {
            "data": [dict(application) for application in applications],
            "total_count": int(total_count),
        }

    @staticmethod
    def _with_access_joins(statement: Any) -> Any:
        return (
            statement.select_from(Application)
            .join(PartnerGroup, PartnerGroup.id == Application.partner_group_id)
            .join(PartnerGroupRole, PartnerGroupRole.partner_group_id == PartnerGroup.id)
            .join(Role, Role.id == PartnerGroupRole.role_id)
            .join(UserRole, UserRole.role_id == Role.id)
            .join(User, User.id == UserRole.user_id)
        )

    @staticmethod
    def _access_conditions(user_uuid: uuid_pkg.UUID | str) -> tuple[Any, ...]:
        return (
            User.uuid == user_uuid,
            User.is_deleted.is_(False),
            UserRole.is_deleted.is_(False),
            PartnerGroupRole.is_deleted.is_(False),
            Role.name == PARTNER_DEVELOPER_ROLE,
            Role.is_deleted.is_(False),
            PartnerGroup.is_deleted.is_(False),
            Application.is_deleted.is_(False),
        )


application_repository = ApplicationRepository()
