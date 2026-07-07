from typing import Any

from joserfc import jwk, jwt
from joserfc.errors import JoseError
from joserfc.jwt import JWTClaimsRegistry
from starsessions.stores.base import SessionStore

from ..core.config import settings
from ..core.exceptions.http_exceptions import UnauthorizedException
from ..core.oidc import get_oidc_client


class OidcLogoutService:
    def __init__(self, store: SessionStore | None = None) -> None:
        if store is None:
            from ..core.setup import get_redis_session_store

            store = get_redis_session_store()

        self.store = store

    async def remove_local_session(self, session_id: str) -> None:
        await self.store.remove(session_id)

    async def validate_logout_token(self, logout_token: str) -> dict[str, Any]:
        if not logout_token:
            raise UnauthorizedException("Invalid logout token.")

        client = get_oidc_client()
        metadata = await client.load_server_metadata()
        jwks = await client.fetch_jwk_set()
        expected_issuer = metadata.get("issuer")
        expected_audience = settings.OIDC_CLIENT_ID
        if expected_issuer and expected_audience:
            claims_registry = JWTClaimsRegistry(
                iss={"essential": True, "value": expected_issuer},
                aud={"essential": True, "value": expected_audience},
            )
        elif expected_issuer:
            claims_registry = JWTClaimsRegistry(
                iss={"essential": True, "value": expected_issuer},
            )
        elif expected_audience:
            claims_registry = JWTClaimsRegistry(
                aud={"essential": True, "value": expected_audience},
            )
        else:
            claims_registry = JWTClaimsRegistry()

        try:
            key_set = jwks if isinstance(jwks, jwk.KeySet) else jwk.KeySet.import_key_set(jwks)
            token = jwt.decode(logout_token, key_set)
            claims = token.claims
            claims_registry.validate(claims)
        except (JoseError, TypeError, ValueError) as exc:
            raise UnauthorizedException("Invalid logout token.") from exc

        events = claims.get("events") or {}
        if "http://schemas.openid.net/event/backchannel-logout" not in events:
            raise UnauthorizedException("Invalid logout token.")

        if claims.get("nonce") is not None:
            raise UnauthorizedException("Invalid logout token.")

        if not claims.get("sid"):
            raise UnauthorizedException("Invalid logout token.")

        return dict(claims)
