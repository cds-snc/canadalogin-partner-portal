from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.core.exceptions.ibm_sv_exceptions import IBMVerifyServerError
from src.app.repositories.ibm_sv_admin import IBMVerifyAdminClient


class FixedDateTime(datetime):
    @classmethod
    def now(cls, tz=None):
        fixed_value = cls(2026, 4, 9, 15, 30, 45)
        if tz is not None:
            return fixed_value.replace(tzinfo=tz)
        return fixed_value


class TestIBMVerifyAdminClient:
    @pytest.mark.asyncio
    async def test_create_application_surfaces_ibm_error_details(self, caplog) -> None:
        mock_http_client = Mock()
        request = Mock()
        request.method = "POST"
        request.url = "https://tenant.verify.ibm.com/v1.0/applications"
        request.content = b'{"name":"[TBS] - Example App"}'

        response = Mock()
        response.status_code = 500
        response.request = request
        response.json.return_value = {
            "message": "template validation failed",
            "trace": "ibm-trace-123",
        }
        response.text = '{"message":"template validation failed"}'

        mock_http_client.post = AsyncMock(return_value=response)
        client = IBMVerifyAdminClient(mock_http_client)

        with pytest.raises(IBMVerifyServerError) as error_info:
            await client.create_application({"name": "[TBS] - Example App"})

        assert error_info.value.detail["message"] == "template validation failed"
        assert error_info.value.detail["response_body"] == {
            "message": "template validation failed",
            "trace": "ibm-trace-123",
        }
        assert 'IBM Verify API request failed' in caplog.text

    @pytest.mark.asyncio
    async def test_create_application_sends_accept_header(self) -> None:
        mock_http_client = Mock()
        response = Mock()
        response.status_code = 200
        response.json.return_value = {"id": "ibm-app-123"}

        mock_http_client.post = AsyncMock(return_value=response)
        client = IBMVerifyAdminClient(mock_http_client)

        result = await client.create_application({"name": "[TBS] - Example App"})

        assert result == {"id": "ibm-app-123"}
        mock_http_client.post.assert_awaited_once_with(
            f"{client._base_url}/v1.0/applications",
            headers={"Accept": "application/json"},
            json={"name": "[TBS] - Example App"},
        )

    @pytest.mark.asyncio
    async def test_get_application_total_logins_defaults_to_today_when_dates_are_missing(self) -> None:
        mock_http_client = Mock()
        response = Mock()
        response.status_code = 200
        response.json.return_value = {"total": 11}

        mock_http_client.post = AsyncMock(return_value=response)
        client = IBMVerifyAdminClient(mock_http_client)

        with patch("datetime.datetime", FixedDateTime):
            await client.get_application_total_logins("ibm-app-123")

        mock_http_client.post.assert_awaited_once_with(
            f"{client._base_url}/v1.0/reports/app_total_logins",
            json={
                "APPID": "ibm-app-123",
                "FROM": "1775692800000",
                "TO": "1775779199999",
            },
        )

    @pytest.mark.asyncio
    async def test_get_application_audit_trail_defaults_to_today_when_dates_are_invalid(self) -> None:
        mock_http_client = Mock()
        response = Mock()
        response.status_code = 200
        response.json.return_value = {"events": [], "total": 0}

        mock_http_client.post = AsyncMock(return_value=response)
        client = IBMVerifyAdminClient(mock_http_client)

        with patch("datetime.datetime", FixedDateTime):
            await client.get_application_audit_trail(
                "ibm-app-123",
                from_date="not-a-timestamp",
                to_date="",
                size=15,
            )

        mock_http_client.post.assert_awaited_once_with(
            f"{client._base_url}/v1.0/reports/app_audit_trail",
            json={
                "APPID": "ibm-app-123",
                "FROM": "1775692800000",
                "TO": "1775779199999",
                "SIZE": 15,
                "SORT_BY": "time",
                "SORT_ORDER": "DESC",
            },
        )

    @pytest.mark.asyncio
    async def test_app_audit_trail_search_after_defaults_to_today_when_dates_are_missing(self) -> None:
        mock_http_client = Mock()
        response = Mock()
        response.status_code = 200
        response.json.return_value = {"events": [], "next": None, "total": 0}

        mock_http_client.post = AsyncMock(return_value=response)
        client = IBMVerifyAdminClient(mock_http_client)

        with patch("datetime.datetime", FixedDateTime):
            await client.app_audit_trail_search_after(
                "ibm-app-123",
                size=25,
                search_after='"1775692800000", "event-2"',
            )

        mock_http_client.post.assert_awaited_once_with(
            f"{client._base_url}/v1.0/reports/app_audit_trail_search_after",
            json={
                "APPID": "ibm-app-123",
                "FROM": "1775692800000",
                "TO": "1775779199999",
                "SIZE": 25,
                "SORT_BY": "time",
                "SORT_ORDER": "DESC",
                "SEARCH_AFTER": '"1775692800000", "event-2"',
            },
        )
