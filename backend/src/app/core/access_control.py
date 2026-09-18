from pathlib import Path
from typing import Annotated

from casbin_fastapi_decorator import PermissionGuard
from casbin_fastapi_decorator_db import DatabaseEnforcerProvider
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..api.dependencies import get_current_user
from ..models.access_policy import AccessPolicy
from ..models.role import Role
from ..models.user_role import UserRole
from ..services.partner_group_role_service import PartnerGroupRoleService
from .db.database import async_get_db, local_session
from .exceptions.http_exceptions import ForbiddenException

CASBIN_MODEL_PATH = Path(__file__).with_name("casbin_model.conf")


async def get_casbin_subject(
    current_user: dict,
    db: AsyncSession,
    resource: str,
    action: str,
) -> str:
    if current_user.get("is_superuser"):
        return "admin"

    statement = (
        select(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .join(AccessPolicy, AccessPolicy.subject == Role.name)
        .where(
            UserRole.user_id == current_user["id"],
            UserRole.is_deleted.is_(False),
            Role.is_deleted.is_(False),
            AccessPolicy.resource == resource,
            AccessPolicy.action == action,
            AccessPolicy.is_deleted.is_(False),
        )
        .limit(1)
    )
    subject = (await db.execute(statement)).scalar_one_or_none()
    if subject is not None:
        return str(subject)

    return "anonymous"


def casbin_error_factory(_user: str, *_args: object) -> Exception:
    return ForbiddenException("You do not have enough privileges.")


database_enforcer_provider = DatabaseEnforcerProvider(
    model_path=CASBIN_MODEL_PATH,
    session_factory=local_session,
    policy_model=AccessPolicy,
    policy_mapper=lambda policy: (policy.subject, policy.resource, policy.action),
    default_policies=[("admin", "*", ".*")],
)

class CasbinPermissionGuard:
    def require_permission(self, resource: str, action: str):
        async def user_provider(
            current_user: Annotated[dict, Depends(get_current_user)],
            db: Annotated[AsyncSession, Depends(async_get_db)],
        ) -> str:
            return await get_casbin_subject(
                current_user=current_user,
                db=db,
                resource=resource,
                action=action,
            )

        return PermissionGuard(
            user_provider=user_provider,
            enforcer_provider=database_enforcer_provider,
            error_factory=casbin_error_factory,
        ).require_permission(resource, action)

    def require_application_permission(self, resource: str, action: str):
        async def user_provider(
            application_uuid: str,
            current_user: Annotated[dict, Depends(get_current_user)],
            db: Annotated[AsyncSession, Depends(async_get_db)],
        ) -> str:
            roles = await PartnerGroupRoleService().get_user_roles_for_application(
                db=db,
                user_uuid=current_user["uuid"],
                application_uuid=application_uuid,
            )
            role_names = [str(role["name"]) for role in roles]
            if not role_names:
                return "anonymous"

            statement = select(AccessPolicy.subject).where(
                AccessPolicy.subject.in_(role_names),
                AccessPolicy.resource == resource,
                AccessPolicy.action == action,
                AccessPolicy.is_deleted.is_(False),
            )
            subject = (await db.execute(statement)).scalar_one_or_none()
            return str(subject) if subject is not None else "anonymous"

        return PermissionGuard(
            user_provider=user_provider,
            enforcer_provider=database_enforcer_provider,
            error_factory=casbin_error_factory,
        ).require_permission(resource, action)


casbin_guard = CasbinPermissionGuard()
