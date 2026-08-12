from collections.abc import Iterable
from urllib.parse import urlsplit

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

from ..core.config import normalize_http_origin


class CookieOriginMiddleware(BaseHTTPMiddleware):
    """Reject cross-origin state changes that rely on the session cookie.

    Browsers send ``Origin`` for cross-origin unsafe requests. ``Referer`` and
    Fetch Metadata provide additional coverage, while requests with none of
    those browser headers remain compatible with local CLI and service checks.
    """

    _UNSAFE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})

    def __init__(
        self,
        app: ASGIApp,
        *,
        allowed_origins: Iterable[str],
        session_cookie_name: str,
        api_prefix: str = "/api/",
    ) -> None:
        super().__init__(app)
        self.allowed_origins = frozenset(normalize_http_origin(origin) for origin in allowed_origins)
        self.session_cookie_name = session_cookie_name
        self.api_prefix = api_prefix

    @staticmethod
    def _request_origin(request: Request) -> str:
        return normalize_http_origin(f"{request.url.scheme}://{request.url.netloc}")

    @staticmethod
    def _referer_origin(referer: str) -> str:
        parsed = urlsplit(referer)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("invalid referer")
        return normalize_http_origin(f"{parsed.scheme}://{parsed.netloc}")

    def _is_trusted_origin(self, request: Request, origin: str) -> bool:
        try:
            normalized = normalize_http_origin(origin)
            request_origin = self._request_origin(request)
        except ValueError:
            return False
        return normalized == request_origin or normalized in self.allowed_origins

    def _is_allowed(self, request: Request) -> bool:
        origin = request.headers.get("Origin")
        if origin is not None:
            return self._is_trusted_origin(request, origin)

        referer = request.headers.get("Referer")
        if referer is not None:
            try:
                referer_origin = self._referer_origin(referer)
            except ValueError:
                return False
            return self._is_trusted_origin(request, referer_origin)

        # A browser explicitly identifying the request as cross-site cannot
        # bypass the check by omitting Origin and Referer. Their total absence
        # remains allowed for non-browser local clients.
        return request.headers.get("Sec-Fetch-Site", "").lower() != "cross-site"

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        requires_check = (
            request.method.upper() in self._UNSAFE_METHODS
            and request.url.path.startswith(self.api_prefix)
            and self.session_cookie_name in request.cookies
        )
        if requires_check and not self._is_allowed(request):
            request_id = getattr(request.state, "request_id", None)
            return JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "code": "forbidden",
                        "message": ("Cross-origin cookie-authenticated request is not allowed."),
                        "details": None,
                        "requestId": str(request_id) if request_id else None,
                    }
                },
            )

        return await call_next(request)
