import uuid as uuid_pkg
from datetime import datetime
from typing import Any

from fastcrud import compute_offset, paginated_response
from sqlalchemy.ext.asyncio import AsyncSession

from ..repositories.crud_audit_log import crud_audit_log
from ..schemas.audit_log import AuditLogCreateInternal, AuditLogRead


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

    async def list_audit_logs(
        self,
        db: AsyncSession,
        page: int,
        items_per_page: int,
        user_uuid: uuid_pkg.UUID | None = None,
        target: str | None = None,
        operation: str | None = None,
        target_uuid: uuid_pkg.UUID | None = None,
        created_at_gte: datetime | None = None,
        created_at_lte: datetime | None = None,
    ) -> dict[str, Any]:
        filters: dict[str, Any] = {}
        if user_uuid is not None:
            filters["user_uuid"] = user_uuid
        if target is not None:
            filters["target"] = target
        if operation is not None:
            filters["operation"] = operation
        if target_uuid is not None:
            filters["target_uuid"] = target_uuid
        if created_at_gte is not None:
            filters["created_at__gte"] = created_at_gte
        if created_at_lte is not None:
            filters["created_at__lte"] = created_at_lte

        audit_logs_data = await crud_audit_log.get_multi(
            db=db,
            offset=compute_offset(page, items_per_page),
            limit=items_per_page,
            schema_to_select=AuditLogRead,
            **filters,
        )
        return paginated_response(crud_data=audit_logs_data, page=page, items_per_page=items_per_page)
