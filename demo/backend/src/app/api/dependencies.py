import inspect
from typing import Annotated, Any

from fastapi import Depends

from ..core.exceptions.http_exceptions import ForbiddenException, UnauthorizedException
from ..services.policy_service import PolicyService
from ..services.post_service import PostService
from ..services.workspace_service import WorkspaceService


def get_policy_service() -> PolicyService:
	return PolicyService()


def get_post_service() -> PostService:
	return PostService()


def get_workspace_service() -> WorkspaceService:
	return WorkspaceService()


async def get_current_user() -> dict[str, Any]:
	raise UnauthorizedException("User not authenticated.")


async def get_current_superuser(
	current_user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
	if not current_user.get("is_superuser"):
		raise ForbiddenException("You do not have enough privileges.")
	return current_user


async def resolve_override(provider: Any) -> Any:
	result = provider() if callable(provider) else provider
	if inspect.isawaitable(result):
		return await result
	return result