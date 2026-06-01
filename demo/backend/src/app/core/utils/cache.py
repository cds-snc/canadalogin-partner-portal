import functools
import uuid as uuid_pkg
from typing import Any, Callable

from fastapi import Request

client: Any | None = None


def _format_prefix(prefix: str, kwargs: dict[str, Any]) -> str:
	return prefix.format(**kwargs)


async def _delete_keys_by_pattern(pattern: str) -> None:
	if client is None:
		return

	cursor = 0
	while True:
		cursor, keys = await client.scan(cursor, match=pattern, count=100)
		if keys:
			await client.delete(*keys)
		if cursor == 0:
			break


async def invalidate_post_cache(
	user_uuid: str | uuid_pkg.UUID,
	post_uuid: str | uuid_pkg.UUID | None = None,
) -> None:
	if client is None:
		return

	normalized_user_uuid = str(user_uuid)
	if post_uuid is not None:
		await client.delete(f"{normalized_user_uuid}_post_cache:{post_uuid}")

	await client.delete(f"{normalized_user_uuid}_posts:{normalized_user_uuid}")
	await _delete_keys_by_pattern(f"{normalized_user_uuid}_posts:**")


def cache(
	key_prefix: str,
	resource_id_name: str | None = None,
	expiration: int = 3600,
	resource_id_type: type | tuple[type, ...] = int,
	to_invalidate_extra: dict[str, Any] | None = None,
	pattern_to_invalidate_extra: list[str] | None = None,
) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
	def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
		@functools.wraps(func)
		async def wrapper(*args: Any, **kwargs: Any) -> Any:
			result = await func(*args, **kwargs)

			if client is None:
				return result

			request = kwargs.get("request") or (args[0] if args else None)
			method = getattr(request, "method", "GET").upper() if isinstance(request, Request) or hasattr(request, "method") else "GET"
			if method not in {"POST", "PATCH", "DELETE", "PUT"}:
				return result

			formatted_prefix = _format_prefix(key_prefix, kwargs)
			if resource_id_name is not None and resource_id_name in kwargs:
				await client.delete(f"{formatted_prefix}:{kwargs[resource_id_name]}")

			for pattern in pattern_to_invalidate_extra or []:
				formatted_pattern = _format_prefix(pattern, kwargs)
				if formatted_pattern.endswith(":*"):
					formatted_pattern = f"{formatted_pattern}*"
				await _delete_keys_by_pattern(formatted_pattern)

			return result

		return wrapper

	return decorator