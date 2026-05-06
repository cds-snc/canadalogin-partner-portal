"""IBM Security Verify User Service.

This service handles user-facing operations that require the current user's
access token. Each instance is tied to a specific user's session.
"""

from typing import Any

from ..repositories.ibm_sv_user import IBMVerifyUserClient


class IBMVerifyUserService:
    """Service for IBM Security Verify user operations.

    This service is instantiated per-request to ensure thread-safety.
    """

    def __init__(self, client: IBMVerifyUserClient) -> None:
        self._client = client

    async def get_profile(self) -> dict[str, Any]:
        """Get the current user's profile."""
        return await self._client.fetch_profile()

    async def get_userinfo(self) -> dict[str, Any]:
        """Get userinfo claims from the OAuth2 endpoint."""
        return await self._client.fetch_userinfo()

    async def get_authenticators(self) -> dict[str, Any]:
        """Get the current user's enrolled authenticators (MFA factors)."""
        return await self._client.fetch_authenticators()

    async def get_applications(self) -> dict[str, Any]:
        """Get applications accessible to the current user."""
        return await self._client.fetch_applications()
