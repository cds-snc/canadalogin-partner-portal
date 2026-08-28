from unittest.mock import Mock

import pytest

from src.app.api.v1.roles import read_role, read_roles


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


class TestReadRoles:
    @pytest.mark.asyncio
    async def test_read_roles_returns_only_canonical_reference(self):
        result = await unwrap_endpoint(read_roles)(Mock())

        assert [role.code.value for role in result] == [
            "cl_admin",
            "rp_admin",
            "rp_user_edit",
            "read_only",
        ]
        assert [role.scope.value for role in result] == [
            "global",
            "workspace",
            "workspace",
            "workspace",
        ]

    @pytest.mark.asyncio
    async def test_read_role_resolves_canonical_key(self):
        result = await unwrap_endpoint(read_role)(Mock(), "rp_user_edit")

        assert result.code.value == "rp_user_edit"
        assert result.scope.value == "workspace"
