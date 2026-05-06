"""IBM Security Verify API exceptions."""

from typing import Any

from fastapi import HTTPException, status


class IBMVerifyException(HTTPException):
    """Base exception for IBM Verify API errors."""

    def __init__(self, message: str, status_code: int = 500, response_body: dict[str, Any] | None = None):
        detail: dict[str, Any] = {"message": message}
        if response_body:
            detail["response_body"] = response_body
        super().__init__(status_code=status_code, detail=detail)


class IBMVerifyBadRequest(IBMVerifyException):
    def __init__(self, message: str = "Bad request", response_body: dict[str, Any] | None = None):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, response_body)


class IBMVerifyUnauthorized(IBMVerifyException):
    def __init__(self, message: str = "Unauthorized", response_body: dict[str, Any] | None = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, response_body)


class IBMVerifyForbidden(IBMVerifyException):
    def __init__(self, message: str = "Forbidden", response_body: dict[str, Any] | None = None):
        super().__init__(message, status.HTTP_403_FORBIDDEN, response_body)


class IBMVerifyNotFound(IBMVerifyException):
    def __init__(self, message: str = "Not found", response_body: dict[str, Any] | None = None):
        super().__init__(message, status.HTTP_404_NOT_FOUND, response_body)


class IBMVerifyServerError(IBMVerifyException):
    def __init__(self, message: str = "IBM Verify server error", response_body: dict[str, Any] | None = None):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR, response_body)
