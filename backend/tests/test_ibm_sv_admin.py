"""Unit tests for IBM Security Verify Admin API endpoints."""

from typing import Any
from unittest.mock import AsyncMock, Mock, patch

import pytest
from ibm_verify_community_sdk.applications.models import (
    GetApplicationEntitlementsResponse,
    GetApplicationResponse,
)
from ibm_verify_community_sdk.groups.models import GetGroupsResponse, Group
from ibm_verify_community_sdk.reports.models import ReportResponse
from ibm_verify_community_sdk.users.models import GetAccountDetailsResponse, GetUsersResponse

from src.app.api.v1 import ibm_sv_admin


def unwrap_endpoint(endpoint: Any) -> Any:
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


class TestUserEndpoints:
    @pytest.mark.asyncio
    async def test_list_users_delegates_to_client(self):
        mock_client = Mock()
        mock_client.fetch_users = AsyncMock(
            return_value=GetUsersResponse(
                Resources=[
                    GetAccountDetailsResponse(id="user1", name={"formatted": "Test User"}),
                    GetAccountDetailsResponse(id="user2", name={"formatted": "Another User"}),
                ]
            )
        )

        result = await unwrap_endpoint(ibm_sv_admin.list_users)(Mock(), mock_client)

        assert len(result) == 2
        assert result[0]["id"] == "user1"
        mock_client.fetch_users.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_search_users_delegates_to_client(self):
        mock_client = Mock()
        mock_client.search_users_by_name = AsyncMock(
            return_value=GetUsersResponse(
                Resources=[GetAccountDetailsResponse(id="user1", name={"formatted": "Test User"})]
            )
        )

        result = await unwrap_endpoint(ibm_sv_admin.search_users)(Mock(), "test", mock_client)

        assert len(result) == 1
        assert result[0]["id"] == "user1"
        mock_client.search_users_by_name.assert_awaited_once_with("test")


class TestApplicationEndpoints:
    @pytest.mark.asyncio
    async def test_list_applications_delegates_to_client(self):
        mock_client = Mock()
        mock_client.list_applications = AsyncMock(
            return_value=[{"id": "app1", "name": "Test App"}]
        )

        result = await unwrap_endpoint(ibm_sv_admin.list_applications)(Mock(), mock_client)

        assert len(result) == 1
        assert result[0]["name"] == "Test App"
        mock_client.list_applications.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_application_delegates_to_client(self):
        mock_client = Mock()
        mock_client.get_application_detail = AsyncMock(
            return_value=GetApplicationResponse(name="Test App", description="A test app")
        )

        result = await unwrap_endpoint(ibm_sv_admin.get_application)(Mock(), "app1", mock_client)

        assert result["name"] == "Test App"
        mock_client.get_application_detail.assert_awaited_once_with("app1")

    @pytest.mark.asyncio
    async def test_create_application_delegates_to_service(self):
        mock_client = Mock()
        mock_service = Mock()
        mock_service.create_application_from_payload = AsyncMock(
            return_value={"id": "app1", "name": "New App"}
        )

        with patch("src.app.services.ibm_sv_admin_service.IBMVerifyAdminService", return_value=mock_service):
            result = await unwrap_endpoint(ibm_sv_admin.create_application)(
                Mock(),
                ibm_sv_admin.ApplicationCreateRequest(
                    name="New App",
                    description="A new app",
                    application_url="https://example.com",
                    redirect_uris=["https://example.com/callback"],
                    owners=["user1"],
                ),
                mock_client,
            )

        assert result["name"] == "New App"
        mock_service.create_application_from_payload.assert_awaited_once_with(
            {
                "name": "New App",
                "description": "A new app",
                "application_url": "https://example.com",
                "redirect_uris": ["https://example.com/callback"],
            },
            ["user1"],
        )

    @pytest.mark.asyncio
    async def test_update_application_delegates_to_service(self):
        mock_client = Mock()
        mock_service = Mock()
        mock_service.update_application_from_payload = AsyncMock()

        with patch("src.app.services.ibm_sv_admin_service.IBMVerifyAdminService", return_value=mock_service):
            result = await unwrap_endpoint(ibm_sv_admin.update_application)(
                Mock(),
                "app1",
                ibm_sv_admin.ApplicationUpdateRequest(
                    name="Updated App",
                    description="Updated description",
                    application_url="https://example.com",
                    redirect_uris=["https://example.com/callback"],
                ),
                mock_client,
            )

        assert result["message"] == "Application updated"
        mock_service.update_application_from_payload.assert_awaited_once_with(
            "app1",
            {
                "name": "Updated App",
                "description": "Updated description",
                "application_url": "https://example.com",
                "redirect_uris": ["https://example.com/callback"],
            },
        )

    @pytest.mark.asyncio
    async def test_delete_application_delegates_to_client(self):
        mock_client = Mock()
        mock_client.delete_application = AsyncMock()

        result = await unwrap_endpoint(ibm_sv_admin.delete_application)(Mock(), "app1", mock_client)

        assert result["message"] == "Application deleted"
        mock_client.delete_application.assert_awaited_once_with("app1")

    @pytest.mark.asyncio
    async def test_get_application_logins_delegates_to_client(self):
        mock_client = Mock()
        mock_client.get_application_total_logins = AsyncMock(
            return_value=ReportResponse(response={"total": 100, "logins": []}, success=True)
        )

        result = await unwrap_endpoint(ibm_sv_admin.get_application_logins)(
            Mock(), "app1", mock_client, from_date="2024-01-01", to_date="2024-01-31"
        )

        assert result["response"]["total"] == 100
        mock_client.get_application_total_logins.assert_awaited_once_with("app1", "2024-01-01", "2024-01-31")

    @pytest.mark.asyncio
    async def test_get_application_audit_trail_delegates_to_service(self):
        mock_client = Mock()
        mock_service = Mock()
        mock_service.get_application_audit_trail = AsyncMock(
            return_value={"events": [], "total": 0}
        )

        with patch("src.app.services.ibm_sv_admin_service.IBMVerifyAdminService", return_value=mock_service):
            result = await unwrap_endpoint(ibm_sv_admin.get_application_audit_trail)(
                Mock(), "app1", mock_client, size=50, sort_by="time", sort_order="DESC"
            )

        assert "events" in result
        mock_service.get_application_audit_trail.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_application_entitlements_delegates_to_client(self):
        mock_client = Mock()
        mock_client.get_application_entitlements = AsyncMock(
            return_value=GetApplicationEntitlementsResponse(entitlements=[])
        )

        result = await unwrap_endpoint(ibm_sv_admin.get_application_entitlements)(Mock(), "app1", mock_client)

        assert "entitlements" in result
        mock_client.get_application_entitlements.assert_awaited_once_with("app1")


class TestGroupEndpoints:
    @pytest.mark.asyncio
    async def test_list_groups_delegates_to_client(self):
        mock_client = Mock()
        mock_client.list_groups = AsyncMock(
            return_value=GetGroupsResponse(
                Resources=[Group(id="group1", displayName="Test Group")]
            )
        )

        result = await unwrap_endpoint(ibm_sv_admin.list_groups)(Mock(), mock_client, count=100, start_index=1)

        assert len(result) == 1
        assert result[0]["displayName"] == "Test Group"
        mock_client.list_groups.assert_awaited_once_with(100, 1)

    @pytest.mark.asyncio
    async def test_search_groups_delegates_to_client(self):
        mock_client = Mock()
        mock_client.search_groups_by_name = AsyncMock(
            return_value=GetGroupsResponse(
                Resources=[Group(id="group1", displayName="Test Group")]
            )
        )

        result = await unwrap_endpoint(ibm_sv_admin.search_groups)(Mock(), "test", mock_client)

        assert len(result) == 1
        mock_client.search_groups_by_name.assert_awaited_once_with("test")

    @pytest.mark.asyncio
    async def test_get_group_delegates_to_client(self):
        mock_client = Mock()
        mock_client.get_group_by_id = AsyncMock(
            return_value=Group(id="group1", displayName="Test Group")
        )

        result = await unwrap_endpoint(ibm_sv_admin.get_group)(Mock(), "group1", mock_client)

        assert result["displayName"] == "Test Group"
        mock_client.get_group_by_id.assert_awaited_once_with("group1")

    @pytest.mark.asyncio
    async def test_add_user_to_group_delegates_to_client(self):
        mock_client = Mock()
        mock_client.add_user_to_group = AsyncMock()

        result = await unwrap_endpoint(ibm_sv_admin.add_user_to_group)(Mock(), "group1", "user1", mock_client)

        assert result["message"] == "User added to group"
        mock_client.add_user_to_group.assert_awaited_once_with("group1", "user1")

    @pytest.mark.asyncio
    async def test_remove_user_from_group_delegates_to_client(self):
        mock_client = Mock()
        mock_client.remove_user_from_group = AsyncMock()

        result = await unwrap_endpoint(ibm_sv_admin.remove_user_from_group)(Mock(), "group1", "user1", mock_client)

        assert result["message"] == "User removed from group"
        mock_client.remove_user_from_group.assert_awaited_once_with("group1", "user1")

    @pytest.mark.asyncio
    async def test_check_user_in_group_delegates_to_client(self):
        mock_client = Mock()
        mock_client.is_user_in_group = AsyncMock(return_value=True)

        result = await unwrap_endpoint(ibm_sv_admin.check_user_in_group)(Mock(), "group1", "user1", mock_client)

        assert result["is_member"] is True
        mock_client.is_user_in_group.assert_awaited_once_with("group1", "user1")
