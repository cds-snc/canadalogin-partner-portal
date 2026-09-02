
from authlib.integrations.base_client.errors import MismatchingStateError
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request
from starsessions import get_session_id, regenerate_session_id

from ..core.config import settings
from ..core.exceptions.http_exceptions import ForbiddenException, UnauthorizedException
from ..core.logger import logging
from ..core.oidc import build_oidc_redirect_uri, get_oidc_client, sync_oidc_user
from .concurrent_session_service import ConcurrentSessionService
from .oidc_logout_service import OidcLogoutService

logger = logging.getLogger(__name__)


class OidcService:
    def __init__(
        self,
        logout_service: OidcLogoutService | None = None,
        session_service: ConcurrentSessionService | None = None,
    ) -> None:
        self.logout_service = logout_service or OidcLogoutService()
        self.session_service = session_service or ConcurrentSessionService()

    async def login(self, request: Request, ui_locales: str | None = None):
        client = get_oidc_client()
        redirect_uri = build_oidc_redirect_uri(request)
        if ui_locales:
            request.session["ui_locales"] = ui_locales
            return await client.authorize_redirect(request, redirect_uri, ui_locales=ui_locales)
        return await client.authorize_redirect(request, redirect_uri)

    @staticmethod
    def _store_oidc_logout_context(request: Request, client, token: dict, claims: dict) -> None:
        request.session.clear()
        request.session["oidc_logout"] = {
            "sid": claims.get("sid"),
            "sub": claims.get("sub"),
            "issuer": client.server_metadata.get("issuer"),
            "id_token": token.get("id_token"),
        }

    async def callback(self, request: Request, db: AsyncSession):
        client = get_oidc_client()
        try:
            token = await client.authorize_access_token(request)
        except MismatchingStateError:
            request.session.clear()
            return RedirectResponse(url="/api/v1/auth/oidc/login")
        claims = token.get("userinfo", {})
        try:
            oidc_user = await sync_oidc_user(db, claims)
        except ForbiddenException:
            self._store_oidc_logout_context(request, client, token, claims)
            return RedirectResponse(url=settings.OIDC_ACCESS_DENIED_REDIRECT)
        try:
            pre_auth_session_id = get_session_id(request)
            session_id = regenerate_session_id(request)
        except (AssertionError, KeyError, TypeError):
            request.session.clear()
            return RedirectResponse(url=settings.OIDC_ACCESS_DENIED_REDIRECT)

        is_reserved = await self.session_service.reserve(
            str(oidc_user["uuid"]),
            session_id,
            claims.get("sid"),
        )
        if not is_reserved:
            self._store_oidc_logout_context(request, client, token, claims)
            if pre_auth_session_id:
                await self.logout_service.remove_local_session(pre_auth_session_id)
            logger.warning("concurrent session limit reached: %s", oidc_user["uuid"])
            return RedirectResponse(
                url=f"{settings.OIDC_ACCESS_DENIED_REDIRECT}?reason=concurrent-session-limit"
            )

        if pre_auth_session_id and pre_auth_session_id != session_id:
            await self.session_service.session_store.remove(pre_auth_session_id)

        request.session["user_uuid"] = str(oidc_user["uuid"])
        request.session["tokens"] = token
        request.session["oidc_logout"] = {
            "sid": claims.get("sid"),
            "sub": claims.get("sub"),
            "issuer": client.server_metadata.get("issuer"),
            "id_token": token.get("id_token"),
        }
        ui_locales = request.session.pop("ui_locales", None)
        post_login_url = settings.OIDC_POST_LOGIN_REDIRECT
        if ui_locales:
            post_login_url = f"{post_login_url}?ui_locales={ui_locales}"
        logger.info("user login: %s", oidc_user["uuid"])
        return RedirectResponse(url=post_login_url)

    async def backchannel_logout(self, logout_token: str) -> dict[str, str]:
        claims = await self.logout_service.validate_logout_token(logout_token)
        sid = claims.get("sid")
        if not sid:
            raise UnauthorizedException("Invalid logout token.")

        await self.session_service.remove_oidc_sessions(sid)
        return {"message": "Backchannel logout processed"}
