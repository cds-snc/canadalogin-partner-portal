"""IBM Security Verify Admin API client."""

import inspect
import logging
from collections.abc import Callable
from typing import Any

import httpx
import requests
from authlib.integrations.httpx_client import AsyncOAuth2Client
from ibm_verify_community_sdk.applications.models import ApplicationRequest
from ibm_verify_community_sdk.client import APIClientError, IbmVerifyClient
from ibm_verify_community_sdk.groups.models import PatchGroupOperation, PatchGroupRequest
from ibm_verify_community_sdk.oidc.models import DeleteClientSecretOperation, RotateClientSecretRequest
from ibm_verify_community_sdk.reports.models import ReportRequest, ReportSearchAfterRequest

from ..core.config import settings
from ..core.exceptions.ibm_sv_exceptions import (
    IBMVerifyBadRequest,
    IBMVerifyForbidden,
    IBMVerifyNotFound,
    IBMVerifyServerError,
    IBMVerifyUnauthorized,
)

LOGGER = logging.getLogger(__name__)


class IBMVerifyAdminClient:
    """Client for IBM Security Verify Admin API operations."""

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

    async def fetch_users(self) -> list[dict[str, Any]]:
        """Fetch all users from IBM Verify."""
        payload = await self._run_sdk(
            lambda sdk_client: sdk_client.users.get_users(
                count="100",
                sortBy="name.formatted",
                startIndex="1",
            )
        )
        if isinstance(payload, dict):
            resources = payload.get("Resources")
            if isinstance(resources, list):
                return resources
        return payload if isinstance(payload, list) else []

    async def search_users_by_name(self, username: str) -> list[dict[str, Any]]:
        """Search for users by username."""
        payload = await self._run_sdk(
            lambda sdk_client: sdk_client.users.get_users(
                count="100",
                sortBy="name.formatted",
                startIndex="1",
                fullText=username,
            )
        )
        if isinstance(payload, dict):
            resources = payload.get("Resources")
            if isinstance(resources, list):
                return resources
        return payload if isinstance(payload, list) else []

    async def list_applications(self) -> list[dict[str, Any]]:
        """List all applications."""
        payload = await self._run_sdk(lambda sdk_client: sdk_client.applications.list_applications())
        if isinstance(payload, dict):
            embedded = payload.get("_embedded")
            if isinstance(embedded, dict):
                resources = embedded.get("applications")
                if isinstance(resources, list):
                    return resources
            resources = payload.get("resources", payload.get("Resources"))
            if isinstance(resources, list):
                return resources
        return payload if isinstance(payload, list) else []

    async def get_application_detail(self, application_id: str) -> dict[str, Any]:
        """Get application details by ID."""
        payload = await self._run_sdk(lambda sdk_client: sdk_client.applications.get_application(application_id=application_id))
        return payload if isinstance(payload, dict) else {}

    async def create_application(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Create a new application."""
        body = ApplicationRequest.model_validate(payload)
        result = await self._run_sdk(lambda sdk_client: sdk_client.applications.create_application(body=body))
        return result if isinstance(result, dict) else {}

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
    ) -> dict[str, Any]:
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
        return payload if isinstance(payload, dict) else {}

    async def get_application_audit_trail(
        self,
        application_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
        size: int = 25,
        sort_by: str = "time",
        sort_order: str = "DESC",
    ) -> dict[str, Any]:
        """Get audit trail for an application."""
        from_timestamp, to_timestamp = self._resolve_report_range(from_date, to_date)
        normalized_sort_order = (sort_order or "DESC").upper()
        if normalized_sort_order not in {"ASC", "DESC"}:
            normalized_sort_order = "DESC"
        body = ReportRequest.model_validate(
            {
                "APPID": application_id,
                "FROM": from_timestamp,
                "TO": to_timestamp,
                "SIZE": size if size > 0 else 50,
                "SORT_BY": sort_by or "time",
                "SORT_ORDER": normalized_sort_order,
            }
        )
        payload = await self._run_sdk(lambda sdk_client: sdk_client.reports.run_app_audit_trail(body=body))
        return payload if isinstance(payload, dict) else {}

    async def app_audit_trail_search_after(
        self,
        application_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
        size: int = 25,
        search_after: str | None = None,
    ) -> dict[str, Any]:
        """Get audit trail with search_after cursor for pagination."""
        from_timestamp, to_timestamp = self._resolve_report_range(from_date, to_date)
        body = ReportSearchAfterRequest.model_validate(
            {
                "APPID": application_id,
                "FROM": from_timestamp,
                "TO": to_timestamp,
                "SIZE": size if size > 0 else 25,
                "SORT_BY": "time",
                "SORT_ORDER": "DESC",
                "SEARCH_AFTER": search_after or "",
            }
        )
        payload = await self._run_sdk(lambda sdk_client: sdk_client.reports.run_app_audit_trail_search_after(body=body))
        return payload if isinstance(payload, dict) else {}

    async def get_client_secret(self, client_id: str) -> dict[str, Any]:
        """Get client secrets for an OIDC client."""
        payload = await self._run_sdk(lambda sdk_client: sdk_client.oidc.get_client_secrets(client_id=client_id))
        return payload if isinstance(payload, dict) else {}

    async def update_client_secret(self, client_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Update client secret for an OIDC client."""
        body = RotateClientSecretRequest.model_validate(payload) if payload else None
        result = await self._run_sdk(
            lambda sdk_client: sdk_client.oidc.rotate_client_secret(
                client_id=client_id,
                body=body,
            )
        )
        return result if isinstance(result, dict) else {}

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

    async def get_application_entitlements(self, application_id: str) -> dict[str, Any]:
        """Get entitlements for an application."""
        payload = await self._run_sdk(
            lambda sdk_client: sdk_client.applications.get_application_entitlements(application_id=application_id)
        )
        return payload if isinstance(payload, dict) else {}

    async def list_groups(self, count: int = 100, start_index: int = 1) -> list[dict[str, Any]]:
        """List all groups."""
        payload = await self._run_sdk(
            lambda sdk_client: sdk_client.groups.get_groups(
                count=str(count),
                startIndex=str(start_index),
            )
        )
        if isinstance(payload, dict):
            resources = payload.get("Resources")
            if isinstance(resources, list):
                return resources
        return payload if isinstance(payload, list) else []

    async def search_groups_by_name(self, group_name: str) -> list[dict[str, Any]]:
        """Search for groups by name."""
        payload = await self._run_sdk(
            lambda sdk_client: sdk_client.groups.get_groups(
                count="100",
                startIndex="1",
                sortBy="displayName",
                fullText=group_name,
            )
        )
        if isinstance(payload, dict):
            resources = payload.get("Resources")
            if isinstance(resources, list):
                return resources
        return payload if isinstance(payload, list) else []

    async def get_group_by_id(self, group_id: str) -> dict[str, Any]:
        """Get a group by ID."""
        payload = await self._run_sdk(lambda sdk_client: sdk_client.groups.get_group(group_id=group_id))
        return payload if isinstance(payload, dict) else {}

    async def add_user_to_group(self, group_id: str, user_id: str) -> None:
        """Add a user to a group."""
        body = PatchGroupRequest(
            schemas=["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            Operations=[
                PatchGroupOperation(op="add", path="members", value=[{"type": "user", "value": user_id}]),
                PatchGroupOperation(
                    op="add",
                    path="urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification:notifyType",
                    value="NONE",
                ),
            ],
        )
        await self._run_sdk(lambda sdk_client: sdk_client.groups.patch_group(group_id=group_id, body=body))

    async def remove_user_from_group(self, group_id: str, user_id: str) -> None:
        """Remove a user from a group."""
        body = PatchGroupRequest(
            schemas=["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            Operations=[PatchGroupOperation(op="remove", path=f'members[value eq "{user_id}"]')],
        )
        await self._run_sdk(lambda sdk_client: sdk_client.groups.patch_group(group_id=group_id, body=body))

    async def is_user_in_group(self, group_id: str, user_id: str) -> bool:
        """Check if a user is a member of a group."""
        try:
            group = await self.get_group_by_id(group_id)
            members = group.get("members", [])
            for member in members:
                if member.get("value") == user_id:
                    return True
            return False
        except Exception:
            return False

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
    client_secret = (
        settings.IBM_SV_ADMIN_CLIENT_SECRET.get_secret_value() if settings.IBM_SV_ADMIN_CLIENT_SECRET else None
    )
    return AsyncOAuth2Client(
        client_id=client_id,
        client_secret=client_secret,
        grant_type="client_credentials",
        token_endpoint=token_endpoint,
        leeway=120,
    )
