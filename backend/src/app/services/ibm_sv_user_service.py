"""IBM Security Verify User Service.

This service handles user-facing operations that require the current user's
access token. Each instance is tied to a specific user's session.
"""

from typing import Any
from uuid import UUID

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

    def _extract_applications(self, payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, dict):
            applications = payload.get("applications")
            if isinstance(applications, list):
                return [item for item in applications if isinstance(item, dict)]
            if isinstance(applications, dict):
                return [applications]
            return []

        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]

        return []

    def _extract_application_id(self, application: dict[str, Any]) -> str | None:
        for key in ("id", "application_id", "applicationId", "applicationid"):
            value = application.get(key)
            if value is None:
                continue
            normalized = str(value).strip()
            if normalized:
                return normalized
        return None

    async def get_applications(self) -> list[dict[str, Any]]:
        """Get applications accessible to the current user."""
        payload = await self._client.fetch_applications()
        return self._extract_applications(payload)

    async def has_application(self, application_id: str | int | UUID) -> bool:
        """Check whether an application id exists in the current user's applications."""
        target = str(application_id).strip()
        if not target:
            return False

        applications = await self.get_applications()
        for application in applications:
            if self._extract_application_id(application) == target:
                return True

        return False
