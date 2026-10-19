import uuid
from unittest.mock import AsyncMock, Mock

import pytest

from src.app.api.v1.application_environments import (
    create_application_environment,
    read_application_environment,
    read_application_environments,
    update_application_environment_name,
)
from src.app.schemas.application_environment import (
    ApplicationEnvironmentCreate,
    ApplicationEnvironmentNameUpdate,
    ApplicationEnvironmentUpdate,
)


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
async def test_read_application_environment_delegates_to_service(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    expected = {"uuid": environment_uuid, "partner_label": "Test"}
    mock_service = Mock()
    mock_service.get_application_environment = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(read_application_environment)(
        Mock(),
        application_uuid,
        environment_uuid,
        mock_db,
        mock_service,
    )

    assert result == expected
    mock_service.get_application_environment.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
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


@pytest.mark.asyncio
async def test_update_application_environment_name_delegates_to_service(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = ApplicationEnvironmentNameUpdate(environment_name="portal-renamed")
    expected = {"uuid": environment_uuid, "partner_label": "TEST-portal-renamed"}
    mock_service = Mock()
    mock_service.update_application_environment_name = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(update_application_environment_name)(
        Mock(),
        application_uuid,
        environment_uuid,
        environment,
        mock_db,
        mock_service,
    )

    assert result == expected
    mock_service.update_application_environment_name.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        environment=environment,
    )


@pytest.mark.asyncio
async def test_update_application_environment_single_sign_out_delegates_to_service(
    mock_db,
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = ApplicationEnvironmentUpdate(single_sign_out=False)
    expected = {"uuid": environment_uuid, "singleSignOut": False}
    mock_service = Mock()
    mock_service.update_application_environment_name = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(update_application_environment_name)(
        Mock(),
        application_uuid,
        environment_uuid,
        environment,
        mock_db,
        mock_service,
    )

    assert result == expected
    mock_service.update_application_environment_name.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        environment=environment,
    )


@pytest.mark.asyncio
async def test_update_application_environment_authentication_method_delegates_to_service(
    mock_db,
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = ApplicationEnvironmentUpdate(
        client_auth_method="private_key_jwt",
        jwks_uri="https://example.com/jwks",
    )
    expected = {"uuid": environment_uuid, "clientAuthMethod": "private_key_jwt"}
    mock_service = Mock()
    mock_service.update_application_environment_name = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(update_application_environment_name)(
        Mock(),
        application_uuid,
        environment_uuid,
        environment,
        mock_db,
        mock_service,
    )

    assert result == expected
    mock_service.update_application_environment_name.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        environment=environment,
    )


@pytest.mark.asyncio
async def test_update_application_environment_sector_identifier_delegates_to_service(
    mock_db,
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = ApplicationEnvironmentUpdate(
        sector_identifier_url="https://example.com/sector",
        shares_identifier=True,
    )
    expected = {"uuid": environment_uuid, "sharesIdentifier": True}
    mock_service = Mock()
    mock_service.update_application_environment_name = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(update_application_environment_name)(
        Mock(),
        application_uuid,
        environment_uuid,
        environment,
        mock_db,
        mock_service,
    )

    assert result == expected
    mock_service.update_application_environment_name.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        environment=environment,
    )


@pytest.mark.asyncio
async def test_update_application_environment_verification_delegates_to_service(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = ApplicationEnvironmentUpdate(
        verification_messages=["id_token", "userinfo"],
        verification_signature_algorithms=["RS256", "PS256"],
    )
    expected = {"uuid": environment_uuid, "verificationMessages": ["id_token", "userinfo"]}
    mock_service = Mock()
    mock_service.update_application_environment_name = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(update_application_environment_name)(
        Mock(),
        application_uuid,
        environment_uuid,
        environment,
        mock_db,
        mock_service,
    )

    assert result == expected
    mock_service.update_application_environment_name.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        environment=environment,
    )


@pytest.mark.asyncio
async def test_update_application_environment_signing_delegates_to_service(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = ApplicationEnvironmentUpdate(
        can_sign_messages=False,
        signing_messages=[],
        signing_signature_algorithms=[],
    )
    expected = {"uuid": environment_uuid, "canSignMessages": False}
    mock_service = Mock()
    mock_service.update_application_environment_name = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(update_application_environment_name)(
        Mock(),
        application_uuid,
        environment_uuid,
        environment,
        mock_db,
        mock_service,
    )

    assert result == expected
    mock_service.update_application_environment_name.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        environment=environment,
    )


@pytest.mark.asyncio
async def test_update_application_environment_encryption_delegates_to_service(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = ApplicationEnvironmentUpdate(
        can_encrypt_requests=False,
        encryption_key_algorithms=[],
        encryption_content_algorithms=[],
    )
    expected = {"uuid": environment_uuid, "canEncryptRequests": False}
    mock_service = Mock()
    mock_service.update_application_environment_name = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(update_application_environment_name)(
        Mock(),
        application_uuid,
        environment_uuid,
        environment,
        mock_db,
        mock_service,
    )

    assert result == expected
    mock_service.update_application_environment_name.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        environment=environment,
    )


@pytest.mark.asyncio
async def test_update_application_environment_decryption_delegates_to_service(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = ApplicationEnvironmentUpdate(
        can_decrypt_messages=False,
        decryption_messages=[],
        decryption_key_algorithms=[],
        decryption_content_algorithms=[],
    )
    expected = {"uuid": environment_uuid, "canDecryptMessages": False}
    mock_service = Mock()
    mock_service.update_application_environment_name = AsyncMock(return_value=expected)

    result = await unwrap_endpoint(update_application_environment_name)(
        Mock(),
        application_uuid,
        environment_uuid,
        environment,
        mock_db,
        mock_service,
    )

    assert result == expected
    mock_service.update_application_environment_name.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        environment=environment,
    )
