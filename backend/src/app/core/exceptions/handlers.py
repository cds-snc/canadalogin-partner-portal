import re
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from ..logger import logging
from ..schemas import ErrorDetail, ErrorResponse
from .cache_exceptions import CacheIdentificationInferenceError, InvalidRequestError, MissingClientError
from .http_exceptions import RPApplicationDepartmentRequiredException
from .ibm_sv_exceptions import IBMVerifyException
from .standardized_logger import StandardizedLogger

logger = logging.getLogger(__name__)

standardized_logger = StandardizedLogger()

_CACHE_EXCEPTION_STATUS = {
    CacheIdentificationInferenceError: 500,
    InvalidRequestError: 500,
    MissingClientError: 503,
}

_STATUS_CODE_MAP = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    409: "conflict",
    422: "unprocessable_entity",
    429: "rate_limited",
    500: "internal_server_error",
    503: "service_unavailable",
}


def _format_validation_location(location: list[Any] | tuple[Any, ...]) -> str:
    return ".".join(str(part) for part in location)


def _validation_message(exc: RequestValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "Request validation failed."

    first_error = errors[0]
    location = _format_validation_location(first_error.get("loc", []))
    message = first_error.get("msg") or "Invalid request."
    if not location:
        return str(message)
    return f"{location}: {message}"


def _get_request_id(request: Request) -> str | None:
    request_id = getattr(request.state, "request_id", None)
    if request_id is not None:
        return str(request_id)

    header_request_id = request.headers.get("X-Request-ID")
    if header_request_id:
        return header_request_id

    return None


def _serialize_error_response(
    *,
    request: Request,
    status_code: int,
    code: str,
    message: str,
    details: Any = None,
) -> JSONResponse:
    payload = ErrorResponse(
        error=ErrorDetail(
            code=code,
            message=message,
            details=details,
            request_id=_get_request_id(request),
        )
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump(by_alias=True))


def _status_code_to_error_code(status_code: int) -> str:
    return _STATUS_CODE_MAP.get(status_code, "http_error")


def _class_name_to_error_code(name: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


def _http_message_and_details(exc: StarletteHTTPException) -> tuple[str, Any]:
    detail = exc.detail
    if isinstance(detail, dict):
        message = detail.get("message") or detail.get("detail") or HTTPStatus(exc.status_code).phrase
        return str(message), detail
    if isinstance(detail, list):
        return HTTPStatus(exc.status_code).phrase, detail
    if isinstance(detail, str):
        return detail, None
    return HTTPStatus(exc.status_code).phrase, detail


def _ibm_message_and_details(exc: IBMVerifyException) -> tuple[str, Any]:
    detail: dict[str, Any] = exc.detail if isinstance(exc.detail, dict) else {}
    message = detail.get("message") or HTTPStatus(exc.status_code).phrase
    response_body = detail.get("response_body")
    details: dict[str, Any] = {}
    if response_body is not None:
        details["responseBody"] = response_body
    if detail and detail != {"message": message}:
        details["context"] = detail
    return str(message), details or None


def register_exception_handlers(application: FastAPI) -> None:
    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        response = _serialize_error_response(
            request=request,
            status_code=422,
            code="validation_error",
            message=_validation_message(exc),
            details=exc.errors(),
        )
        standardized_logger.log(request, response)
        return response

    @application.exception_handler(RPApplicationDepartmentRequiredException)
    async def rp_application_department_required_handler(
        request: Request, exc: RPApplicationDepartmentRequiredException
    ) -> JSONResponse:
        response = _serialize_error_response(
            request=request,
            status_code=409,
            code="rp_application_department_required",
            message=exc.message,
        )
        standardized_logger.log(request, response)
        return response

    @application.exception_handler(IBMVerifyException)
    async def ibm_verify_exception_handler(request: Request, exc: IBMVerifyException) -> JSONResponse:
        message, details = _ibm_message_and_details(exc)
        response = _serialize_error_response(
            request=request,
            status_code=exc.status_code,
            code=_class_name_to_error_code(exc.__class__.__name__).replace("i_b_m_verify", "ibm_verify"),
            message=message,
            details=details,
        )
        standardized_logger.log(request, response)
        return response

    @application.exception_handler(CacheIdentificationInferenceError)
    @application.exception_handler(InvalidRequestError)
    @application.exception_handler(MissingClientError)
    async def cache_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        status_code = _CACHE_EXCEPTION_STATUS.get(type(exc), 500)
        response = _serialize_error_response(
            request=request,
            status_code=status_code,
            code=type(exc).__name__.replace("Error", "").replace("Exception", "").lower(),
            message=str(exc),
        )
        standardized_logger.log(request, response)
        return response

    @application.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        message, details = _http_message_and_details(exc)
        response = _serialize_error_response(
            request=request,
            status_code=exc.status_code,
            code=_status_code_to_error_code(exc.status_code),
            message=message,
            details=details,
        )
        standardized_logger.log(request, response)
        return response

    @application.exception_handler(Exception)
    async def unexpected_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled application error", exc_info=exc)
        response = _serialize_error_response(
            request=request,
            status_code=500,
            code="internal_server_error",
            message="An unexpected error occurred.",
        )
        standardized_logger.log(request, response)
        return response
