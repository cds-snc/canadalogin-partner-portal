"""Unit tests for user API endpoints."""

from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.users import (
    erase_user,
    patch_user,
    patch_user_department,
    patch_user_tier,
    read_pending_user_invitations,
    read_user,
    read_user_access_administration,
    read_user_department,
    read_user_rate_limits,
    read_user_tier,
    read_users,
    resolve_user_invitation_target,
    write_user,
)
from src.app.schemas.user import (
    UserCreate,
    UserDepartmentUpdate,
    UserInvitationTargetResolutionRequest,
    UserTierUpdate,
    UserUpdate,
)


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


class TestWriteUser:
    """Test user creation endpoint."""

    @pytest.mark.asyncio
    async def test_create_user_success(self, mock_db, sample_user_data, sample_user_read):
        """Test successful user creation."""
        user_create = UserCreate(**sample_user_data)
        mock_service = Mock()
        mock_service.create_user = AsyncMock(return_value=sample_user_read.model_dump())

        result = await unwrap_endpoint(write_user)(Mock(), user_create, mock_db, mock_service)

        assert result == sample_user_read.model_dump()
        mock_service.create_user.assert_awaited_once_with(db=mock_db, user=user_create)


class TestReadUser:
    """Test user retrieval endpoint."""

    @pytest.mark.asyncio
    async def test_read_user_success(self, mock_db, sample_user_read):
        """Test successful user retrieval."""
        user_uuid = str(sample_user_read.uuid)
        mock_service = Mock()
        mock_service.get_user_by_uuid = AsyncMock(return_value=sample_user_read.model_dump())

        result = await unwrap_endpoint(read_user)(Mock(), user_uuid, mock_db, mock_service)

        assert result == sample_user_read.model_dump()
        mock_service.get_user_by_uuid.assert_awaited_once_with(db=mock_db, user_uuid=user_uuid)

    @pytest.mark.asyncio
    async def test_read_user_access_administration_delegates_with_actor(
        self,
        mock_db,
        current_user_dict,
        sample_user_read,
    ) -> None:
        user_uuid = sample_user_read.uuid
        expected = Mock()
        mock_service = Mock()
        mock_service.get_user_access_administration = AsyncMock(return_value=expected)

        result = await read_user_access_administration(
            Mock(),
            user_uuid,
            current_user_dict,
            mock_db,
            mock_service,
        )

        assert result is expected
        mock_service.get_user_access_administration.assert_awaited_once_with(
            db=mock_db,
            user_uuid=user_uuid,
            current_user=current_user_dict,
        )

    @pytest.mark.asyncio
    async def test_resolve_invitation_target_delegates_normalized_schema_value(
        self,
        mock_db,
        current_user_dict,
    ) -> None:
        payload = UserInvitationTargetResolutionRequest(invited_email="invitee@example.gc.ca")
        expected = Mock()
        mock_service = Mock()
        mock_service.resolve_invitation_target = AsyncMock(return_value=expected)

        result = await resolve_user_invitation_target(
            Mock(),
            payload,
            current_user_dict,
            mock_db,
            mock_service,
        )

        assert result is expected
        mock_service.resolve_invitation_target.assert_awaited_once_with(
            db=mock_db,
            invited_email="invitee@example.gc.ca",
            current_user=current_user_dict,
        )


class TestReadUsers:
    """Test users list endpoint."""

    @pytest.mark.asyncio
    async def test_read_users_success(self, mock_db):
        """Test successful users list retrieval."""
        expected_response = {
            "data": [
                {"uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"},
                {"uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f2"},
            ],
            "pagination": {},
        }
        mock_service = Mock()
        mock_service.list_users = AsyncMock(return_value=expected_response)

        result = await unwrap_endpoint(read_users)(Mock(), mock_db, mock_service, 1, 10)

        assert result == expected_response
        mock_service.list_users.assert_awaited_once_with(db=mock_db, page=1, items_per_page=10)

    @pytest.mark.asyncio
    async def test_read_pending_invitations_delegates_with_actor(
        self,
        mock_db,
        current_user_dict,
    ) -> None:
        expected_response = {
            "data": [],
            "has_more": False,
            "items_per_page": 10,
            "page": 1,
            "total_count": 0,
        }
        mock_service = Mock()
        mock_service.list_pending_invitations = AsyncMock(return_value=expected_response)

        result = await read_pending_user_invitations(
            Mock(),
            current_user_dict,
            mock_db,
            mock_service,
            1,
            10,
        )

        assert result == expected_response
        mock_service.list_pending_invitations.assert_awaited_once_with(
            db=mock_db,
            page=1,
            items_per_page=10,
            current_user=current_user_dict,
        )


class TestPatchUser:
    """Test user update endpoint."""

    @pytest.mark.asyncio
    async def test_patch_user_success(self, mock_db, current_user_dict, sample_user_read):
        """Test successful user update."""
        user_uuid = str(sample_user_read.uuid)
        user_update = UserUpdate(name="New Name")
        mock_service = Mock()
        mock_service.update_user = AsyncMock(return_value={"message": "User updated"})

        result = await unwrap_endpoint(patch_user)(Mock(), user_update, user_uuid, current_user_dict, mock_db, mock_service)

        assert result == {"message": "User updated"}
        mock_service.update_user.assert_awaited_once_with(
            db=mock_db,
            user_uuid=user_uuid,
            current_user=current_user_dict,
            values=user_update,
        )


class TestEraseUser:
    """Test user deletion endpoint."""

    @pytest.mark.asyncio
    async def test_erase_user_success(self, mock_db, current_user_dict, sample_user_read):
        """Test successful user deletion."""
        user_uuid = str(sample_user_read.uuid)
        mock_service = Mock()
        mock_service.delete_user = AsyncMock(return_value={"message": "User deleted"})

        result = await unwrap_endpoint(erase_user)(Mock(), user_uuid, current_user_dict, mock_db, mock_service)

        assert result == {"message": "User deleted"}
        mock_service.delete_user.assert_awaited_once_with(
            db=mock_db,
            user_uuid=user_uuid,
            current_user=current_user_dict,
            token=None,
        )

    @pytest.mark.asyncio
    async def test_erase_user_accepts_cookie_session_without_bearer_token(
        self,
        mock_db,
        current_user_dict,
        sample_user_read,
    ):
        user_uuid = str(sample_user_read.uuid)
        request = Mock()
        request.session = {"user_uuid": str(current_user_dict["uuid"])}
        mock_service = Mock()
        mock_service.delete_user = AsyncMock(return_value={"message": "User deleted"})

        result = await unwrap_endpoint(erase_user)(
            request,
            user_uuid,
            current_user_dict,
            mock_db,
            mock_service,
        )

        assert result == {"message": "User deleted"}
        mock_service.delete_user.assert_awaited_once_with(
            db=mock_db,
            user_uuid=user_uuid,
            current_user=current_user_dict,
            token=None,
        )

    @pytest.mark.asyncio
    async def test_erase_user_clears_cookie_session_when_actor_deletes_self(
        self,
        mock_db,
        current_user_dict,
    ):
        user_uuid = str(current_user_dict["uuid"])
        request = Mock()
        request.session = {
            "local_dev_fixture_id": "local-cl-admin",
            "user_uuid": user_uuid,
        }
        mock_service = Mock()
        mock_service.delete_user = AsyncMock(return_value={"message": "User deleted"})

        result = await unwrap_endpoint(erase_user)(
            request,
            user_uuid,
            current_user_dict,
            mock_db,
            mock_service,
        )

        assert result == {"message": "User deleted"}
        assert request.session == {}


class TestUserDepartmentEndpoints:
    @pytest.mark.asyncio
    async def test_read_user_department_returns_none_when_user_has_no_department(self, mock_db, sample_user_read):
        user_uuid = str(sample_user_read.uuid)
        mock_service = Mock()
        mock_service.get_user_department = AsyncMock(return_value=None)

        result = await unwrap_endpoint(read_user_department)(Mock(), user_uuid, mock_db, mock_service)

        assert result is None
        mock_service.get_user_department.assert_awaited_once_with(db=mock_db, user_uuid=user_uuid)

    @pytest.mark.asyncio
    async def test_patch_user_department_assigns_department(self, mock_db, sample_user_read):
        user_uuid = str(sample_user_read.uuid)
        department_update = UserDepartmentUpdate(department_abbreviation="AAFC")
        mock_service = Mock()
        mock_service.update_user_department = AsyncMock(return_value={"message": "User department updated"})

        result = await unwrap_endpoint(patch_user_department)(Mock(), user_uuid, department_update, mock_db, mock_service)

        assert result == {"message": "User department updated"}
        mock_service.update_user_department.assert_awaited_once_with(db=mock_db, user_uuid=user_uuid, values=department_update)


class TestUserNestedEndpoints:
    @pytest.mark.asyncio
    async def test_read_user_rate_limits_uses_uuid(self, mock_db, sample_user_read):
        user_uuid = str(sample_user_read.uuid)
        mock_service = Mock()
        mock_service.get_user_rate_limits = AsyncMock(return_value={"uuid": user_uuid, "tier_rate_limits": []})

        result = await unwrap_endpoint(read_user_rate_limits)(Mock(), user_uuid, mock_db, mock_service)

        assert result == {"uuid": user_uuid, "tier_rate_limits": []}
        mock_service.get_user_rate_limits.assert_awaited_once_with(db=mock_db, user_uuid=user_uuid)

    @pytest.mark.asyncio
    async def test_read_user_tier_uses_uuid(self, mock_db, sample_user_read):
        user_uuid = str(sample_user_read.uuid)
        mock_service = Mock()
        mock_service.get_user_tier = AsyncMock(return_value={"uuid": user_uuid, "tier_name": "free"})

        result = await unwrap_endpoint(read_user_tier)(Mock(), user_uuid, mock_db, mock_service)

        assert result == {"uuid": user_uuid, "tier_name": "free"}
        mock_service.get_user_tier.assert_awaited_once_with(db=mock_db, user_uuid=user_uuid)

    @pytest.mark.asyncio
    async def test_patch_user_tier_uses_uuid(self, mock_db, sample_user_read):
        user_uuid = str(sample_user_read.uuid)
        values = UserTierUpdate(tier_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401")
        mock_service = Mock()
        mock_service.update_user_tier = AsyncMock(return_value={"message": "User Tier updated"})

        result = await unwrap_endpoint(patch_user_tier)(Mock(), user_uuid, values, mock_db, mock_service)

        assert result == {"message": "User Tier updated"}
        mock_service.update_user_tier.assert_awaited_once_with(db=mock_db, user_uuid=user_uuid, values=values)
