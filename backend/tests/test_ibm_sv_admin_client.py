from datetime import datetime
from typing import Any, cast
from unittest.mock import AsyncMock, Mock, patch

import pytest
import requests
from ibm_verify_community_sdk.client import APIClientError

from src.app.core.exceptions.ibm_sv_exceptions import IBMVerifyBadRequest, IBMVerifyServerError
from src.app.repositories.ibm_sv_admin import IBMVerifyAdminClient


class FixedDateTime(datetime):
    @classmethod
    def now(cls, tz=None):
        fixed_value = cls(2026, 4, 9, 15, 30, 45)
        if tz is not None:
            return fixed_value.replace(tzinfo=tz)
        return fixed_value


class TestIBMVerifyAdminClient:
    def _api_client_error_with_response(self, status_code: int, payload: dict[str, object]) -> APIClientError:
        response = Mock(spec=requests.Response)
        response.status_code = status_code
        response.json.return_value = payload
        response.text = str(payload)

        cause = requests.HTTPError("upstream error", response=response)
        error = APIClientError("SDK request failed")
        error.__cause__ = cause
        return error

    def test_translate_sdk_error_preserves_400_message(self) -> None:
        client = IBMVerifyAdminClient(Mock())
        translated = client._translate_sdk_error(
            self._api_client_error_with_response(400, {"message": "template validation failed"})
        )

        assert isinstance(translated, IBMVerifyBadRequest)
        detail = cast(dict[str, Any], translated.detail)
        assert detail["message"] == "template validation failed"
        assert detail["response_body"] == {"message": "template validation failed"}

    def test_translate_sdk_error_defaults_to_server_error(self) -> None:
        client = IBMVerifyAdminClient(Mock())
        translated = client._translate_sdk_error(self._api_client_error_with_response(500, {"message": "internal"}))

        assert isinstance(translated, IBMVerifyServerError)
        detail = cast(dict[str, Any], translated.detail)
        assert detail["message"] == "internal"

    @pytest.mark.asyncio
    async def test_create_application_uses_integrated_sdk_execution(self) -> None:
        mock_http_client = Mock()
        client = IBMVerifyAdminClient(mock_http_client)
        with (
            patch.object(client, "_run_sdk", AsyncMock(return_value={"id": "ibm-app-123"})) as run_sdk,
            patch("src.app.repositories.ibm_sv_admin.ApplicationRequest.model_validate", return_value=Mock()),
        ):
            result = await client.create_application({"name": "[TBS] - Example App"})

            assert result == {"id": "ibm-app-123"}
            run_sdk.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_update_application_uses_integrated_sdk_execution(self) -> None:
        mock_http_client = Mock()
        client = IBMVerifyAdminClient(mock_http_client)
        with (
            patch.object(client, "_run_sdk", AsyncMock(return_value=None)) as run_sdk,
            patch("src.app.repositories.ibm_sv_admin.ApplicationRequest.model_validate", return_value=Mock()),
        ):
            result = await client.update_application("ibm-app-123", {"name": "[TBS] - Updated"})

            assert result is True
            run_sdk.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_application_total_logins_defaults_to_today_when_dates_are_missing(self) -> None:
        mock_http_client = Mock()
        client = IBMVerifyAdminClient(mock_http_client)
        with patch.object(client, "_run_sdk", AsyncMock(return_value={"total": 11})) as run_sdk:
            with patch("datetime.datetime", FixedDateTime):
                await client.get_application_total_logins("ibm-app-123")

            run_sdk.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_application_audit_trail_defaults_to_today_when_dates_are_invalid(self) -> None:
        mock_http_client = Mock()
        client = IBMVerifyAdminClient(mock_http_client)
        with patch.object(client, "_run_sdk", AsyncMock(return_value={"events": [], "total": 0})) as run_sdk:
            with patch("datetime.datetime", FixedDateTime):
                await client.get_application_audit_trail(
                    "ibm-app-123",
                    from_date="not-a-timestamp",
                    to_date="",
                    size=15,
                )

            run_sdk.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_app_audit_trail_search_after_defaults_to_today_when_dates_are_missing(self) -> None:
        mock_http_client = Mock()
        client = IBMVerifyAdminClient(mock_http_client)
        with patch.object(client, "_run_sdk", AsyncMock(return_value={"events": [], "next": None, "total": 0})) as run_sdk:
            with patch("datetime.datetime", FixedDateTime):
                await client.app_audit_trail_search_after(
                    "ibm-app-123",
                    size=25,
                    search_after='"1775692800000", "event-2"',
                )

            run_sdk.assert_awaited_once()
