import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest

from src.app.core.exceptions.http_exceptions import BadRequestException, NotFoundException
from src.app.schemas.application_environment import ApplicationEnvironmentCreate
from src.app.services.application_environment_service import ApplicationEnvironmentService


def valid_environment_create() -> ApplicationEnvironmentCreate:
    return ApplicationEnvironmentCreate(
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
        logout_method="front_channel",
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


@pytest.mark.asyncio
async def test_list_application_environments_returns_application_and_page(mock_db):
    application_uuid = uuid.uuid4()
    application = {
        "uuid": application_uuid,
        "name_en": "Example application",
        "name_fr": "Application exemple",
    }
    environments = {
        "data": [
            {
                "uuid": uuid.uuid4(),
                "partner_label": "Production",
                "tenant_code": "production",
                "status_code": "published",
                "config": {
                    "redirectUris": ["https://example.com/callback"],
                },
                "created_at": datetime.now(UTC),
                "updated_at": None,
            }
        ],
        "total_count": 1,
    }

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_application_summary = AsyncMock(return_value=application)
        repository.list_environments = AsyncMock(return_value=environments)

        result = await ApplicationEnvironmentService().list_application_environments(
            db=mock_db,
            application_uuid=application_uuid,
            page=1,
            items_per_page=10,
        )

    assert result["application"] == application
    assert result["data"] == environments["data"]
    assert result["total_count"] == 1
    assert result["has_more"] is False
    repository.list_environments.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        offset=0,
        limit=10,
    )


@pytest.mark.asyncio
async def test_list_application_environments_rejects_unknown_application(mock_db):
    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_application_summary = AsyncMock(return_value=None)
        repository.list_environments = AsyncMock()

        with pytest.raises(NotFoundException, match="Application not found"):
            await ApplicationEnvironmentService().list_application_environments(
                db=mock_db,
                application_uuid=uuid.uuid4(),
                page=1,
                items_per_page=10,
            )

    repository.list_environments.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_application_environment_maps_and_persists_configuration(mock_db):
    application_uuid = uuid.uuid4()
    environment = valid_environment_create()
    expected = {"uuid": uuid.uuid4(), "status_code": "submitted"}

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_application_id = AsyncMock(return_value=42)
        repository.get_active_lookup_id = AsyncMock(side_effect=[10, 11, 12, 13])
        repository.create_environment = AsyncMock(return_value=expected)

        result = await ApplicationEnvironmentService().create_application_environment(
            db=mock_db,
            application_uuid=application_uuid,
            environment=environment,
        )

    assert result == expected
    repository.create_environment.assert_awaited_once_with(
        db=mock_db,
        application_id=42,
        status_id=10,
        client_type_id=11,
        authentication_protocol_id=12,
        tenant_id=13,
        partner_label="portal",
        application_url_en="https://en.example.com/",
        application_url_fr="https://fr.example.com/",
        tenant_code="test",
        status_code="submitted",
        config=environment.model_dump(by_alias=True, exclude_none=True, mode="json"),
    )


@pytest.mark.asyncio
async def test_create_application_environment_rejects_ineligible_copy_source(mock_db):
    environment = valid_environment_create().model_copy(
        update={
            "copy_existing": True,
            "source_environment_uuid": uuid.uuid4(),
        }
    )

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_application_id = AsyncMock(return_value=42)
        repository.source_environment_exists = AsyncMock(return_value=False)
        repository.create_environment = AsyncMock()

        with pytest.raises(BadRequestException, match="Source environment not found"):
            await ApplicationEnvironmentService().create_application_environment(
                db=mock_db,
                application_uuid=uuid.uuid4(),
                environment=environment,
            )

    repository.create_environment.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_application_environment_rejects_unknown_application(mock_db):
    environment = valid_environment_create()

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_application_id = AsyncMock(return_value=None)
        repository.create_environment = AsyncMock()

        with pytest.raises(NotFoundException, match="Application not found"):
            await ApplicationEnvironmentService().create_application_environment(
                db=mock_db,
                application_uuid=uuid.uuid4(),
                environment=environment,
            )

    repository.create_environment.assert_not_awaited()
