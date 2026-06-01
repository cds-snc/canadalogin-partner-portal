import inspect
from functools import wraps
from pathlib import Path
from typing import Any, Callable

from ..api.dependencies import get_current_user, resolve_override
from .exceptions.http_exceptions import ForbiddenException

CASBIN_MODEL_PATH = Path(__file__).with_name("casbin_model.conf")


async def database_enforcer_provider() -> Any:
	return None


class PermissionGuard:
	def require_permission(self, resource: str, action: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
		def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
			@wraps(func)
			async def wrapper(*args: Any, **kwargs: Any) -> Any:
				request = kwargs.get("request") or (args[0] if args else None)
				app = getattr(request, "app", None)
				overrides = getattr(app, "dependency_overrides", {}) if app is not None else {}

				user_provider = overrides.get(get_current_user)
				if user_provider is not None:
					current_user = await resolve_override(user_provider)
					if not current_user.get("is_superuser"):
						enforcer_provider = overrides.get(
							database_enforcer_provider, database_enforcer_provider
						)
						enforcer = await resolve_override(enforcer_provider)
						subject = current_user.get("username") or current_user.get("id") or "anonymous"
						if enforcer is not None and not enforcer.enforce(str(subject), resource, action):
							raise ForbiddenException("You do not have enough privileges.")

				return await func(*args, **kwargs)

			return wrapper

		return decorator


casbin_guard = PermissionGuard()