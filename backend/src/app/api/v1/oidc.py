from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_oidc_service
from ...core.db.database import async_get_db
from ...services.oidc_service import OidcService

router = APIRouter(prefix="/auth/oidc", tags=["oidc"])


@router.get("/login")
async def oidc_login(request: Request, service: Annotated[OidcService, Depends(get_oidc_service)]):
    return await service.login(request)


@router.get("/callback")
async def oidc_callback(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[OidcService, Depends(get_oidc_service)],
):
    return await service.callback(request=request, db=db)
