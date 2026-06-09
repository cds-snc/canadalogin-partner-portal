from typing import Any, cast
from unittest.mock import AsyncMock, Mock, patch

import pytest
import requests
from ibm_verify_community_sdk.client import APIClientError

from src.app.core.exceptions.ibm_sv_exceptions import IBMVerifyBadRequest, IBMVerifyServerError
from src.app.repositories.ibm_sv_user import IBMVerifyUserClient


class TestIBMVerifyUserClient:
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
        client = IBMVerifyUserClient("test-token")
        translated = client._translate_sdk_error(
            self._api_client_error_with_response(400, {"message": "template validation failed"})
        )

        assert isinstance(translated, IBMVerifyBadRequest)
        detail = cast(dict[str, Any], translated.detail)
        assert detail["message"] == "template validation failed"
        assert detail["response_body"] == {"message": "template validation failed"}

    def test_translate_sdk_error_defaults_to_server_error(self) -> None:
        client = IBMVerifyUserClient("test-token")
        translated = client._translate_sdk_error(self._api_client_error_with_response(500, {"message": "internal"}))

        assert isinstance(translated, IBMVerifyServerError)
        detail = cast(dict[str, Any], translated.detail)
        assert detail["message"] == "internal"

    @pytest.mark.asyncio
    async def test_fetch_profile_uses_integrated_sdk_execution(self) -> None:
        client = IBMVerifyUserClient("test-token")
        with patch.object(client, "_run_sdk", AsyncMock(return_value={"id": "ibm-user-123"})) as run_sdk:
            result = await client.fetch_profile()

            assert result == {"id": "ibm-user-123"}
            run_sdk.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_fetch_userinfo_uses_integrated_sdk_execution(self) -> None:
        client = IBMVerifyUserClient("test-token")
        with patch.object(client, "_run_request", AsyncMock(return_value={"sub": "ibm-user-123"})) as run_request:
            result = await client.fetch_userinfo()

            assert result == {"sub": "ibm-user-123"}
            run_request.assert_awaited_once_with("GET", "/oauth2/userinfo")

    @pytest.mark.asyncio
    async def test_fetch_authenticators_uses_integrated_sdk_execution(self) -> None:
        client = IBMVerifyUserClient("test-token")
        with patch.object(client, "_run_request", AsyncMock(return_value={"factors": []})) as run_request:
            result = await client.fetch_authenticators()

            assert result == {"factors": []}
            run_request.assert_awaited_once_with("GET", "/v2.0/factors")

    @pytest.mark.asyncio
    async def test_fetch_applications_uses_integrated_sdk_execution(self) -> None:
        client = IBMVerifyUserClient("test-token")
        with patch.object(client, "_run_request", AsyncMock(return_value={"applications": []})) as run_request:
            result = await client.fetch_applications()

            assert result == {"applications": []}
            run_request.assert_awaited_once_with("GET", "/v1.0/owner/applications")
