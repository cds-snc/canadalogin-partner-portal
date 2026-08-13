import re
from datetime import UTC, datetime
from json import JSONDecodeError
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import httpx
from authlib.integrations.starlette_client import OAuth
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from ..repositories.crud_rp_application_developer_invitations import crud_rp_application_developer_invitations
from ..repositories.crud_users import crud_users
from ..schemas.rp_application_developer_invitation import RPApplicationDeveloperInvitationReadInternal
from ..schemas.user import UserCreateInternal, UserReadInternal
from ..services.authorization_service import AuthorizationResolutionError, AuthorizationService
from .config import settings
from .exceptions.http_exceptions import CustomException, ForbiddenException, UnauthorizedException

oauth = OAuth()
_client_registered = False
_OIDC_DISCOVERY_PATH = "/.well-known/openid-configuration"
_OIDC_DISCOVERY_ERROR_MESSAGE = "OIDC discovery metadata could not be loaded. Check OIDC_SERVER_METADATA_URL."


def _build_oidc_configuration_error(detail: str) -> CustomException:
    return CustomException(status_code=503, detail=detail)


def get_oidc_server_metadata_url() -> str | None:
    configured_server_metadata_url = settings.OIDC_SERVER_METADATA_URL
    if not configured_server_metadata_url:
        return None

    normalized_server_metadata_url = configured_server_metadata_url.strip().rstrip("/")
    if not normalized_server_metadata_url:
        return None

    parsed_url = urlsplit(normalized_server_metadata_url)
    if parsed_url.path.endswith(_OIDC_DISCOVERY_PATH):
        return normalized_server_metadata_url

    discovery_path = f"{parsed_url.path.rstrip('/')}{_OIDC_DISCOVERY_PATH}"
    if not discovery_path.startswith("/"):
        discovery_path = f"/{discovery_path}"

    return urlunsplit(
        (
            parsed_url.scheme,
            parsed_url.netloc,
            discovery_path,
            parsed_url.query,
            parsed_url.fragment,
        )
    )


async def load_oidc_server_metadata(client) -> dict[str, Any]:
    try:
        return dict(await client.load_server_metadata())
    except (httpx.HTTPError, JSONDecodeError, TypeError, ValueError) as exc:
        raise _build_oidc_configuration_error(_OIDC_DISCOVERY_ERROR_MESSAGE) from exc


def register_oidc_client() -> None:
    global _client_registered

    if _client_registered or not settings.OIDC_ENABLED:
        return

    server_metadata_url = get_oidc_server_metadata_url()
    if not server_metadata_url or not settings.OIDC_CLIENT_ID or not settings.OIDC_CLIENT_SECRET:
        return

    oauth.register(
        name=settings.OIDC_PROVIDER_NAME,
        client_id=settings.OIDC_CLIENT_ID,
        client_secret=settings.OIDC_CLIENT_SECRET.get_secret_value(),
        server_metadata_url=server_metadata_url,
        client_kwargs={"scope": settings.OIDC_SCOPES},
        code_challenge_method="S256",
    )
    _client_registered = True


def get_oidc_client():
    register_oidc_client()
    client = oauth.create_client(settings.OIDC_PROVIDER_NAME)
    if client is None:
        raise _build_oidc_configuration_error("OIDC login is not configured.")

    return client


async def warm_oidc_metadata() -> None:
    if not settings.OIDC_ENABLED:
        return

    register_oidc_client()
    client = oauth.create_client(settings.OIDC_PROVIDER_NAME)
    if client is None:
        return

    await load_oidc_server_metadata(client)


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


def _extract_current_user_id(user: dict[str, Any]) -> int | None:
    raw_user_id = user.get("id")
    if raw_user_id is None or isinstance(raw_user_id, bool):
        return None

    if isinstance(raw_user_id, int):
        return raw_user_id

    normalized = str(raw_user_id).strip()
    if not normalized:
        return None

    try:
        return int(normalized)
    except ValueError:
        return None


def _is_future_datetime(value: Any) -> bool:
    if not isinstance(value, datetime):
        return False

    normalized = value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)
    return normalized > datetime.now(UTC)


async def _has_active_canonical_assignment(db: AsyncSession, user: dict[str, Any]) -> bool:
    user_id = _extract_current_user_id(user)
    if user_id is None:
        return False

    try:
        state = await AuthorizationService().resolve_for_user(db, user_id=user_id)
    except AuthorizationResolutionError:
        return False
    return state.global_role is not None or bool(state.partner_access)


async def _has_pending_invitation_for_email(db: AsyncSession, normalized_email: str) -> bool:
    invitations_data = await crud_rp_application_developer_invitations.get_multi(
        db=db,
        invited_email=normalized_email,
        status="pending",
        is_deleted=False,
        schema_to_select=RPApplicationDeveloperInvitationReadInternal,
    )
    invitations = invitations_data.get("data", []) if isinstance(invitations_data, dict) else invitations_data

    for invitation in invitations:
        invitation_data = invitation if isinstance(invitation, dict) else dict(invitation)
        if _is_future_datetime(invitation_data.get("invite_expires_at")):
            return True

    return False


async def _has_local_portal_access_or_pending_invitation(
    db: AsyncSession,
    user: dict[str, Any],
    normalized_email: str,
    *,
    email_is_verified: bool,
) -> bool:
    if await _has_active_canonical_assignment(db=db, user=user):
        return True

    if not email_is_verified:
        return False
    return await _has_pending_invitation_for_email(db=db, normalized_email=normalized_email)


def _has_verified_email_claim(claims: dict[str, Any]) -> bool:
    # OIDC defines email_verified as a JSON boolean. String-like values are not
    # accepted because permissive coercion would weaken the identity boundary.
    return claims.get("email_verified") is True


def _is_unbound_local_identity(user: dict[str, Any]) -> bool:
    return user.get("auth_provider") is None and user.get("auth_subject") is None


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


async def sync_oidc_user(db: AsyncSession, claims: dict[str, Any]) -> dict[str, Any]:
    subject = claims.get("sub")
    if not subject:
        raise UnauthorizedException("OIDC subject claim is missing.")

    email = claims.get("email")
    if not email:
        raise ForbiddenException("User is not allowed to access this site")

    normalized_email = str(email).strip().lower()
    provider = settings.OIDC_PROVIDER_NAME
    email_is_verified = _has_verified_email_claim(claims)

    existing_user = await crud_users.get(
        db=db,
        auth_provider=provider,
        auth_subject=subject,
        is_deleted=False,
        schema_to_select=UserReadInternal,
    )
    if existing_user is not None:
        update_object: dict[str, Any] = {}
        if email_is_verified:
            update_object.update(
                {
                    "email": normalized_email,
                    "username": normalized_email,
                }
            )
        access_email = normalized_email if email_is_verified else str(existing_user.get("email") or "").strip().lower()
        if await _has_local_portal_access_or_pending_invitation(
            db=db,
            user=existing_user,
            normalized_email=access_email,
            email_is_verified=email_is_verified,
        ):
            update_object["last_login_at"] = datetime.now(UTC)

        await crud_users.update(
            db=db,
            object=update_object,
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
        if not await _has_local_portal_access_or_pending_invitation(
            db=db,
            user=refreshed,
            normalized_email=access_email,
            email_is_verified=email_is_verified,
        ):
            raise ForbiddenException("User is not allowed to access this site")
        return refreshed

    if not email_is_verified:
        raise ForbiddenException("User is not allowed to access this site")

    if email:
        email_user = await crud_users.get(
            db=db,
            email=normalized_email,
            is_deleted=False,
            schema_to_select=UserReadInternal,
        )
        if email_user is not None:
            if not _is_unbound_local_identity(email_user):
                raise ForbiddenException("User is not allowed to access this site")
            update_object = {
                "auth_provider": provider,
                "auth_subject": subject,
                "username": normalized_email,
                "email": normalized_email,
            }
            if await _has_local_portal_access_or_pending_invitation(
                db=db,
                user=email_user,
                normalized_email=normalized_email,
                email_is_verified=email_is_verified,
            ):
                update_object["last_login_at"] = datetime.now(UTC)

            try:
                bound_user = await crud_users.update(
                    db=db,
                    object=update_object,
                    uuid=email_user["uuid"],
                    auth_provider=None,
                    auth_subject=None,
                    return_columns=["uuid"],
                    one_or_none=True,
                )
            except NoResultFound:
                bound_user = None
            if bound_user is None:
                # A concurrent request or stale read observed an identity that
                # is no longer unbound. Never overwrite the winning binding.
                raise ForbiddenException("User is not allowed to access this site")
            refreshed = await crud_users.get(
                db=db,
                uuid=email_user["uuid"],
                is_deleted=False,
                schema_to_select=UserReadInternal,
            )
            if refreshed is None:
                raise UnauthorizedException("Failed to refresh email-linked user")
            if not await _has_local_portal_access_or_pending_invitation(
                db=db,
                user=refreshed,
                normalized_email=normalized_email,
                email_is_verified=email_is_verified,
            ):
                raise ForbiddenException("User is not allowed to access this site")
            return refreshed

    if not await _has_pending_invitation_for_email(db=db, normalized_email=normalized_email):
        raise ForbiddenException("User is not allowed to access this site")

    created_user = await crud_users.create(
        db=db,
        object=UserCreateInternal(
            name=normalized_email,
            email=normalized_email,
            username=normalized_email,
            auth_provider=provider,
            auth_subject=subject,
            # A matching live invitation is the explicit activation event for
            # a newly created identity. Existing disabled accounts are never
            # silently reactivated by this path.
            enabled=True,
        ),
        schema_to_select=UserReadInternal,
    )
    if created_user is None:
        raise UnauthorizedException("Failed to create OIDC user")

    if not await _has_local_portal_access_or_pending_invitation(
        db=db,
        user=created_user,
        normalized_email=normalized_email,
        email_is_verified=email_is_verified,
    ):
        raise ForbiddenException("User is not allowed to access this site")

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
