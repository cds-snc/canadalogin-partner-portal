"""IBM Security Verify User API client.

This client is designed for per-request instantiation to ensure thread-safety.
Each request should have its own access token from the current user's session.
"""

import inspect
from collections.abc import Callable
from typing import Any

import httpx
import requests
from ibm_verify_community_sdk.client import APIClientError, IbmVerifyClient

from ..core.config import settings
from ..core.exceptions.ibm_sv_exceptions import (
    IBMVerifyBadRequest,
    IBMVerifyForbidden,
    IBMVerifyNotFound,
    IBMVerifyServerError,
    IBMVerifyUnauthorized,
)


class IBMVerifyUserClient:
    """Client for IBM Security Verify User API operations.

    This client does NOT store tokens - tokens are passed at call time or
    extracted from the current request context to ensure isolation between users.
    """

    def __init__(self, access_token: str) -> None:
        base_url = settings.IBM_SV_ADMIN_BASE_URL
        if not base_url:
            raise ValueError("IBM_SV_ADMIN_BASE_URL is not configured")
        self._base_url = base_url.rstrip("/")
        self._access_token = access_token
        self._sdk_client: IbmVerifyClient | None = None

    def _get_or_create_sdk_client(self) -> IbmVerifyClient:
        if self._sdk_client is not None:
            return self._sdk_client

        self._sdk_client = IbmVerifyClient(tenant_url=self._base_url, access_token=self._access_token)
        return self._sdk_client

    def _translate_sdk_error(self, exc: APIClientError) -> Exception:
        status_code = 500
        response_body: dict[str, Any] | None = None
        message = str(exc)

        cause = exc.__cause__
        response = None
        if isinstance(cause, requests.RequestException) and cause.response is not None:
            response = cause.response
        elif isinstance(cause, httpx.HTTPError):
            response = getattr(cause, "response", None)

        if response is not None:
            status_code = response.status_code

            body: Any = None
            try:
                body = response.json()
            except ValueError:
                body = None

            if isinstance(body, dict):
                response_body = body
                body_message = body.get("message")
                if isinstance(body_message, str) and body_message.strip():
                    message = body_message.strip()
            elif response.text:
                message = response.text

        error_map = {
            400: IBMVerifyBadRequest,
            401: IBMVerifyUnauthorized,
            403: IBMVerifyForbidden,
            404: IBMVerifyNotFound,
        }
        exc_class = error_map.get(status_code, IBMVerifyServerError)
        return exc_class(message=message, response_body=response_body)

    async def _run_sdk(self, operation: Callable[[IbmVerifyClient], Any]) -> Any:
        sdk_client = self._get_or_create_sdk_client()

        try:
            response = operation(sdk_client)

            if inspect.isawaitable(response):
                response = await response

            raw = getattr(response, "raw", None)
            if raw is not None:
                return raw

            data = getattr(response, "data", None)
            if data is not None:
                return data

            return response
        except APIClientError as exc:
            raise self._translate_sdk_error(exc) from exc

    async def _run_request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
    ) -> Any:
        sdk_client = self._get_or_create_sdk_client()

        try:
            response = sdk_client._request(method=method, path=path, params=params)

            if inspect.isawaitable(response):
                response = await response

            raw = getattr(response, "raw", None)
            if raw is not None:
                return raw

            data = getattr(response, "data", None)
            if data is not None:
                return data

            return response
        except APIClientError as exc:
            raise self._translate_sdk_error(exc) from exc

    async def fetch_profile(self) -> dict[str, Any]:
        """Fetch the current user's profile."""
        payload = await self._run_sdk(lambda sdk_client: sdk_client.users.get_account_details())
        return payload if isinstance(payload, dict) else {"profile": payload}

    async def fetch_userinfo(self) -> dict[str, Any]:
        """Fetch userinfo from the OAuth2 endpoint."""
        payload = await self._run_request("GET", "/oauth2/userinfo")
        return payload if isinstance(payload, dict) else {"userinfo": payload}

    async def fetch_authenticators(self) -> dict[str, Any]:
        """Fetch the current user's enrolled authenticators (MFA factors)."""
        payload = await self._run_request("GET", "/v2.0/factors")
        return payload if isinstance(payload, dict) else {"authenticators": payload}

    async def fetch_applications(self) -> dict[str, Any]:
        """Fetch applications accessible to the current user."""
        payload = await self._run_request("GET", "/v1.0/owner/applications")
        return payload if isinstance(payload, dict) else {"applications": payload}

    async def aclose(self) -> None:
        """Close the underlying HTTP client."""
        if self._sdk_client is not None:
            if hasattr(self._sdk_client, "aclose"):
                result = self._sdk_client.aclose()
            else:
                result = self._sdk_client.close()

            if inspect.isawaitable(result):
                await result

            self._sdk_client = None

    async def __aenter__(self) -> "IBMVerifyUserClient":
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.aclose()
