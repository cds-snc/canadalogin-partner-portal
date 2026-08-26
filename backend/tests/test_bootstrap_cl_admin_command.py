import logging
from unittest.mock import AsyncMock, patch

import pytest

from src.app.commands import bootstrap_cl_admin
from src.app.services.cl_admin_roster_bootstrap import (
    CLAdminRosterBootstrapOutcome,
    CLAdminRosterConfigurationError,
)


class _SessionContext:
    async def __aenter__(self):
        return object()

    async def __aexit__(self, exc_type, exc, traceback):
        return None


@pytest.mark.asyncio
async def test_command_delegates_and_logs_aggregate_outcome(caplog: pytest.LogCaptureFixture) -> None:
    service = AsyncMock()
    service.bootstrap.return_value = CLAdminRosterBootstrapOutcome(created_users=1, created_assignments=2)
    caplog.set_level(logging.INFO, logger="src.app.commands.bootstrap_cl_admin")

    with (
        patch("src.app.commands.bootstrap_cl_admin.local_session", return_value=_SessionContext()),
        patch("src.app.commands.bootstrap_cl_admin.CLAdminRosterBootstrapService", return_value=service),
        patch.object(bootstrap_cl_admin.settings, "INITIAL_CL_ADMIN_EMAILS", '["admin.one@example.test"]'),
    ):
        assert await bootstrap_cl_admin.run_bootstrap_command() == 0

    service.bootstrap.assert_awaited_once()
    assert "created_users=1" in caplog.text
    assert "created_assignments=2" in caplog.text
    assert "admin.one@example.test" not in caplog.text


@pytest.mark.asyncio
async def test_command_returns_safe_failure_for_invalid_configuration(caplog: pytest.LogCaptureFixture) -> None:
    service = AsyncMock()
    service.bootstrap.side_effect = CLAdminRosterConfigurationError("invalid")
    caplog.set_level(logging.ERROR, logger="src.app.commands.bootstrap_cl_admin")

    with (
        patch("src.app.commands.bootstrap_cl_admin.local_session", return_value=_SessionContext()),
        patch("src.app.commands.bootstrap_cl_admin.CLAdminRosterBootstrapService", return_value=service),
    ):
        assert await bootstrap_cl_admin.run_bootstrap_command() == 1

    assert "category=invalid_configuration" in caplog.text


@pytest.mark.asyncio
async def test_command_logs_missing_roster_noop_without_exposing_configuration(
    caplog: pytest.LogCaptureFixture,
) -> None:
    service = AsyncMock()
    service.bootstrap.return_value = CLAdminRosterBootstrapOutcome(skipped=True)
    caplog.set_level(logging.INFO, logger="src.app.commands.bootstrap_cl_admin")

    with (
        patch("src.app.commands.bootstrap_cl_admin.local_session", return_value=_SessionContext()),
        patch("src.app.commands.bootstrap_cl_admin.CLAdminRosterBootstrapService", return_value=service),
        patch.object(bootstrap_cl_admin.settings, "INITIAL_CL_ADMIN_EMAILS", None),
    ):
        assert await bootstrap_cl_admin.run_bootstrap_command() == 0

    assert "skipped=True" in caplog.text
    assert "INITIAL_CL_ADMIN_EMAILS" not in caplog.text


@pytest.mark.asyncio
async def test_command_returns_safe_failure_for_operational_error(caplog: pytest.LogCaptureFixture) -> None:
    service = AsyncMock()
    service.bootstrap.side_effect = RuntimeError("database error")
    caplog.set_level(logging.ERROR, logger="src.app.commands.bootstrap_cl_admin")

    with (
        patch("src.app.commands.bootstrap_cl_admin.local_session", return_value=_SessionContext()),
        patch("src.app.commands.bootstrap_cl_admin.CLAdminRosterBootstrapService", return_value=service),
    ):
        assert await bootstrap_cl_admin.run_bootstrap_command() == 1

    assert "category=operation_failed" in caplog.text
    assert "database error" not in caplog.text
