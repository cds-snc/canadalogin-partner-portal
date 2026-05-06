"""IBM Security Verify repository dependencies."""

from typing import Annotated

from fastapi import Depends, Request

from ..core.exceptions.http_exceptions import UnauthorizedException
from ..repositories.ibm_sv_admin import IBMVerifyAdminClient, create_admin_oauth_client
from ..repositories.ibm_sv_user import IBMVerifyUserClient

_ibm_sv_admin_client: IBMVerifyAdminClient | None = None


async def get_ibm_sv_admin_client() -> IBMVerifyAdminClient:
    """Get the shared IBM Verify admin client from app.state or create it.

    This client uses client_credentials flow and is shared across requests.
    Suitable for admin operations that don't require user context.
    """
    global _ibm_sv_admin_client

    if _ibm_sv_admin_client is not None:
        return _ibm_sv_admin_client

    oauth_client = await create_admin_oauth_client()

    if oauth_client.token is None or oauth_client.token.is_expired():
        await oauth_client.fetch_token()

    _ibm_sv_admin_client = IBMVerifyAdminClient(oauth_client)
    return _ibm_sv_admin_client


def get_ibm_sv_user_client(request: Request) -> IBMVerifyUserClient:
    """Get a thread-safe IBM Verify user client for the current request.

    This function extracts the access token from the current user's session
    and creates a new client instance to ensure isolation between requests.

    The caller is responsible for managing the client lifecycle (using async with
    or manually calling aclose).
    """
    try:
        session = request.session
    except AssertionError:
        raise UnauthorizedException("Session not available")

    tokens = session.get("tokens") if session else None
    access_token = (tokens.get("access_token") if tokens else None) if tokens else None

    if not access_token:
        raise UnauthorizedException("User access token not found in session")

    return IBMVerifyUserClient(access_token=access_token)


async def get_ibm_sv_user_client_from_token(access_token: str) -> IBMVerifyUserClient:
    """Create an IBM Verify user client with a provided access token.

    This is useful when you have the access token from another source
    (e.g., from a service that extracted it from a different context).
    """
    if not access_token:
        raise UnauthorizedException("Access token is required")

    return IBMVerifyUserClient(access_token=access_token)


async def close_ibm_sv_admin_client() -> None:
    """Close the admin client. Called during application shutdown."""
    global _ibm_sv_admin_client

    if _ibm_sv_admin_client is not None:
        await _ibm_sv_admin_client.aclose()
        _ibm_sv_admin_client = None


def set_ibm_sv_admin_client(client: IBMVerifyAdminClient) -> None:
    """Set the global admin client (for testing or manual initialization)."""
    global _ibm_sv_admin_client
    _ibm_sv_admin_client = client


IBMVerifyAdminClientDep = Annotated[IBMVerifyAdminClient, Depends(get_ibm_sv_admin_client)]
IBMVerifyUserClientDep = Annotated[IBMVerifyUserClient, Depends(get_ibm_sv_user_client)]
