from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request
from starsessions.session import get_session_id, regenerate_session_id

from ..core.config import settings
from ..core.exceptions.http_exceptions import ForbiddenException, UnauthorizedException
from ..core.oidc import build_oidc_redirect_uri, get_oidc_client, sync_oidc_user
from .oidc_logout_service import OidcLogoutService


class OidcService:
    def __init__(self, logout_service: OidcLogoutService | None = None) -> None:
        self.logout_service = logout_service or OidcLogoutService()

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
            request.session.clear()
            return RedirectResponse(url=settings.OIDC_ACCESS_DENIED_REDIRECT)
        regenerate_session_id(request)
        try:
            session_id = get_session_id(request)
        except (AssertionError, KeyError, TypeError):
            session_id = None
        request.session["user_uuid"] = str(oidc_user["uuid"])
        request.session["tokens"] = token
        request.session["oidc_logout"] = {
            "sid": claims.get("sid"),
            "sub": claims.get("sub"),
            "issuer": client.server_metadata.get("issuer"),
            "id_token": token.get("id_token"),
        }
        if claims.get("sid") and session_id:
            await self.logout_service.store_session(claims["sid"], session_id)
        return RedirectResponse(url=settings.OIDC_POST_LOGIN_REDIRECT)

    async def backchannel_logout(self, logout_token: str) -> dict[str, str]:
        claims = await self.logout_service.validate_logout_token(logout_token)
        sid = claims.get("sid")
        if not sid:
            raise UnauthorizedException("Invalid logout token.")

        session_id = await self.logout_service.get_session_id(sid)
        if session_id:
            await self.logout_service.remove_local_session(session_id)
        await self.logout_service.remove_session(sid)
        return {"message": "Backchannel logout processed"}
