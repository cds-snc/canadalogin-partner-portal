from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request
from starsessions.session import regenerate_session_id

from ..core.config import settings
from ..core.exceptions.http_exceptions import ForbiddenException
from ..core.oidc import build_oidc_redirect_uri, get_oidc_client, sync_oidc_user


class OidcService:
    async def login(self, request: Request):
        client = get_oidc_client()
        redirect_uri = build_oidc_redirect_uri(request)
        return await client.authorize_redirect(request, redirect_uri)

    async def callback(self, request: Request, db: AsyncSession):
        client = get_oidc_client()
        token = await client.authorize_access_token(request)
        claims = token.get("userinfo", {})
        try:
            oidc_user = await sync_oidc_user(db, claims)
        except ForbiddenException:
            return RedirectResponse(url=settings.OIDC_ACCESS_DENIED_REDIRECT)
        regenerate_session_id(request)
        request.session["user_uuid"] = str(oidc_user["uuid"])
        request.session["tokens"] = token
        return RedirectResponse(url=settings.OIDC_POST_LOGIN_REDIRECT)
