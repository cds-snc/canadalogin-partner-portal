from unittest.mock import AsyncMock, Mock

import pytest
from casbin import Enforcer

from src.app.core.access_control import (
    CASBIN_MODEL_PATH,
    casbin_guard,
    get_casbin_subject,
)


class TestCasbinSubjectProvider:
    @pytest.mark.asyncio
    async def test_subject_uses_matching_active_user_role_permission(self, mock_db):
        result = Mock()
        result.scalar_one_or_none.return_value = "Partner Production Administrator"
        mock_db.execute = AsyncMock(return_value=result)

        subject = await get_casbin_subject(
            current_user={"id": 1, "username": "developer@example.com"},
            db=mock_db,
            resource="applications",
            action="write",
        )

        assert subject == "Partner Production Administrator"

    def test_permission_guard_is_enabled(self):
        assert hasattr(casbin_guard, "require_permission")

    @pytest.mark.asyncio
    async def test_permission_guard_can_use_a_fixed_non_admin_subject(self, monkeypatch):
        captured = {}

        class GuardSpy:
            def __init__(self, *, user_provider, **_kwargs):
                captured["user_provider"] = user_provider

            def require_permission(self, *permission):
                captured["permission"] = permission
                return lambda endpoint: endpoint

        monkeypatch.setattr("src.app.core.access_control.PermissionGuard", GuardSpy)
        casbin_guard.require_permission_for_subject(
            "legacy_rp_api_disabled",
            "deny",
            "anonymous",
        )

        assert await captured["user_provider"]() == "anonymous"
        assert captured["permission"] == ("legacy_rp_api_disabled", "deny")

    def test_unseeded_fake_permission_denies_even_with_global_admin_wildcard(self):
        enforcer = Enforcer(str(CASBIN_MODEL_PATH))
        enforcer.add_policy("admin", "*", ".*")

        assert not enforcer.enforce("anonymous", "legacy_rp_api_disabled", "deny")
