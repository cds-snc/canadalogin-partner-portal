import re
from datetime import UTC, datetime
from typing import Any

from authlib.integrations.starlette_client import OAuth
from sqlalchemy.ext.asyncio import AsyncSession

from ..repositories.crud_users import crud_users
from ..schemas.user import UserCreateInternal, UserReadInternal
from .config import settings
from .exceptions.http_exceptions import ForbiddenException, UnauthorizedException

oauth = OAuth()
_client_registered = False


def register_oidc_client() -> None:
    global _client_registered

    if _client_registered or not settings.OIDC_ENABLED:
        return

    if not settings.OIDC_SERVER_METADATA_URL or not settings.OIDC_CLIENT_ID or not settings.OIDC_CLIENT_SECRET:
        return

    oauth.register(
        name=settings.OIDC_PROVIDER_NAME,
        client_id=settings.OIDC_CLIENT_ID,
        client_secret=settings.OIDC_CLIENT_SECRET.get_secret_value(),
        server_metadata_url=settings.OIDC_SERVER_METADATA_URL,
        client_kwargs={"scope": settings.OIDC_SCOPES},
        code_challenge_method="S256",
    )
    _client_registered = True


def get_oidc_client():
    register_oidc_client()
    client = oauth.create_client(settings.OIDC_PROVIDER_NAME)
    if client is None:
        raise RuntimeError("OIDC client is not configured")

    return client


async def warm_oidc_metadata() -> None:
    if not settings.OIDC_ENABLED:
        return

    register_oidc_client()
    client = oauth.create_client(settings.OIDC_PROVIDER_NAME)
    if client is None:
        return

    await client.load_server_metadata()


def build_oidc_redirect_uri(request) -> str:
    configured_redirect_uri = settings.OIDC_REDIRECT_URI
    if configured_redirect_uri:
        normalized_redirect_uri = configured_redirect_uri.strip().rstrip("/")
        if normalized_redirect_uri:
            return normalized_redirect_uri

    return str(request.url_for("oidc_callback"))


def normalize_username_candidate(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]", "", value.lower())
    return normalized[:20] or "user"


async def generate_unique_username(db: AsyncSession, claims: dict[str, Any]) -> str:
    candidates = [
        claims.get("preferred_username"),
        claims.get("nickname"),
        claims.get("email", "").split("@", 1)[0] if claims.get("email") else None,
        claims.get("name"),
        claims.get("sub"),
    ]

    base_candidate = next((candidate for candidate in candidates if candidate), "user")
    base = normalize_username_candidate(str(base_candidate))

    for suffix in range(0, 1000):
        username = base if suffix == 0 else f"{base[: max(1, 20 - len(str(suffix)))]}{suffix}"
        exists = await crud_users.exists(db=db, username=username)
        if not exists:
            return username

    raise UnauthorizedException("Unable to allocate a username for the OIDC user.")


async def sync_oidc_user(db: AsyncSession, claims: dict[str, object]) -> dict[str, object]:
    subject = claims.get("sub")
    if not subject:
        raise UnauthorizedException("OIDC subject claim is missing.")

    email = claims.get("email")
    if not email:
        raise ForbiddenException("User is not allowed to access this site")

    normalized_email = str(email).strip().lower()
    provider = settings.OIDC_PROVIDER_NAME

    existing_user = await crud_users.get(
        db=db,
        auth_provider=provider,
        auth_subject=subject,
        is_deleted=False,
        schema_to_select=UserReadInternal,
    )
    if existing_user is not None:
        await crud_users.update(
            db=db,
            object={
                "last_login_at": datetime.now(UTC),
                "email": normalized_email,
                "username": normalized_email,
            },
            uuid=existing_user["uuid"],
        )
        refreshed = await crud_users.get(
            db=db,
            uuid=existing_user["uuid"],
            is_deleted=False,
            schema_to_select=UserReadInternal,
        )
        if refreshed is None:
            raise UnauthorizedException("Failed to refresh existing user")
        return refreshed

    if email:
        email_user = await crud_users.get(db=db, email=normalized_email, is_deleted=False, schema_to_select=UserReadInternal)
        if email_user is not None:
            await crud_users.update(
                db=db,
                object={
                    "auth_provider": provider,
                    "auth_subject": subject,
                    "last_login_at": datetime.now(UTC),
                    "username": normalized_email,
                    "email": normalized_email,
                },
                uuid=email_user["uuid"],
            )
            refreshed = await crud_users.get(
                db=db,
                uuid=email_user["uuid"],
                is_deleted=False,
                schema_to_select=UserReadInternal,
            )
            if refreshed is None:
                raise UnauthorizedException("Failed to refresh email-linked user")
            return refreshed

    created_user = await crud_users.create(
        db=db,
        object=UserCreateInternal(
            name=normalized_email,
            email=normalized_email,
            username=normalized_email,
            auth_provider=provider,
            auth_subject=subject,
        ),
        schema_to_select=UserReadInternal,
    )
    if created_user is None:
        raise UnauthorizedException("Failed to create OIDC user")

    await crud_users.update(
        db=db,
        object={
            "last_login_at": datetime.now(UTC),
        },
        uuid=created_user["uuid"],
    )

    refreshed = await crud_users.get(
        db=db,
        uuid=created_user["uuid"],
        is_deleted=False,
        schema_to_select=UserReadInternal,
    )
    if refreshed is None:
        raise UnauthorizedException("Failed to refresh created user")

    return refreshed

