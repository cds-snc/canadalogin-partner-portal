import hashlib
import logging
import importlib
from unittest.mock import MagicMock

import pytest

from src.app.core.exceptions.standardized_logger import (
    QUERY_STRING_BLACKLIST,
    StandardizedLogger,
)
from src.app.core import logger as app_logger


@pytest.fixture()
def logger_instance() -> StandardizedLogger:
    return StandardizedLogger()


@pytest.fixture()
def mock_request() -> MagicMock:
    request = MagicMock()
    request.method = "GET"
    request.url.path = "/test"
    request.query_params.items.return_value = []
    request.state.request_id = None
    request.headers.get.return_value = None
    request.scope.get.return_value = None
    request.session.get.return_value = None
    return request


def test_hash_blacklisted_params_hashes_sensitive_values(logger_instance: StandardizedLogger) -> None:
    params = {"token": "my-secret-token", "safe_param": "safe-value"}
    result = logger_instance._hash_blacklisted_params(params)
    expected_hash = hashlib.sha256("my-secret-token".encode()).hexdigest()
    assert f"token={expected_hash}" in result
    assert "safe-value" in result


def test_hash_blacklisted_params_covers_all_blacklisted_keys(logger_instance: StandardizedLogger) -> None:
    params = {key: "sensitive" for key in QUERY_STRING_BLACKLIST}
    result = logger_instance._hash_blacklisted_params(params)
    plain = "sensitive"
    assert plain not in result


def test_hash_blacklisted_params_preserves_non_sensitive_values(logger_instance: StandardizedLogger) -> None:
    params = {"page": "2", "sort": "asc"}
    result = logger_instance._hash_blacklisted_params(params)
    assert "page=2" in result
    assert "sort=asc" in result


def test_build_user_returns_none_when_no_session_user(
    logger_instance: StandardizedLogger, mock_request: MagicMock
) -> None:
    mock_request.session.get.return_value = None
    assert logger_instance._build_user(mock_request) is None


def test_build_user_returns_hashed_id_when_session_has_user(
    logger_instance: StandardizedLogger, mock_request: MagicMock
) -> None:
    mock_request.session.get.return_value = "test-uuid-123"
    result = logger_instance._build_user(mock_request)
    expected_hash = hashlib.sha256("test-uuid-123".encode()).hexdigest()
    assert result == {"id": expected_hash}


def test_build_user_returns_none_on_exception(
    logger_instance: StandardizedLogger, mock_request: MagicMock
) -> None:
    mock_request.session.get.side_effect = RuntimeError("session broken")
    assert logger_instance._build_user(mock_request) is None


def test_build_request_includes_request_id_from_state(
    logger_instance: StandardizedLogger, mock_request: MagicMock
) -> None:
    mock_request.state.request_id = "state-req-id"
    result = logger_instance._build_request(mock_request)
    assert result["request_id"] == "state-req-id"


def test_build_request_falls_back_to_header_for_request_id(
    logger_instance: StandardizedLogger, mock_request: MagicMock
) -> None:
    mock_request.state.request_id = None
    mock_request.headers.get.return_value = "header-req-id"
    result = logger_instance._build_request(mock_request)
    assert result["request_id"] == "header-req-id"


def test_build_request_omits_request_id_when_absent(
    logger_instance: StandardizedLogger, mock_request: MagicMock
) -> None:
    result = logger_instance._build_request(mock_request)
    assert "request_id" not in result


def test_log_does_not_emit_for_2xx_responses(
    logger_instance: StandardizedLogger, mock_request: MagicMock, caplog: pytest.LogCaptureFixture
) -> None:
    response = MagicMock()
    response.status_code = 200
    with caplog.at_level(logging.WARNING, logger="src.app.core.exceptions.standardized_logger"):
        result = logger_instance.log(mock_request, response)
    assert result is response
    assert len(caplog.records) == 0


def test_log_emits_warning_for_4xx_responses(
    logger_instance: StandardizedLogger, mock_request: MagicMock, caplog: pytest.LogCaptureFixture
) -> None:
    response = MagicMock()
    response.status_code = 403
    with caplog.at_level(logging.WARNING, logger="src.app.core.exceptions.standardized_logger"):
        logger_instance.log(mock_request, response)
    assert len(caplog.records) == 1
    assert caplog.records[0].levelno == logging.WARNING
    assert "CanadaLogin.PartnerPortal.WARNING.403" in caplog.records[0].message


def test_log_emits_error_for_5xx_responses(
    logger_instance: StandardizedLogger, mock_request: MagicMock, caplog: pytest.LogCaptureFixture
) -> None:
    response = MagicMock()
    response.status_code = 500
    with caplog.at_level(logging.ERROR, logger="src.app.core.exceptions.standardized_logger"):
        logger_instance.log(mock_request, response)
    assert len(caplog.records) == 1
    assert caplog.records[0].levelno == logging.ERROR
    assert "CanadaLogin.PartnerPortal.ERROR.500" in caplog.records[0].message


def test_build_formatter_disables_console_colors_when_no_color_is_set(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, object] = {}

    class FakeConsoleRenderer:
        def __init__(self, *, colors: bool = True, **kwargs: object) -> None:
            captured["colors"] = colors
            captured["kwargs"] = kwargs

        def __call__(self, *args: object, **kwargs: object) -> str:
            return "rendered"

    monkeypatch.setenv("NO_COLOR", "1")
    monkeypatch.setattr(app_logger, "ConsoleRenderer", FakeConsoleRenderer)

    app_logger.build_formatter(json_output=False, pre_chain=[])

    assert captured["colors"] is False
