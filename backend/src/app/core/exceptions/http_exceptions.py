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
    """Raised when a grant-accessible RP application route requires a department
    assignment that is not yet set. Emits HTTP 409 with code
    ``rp_application_department_required``."""

    def __init__(self, message: str = "RP application department assignment is required") -> None:
        super().__init__(message)
        self.message = message


class RegistrationDraftConflictException(Exception):
    """Stable 409 for idempotency or optimistic registration conflicts."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class RPApplicationAdoptionConflictException(Exception):
    """Stable 409 when a retained RP is already linked elsewhere."""

    def __init__(
        self,
        message: str = "RP application is already linked to another workspace",
    ) -> None:
        super().__init__(message)
        self.code = "rp_application_already_linked"
        self.message = message
