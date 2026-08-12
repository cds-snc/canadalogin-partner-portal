from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.api.v1.users import search_users
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.exceptions.http_exceptions import BadRequestException, ForbiddenException
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
)
from src.app.services.user_service import UserService


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


class TestSearchUsersRoute:
    @pytest.mark.asyncio
    async def test_search_is_cl_admin_only_and_ignores_legacy_superuser(self, mock_db) -> None:
        service = Mock()
        service.search_users = AsyncMock()

        with pytest.raises(ForbiddenException, match="You do not have enough privileges"):
            await unwrap_endpoint(search_users)(
                Mock(),
                "member",
                mock_db,
                service,
                {"id": 42, "is_superuser": True},
            )

        service.search_users.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_cl_admin_search_has_no_partner_workspace_directory_branch(
        self,
        mock_db,
    ) -> None:
        service = Mock()
        service.search_users = AsyncMock(return_value=[{"uuid": "user-uuid-2"}])
        current_user = {
            "id": 1,
            AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
        }

        result = await unwrap_endpoint(search_users)(
            Mock(),
            "member",
            mock_db,
            service,
            current_user,
        )

        assert result == [{"uuid": "user-uuid-2"}]
        service.search_users.assert_awaited_once_with(db=mock_db, query="member")


class TestUserSearchService:
    @pytest.mark.asyncio
    async def test_search_filters_disabled_deleted_users_without_membership_authority(
        self,
        mock_db,
    ) -> None:
        service = UserService()
        users = [
            SimpleNamespace(
                id=99,
                uuid="user-uuid-1",
                name="Member User",
                email="member@example.gc.ca",
                username="member@example.gc.ca",
            ),
            SimpleNamespace(
                id=100,
                uuid="user-uuid-2",
                name="Candidate User",
                email="candidate@example.gc.ca",
                username="candidate@example.gc.ca",
            ),
        ]
        scalar_result = Mock()
        scalar_result.all.return_value = users
        execute_result = Mock()
        execute_result.scalars.return_value = scalar_result
        mock_db.execute = AsyncMock(return_value=execute_result)

        with (
            patch.object(
                service,
                "_build_user_access_directory_entries",
                new=AsyncMock(side_effect=lambda db, users: users),
            ),
        ):
            result = await service.search_users(db=mock_db, query="user")

        assert [user["uuid"] for user in result] == ["user-uuid-1", "user-uuid-2"]
        statement = mock_db.execute.await_args.args[0]
        statement_text = str(statement)
        assert statement._limit_clause.value == 20
        assert '"user".enabled IS true' in statement_text
        assert '"user".is_deleted IS false' in statement_text

    @pytest.mark.parametrize("query", ["", " ", "x", "x" * 101])
    @pytest.mark.asyncio
    async def test_search_rejects_queries_outside_the_bounded_contract(
        self,
        mock_db,
        query: str,
    ) -> None:
        with pytest.raises(BadRequestException, match="between 2 and 100"):
            await UserService().search_users(db=mock_db, query=query)

        mock_db.execute.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_search_escapes_sql_wildcards(self, mock_db) -> None:
        scalar_result = Mock()
        scalar_result.all.return_value = []
        execute_result = Mock()
        execute_result.scalars.return_value = scalar_result
        mock_db.execute = AsyncMock(return_value=execute_result)

        await UserService().search_users(db=mock_db, query="target%_")

        statement = mock_db.execute.await_args.args[0]
        assert "%target\\%\\_%" in statement.compile().params.values()
