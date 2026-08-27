from urllib.parse import urlencode

from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request
from starsessions.session import generate_session_id, get_session_handler

from ..core.config import LOCAL_DEV_SESSION_FIXTURE_KEY, settings
from ..core.exceptions.http_exceptions import ForbiddenException, UnauthorizedException
from ..core.identity import (
    SESSION_AUTHENTICATED_EMAIL_KEY,
    SESSION_AUTHENTICATED_EMAIL_VERIFIED_KEY,
    SESSION_AUTHENTICATION_PROVIDER_KEY,
    resolve_verified_email_claim,
)
from ..core.logger import logging
from ..core.oidc import build_oidc_redirect_uri, get_oidc_client, load_oidc_server_metadata, sync_oidc_user
from .oidc_logout_service import OidcLogoutService

logger = logging.getLogger(__name__)


class OidcService:
    def __init__(self, logout_service: OidcLogoutService | None = None) -> None:
        self.logout_service = logout_service or OidcLogoutService()

    async def login(self, request: Request, ui_locales: str | None = None, redirect: str | None = None):
        client = get_oidc_client()
        await load_oidc_server_metadata(client)
        redirect_uri = build_oidc_redirect_uri(request)
        if redirect:
            request.session["post_login_redirect"] = redirect
        if ui_locales:
            request.session["ui_locales"] = ui_locales
            return await client.authorize_redirect(request, redirect_uri, ui_locales=ui_locales)
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
        try:
            handler = get_session_handler(request)
            handler.session_id = claims.get("sid") or generate_session_id()
        except (AssertionError, KeyError, TypeError):
            pass
        request.session.pop(LOCAL_DEV_SESSION_FIXTURE_KEY, None)
        request.session["user_uuid"] = str(oidc_user["uuid"])
        request.session["tokens"] = {key: value for key, value in token.items() if key != "userinfo"}
        verified_email = resolve_verified_email_claim(claims)
        if verified_email is None:
            request.session.pop(SESSION_AUTHENTICATED_EMAIL_KEY, None)
            request.session.pop(SESSION_AUTHENTICATED_EMAIL_VERIFIED_KEY, None)
            request.session.pop(SESSION_AUTHENTICATION_PROVIDER_KEY, None)
        else:
            request.session[SESSION_AUTHENTICATED_EMAIL_KEY] = verified_email
            request.session[SESSION_AUTHENTICATED_EMAIL_VERIFIED_KEY] = True
            request.session[SESSION_AUTHENTICATION_PROVIDER_KEY] = settings.OIDC_PROVIDER_NAME
        request.session["oidc_logout"] = {
            "sid": claims.get("sid"),
            "sub": claims.get("sub"),
            "issuer": client.server_metadata.get("issuer"),
            "id_token": token.get("id_token"),
        }
        ui_locales = request.session.pop("ui_locales", None)
        redirect = request.session.pop("post_login_redirect", None)
        post_login_url = settings.OIDC_POST_LOGIN_REDIRECT
        query_params: dict[str, str] = {}
        if ui_locales:
            query_params["ui_locales"] = ui_locales
        if redirect:
            query_params["redirect"] = redirect
        if query_params:
            post_login_url = f"{post_login_url}?{urlencode(query_params)}"
        logger.info("user login: %s", oidc_user["uuid"])
        return RedirectResponse(url=post_login_url)

    async def backchannel_logout(self, logout_token: str) -> dict[str, str]:
        claims = await self.logout_service.validate_logout_token(logout_token)
        sid = claims.get("sid")
        if not sid:
            raise UnauthorizedException("Invalid logout token.")

        await self.logout_service.remove_local_session(sid)
        return {"message": "Backchannel logout processed"}
