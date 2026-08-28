from collections.abc import Iterable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp


class ClientCacheMiddleware(BaseHTTPMiddleware):
    """Apply safe browser defaults; public caching requires path opt-in."""

    def __init__(
        self,
        app: ASGIApp,
        max_age: int = 60,
        public_path_prefixes: Iterable[str] = (),
    ) -> None:
        super().__init__(app)
        self.max_age = max_age
        self.public_path_prefixes = tuple(prefix.rstrip("/") or "/" for prefix in public_path_prefixes)

    def _is_public_path(self, path: str) -> bool:
        return any(path == prefix or path.startswith(f"{prefix}/") for prefix in self.public_path_prefixes)

    def _may_cache_publicly(self, request: Request, response: Response) -> bool:
        existing_policy = response.headers.get("Cache-Control", "").lower()
        return (
            request.method.upper() in {"GET", "HEAD"}
            and not request.url.path.startswith("/api/")
            and self._is_public_path(request.url.path)
            and "Authorization" not in request.headers
            and not request.cookies
            and "set-cookie" not in response.headers
            and 200 <= response.status_code < 300
            and "application/json" not in response.headers.get("content-type", "").lower()
            and "private" not in existing_policy
            and "no-store" not in existing_policy
        )

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response: Response = await call_next(request)
        # Invitation tokens can appear in a portal URL before OIDC login. Keep
        # that URL out of Referer headers across redirects and external links.
        response.headers["Referrer-Policy"] = "no-referrer"
        if self._may_cache_publicly(request, response):
            response.headers["Cache-Control"] = f"public, max-age={self.max_age}"
        else:
            response.headers["Cache-Control"] = "private, no-store"
        return response
