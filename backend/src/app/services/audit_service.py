import uuid as uuid_pkg

from sqlalchemy.ext.asyncio import AsyncSession

from ..repositories.crud_audit_log import crud_audit_log
from ..schemas.audit_log import AuditLogCreateInternal


class AuditService:
    async def log_action(
        self,
        db: AsyncSession,
        user: str,
        target: str,
        operation: str,
        description: str,
        user_uuid: uuid_pkg.UUID | None = None,
        target_uuid: uuid_pkg.UUID | None = None,
    ) -> None:
        await crud_audit_log.create(
            db=db,
            object=AuditLogCreateInternal(
                user=user,
                user_uuid=user_uuid,
                target=target,
                target_uuid=target_uuid,
                operation=operation,
                description=description,
            ),
        )
