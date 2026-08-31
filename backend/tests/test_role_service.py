from unittest.mock import AsyncMock, patch

import pytest

from src.app.core.exceptions.http_exceptions import DuplicateValueException, NotFoundException
from src.app.schemas.role import RoleCreate, RoleUpdate
from src.app.services.role_service import RoleService


class TestRoleService:
    @pytest.mark.asyncio
    async def test_create_role_rejects_duplicate_name(self, mock_db) -> None:
        service = RoleService()

        with patch("src.app.services.role_service.crud_roles") as mock_roles:
            mock_roles.exists = AsyncMock(return_value=True)

            with pytest.raises(DuplicateValueException, match="Role name not available"):
                await service.create_role(db=mock_db, role=RoleCreate(name="editor", description="Editor role"))

    @pytest.mark.asyncio
    async def test_get_role_by_name_raises_when_missing(self, mock_db) -> None:
        service = RoleService()

        with patch("src.app.services.role_service.crud_roles") as mock_roles:
            mock_roles.get = AsyncMock(return_value=None)

            with pytest.raises(NotFoundException, match="Role not found"):
                await service.get_role_by_uuid(db=mock_db, role_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301")

    @pytest.mark.asyncio
    async def test_update_role_updates_existing_role(self, mock_db) -> None:
        service = RoleService()
        role_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301"

        with patch("src.app.services.role_service.crud_roles") as mock_roles:
            mock_roles.get = AsyncMock(return_value={"id": 1, "uuid": role_uuid, "name": "editor"})
            mock_roles.update = AsyncMock(return_value=None)

            result = await service.update_role(db=mock_db, role_uuid=role_uuid, values=RoleUpdate(description="Updated"))

        assert result == {"message": "Role updated"}
