from collections.abc import Callable
from typing import Any


class DisabledPermissionGuard:
    def require_permission(self, _resource: str, _action: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        def decorator(endpoint: Callable[..., Any]) -> Callable[..., Any]:
            return endpoint

        return decorator


casbin_guard = DisabledPermissionGuard()
