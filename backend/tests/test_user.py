"""Unit tests for user API endpoints."""

import uuid as uuid_pkg
from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.users import (
    add_role_to_user,
    erase_db_user,
    erase_user,
    patch_user,
    patch_user_department,
    patch_user_tier,
    read_user,
    read_user_department,
    read_user_rate_limits,
    read_user_role,
    read_user_tier,
    read_users,
    remove_role_from_user,
    write_user,
)
from src.app.schemas.user import (
    UserAddRole,
    UserCreate,
    UserDepartmentUpdate,
    UserRemoveRole,
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
        token = "mock_token"
        mock_service = Mock()
        mock_service.delete_user = AsyncMock(return_value={"message": "User deleted"})

        result = await unwrap_endpoint(erase_user)(Mock(), user_uuid, current_user_dict, mock_db, mock_service, token)

        assert result == {"message": "User deleted"}
        mock_service.delete_user.assert_awaited_once_with(
            db=mock_db,
            user_uuid=user_uuid,
            current_user=current_user_dict,
            token=token,
        )

    @pytest.mark.asyncio
    async def test_erase_db_user_success(self, mock_db, sample_user_read):
        user_uuid = str(sample_user_read.uuid)
        token = "mock_token"
        mock_service = Mock()
        mock_service.delete_user_from_db = AsyncMock(return_value={"message": "User deleted from the database"})

        result = await unwrap_endpoint(erase_db_user)(Mock(), user_uuid, mock_db, mock_service, token)

        assert result == {"message": "User deleted from the database"}
        mock_service.delete_user_from_db.assert_awaited_once_with(db=mock_db, user_uuid=user_uuid, token=token)


class TestUserRoleEndpoints:
    @pytest.mark.asyncio
    async def test_read_user_role_returns_none_when_user_has_no_role(self, mock_db, sample_user_read):
        user_dict = sample_user_read.model_dump()
        user_dict["role_ids"] = None
        user_uuid = str(sample_user_read.uuid)
        mock_service = Mock()
        mock_service.get_user_role = AsyncMock(return_value=None)

        result = await unwrap_endpoint(read_user_role)(Mock(), user_uuid, mock_db, mock_service)

        assert result is None
        mock_service.get_user_role.assert_awaited_once_with(db=mock_db, user_uuid=user_uuid)

    @pytest.mark.asyncio
    async def test_add_role_to_user(self, mock_db, sample_user_read):
        user_uuid = str(sample_user_read.uuid)
        role_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301"
        mock_service = Mock()
        mock_service.add_role_to_user = AsyncMock(return_value={"message": "Role added to user"})

        result = await unwrap_endpoint(add_role_to_user)(
            Mock(), user_uuid, uuid_pkg.UUID(role_uuid), mock_db, mock_service
        )

        assert result == {"message": "Role added to user"}
        mock_service.add_role_to_user.assert_awaited_once_with(
            db=mock_db, user_uuid=user_uuid, values=UserAddRole(role_uuid=uuid_pkg.UUID(role_uuid))
        )

    @pytest.mark.asyncio
    async def test_remove_role_from_user(self, mock_db, sample_user_read):
        user_uuid = str(sample_user_read.uuid)
        role_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301"
        mock_service = Mock()
        mock_service.remove_role_from_user = AsyncMock(return_value={"message": "Role removed from user"})

        result = await unwrap_endpoint(remove_role_from_user)(
            Mock(), user_uuid, uuid_pkg.UUID(role_uuid), mock_db, mock_service
        )

        assert result == {"message": "Role removed from user"}
        mock_service.remove_role_from_user.assert_awaited_once_with(
            db=mock_db, user_uuid=user_uuid, values=UserRemoveRole(role_uuid=uuid_pkg.UUID(role_uuid))
        )


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
