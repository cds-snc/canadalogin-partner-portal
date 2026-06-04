from typing import Any

from joserfc import jwt
from joserfc.errors import JoseError
from joserfc.jwt import JWTClaimsRegistry
from starsessions.stores.base import SessionStore

from ..core.config import settings
from ..core.exceptions.http_exceptions import UnauthorizedException


class OidcLogoutService:
    def __init__(self, store: SessionStore | None = None) -> None:
        if store is None:
            from ..core.setup import get_redis_session_store

            store = get_redis_session_store()

        self.store = store

    @staticmethod
    def build_index_key(sid: str) -> str:
        return f"oidc-logout:{sid}"

    async def store_session(self, sid: str, session_id: str) -> None:
        await self.store.write(
            session_id=self.build_index_key(sid),
            data=session_id.encode(),
            lifetime=settings.SESSION_MAX_AGE,
            ttl=settings.REDIS_SESSION_GC_TTL,
        )

    async def get_session_id(self, sid: str) -> str | None:
        payload = await self.store.read(self.build_index_key(sid), settings.SESSION_MAX_AGE)
        if payload is None:
            return None

        return payload.decode()

    async def remove_session(self, sid: str) -> None:
        await self.store.remove(self.build_index_key(sid))

    async def remove_local_session(self, session_id: str) -> None:
        await self.store.remove(session_id)

    async def validate_logout_token(self, logout_token: str) -> dict[str, Any]:
        if not logout_token:
            raise UnauthorizedException("Invalid logout token.")

        from ..core.oidc import get_oidc_client

        client = get_oidc_client()
        metadata = await client.load_server_metadata()
        jwks = await client.fetch_jwk_set()
        expected_issuer = metadata.get("issuer")
        expected_audience = settings.OIDC_CLIENT_ID
        claims_requests: dict[str, dict[str, Any]] = {}
        if expected_issuer:
            claims_requests["iss"] = {"essential": True, "value": expected_issuer}
        if expected_audience:
            claims_requests["aud"] = {"essential": True, "value": expected_audience}
        claims_registry = JWTClaimsRegistry(**claims_requests)

        try:
            token = jwt.decode(logout_token, jwks)
            claims = token.claims
            claims_registry.validate(claims)
        except JoseError as exc:
            raise UnauthorizedException("Invalid logout token.") from exc

        events = claims.get("events") or {}
        if "http://schemas.openid.net/event/backchannel-logout" not in events:
            raise UnauthorizedException("Invalid logout token.")

        if claims.get("nonce") is not None:
            raise UnauthorizedException("Invalid logout token.")

        if not claims.get("sid"):
            raise UnauthorizedException("Invalid logout token.")

        return dict(claims)
