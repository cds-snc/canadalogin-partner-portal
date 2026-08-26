"""IBM Security Verify client limited to portal-owned RP operations."""

import inspect
import logging
import re
from collections.abc import Callable
from typing import Any

import httpx
from authlib.integrations.httpx_client import AsyncOAuth2Client
from ibm_verify_community_sdk.applications.models import (
    ApplicationRequest,
    GetApplicationResponse,
    ListApplicationsResponse,
)
from ibm_verify_community_sdk.client import APIClientError, IbmVerifyClient
from ibm_verify_community_sdk.oidc.models import (
    DeleteClientSecretOperation,
    GetClientSecretsResponse,
    RotateClientSecretRequest,
    RotateClientSecretResponse,
)
from ibm_verify_community_sdk.reports.models import ReportRequest, ReportResponse

from ..core.config import settings
from ..core.exceptions.ibm_sv_exceptions import (
    IBMVerifyBadRequest,
    IBMVerifyForbidden,
    IBMVerifyNotFound,
    IBMVerifyServerError,
    IBMVerifyUnauthorized,
)

LOGGER = logging.getLogger(__name__)
APPLICATION_ID_PATTERN = re.compile(r"/applications/([^/?#]+)")


class IBMVerifyAdminClient:
    """Credentialed provider client without a generic admin HTTP surface."""

    def __init__(self, client: AsyncOAuth2Client) -> None:
        base_url = settings.IBM_SV_ADMIN_BASE_URL
        if not base_url:
            raise ValueError("IBM_SV_ADMIN_BASE_URL is not configured")
        self._base_url = base_url.rstrip("/")
        self._client: Any = client
        self._sdk_client: IbmVerifyClient | None = None
        self._sdk_access_token: str | None = None

    async def _close_sdk_client(self) -> None:
        if self._sdk_client is None:
            return

        if hasattr(self._sdk_client, "aclose"):
            result = self._sdk_client.aclose()
        else:
            result = self._sdk_client.close()

        if inspect.isawaitable(result):
            await result

        self._sdk_client = None
        self._sdk_access_token = None

    async def _get_or_create_sdk_client(self, access_token: str) -> IbmVerifyClient:
        if self._sdk_client is not None and self._sdk_access_token == access_token:
            return self._sdk_client

        if self._sdk_client is not None:
            await self._close_sdk_client()

        self._sdk_client = IbmVerifyClient(tenant_url=self._base_url, access_token=access_token)
        self._sdk_access_token = access_token
        return self._sdk_client

    async def _ensure_access_token(self) -> str:
        token = self._client.token
        if token is None or token.is_expired():
            token = await self._client.fetch_token()

        access_token = token.get("access_token") if isinstance(token, dict) else None
        if not access_token:
            raise IBMVerifyUnauthorized("Unable to acquire IBM Verify admin token")
        return str(access_token)

    def _translate_sdk_error(self, exc: APIClientError) -> Exception:
        status_code = 500
        response_body: dict[str, Any] | None = None
        message = str(exc)

        cause = exc.__cause__
        response = getattr(cause, "response", None)
        if response is None and isinstance(cause, httpx.HTTPError):
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
        access_token = await self._ensure_access_token()
        sdk_client = await self._get_or_create_sdk_client(access_token)

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

    def _resolve_report_range(
        self,
        from_date: str | None,
        to_date: str | None,
    ) -> tuple[str, str]:
        """Resolve report date bounds, defaulting invalid or missing inputs to today."""
        from datetime import UTC, datetime, timedelta

        normalized_from = str(from_date or "").strip()
        normalized_to = str(to_date or "").strip()
        if normalized_from.isdigit() and normalized_to.isdigit():
            return normalized_from, normalized_to

        now = datetime.now(UTC)
        start_of_day = datetime.combine(now.date(), datetime.min.time(), tzinfo=UTC)
        end_of_day = start_of_day + timedelta(days=1) - timedelta(milliseconds=1)
        return str(int(start_of_day.timestamp() * 1000)), str(int(end_of_day.timestamp() * 1000))

    async def list_applications(self) -> ListApplicationsResponse:
        """List all applications."""
        access_token = await self._ensure_access_token()
        sdk_client = await self._get_or_create_sdk_client(access_token)

        try:
            response = sdk_client.applications.list_applications()

            if inspect.isawaitable(response):
                response = await response
        except APIClientError as exc:
            raise self._translate_sdk_error(exc) from exc

        data = getattr(response, "data", None)
        if isinstance(data, ListApplicationsResponse):
            return data
        if isinstance(data, dict):
            return ListApplicationsResponse.model_validate(data)

        if isinstance(response, ListApplicationsResponse):
            return response
        if isinstance(response, dict):
            return ListApplicationsResponse.model_validate(response)

        raise IBMVerifyServerError(message="Unexpected list_applications response payload")

    async def get_application_detail(self, application_id: str) -> GetApplicationResponse:
        """Get application details by ID."""
        access_token = await self._ensure_access_token()
        sdk_client = await self._get_or_create_sdk_client(access_token)

        try:
            response = sdk_client.applications.get_application(application_id=application_id)

            if inspect.isawaitable(response):
                response = await response
        except APIClientError as exc:
            raise self._translate_sdk_error(exc) from exc

        data = getattr(response, "data", None)
        if isinstance(data, GetApplicationResponse):
            return data
        if isinstance(data, dict):
            return GetApplicationResponse.model_validate(data)

        if isinstance(response, GetApplicationResponse):
            return response
        if isinstance(response, dict):
            return GetApplicationResponse.model_validate(response)

        raise IBMVerifyServerError(message="Unexpected get_application_detail response payload")

    async def create_application(self, payload: dict[str, Any]) -> GetApplicationResponse:
        """Create a new application."""
        body = ApplicationRequest.model_validate(payload)
        result = await self._run_sdk(lambda sdk_client: sdk_client.applications.create_application(body=body))
        if isinstance(result, GetApplicationResponse):
            return result
        if isinstance(result, dict):
            return GetApplicationResponse.model_validate(result)
        raise IBMVerifyServerError(message="Unexpected create_application response payload")

    async def update_application(self, application_id: str, payload: dict[str, Any]) -> bool:
        """Update an existing application."""
        body = ApplicationRequest.model_validate(payload)
        await self._run_sdk(
            lambda sdk_client: sdk_client.applications.update_application(
                application_id=application_id,
                body=body,
            )
        )
        return True

    async def delete_application(self, application_id: str) -> None:
        """Delete an application."""
        await self._run_sdk(lambda sdk_client: sdk_client.applications.delete_application(application_id=application_id))

    async def get_application_total_logins(
        self,
        application_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> ReportResponse:
        """Get total logins for an application."""
        from_timestamp, to_timestamp = self._resolve_report_range(from_date, to_date)
        body = ReportRequest.model_validate(
            {
                "APPID": application_id,
                "FROM": from_timestamp,
                "TO": to_timestamp,
            }
        )
        payload = await self._run_sdk(lambda sdk_client: sdk_client.reports.run_app_total_logins(body=body))
        if isinstance(payload, ReportResponse):
            return payload
        if isinstance(payload, dict):
            return ReportResponse.model_validate(payload)
        raise IBMVerifyServerError(message="Unexpected get_application_total_logins response payload")

    async def get_client_secret(self, client_id: str) -> GetClientSecretsResponse:
        """Get client secrets for an OIDC client."""
        payload = await self._run_sdk(lambda sdk_client: sdk_client.oidc.get_client_secrets(client_id=client_id))
        if isinstance(payload, GetClientSecretsResponse):
            return payload
        if isinstance(payload, dict):
            return GetClientSecretsResponse.model_validate(payload)
        raise IBMVerifyServerError(message="Unexpected get_client_secret response payload")

    async def update_client_secret(self, client_id: str, payload: dict[str, Any]) -> RotateClientSecretResponse:
        """Update client secret for an OIDC client."""
        body = RotateClientSecretRequest.model_validate(payload) if payload else None
        result = await self._run_sdk(
            lambda sdk_client: sdk_client.oidc.rotate_client_secret(
                client_id=client_id,
                body=body,
            )
        )
        if isinstance(result, RotateClientSecretResponse):
            return result
        if isinstance(result, dict):
            return RotateClientSecretResponse.model_validate(result)
        raise IBMVerifyServerError(message="Unexpected update_client_secret response payload")

    async def delete_rotated_client_secrets(self, client_id: str, path: list[str]) -> bool:
        """Delete rotated client secrets."""
        operations = [DeleteClientSecretOperation(path=p, op="remove") for p in path]
        await self._run_sdk(
            lambda sdk_client: sdk_client.oidc.delete_client_secrets(
                client_id=client_id,
                body=operations,
            )
        )
        return True

    async def aclose(self) -> None:
        """Close the underlying HTTP client."""
        await self._close_sdk_client()
        await self._client.aclose()


async def create_admin_oauth_client() -> AsyncOAuth2Client:
    """Create and configure the admin OAuth client."""
    base_url = settings.IBM_SV_ADMIN_BASE_URL
    if not base_url:
        raise ValueError("IBM_SV_ADMIN_BASE_URL is not configured")

    token_endpoint = f"{base_url.rstrip('/')}/oauth2/token"
    client_id = settings.IBM_SV_ADMIN_CLIENT_ID.get_secret_value() if settings.IBM_SV_ADMIN_CLIENT_ID else None
    client_secret = settings.IBM_SV_ADMIN_CLIENT_SECRET.get_secret_value() if settings.IBM_SV_ADMIN_CLIENT_SECRET else None
    return AsyncOAuth2Client(
        client_id=client_id,
        client_secret=client_secret,
        grant_type="client_credentials",
        token_endpoint=token_endpoint,
        leeway=120,
    )
