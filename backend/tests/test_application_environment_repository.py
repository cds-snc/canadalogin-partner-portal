from unittest.mock import AsyncMock, Mock

import uuid

import pytest

from src.app.repositories.application_environment_repository import (
    ApplicationEnvironmentRepository,
)


@pytest.mark.asyncio
async def test_create_environment_commits_and_returns_created_configuration(mock_db):
    repository = ApplicationEnvironmentRepository()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    result = await repository.create_environment(
        db=mock_db,
        application_id=1,
        status_id=2,
        client_type_id=3,
        authentication_protocol_id=4,
        tenant_id=5,
        partner_label="portal",
        application_url_en="https://en.example.com",
        application_url_fr="https://fr.example.com",
        tenant_code="test",
        status_code="submitted",
        config={"environmentName": "portal"},
    )

    mock_db.add.assert_called_once()
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(mock_db.add.call_args.args[0])
    assert result["partner_label"] == "portal"
    assert result["tenant_code"] == "test"
    assert result["status_code"] == "submitted"
    assert result["config"] == {"environmentName": "portal"}


@pytest.mark.asyncio
async def test_source_environment_exists_limits_sources_to_non_production_tenants(mock_db):
    mock_db.execute = AsyncMock()
    execute_result = Mock()
    execute_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = execute_result

    result = await ApplicationEnvironmentRepository().source_environment_exists(
        db=mock_db,
        application_uuid=uuid.uuid4(),
        source_environment_uuid=uuid.uuid4(),
    )

    statement = mock_db.execute.await_args.args[0]
    assert ["test", "staging"] in statement.compile().params.values()
    assert result is False
