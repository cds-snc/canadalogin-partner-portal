"""IBM Security Verify User API client.

This client is designed for per-request instantiation to ensure thread-safety.
Each request should have its own access token from the current user's session.
"""

from typing import Any

import httpx
from ibm_verify_community_sdk.applications.models import GetApplicationsResponse
from ibm_verify_community_sdk.users.models import GetAccountDetailsResponse

from ..core.config import settings


class IBMVerifyUserClient:
    """Thread-safe client for IBM Security Verify User API operations.

    This client does NOT store tokens - tokens are passed at call time or
    extracted from the current request context to ensure isolation between users.
    """

    def __init__(self, access_token: str) -> None:
        base_url = settings.IBM_SV_ADMIN_BASE_URL
        if not base_url:
            raise ValueError("IBM_SV_ADMIN_BASE_URL is not configured")
        self._base_url = base_url.rstrip("/")
        self._access_token = access_token
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(5.0, read=10.0),
            headers={"Authorization": f"Bearer {access_token}"},
        )

    def _auth_headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._access_token}"}

    async def fetch_profile(self) -> GetAccountDetailsResponse:
        """Fetch the current user's profile."""
        response = await self._client.get(f"{self._base_url}/v2.0/Me")
        response.raise_for_status()
        payload: Any = response.json()
        if isinstance(payload, dict):
            return GetAccountDetailsResponse.model_validate(payload)
        raise httpx.HTTPError("Unexpected profile response payload")

    async def fetch_userinfo(self) -> dict[str, Any]:
        """Fetch userinfo from the OAuth2 endpoint."""
        response = await self._client.get(f"{self._base_url}/oauth2/userinfo")
        response.raise_for_status()
        payload: Any = response.json()
        if isinstance(payload, dict):
            return payload
        return {"userinfo": payload}

    async def fetch_authenticators(self) -> dict[str, Any]:
        """Fetch the current user's enrolled authenticators (MFA factors)."""
        response = await self._client.get(f"{self._base_url}/v2.0/factors")
        response.raise_for_status()
        return response.json()  # type: ignore[no-any-return]

    async def fetch_applications(self) -> GetApplicationsResponse:
        """Fetch applications accessible to the current user."""
        response = await self._client.get(f"{self._base_url}/v1.0/owner/applications")
        response.raise_for_status()
        payload: Any = response.json()
        if isinstance(payload, dict):
            return GetApplicationsResponse.model_validate(payload)
        raise httpx.HTTPError("Unexpected applications response payload")

    async def aclose(self) -> None:
        """Close the underlying HTTP client."""
        await self._client.aclose()

    async def __aenter__(self) -> "IBMVerifyUserClient":
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.aclose()
