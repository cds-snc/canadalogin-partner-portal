"""IBM Security Verify Admin API client."""

import logging
from typing import Any

from authlib.integrations.httpx_client import AsyncOAuth2Client

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

    def _handle_response(self, response: Any) -> None:
        """Handle HTTP response and raise appropriate exception on error."""
        if response.status_code < 400:
            return

        response_body = response.json() if response.content else None
        message = None
        if isinstance(response_body, dict):
            raw_message = response_body.get("message")
            if isinstance(raw_message, str) and raw_message.strip():
                message = raw_message.strip()

        request = getattr(response, "request", None)
        if request is not None:
            request_method = getattr(request, "method", "UNKNOWN")
            request_url = getattr(request, "url", "")
            request_content = getattr(request, "content", b"")
            try:
                request_body = (
                    request_content.decode("utf-8", errors="replace")
                    if isinstance(request_content, bytes | bytearray)
                    else str(request_content)
                )
            except Exception:
                request_body = "<unavailable>"

            LOGGER.error(
                "IBM Verify API request failed method=%s url=%s status_code=%s request_body=%s response_body=%s",
                request_method,
                request_url,
                response.status_code,
                request_body,
                response.text,
            )

        error_map = {
            400: IBMVerifyBadRequest,
            401: IBMVerifyUnauthorized,
            403: IBMVerifyForbidden,
            404: IBMVerifyNotFound,
        }

        exception_class = error_map.get(response.status_code, IBMVerifyServerError)

        raise exception_class(
            message=message or exception_class.__name__,
            response_body=response_body,
        )

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
        response = await self._client.get(f"{self._base_url}/v2.0/Users")
        self._handle_response(response)
        payload: Any = response.json()
        if isinstance(payload, list):
            return payload
        return payload.get("Resources", [])  # type: ignore[no-any-return]

    async def search_users_by_name(self, username: str) -> list[dict[str, Any]]:
        """Search for users by username."""
        query_params = {
            "count": 100,
            "fullText": username,
            "sortBy": "name.formatted",
            "startIndex": 1,
        }
        response = await self._client.get(
            f"{self._base_url}/v2.0/Users",
            params=query_params,
        )
        self._handle_response(response)
        payload: Any = response.json()
        if isinstance(payload, list):
            return payload
        return payload.get("Resources", [])  # type: ignore[no-any-return]

    async def list_applications(self) -> list[dict[str, Any]]:
        """List all applications."""
        response = await self._client.get(f"{self._base_url}/v1.0/applications")
        self._handle_response(response)
        payload: Any = response.json()
        if isinstance(payload, list):
            return payload
        return payload.get("resources", payload.get("Resources", []))  # type: ignore[no-any-return]

    async def get_application_detail(self, application_id: str) -> dict[str, Any]:
        """Get application details by ID."""
        response = await self._client.get(f"{self._base_url}/v1.0/applications/{application_id}")
        self._handle_response(response)
        return response.json()  # type: ignore[no-any-return]

    async def create_application(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Create a new application."""
        response = await self._client.post(
            f"{self._base_url}/v1.0/applications",
            headers={"Accept": "application/json"},
            json=payload,
        )
        self._handle_response(response)
        return response.json()  # type: ignore[no-any-return]

    async def update_application(self, application_id: str, payload: dict[str, Any]) -> bool:
        """Update an existing application."""
        response = await self._client.put(
            f"{self._base_url}/v1.0/applications/{application_id}",
            headers={"Accept": "application/json"},
            json=payload,
        )
        self._handle_response(response)
        return True

    async def delete_application(self, application_id: str) -> None:
        """Delete an application."""
        response = await self._client.delete(f"{self._base_url}/v1.0/applications/{application_id}")
        self._handle_response(response)

    async def get_application_total_logins(
        self,
        application_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> dict[str, Any]:
        """Get total logins for an application."""
        from_timestamp, to_timestamp = self._resolve_report_range(from_date, to_date)
        payload = {"APPID": application_id, "FROM": from_timestamp, "TO": to_timestamp}
        response = await self._client.post(
            f"{self._base_url}/v1.0/reports/app_total_logins",
            json=payload,
        )
        self._handle_response(response)
        return response.json()  # type: ignore[no-any-return]

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
        payload = {
            "APPID": application_id,
            "FROM": from_timestamp,
            "TO": to_timestamp,
            "SIZE": size if size > 0 else 50,
            "SORT_BY": sort_by or "time",
            "SORT_ORDER": normalized_sort_order,
        }
        response = await self._client.post(
            f"{self._base_url}/v1.0/reports/app_audit_trail",
            json=payload,
        )
        self._handle_response(response)
        return response.json()  # type: ignore[no-any-return]

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
        payload = {
            "APPID": application_id,
            "FROM": from_timestamp,
            "TO": to_timestamp,
            "SIZE": size if size > 0 else 25,
            "SORT_BY": "time",
            "SORT_ORDER": "DESC",
            "SEARCH_AFTER": search_after,
        }
        response = await self._client.post(
            f"{self._base_url}/v1.0/reports/app_audit_trail_search_after",
            json=payload,
        )
        self._handle_response(response)
        return response.json()  # type: ignore[no-any-return]

    async def get_client_secret(self, client_id: str) -> dict[str, Any]:
        """Get client secrets for an OIDC client."""
        response = await self._client.get(
            f"{self._base_url}/oidc-mgmt/v2.0/clients/{client_id}/secrets"
        )
        self._handle_response(response)
        return response.json()  # type: ignore[no-any-return]

    async def update_client_secret(self, client_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Update client secret for an OIDC client."""
        response = await self._client.post(
            f"{self._base_url}/oidc-mgmt/v2.0/clients/{client_id}/secrets",
            json=payload,
        )
        self._handle_response(response)
        return response.json()  # type: ignore[no-any-return]

    async def delete_rotated_client_secrets(self, client_id: str, path: list[str]) -> bool:
        """Delete rotated client secrets."""
        payload = [{"path": p, "op": "remove"} for p in path]
        response = await self._client.patch(
            f"{self._base_url}/oidc-mgmt/v2.0/clients/{client_id}/secrets",
            json=payload,
        )
        self._handle_response(response)
        return True

    async def get_application_entitlements(self, application_id: str) -> dict[str, Any]:
        """Get entitlements for an application."""
        response = await self._client.get(
            f"{self._base_url}/v1.0/owner/applications/{application_id}/entitlements"
        )
        self._handle_response(response)
        return response.json()  # type: ignore[no-any-return]

    async def list_groups(self, count: int = 100, start_index: int = 1) -> list[dict[str, Any]]:
        """List all groups."""
        query_params = {
            "count": count,
            "startIndex": start_index,
        }
        response = await self._client.get(
            f"{self._base_url}/v2.0/Groups",
            params=query_params,
        )
        self._handle_response(response)
        payload: Any = response.json()
        if isinstance(payload, list):
            return payload
        return payload.get("Resources", [])  # type: ignore[no-any-return]

    async def search_groups_by_name(self, group_name: str) -> list[dict[str, Any]]:
        """Search for groups by name."""
        query_params = {
            "count": 100,
            "fullText": group_name,
            "sortBy": "displayName",
            "startIndex": 1,
        }
        response = await self._client.get(
            f"{self._base_url}/v2.0/Groups",
            params=query_params,
        )
        self._handle_response(response)
        payload: Any = response.json()
        if isinstance(payload, list):
            return payload
        return payload.get("Resources", [])  # type: ignore[no-any-return]

    async def get_group_by_id(self, group_id: str) -> dict[str, Any]:
        """Get a group by ID."""
        response = await self._client.get(f"{self._base_url}/v2.0/Groups/{group_id}")
        self._handle_response(response)
        return response.json()  # type: ignore[no-any-return]

    async def add_user_to_group(self, group_id: str, user_id: str) -> None:
        """Add a user to a group."""
        payload = {
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [
                {
                    "op": "add",
                    "path": "members",
                    "value": [{"type": "user", "value": user_id}],
                },
                {
                    "op": "add",
                    "path": "urn:ietf:params:scim:schemas:extension:ibm:2.0:Notification:notifyType",
                    "value": "NONE",
                },
            ],
        }
        response = await self._client.patch(
            f"{self._base_url}/v2.0/Groups/{group_id}",
            json=payload,
            headers={"Content-Type": "application/scim+json"},
        )
        self._handle_response(response)

    async def remove_user_from_group(self, group_id: str, user_id: str) -> None:
        """Remove a user from a group."""
        payload = {
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
            "Operations": [
                {
                    "op": "remove",
                    "path": f'members[value eq "{user_id}"]',
                }
            ],
        }
        response = await self._client.patch(
            f"{self._base_url}/v2.0/Groups/{group_id}",
            json=payload,
            headers={"Content-Type": "application/scim+json"},
        )
        self._handle_response(response)

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
