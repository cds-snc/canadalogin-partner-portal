# ruff: noqa
from fastcrud.exceptions.http_exceptions import (
    CustomException,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    UnauthorizedException,
    UnprocessableEntityException,
    DuplicateValueException,
    RateLimitException,
)


class RPApplicationDepartmentRequiredException(Exception):
    """Raised when a protected RP application owner route requires a department
    assignment that is not yet set. Emits HTTP 409 with code
    ``rp_application_department_required``."""

    def __init__(self, message: str = "RP application department assignment is required") -> None:
        super().__init__(message)
        self.message = message
