# app/middleware/request_id.py
import uuid

import structlog
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from starlette.types import ASGIApp

from ..core.logging_privacy import hash_log_value, safe_request_path


class LoggerMiddleware(BaseHTTPMiddleware):
    """Middleware to add request ID to the context variables.

    Parameters
    ----------
    app: ASGIApp
        The FastAPI application instance.
    """

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """
        Add request ID to the context variables.
        """
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            client_host=(hash_log_value(request.client.host) if request.client else None),
            status_code=None,
            path=safe_request_path(request),
            method=request.method,
        )
        response = await call_next(request)
        structlog.contextvars.bind_contextvars(
            status_code=response.status_code,
            path=safe_request_path(request),
        )
        response.headers["X-Request-ID"] = request_id
        return response
