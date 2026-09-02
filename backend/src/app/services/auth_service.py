from typing import Any

from jwt import PyJWTError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request
from starsessions import get_session_id

from ..core.config import settings
from ..core.exceptions.http_exceptions import UnauthorizedException
from ..core.logger import logging
from ..core.oidc import get_oidc_client
from ..core.security import (
    TokenType,
    create_access_token,
    verify_token,
)
from .concurrent_session_service import ConcurrentSessionService
from .oidc_logout_service import OidcLogoutService

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(
        self,
        logout_service: OidcLogoutService | None = None,
        session_service: ConcurrentSessionService | None = None,
    ) -> None:
        self.logout_service = logout_service or OidcLogoutService()
        self.session_service = session_service or ConcurrentSessionService()

    async def refresh_access_token(self, request: Request, db: AsyncSession) -> dict[str, str]:
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise UnauthorizedException("Refresh token missing.")

        user_data = await verify_token(refresh_token, TokenType.REFRESH, db)
        if not user_data:
            raise UnauthorizedException("Invalid refresh token.")

        new_access_token = await create_access_token(data={"sub": user_data.subject})
        return {"access_token": new_access_token, "token_type": "bearer"}

    async def logout(
        self,
        request: Request,
    ) -> dict[str, Any]:
        try:
            oidc_logout = None
            user_uuid = None
            session_id = None
            try:
                oidc_logout = request.session.get("oidc_logout")
                user_uuid = request.session.get("user_uuid")
                session_id = get_session_id(request)
            except (AssertionError, KeyError, TypeError):
                pass
            try:
                request.session.clear()
            except AssertionError:
                pass

            if user_uuid and session_id:
                await self.session_service.remove_session(session_id)

            payload = {
                "message": "Logged out successfully",
                "clear_cookies": True,
            }
            oidc_logout_payload = await self._build_oidc_logout_payload(oidc_logout)
            if oidc_logout_payload is not None:
                payload["oidc_logout"] = oidc_logout_payload

            if request.session == {}:
                if user_uuid:
                    logger.info("user logout: %s", user_uuid)
                return payload

            raise UnauthorizedException("No authenticated session found.")
        except PyJWTError:
            raise UnauthorizedException("Invalid token.")

    async def _build_oidc_logout_payload(self, oidc_logout: dict[str, Any] | None) -> dict[str, Any] | None:
        if not oidc_logout:
            return None

        client = get_oidc_client()
        metadata = await client.load_server_metadata()
        end_session_endpoint = metadata.get("end_session_endpoint")
        if not end_session_endpoint:
            return None

        return {
            "end_session_endpoint": end_session_endpoint,
            "id_token_hint": oidc_logout.get("id_token"),
            "post_logout_redirect_uri": settings.OIDC_POST_LOGOUT_REDIRECT_URI,
        }
