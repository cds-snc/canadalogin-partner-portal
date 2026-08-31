from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.roles import erase_role, read_role, read_roles, write_role
from src.app.schemas.role import RoleCreate


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


class TestWriteRole:
    @pytest.mark.asyncio
    async def test_create_role_success(self, mock_db):
        role_create = RoleCreate(name="editor", description="Editor role")
        mock_service = Mock()
        mock_service.create_role = AsyncMock(
            return_value={
                "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301",
                "name": "editor",
                "description": "Editor role",
                "created_at": "2026-03-17T00:00:00",
            }
        )

        result = await unwrap_endpoint(write_role)(Mock(), role_create, mock_db, mock_service)

        assert result == {
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301",
            "name": "editor",
            "description": "Editor role",
            "created_at": "2026-03-17T00:00:00",
        }
        mock_service.create_role.assert_awaited_once_with(db=mock_db, role=role_create)


class TestReadRoles:
    @pytest.mark.asyncio
    async def test_read_roles_success(self, mock_db):
        mock_service = Mock()
        mock_service.list_roles = AsyncMock(return_value={"data": [{"uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b302", "name": "admin"}]})

        result = await unwrap_endpoint(read_roles)(Mock(), mock_db, mock_service, page=1, items_per_page=10)

        assert result == {"data": [{"uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b302", "name": "admin"}]}
        mock_service.list_roles.assert_awaited_once_with(db=mock_db, page=1, items_per_page=10)

    @pytest.mark.asyncio
    async def test_read_role_delegates_to_service(self, mock_db):
        role_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301"
        mock_service = Mock()
        mock_service.get_role_by_uuid = AsyncMock(return_value={"uuid": role_uuid, "name": "editor"})

        result = await unwrap_endpoint(read_role)(Mock(), role_uuid, mock_db, mock_service)

        assert result == {"uuid": role_uuid, "name": "editor"}
        mock_service.get_role_by_uuid.assert_awaited_once_with(db=mock_db, role_uuid=role_uuid)


class TestEraseRole:
    @pytest.mark.asyncio
    async def test_erase_role_soft_deletes_role(self, mock_db):
        role_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301"
        mock_service = Mock()
        mock_service.delete_role = AsyncMock(return_value={"message": "Role deleted"})

        result = await unwrap_endpoint(erase_role)(Mock(), role_uuid, mock_db, mock_service)

        assert result == {"message": "Role deleted"}
        mock_service.delete_role.assert_awaited_once_with(db=mock_db, role_uuid=role_uuid)
