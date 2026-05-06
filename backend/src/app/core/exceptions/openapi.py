from http import HTTPStatus
from typing import Any

from ..schemas import ErrorResponse


def error_responses(*status_codes: int) -> dict[int | str, dict[str, Any]]:
    return {
        status_code: {
            "model": ErrorResponse,
            "description": HTTPStatus(status_code).phrase,
        }
        for status_code in status_codes
    }
