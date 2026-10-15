import uuid
from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.application_environment_client_secrets import (
    create_application_environment_rotated_client_secret,
    read_application_environment_client_credentials,
    router,
)
from src.app.schemas.application_environment_client_secret import (
    ApplicationEnvironmentClientSecretCreateRequest,
    ApplicationEnvironmentClientSecretCredentialsRead,
)


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


def test_environment_client_secret_routes_are_nested_under_environment():
    paths = {(method, route.path) for route in router.routes for method in route.methods}

    assert (
        "GET",
        "/applications/{application_uuid}/environments/{environment_uuid}/client",
    ) in paths
    assert (
        "POST",
        "/applications/{application_uuid}/environments/{environment_uuid}/client/rotated-secrets",
    ) in paths
    assert (
        "GET",
        "/applications/{application_uuid}/environments/{environment_uuid}/client/rotated-secrets",
    ) in paths
    assert (
        "POST",
        "/applications/{application_uuid}/environments/{environment_uuid}/client/rotate-secret",
    ) in paths
    assert (
        "DELETE",
        "/applications/{application_uuid}/environments/{environment_uuid}/client/rotated-secrets/{value}",
    ) in paths


@pytest.mark.asyncio
async def test_read_client_credentials_delegates_to_environment_service(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    current_user = {"uuid": uuid.uuid4()}
    expected = {
        "clientId": "environment-client-id",
        "clientSecret": "secret-value",
        "clientSecretId": "secret-id",
    }
    service = Mock()
    service.get_client_credentials = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(read_application_environment_client_credentials)(
        Mock(),
        application_uuid,
        environment_uuid,
        mock_db,
        current_user,
        service,
        Mock(),
    )

    assert result == ApplicationEnvironmentClientSecretCredentialsRead.model_validate(expected)
    service.get_client_credentials.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        current_user=current_user,
        ibm_admin_client=service.get_client_credentials.await_args.kwargs[
            "ibm_admin_client"
        ],
    )


@pytest.mark.asyncio
async def test_create_rotated_secret_delegates_to_environment_service(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    current_user = {"uuid": uuid.uuid4()}
    payload = ApplicationEnvironmentClientSecretCreateRequest(description="deployment")
    service = Mock()
    service.create_rotated_secret = AsyncMock(return_value=[])
    ibm_admin_client = Mock()

    result = await unwrap_endpoint(create_application_environment_rotated_client_secret)(
        Mock(),
        application_uuid,
        environment_uuid,
        payload,
        mock_db,
        current_user,
        service,
        ibm_admin_client,
    )

    assert result == []
    service.create_rotated_secret.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        current_user=current_user,
        payload=payload,
        ibm_admin_client=ibm_admin_client,
    )
