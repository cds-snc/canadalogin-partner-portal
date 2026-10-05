import uuid
from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.application_environments import (
    create_application_environment,
    read_application_environments,
)
from src.app.schemas.application_environment import ApplicationEnvironmentCreate


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


@pytest.mark.asyncio
async def test_read_application_environments_delegates_to_service(mock_db):
    application_uuid = uuid.uuid4()
    expected = {
        "application": {
            "uuid": application_uuid,
            "name_en": "Example application",
            "name_fr": None,
        },
        "data": [],
        "total_count": 0,
        "has_more": False,
        "page": 1,
        "items_per_page": 10,
    }
    mock_service = Mock()
    mock_service.list_application_environments = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(read_application_environments)(
        Mock(),
        application_uuid,
        mock_db,
        mock_service,
        page=1,
        items_per_page=10,
    )

    assert result == expected
    mock_service.list_application_environments.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        page=1,
        items_per_page=10,
    )


@pytest.mark.asyncio
async def test_create_application_environment_delegates_to_service(mock_db):
    application_uuid = uuid.uuid4()
    environment = ApplicationEnvironmentCreate(
        application_url_en="https://en.example.com",
        application_url_fr="https://fr.example.com",
        can_decrypt_messages=False,
        can_encrypt_requests=False,
        can_sign_messages=False,
        client_auth_method="client_secret_basic",
        client_type="confidential",
        copy_existing=False,
        decryption_content_algorithms=[],
        decryption_key_algorithms=[],
        decryption_messages=[],
        encryption_content_algorithms=[],
        encryption_key_algorithms=[],
        environment_name="portal",
        pkce_supported=True,
        post_logout_redirect_uris=["https://example.com/logout"],
        redirect_uris=["https://example.com/callback"],
        shares_identifier=False,
        signing_messages=[],
        signing_signature_algorithms=[],
        single_sign_out=False,
        tenant_code="test",
        verification_messages=["id_token"],
        verification_signature_algorithms=["RS256"],
    )
    expected = {"uuid": uuid.uuid4()}
    mock_service = Mock()
    mock_service.create_application_environment = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(create_application_environment)(
        Mock(),
        application_uuid,
        environment,
        mock_db,
        mock_service,
    )

    assert result == expected
    mock_service.create_application_environment.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment=environment,
    )
