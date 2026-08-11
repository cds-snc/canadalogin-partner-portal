from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.users import search_users
from src.app.core.exceptions.http_exceptions import ForbiddenException
from src.app.services.user_service import UserService


def unwrap_endpoint(endpoint):
	current = endpoint
	while hasattr(current, "__wrapped__"):
		current = current.__wrapped__
	return current


class TestSearchUsersRoute:
	@pytest.mark.asyncio
	async def test_workspace_scoped_search_requires_workspace_admin_and_passes_workspace_id(self, mock_db) -> None:
		user_service = Mock()
		user_service.search_users = AsyncMock(return_value=[{"uuid": "user-uuid-2"}])
		workspace_service = Mock()
		workspace_service.require_workspace_admin_access = AsyncMock(
			return_value={"id": 9, "uuid": "018f6f83-0000-0000-0000-000000000201"}
		)

		result = await unwrap_endpoint(search_users)(
			Mock(),
			"member",
			mock_db,
			user_service,
			{"id": 42, "is_superuser": False},
			workspace_service,
			"018f6f83-0000-0000-0000-000000000201",
		)

		assert result == [{"uuid": "user-uuid-2"}]
		workspace_service.require_workspace_admin_access.assert_awaited_once_with(
			db=mock_db,
			workspace_uuid="018f6f83-0000-0000-0000-000000000201",
			current_user={"id": 42, "is_superuser": False},
		)
		user_service.search_users.assert_awaited_once_with(
			db=mock_db,
			query="member",
			workspace_id=9,
		)

	@pytest.mark.asyncio
	async def test_global_search_rejects_non_superuser(self, mock_db) -> None:
		with pytest.raises(ForbiddenException, match="You do not have enough privileges"):
			await unwrap_endpoint(search_users)(
				Mock(),
				"member",
				mock_db,
				Mock(),
				{"id": 42, "is_superuser": False},
				Mock(),
				None,
			)


class TestUserSearchService:
	@pytest.mark.asyncio
	async def test_workspace_scoped_search_excludes_existing_members(self, mock_db) -> None:
		service = UserService()

		users = [
			{
				"id": 99,
				"uuid": "user-uuid-1",
				"name": "Member User",
				"email": "member@example.gc.ca",
				"username": "member@example.gc.ca",
			},
			{
				"id": 100,
				"uuid": "user-uuid-2",
				"name": "Candidate User",
				"email": "candidate@example.gc.ca",
				"username": "candidate@example.gc.ca",
			},
		]

		with (
			pytest.MonkeyPatch.context() as mp,
		):
			mp.setattr(
				"src.app.services.user_service.crud_users",
				Mock(get_multi=AsyncMock(return_value={"data": users})),
			)
			mp.setattr(
				"src.app.services.user_service.crud_workspace_members",
				Mock(
					get_multi=AsyncMock(
						return_value={
							"data": [
								{"user_id": 99, "workspace_id": 9, "role": "workspace_member"}
							]
						}
					)
				),
			)
			mp.setattr(
				service,
				"_build_public_user",
				AsyncMock(side_effect=lambda db, user: user),
			)

			result = await service.search_users(
				db=mock_db,
				query="user",
				workspace_id=9,
			)

		assert [user["uuid"] for user in result] == ["user-uuid-2"]
