from unittest.mock import AsyncMock, Mock

import pytest

from src.app.core.access_control import casbin_guard, get_casbin_subject


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
