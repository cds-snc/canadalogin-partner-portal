from unittest.mock import AsyncMock, Mock, patch

import pytest

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
