from unittest.mock import AsyncMock, Mock, patch

import httpx
import pytest
from ibm_verify_community_sdk.applications.models import GetApplicationsResponse
from ibm_verify_community_sdk.users.models import GetAccountDetailsResponse

from src.app.repositories.ibm_sv_user import IBMVerifyUserClient


class TestIBMVerifyUserClient:
    @pytest.mark.asyncio
    async def test_fetch_profile_returns_model(self) -> None:
        mock_http_client = Mock()
        mock_response = Mock()
        mock_response.json.return_value = {"id": "ibm-user-123", "userName": "testuser"}
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with patch("src.app.repositories.ibm_sv_user.httpx.AsyncClient", return_value=mock_http_client):
            with patch("src.app.core.config.settings.IBM_SV_ADMIN_BASE_URL", "https://example.com"):
                client = IBMVerifyUserClient("test-token")
                result = await client.fetch_profile()

        assert isinstance(result, GetAccountDetailsResponse)
        assert result.id == "ibm-user-123"
        assert result.userName == "testuser"

    @pytest.mark.asyncio
    async def test_fetch_userinfo_returns_dict(self) -> None:
        mock_http_client = Mock()
        mock_response = Mock()
        mock_response.json.return_value = {"sub": "ibm-user-123"}
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with patch("src.app.repositories.ibm_sv_user.httpx.AsyncClient", return_value=mock_http_client):
            with patch("src.app.core.config.settings.IBM_SV_ADMIN_BASE_URL", "https://example.com"):
                client = IBMVerifyUserClient("test-token")
                result = await client.fetch_userinfo()

        assert result == {"sub": "ibm-user-123"}

    @pytest.mark.asyncio
    async def test_fetch_authenticators_returns_dict(self) -> None:
        mock_http_client = Mock()
        mock_response = Mock()
        mock_response.json.return_value = {"factors": []}
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with patch("src.app.repositories.ibm_sv_user.httpx.AsyncClient", return_value=mock_http_client):
            with patch("src.app.core.config.settings.IBM_SV_ADMIN_BASE_URL", "https://example.com"):
                client = IBMVerifyUserClient("test-token")
                result = await client.fetch_authenticators()

        assert result == {"factors": []}

    @pytest.mark.asyncio
    async def test_fetch_applications_returns_model(self) -> None:
        mock_http_client = Mock()
        mock_response = Mock()
        mock_response.json.return_value = {
            "totalCount": 1,
            "applications": [
                {
                    "name": "Test App",
                    "links": [],
                    "status": [],
                    "category": [],
                    "id": "app-1",
                    "discretionaryApp": False,
                }
            ],
        }
        mock_http_client.get = AsyncMock(return_value=mock_response)

        with patch("src.app.repositories.ibm_sv_user.httpx.AsyncClient", return_value=mock_http_client):
            with patch("src.app.core.config.settings.IBM_SV_ADMIN_BASE_URL", "https://example.com"):
                client = IBMVerifyUserClient("test-token")
                result = await client.fetch_applications()

        assert isinstance(result, GetApplicationsResponse)
        assert len(result.applications) == 1
        assert result.applications[0].name == "Test App"
