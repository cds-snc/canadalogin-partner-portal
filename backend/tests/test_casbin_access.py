from unittest.mock import AsyncMock, Mock, call

import pytest

from src.app.core.access_control import MultiSubjectEnforcer, get_casbin_subject


class TestCasbinSubjectProvider:
    @pytest.mark.asyncio
    async def test_get_casbin_subject_returns_admin_for_superuser(self):
        subject = await get_casbin_subject({"username": "owner", "is_superuser": True}, None)

        assert subject == ["admin"]

    @pytest.mark.asyncio
    async def test_get_casbin_subject_returns_username_for_regular_user(self):
        subject = await get_casbin_subject({"username": "member", "is_superuser": False, "role_ids": None}, None)

        assert subject == ["member"]

    @pytest.mark.asyncio
    async def test_get_casbin_subject_returns_role_names_before_username_when_user_has_roles(self, mock_db):
        mock_result = Mock()
        mock_result.all = Mock(return_value=[(9, "reviewer"), (7, "editor")])
        mock_db.execute = AsyncMock(return_value=mock_result)

        subject = await get_casbin_subject({"username": "member", "is_superuser": False, "role_ids": [7, 9]}, mock_db)

        assert subject == ["editor", "reviewer", "member"]

    @pytest.mark.asyncio
    async def test_get_casbin_subject_falls_back_to_username_when_role_is_missing(self, mock_db):
        mock_result = Mock()
        mock_result.all = Mock(return_value=[])
        mock_db.execute = AsyncMock(return_value=mock_result)

        subject = await get_casbin_subject({"username": "member", "is_superuser": False, "role_ids": [7]}, mock_db)

        assert subject == ["member"]


class TestMultiSubjectEnforcer:
    @pytest.mark.asyncio
    async def test_enforce_allows_when_any_subject_matches(self):
        enforcer = Mock()
        enforcer.enforce = Mock(side_effect=[False, True])

        wrapped = MultiSubjectEnforcer(enforcer)

        allowed = await wrapped.enforce(["role-a", "role-b"], "users_admin", "read")

        assert allowed is True
        assert enforcer.enforce.call_args_list == [
            call("role-a", "users_admin", "read"),
            call("role-b", "users_admin", "read"),
        ]

    @pytest.mark.asyncio
    async def test_enforce_denies_when_no_subject_matches(self):
        enforcer = Mock()
        enforcer.enforce = Mock(return_value=False)

        wrapped = MultiSubjectEnforcer(enforcer)

        allowed = await wrapped.enforce(["role-a", "member"], "roles", "write")

        assert allowed is False
