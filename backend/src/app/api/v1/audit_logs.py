import uuid as uuid_pkg
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_audit_service, get_current_user
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...schemas.audit_log import AuditLogRead
from ...services.audit_service import AuditService

router = APIRouter(tags=["audit-logs"])


@router.get("/audit-logs", response_model=PaginatedListResponse[AuditLogRead])
@casbin_guard.require_permission("audit_log", "read")
async def read_audit_logs(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[AuditService, Depends(get_audit_service)],
    current_user: Annotated[dict, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    items_per_page: int = Query(10, ge=1, le=100),
    user_uuid: uuid_pkg.UUID | None = Query(None),
    target: str | None = Query(None, max_length=128),
    operation: str | None = Query(None, max_length=16),
    target_uuid: uuid_pkg.UUID | None = Query(None),
    created_at_gte: datetime | None = Query(None),
    created_at_lte: datetime | None = Query(None),
) -> PaginatedListResponse[AuditLogRead]:
    return await service.list_audit_logs(
        db=db,
        page=page,
        items_per_page=items_per_page,
        user_uuid=user_uuid,
        target=target,
        operation=operation,
        target_uuid=target_uuid,
        created_at_gte=created_at_gte,
        created_at_lte=created_at_lte,
    )
