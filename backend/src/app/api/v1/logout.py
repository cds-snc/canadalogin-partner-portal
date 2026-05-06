from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_auth_service
from ...core.config import settings
from ...core.db.database import async_get_db
from ...core.security import optional_oauth2_scheme
from ...services.auth_service import AuthService

router = APIRouter(tags=["login"])


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    access_token: str | None = Depends(optional_oauth2_scheme),
    refresh_token: Optional[str] = Cookie(None, alias="refresh_token"),
    db: AsyncSession = Depends(async_get_db),
    service: AuthService = Depends(get_auth_service),
) -> dict[str, str]:
    result = await service.logout(request=request, access_token=access_token, refresh_token=refresh_token, db=db)
    if result.get("clear_cookies"):
        response.delete_cookie(
            key="refresh_token",
            httponly=True,
            secure=True,
            samesite="lax",
            path="/",
        )
        response.delete_cookie(
            key=settings.SESSION_COOKIE_NAME,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite="lax",
            path="/",
        )
    return {"message": result["message"]}
