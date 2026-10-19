from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette_csrf import CSRFMiddleware

from ..core.schemas import ErrorDetail, ErrorResponse


class CSRFProtectionMiddleware(CSRFMiddleware):
    def _get_error_response(self, request: Request) -> Response:
        request_id = getattr(request.state, "request_id", None) or request.headers.get("X-Request-ID")
        payload = ErrorResponse(
            error=ErrorDetail(
                code="csrf_error",
                message="CSRF token verification failed",
                request_id=str(request_id) if request_id is not None else None,
            )
        )
        return JSONResponse(status_code=403, content=payload.model_dump(by_alias=True))
