from unittest.mock import AsyncMock, Mock

import pytest

from src.app.core.access_control import get_casbin_subject


class TestCasbinSubjectProvider:
    @pytest.mark.asyncio
    async def test_get_casbin_subject_returns_admin_for_superuser(self):
        subject = await get_casbin_subject({"username": "owner", "is_superuser": True}, None)

        assert subject == "admin"

    @pytest.mark.asyncio
    async def test_get_casbin_subject_returns_username_for_regular_user(self):
        subject = await get_casbin_subject({"username": "member", "is_superuser": False, "role_ids": None}, None)

        assert subject == "member"

    @pytest.mark.asyncio
    async def test_get_casbin_subject_returns_role_name_when_user_has_role(self, mock_db):
        mock_result = Mock()
        mock_result.scalars.return_value.all = Mock(return_value=["editor"])
        mock_db.execute = AsyncMock(return_value=mock_result)

        subject = await get_casbin_subject({"username": "member", "is_superuser": False, "role_ids": [7]}, mock_db)

        assert subject == "editor"

    @pytest.mark.asyncio
    async def test_get_casbin_subject_falls_back_to_username_when_role_is_missing(self, mock_db):
        mock_result = Mock()
        mock_result.scalars.return_value.all = Mock(return_value=[])
        mock_db.execute = AsyncMock(return_value=mock_result)

        subject = await get_casbin_subject({"username": "member", "is_superuser": False, "role_ids": [7]}, mock_db)

        assert subject == "member"
