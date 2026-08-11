from unittest.mock import AsyncMock, Mock, patch

import pytest

from fastcrud.exceptions.http_exceptions import CustomException

from src.app.repositories import dependencies


@pytest.mark.asyncio
async def test_get_ibm_sv_admin_client_reuses_client_within_same_loop(monkeypatch):
    monkeypatch.setattr(dependencies, "_ibm_sv_admin_client", None)
    monkeypatch.setattr(dependencies, "_ibm_sv_admin_client_loop_id", None)

    loop = object()
    token = Mock()
    token.is_expired.return_value = False
    oauth_client = Mock(token=token)
    oauth_client.fetch_token = AsyncMock()
    mock_client = AsyncMock()

    with patch("src.app.repositories.dependencies.asyncio.get_running_loop", return_value=loop):
        with patch(
            "src.app.repositories.dependencies.create_admin_oauth_client",
            AsyncMock(return_value=oauth_client),
        ) as create_oauth:
            with patch(
                "src.app.repositories.dependencies.IBMVerifyAdminClient",
                return_value=mock_client,
            ):
                first = await dependencies.get_ibm_sv_admin_client()
                second = await dependencies.get_ibm_sv_admin_client()

    assert first is second
    create_oauth.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_ibm_sv_admin_client_recreates_client_for_different_loop(monkeypatch):
    loop_one = object()
    loop_two = object()

    existing_client = AsyncMock()
    monkeypatch.setattr(dependencies, "_ibm_sv_admin_client", existing_client)
    monkeypatch.setattr(dependencies, "_ibm_sv_admin_client_loop_id", id(loop_one))

    token = Mock()
    token.is_expired.return_value = False
    oauth_client = Mock(token=token)
    oauth_client.fetch_token = AsyncMock()
    replacement_client = AsyncMock()

    with patch("src.app.repositories.dependencies.asyncio.get_running_loop", return_value=loop_two):
        with patch(
            "src.app.repositories.dependencies.create_admin_oauth_client",
            AsyncMock(return_value=oauth_client),
        ):
            with patch(
                "src.app.repositories.dependencies.IBMVerifyAdminClient",
                return_value=replacement_client,
            ):
                result = await dependencies.get_ibm_sv_admin_client()

    existing_client.aclose.assert_awaited_once()
    assert result is replacement_client
    assert dependencies._ibm_sv_admin_client_loop_id == id(loop_two)


@pytest.mark.asyncio
async def test_get_ibm_sv_admin_client_raises_handled_503_when_ibm_sv_is_not_configured(monkeypatch):
    monkeypatch.setattr(dependencies, "_ibm_sv_admin_client", None)
    monkeypatch.setattr(dependencies, "_ibm_sv_admin_client_loop_id", None)

    with patch("src.app.repositories.dependencies.asyncio.get_running_loop", return_value=object()):
        with patch(
            "src.app.repositories.dependencies.create_admin_oauth_client",
            AsyncMock(side_effect=ValueError("IBM_SV_ADMIN_BASE_URL is not configured")),
        ):
            with pytest.raises(CustomException) as exc_info:
                await dependencies.get_ibm_sv_admin_client()

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "IBM Security Verify is not configured. Check IBM_SV_ADMIN_BASE_URL."


def test_get_ibm_sv_user_client_raises_handled_503_when_ibm_sv_is_not_configured() -> None:
    request = Mock()
    request.session = {"tokens": {"access_token": "token-123"}}

    with patch(
        "src.app.repositories.dependencies.IBMVerifyUserClient",
        side_effect=ValueError("IBM_SV_ADMIN_BASE_URL is not configured"),
    ):
        with pytest.raises(CustomException) as exc_info:
            dependencies.get_ibm_sv_user_client(request)

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "IBM Security Verify is not configured. Check IBM_SV_ADMIN_BASE_URL."
