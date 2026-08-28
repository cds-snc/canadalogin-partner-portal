import hashlib
import hmac
import re
from collections.abc import Iterable
from typing import Any
from urllib.parse import urlencode

from .config import settings

UUID_PATH_SEGMENT = re.compile(
    r"(?i)(?<![0-9a-f])"
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
    r"(?![0-9a-f])"
)


def hash_log_value(value: Any) -> str:
    """Return a stable keyed pseudonym suitable for operational logs."""

    digest = hmac.new(
        settings.SECRET_KEY.get_secret_value().encode("utf-8"),
        str(value).encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"hmac-sha256:{digest[:16]}"


def safe_request_path(request: Any) -> str:
    """Prefer a route template and redact UUIDs from unresolved paths."""

    # FastAPI 0.141 keeps included routers nested. The original route stored in
    # the ASGI scope therefore has only its leaf path, while the effective
    # route context preserves the complete path including router prefixes.
    fastapi_scope = request.scope.get("fastapi")
    if isinstance(fastapi_scope, dict):
        route_context = fastapi_scope.get("effective_route_context")
        route_path = getattr(route_context, "path", None)
        if isinstance(route_path, str) and route_path:
            return route_path

    route = request.scope.get("route")
    route_path = getattr(route, "path", None)
    if isinstance(route_path, str) and route_path:
        return route_path
    return UUID_PATH_SEGMENT.sub("{uuid}", str(request.url.path))


def hash_query_values(items: Iterable[tuple[str, Any]]) -> str:
    """Retain parameter names for diagnostics without logging raw values."""

    return urlencode([(str(key), hash_log_value(value)) for key, value in items])
