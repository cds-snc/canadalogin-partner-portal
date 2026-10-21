import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from pydantic import ValidationError

from src.app.core.exceptions.http_exceptions import BadRequestException, NotFoundException
from src.app.models.application_configuration_client_type import (
    ApplicationConfigurationClientType,
)
from src.app.schemas.application_environment import (
    ApplicationEnvironmentCreate,
    ApplicationEnvironmentNameUpdate,
    ApplicationEnvironmentUpdate,
)
from src.app.services.application_environment_service import ApplicationEnvironmentService


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"environmentName": "portal", "applicationUrlEn": "https://en.example.com"},
        {"applicationUrlEn": ""},
        {"clientType": "public"},
        {"pkceSupported": True},
        {"canDecryptMessages": True},
        {"decryptionMessages": ["id_token"]},
        {"decryptionKeyAlgorithms": ["RSA-OAEP"]},
        {"decryptionContentAlgorithms": ["A256GCM"]},
        {
            "canDecryptMessages": True,
            "decryptionMessages": [],
            "decryptionKeyAlgorithms": ["RSA-OAEP"],
            "decryptionContentAlgorithms": ["A256GCM"],
        },
        {
            "canDecryptMessages": False,
            "decryptionMessages": ["id_token"],
            "decryptionKeyAlgorithms": [],
            "decryptionContentAlgorithms": [],
        },
        {
            "canDecryptMessages": True,
            "decryptionMessages": ["id_token"],
            "decryptionKeyAlgorithms": ["RSA1_5"],
            "decryptionContentAlgorithms": ["A256GCM"],
        },
        {"clientType": "public", "pkceSupported": False},
        {"postLogoutRedirectUris": []},
        {"redirectUris": []},
        {"singleSignOut": True},
        {
            "singleSignOut": True,
            "logoutMethod": "front_channel",
        },
        {
            "singleSignOut": False,
            "logoutMethod": "front_channel",
        },
        {"logoutMethod": "front_channel"},
        {
            "environmentName": "portal",
            "singleSignOut": False,
        },
        {"clientAuthMethod": "private_key_jwt"},
        {"jwksUri": "https://example.com/jwks"},
        {"verificationMessages": ["id_token"]},
        {"verificationSignatureAlgorithms": ["RS256"]},
        {"verificationMessages": [] , "verificationSignatureAlgorithms": ["RS256"]},
        {"verificationMessages": ["id_token"], "verificationSignatureAlgorithms": []},
        {
            "verificationMessages": ["id_token"],
            "verificationSignatureAlgorithms": ["HS256"],
        },
        {"canSignMessages": True},
        {"signingMessages": ["request_object"]},
        {"signingSignatureAlgorithms": ["RS256"]},
        {
            "canSignMessages": True,
            "signingMessages": [],
            "signingSignatureAlgorithms": ["RS256"],
        },
        {
            "canSignMessages": True,
            "signingMessages": ["request_object"],
            "signingSignatureAlgorithms": [],
        },
        {
            "canSignMessages": False,
            "signingMessages": ["request_object"],
            "signingSignatureAlgorithms": [],
        },
        {
            "canSignMessages": False,
            "signingMessages": [],
            "signingSignatureAlgorithms": ["RS256"],
        },
        {
            "canSignMessages": True,
            "signingMessages": ["request_object"],
            "signingSignatureAlgorithms": ["HS256"],
        },
        {"canEncryptRequests": True},
        {"encryptionKeyAlgorithms": ["RSA-OAEP"]},
        {"encryptionContentAlgorithms": ["A256GCM"]},
        {
            "canEncryptRequests": True,
            "encryptionKeyAlgorithms": [],
            "encryptionContentAlgorithms": ["A256GCM"],
        },
        {
            "canEncryptRequests": True,
            "encryptionKeyAlgorithms": ["RSA-OAEP"],
            "encryptionContentAlgorithms": [],
        },
        {
            "canEncryptRequests": False,
            "encryptionKeyAlgorithms": ["RSA-OAEP"],
            "encryptionContentAlgorithms": [],
        },
        {
            "canEncryptRequests": False,
            "encryptionKeyAlgorithms": [],
            "encryptionContentAlgorithms": ["A256GCM"],
        },
        {
            "canEncryptRequests": True,
            "encryptionKeyAlgorithms": ["RSA-OAEP"],
            "encryptionContentAlgorithms": ["A256CBC"],
        },
    ],
)
def test_application_environment_update_requires_one_valid_editable_field(payload):
    with pytest.raises(ValidationError):
        ApplicationEnvironmentUpdate.model_validate(payload)


@pytest.mark.parametrize(
    "payload",
    [
        {"environmentName": "portal"},
        {"applicationUrlEn": "https://en.example.com"},
        {"applicationUrlFr": "https://fr.example.com"},
        {"clientType": "public", "pkceSupported": True},
        {"clientType": "confidential", "pkceSupported": False},
        {"postLogoutRedirectUris": ["https://example.com/logout"]},
        {"redirectUris": ["https://example.com/callback"]},
        {
            "singleSignOut": True,
            "logoutMethod": "front_channel",
            "signOutRequestUrl": "https://example.com/sign-out",
        },
        {"singleSignOut": False},
        {"clientAuthMethod": "client_secret_basic"},
        {
            "clientAuthMethod": "private_key_jwt",
            "jwksUri": "https://example.com/jwks",
        },
        {
            "verificationMessages": ["id_token", "userinfo"],
            "verificationSignatureAlgorithms": ["RS256", "PS256"],
        },
        {
            "canSignMessages": True,
            "signingMessages": ["request_object", "token_endpoint"],
            "signingSignatureAlgorithms": ["RS256", "PS256"],
        },
        {
            "canSignMessages": False,
            "signingMessages": [],
            "signingSignatureAlgorithms": [],
        },
        {
            "canEncryptRequests": True,
            "encryptionKeyAlgorithms": ["RSA-OAEP", "RSA-OAEP-256"],
            "encryptionContentAlgorithms": ["A128GCM", "A256GCM"],
        },
        {
            "canEncryptRequests": False,
            "encryptionKeyAlgorithms": [],
            "encryptionContentAlgorithms": [],
        },
        {
            "canDecryptMessages": True,
            "decryptionMessages": ["token_endpoint_response", "id_token", "userinfo"],
            "decryptionKeyAlgorithms": ["RSA-OAEP", "RSA-OAEP-256"],
            "decryptionContentAlgorithms": ["A128GCM", "A192GCM", "A256GCM"],
        },
        {
            "canDecryptMessages": False,
            "decryptionMessages": [],
            "decryptionKeyAlgorithms": [],
            "decryptionContentAlgorithms": [],
        },
    ],
)
def test_application_environment_update_accepts_each_editable_field(payload):
    assert ApplicationEnvironmentUpdate.model_validate(payload)


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
        signing_messages=[],
        signing_signature_algorithms=[],
        single_sign_out=False,
        tenant_code="test",
        verification_messages=["id_token"],
        verification_signature_algorithms=["RS256"],
    )


@pytest.mark.parametrize(
    "removed_field",
    [
        {"sharesIdentifier": False},
        {"sectorIdentifierUrl": "https://example.com/sector"},
    ],
)
def test_application_environment_create_rejects_removed_sector_identifier_fields(
    removed_field,
):
    payload = valid_environment_create().model_dump(by_alias=True)
    payload.update(removed_field)

    with pytest.raises(ValidationError):
        ApplicationEnvironmentCreate.model_validate(payload)


def test_application_environment_create_rejects_disabled_staging_single_sign_out():
    payload = valid_environment_create().model_dump()
    payload.update(tenant_code="staging")

    with pytest.raises(ValidationError, match="singleSignOut is required"):
        ApplicationEnvironmentCreate.model_validate(payload)


def test_application_environment_create_accepts_production():
    payload = valid_environment_create().model_dump()
    payload.update(tenant_code="production")

    assert ApplicationEnvironmentCreate.model_validate(payload).tenant_code == "production"


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


@pytest.mark.asyncio
async def test_update_application_environment_name_updates_prefixed_name(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    current = {"tenant_code": "test"}
    expected = {"uuid": environment_uuid, "partner_label": "TEST-portal-renamed"}

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value=current)
        repository.update_environment_name = AsyncMock(return_value=expected)

        result = await ApplicationEnvironmentService().update_application_environment_name(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            environment=ApplicationEnvironmentNameUpdate(environment_name="portal-renamed"),
        )

    assert result == expected
    repository.update_environment_name.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        environment_name="TEST-portal-renamed",
    )


@pytest.mark.asyncio
async def test_update_application_environment_rejects_production_environment(mock_db):
    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "production"})
        repository.update_environment_name = AsyncMock()

        with pytest.raises(
            BadRequestException,
            match="Production environments cannot be modified",
        ):
            await ApplicationEnvironmentService().update_application_environment_name(
                db=mock_db,
                application_uuid=uuid.uuid4(),
                environment_uuid=uuid.uuid4(),
                environment=ApplicationEnvironmentNameUpdate(environment_name="portal-renamed"),
            )

    repository.update_environment_name.assert_not_awaited()


@pytest.mark.asyncio
async def test_update_application_environment_name_rejects_prefixed_name_over_limit(mock_db):
    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "staging"})
        repository.update_environment_name = AsyncMock()

        with pytest.raises(BadRequestException, match="Environment name is too long"):
            await ApplicationEnvironmentService().update_application_environment_name(
                db=mock_db,
                application_uuid=uuid.uuid4(),
                environment_uuid=uuid.uuid4(),
                environment=ApplicationEnvironmentNameUpdate(environment_name="a" * 64),
            )

    repository.update_environment_name.assert_not_awaited()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("environment", "application_url", "config_key", "url_field"),
    [
        (
            ApplicationEnvironmentUpdate(application_url_en="https://en.example.com"),
            "https://en.example.com/",
            "applicationUrlEn",
            "application_url_en",
        ),
        (
            ApplicationEnvironmentUpdate(application_url_fr="https://fr.example.com"),
            "https://fr.example.com/",
            "applicationUrlFr",
            "application_url_fr",
        ),
    ],
)
async def test_update_application_environment_url_persists_selected_url(
    mock_db,
    environment,
    application_url,
    config_key,
    url_field,
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    expected = {"uuid": environment_uuid, config_key: application_url}

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "test"})
        repository.update_environment_url = AsyncMock(return_value=expected)

        result = await ApplicationEnvironmentService().update_application_environment_name(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            environment=environment,
        )

    assert result == expected
    repository.update_environment_url.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        application_url=application_url,
        config_key=config_key,
        url_field=url_field,
    )


@pytest.mark.asyncio
async def test_update_application_environment_redirect_uris_persists_selected_urls(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    redirect_uris = [
        "https://example.com/callback",
        "https://example.com/alternate-callback",
    ]
    expected = {"uuid": environment_uuid, "redirectUris": redirect_uris}

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "test"})
        repository.update_environment_redirect_uris = AsyncMock(return_value=expected)

        result = await ApplicationEnvironmentService().update_application_environment_name(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            environment=ApplicationEnvironmentUpdate(
                redirect_uris=redirect_uris
            ),
        )

    assert result == expected
    repository.update_environment_redirect_uris.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        redirect_uris=redirect_uris,
    )


@pytest.mark.asyncio
async def test_update_application_environment_post_logout_redirect_uris_persists_selected_urls(
    mock_db,
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    post_logout_redirect_uris = [
        "https://example.com/logout",
        "https://example.com/alternate-logout",
    ]
    expected = {
        "uuid": environment_uuid,
        "postLogoutRedirectUris": post_logout_redirect_uris,
    }

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "test"})
        repository.update_environment_post_logout_redirect_uris = AsyncMock(
            return_value=expected
        )

        result = await ApplicationEnvironmentService().update_application_environment_name(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            environment=ApplicationEnvironmentUpdate(
                post_logout_redirect_uris=post_logout_redirect_uris
            ),
        )

    assert result == expected
    repository.update_environment_post_logout_redirect_uris.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        post_logout_redirect_uris=post_logout_redirect_uris,
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("client_type", "pkce_supported"),
    [("public", True), ("confidential", False)],
)
async def test_update_application_environment_client_type_resolves_lookup_and_persists(
    mock_db,
    client_type,
    pkce_supported,
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    expected = {"uuid": environment_uuid, "clientType": client_type}

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "test"})
        repository.get_active_lookup_id = AsyncMock(return_value=42)
        repository.update_environment_client_type = AsyncMock(return_value=expected)

        result = await ApplicationEnvironmentService().update_application_environment_name(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            environment=ApplicationEnvironmentUpdate(
                client_type=client_type,
                pkce_supported=pkce_supported,
            ),
        )

    assert result == expected
    repository.get_active_lookup_id.assert_awaited_once_with(
        db=mock_db,
        model=ApplicationConfigurationClientType,
        code=client_type,
    )
    repository.update_environment_client_type.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        client_type_id=42,
        client_type=client_type,
        pkce_supported=pkce_supported,
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("client_auth_method", "jwks_uri"),
    [
        ("private_key_jwt", "https://example.com/jwks"),
        ("client_secret_basic", None),
        ("client_secret_post", None),
    ],
)
async def test_update_application_environment_authentication_method_persists_settings(
    mock_db,
    client_auth_method,
    jwks_uri,
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    expected = {"uuid": environment_uuid, "clientAuthMethod": client_auth_method}

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "test"})
        repository.update_environment_authentication_method = AsyncMock(
            return_value=expected
        )

        result = await ApplicationEnvironmentService().update_application_environment_name(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            environment=ApplicationEnvironmentUpdate(
                client_auth_method=client_auth_method,
                jwks_uri=jwks_uri,
            ),
        )

    assert result == expected
    repository.update_environment_authentication_method.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        client_auth_method=client_auth_method,
        jwks_uri=jwks_uri,
    )


@pytest.mark.asyncio
async def test_update_application_environment_verification_persists_settings(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    verification_messages = ["id_token", "userinfo"]
    verification_signature_algorithms = ["RS256", "PS256"]
    expected = {"uuid": environment_uuid, "verificationMessages": verification_messages}

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "test"})
        repository.update_environment_verification = AsyncMock(return_value=expected)

        result = await ApplicationEnvironmentService().update_application_environment_name(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            environment=ApplicationEnvironmentUpdate(
                verification_messages=verification_messages,
                verification_signature_algorithms=verification_signature_algorithms,
            ),
        )

    assert result == expected
    repository.update_environment_verification.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        verification_messages=verification_messages,
        verification_signature_algorithms=verification_signature_algorithms,
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("can_sign_messages", "signing_messages", "signing_signature_algorithms"),
    [
        (True, ["request_object", "token_endpoint"], ["RS256", "PS256"]),
        (False, [], []),
    ],
)
async def test_update_application_environment_signing_persists_settings(
    mock_db,
    can_sign_messages,
    signing_messages,
    signing_signature_algorithms,
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    expected = {"uuid": environment_uuid, "canSignMessages": can_sign_messages}

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "test"})
        repository.update_environment_signing = AsyncMock(return_value=expected)

        result = await ApplicationEnvironmentService().update_application_environment_name(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            environment=ApplicationEnvironmentUpdate(
                can_sign_messages=can_sign_messages,
                signing_messages=signing_messages,
                signing_signature_algorithms=signing_signature_algorithms,
            ),
        )

    assert result == expected
    repository.update_environment_signing.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        can_sign_messages=can_sign_messages,
        signing_messages=signing_messages,
        signing_signature_algorithms=signing_signature_algorithms,
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("can_encrypt_requests", "encryption_key_algorithms", "encryption_content_algorithms"),
    [
        (True, ["RSA-OAEP", "RSA-OAEP-256"], ["A128GCM", "A256GCM"]),
        (False, [], []),
    ],
)
async def test_update_application_environment_encryption_persists_settings(
    mock_db,
    can_encrypt_requests,
    encryption_key_algorithms,
    encryption_content_algorithms,
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    expected = {"uuid": environment_uuid, "canEncryptRequests": can_encrypt_requests}

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "test"})
        repository.update_environment_encryption = AsyncMock(return_value=expected)

        result = await ApplicationEnvironmentService().update_application_environment_name(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            environment=ApplicationEnvironmentUpdate(
                can_encrypt_requests=can_encrypt_requests,
                encryption_key_algorithms=encryption_key_algorithms,
                encryption_content_algorithms=encryption_content_algorithms,
            ),
        )

    assert result == expected
    repository.update_environment_encryption.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        can_encrypt_requests=can_encrypt_requests,
        encryption_key_algorithms=encryption_key_algorithms,
        encryption_content_algorithms=encryption_content_algorithms,
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("can_decrypt_messages", "decryption_messages", "decryption_key_algorithms", "decryption_content_algorithms"),
    [
        (
            True,
            ["token_endpoint_response", "id_token"],
            ["RSA-OAEP", "RSA-OAEP-256"],
            ["A128GCM", "A256GCM"],
        ),
        (False, [], [], []),
    ],
)
async def test_update_application_environment_decryption_persists_settings(
    mock_db,
    can_decrypt_messages,
    decryption_messages,
    decryption_key_algorithms,
    decryption_content_algorithms,
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    expected = {"uuid": environment_uuid, "canDecryptMessages": can_decrypt_messages}

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "test"})
        repository.update_environment_decryption = AsyncMock(return_value=expected)

        result = await ApplicationEnvironmentService().update_application_environment_name(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            environment=ApplicationEnvironmentUpdate(
                can_decrypt_messages=can_decrypt_messages,
                decryption_messages=decryption_messages,
                decryption_key_algorithms=decryption_key_algorithms,
                decryption_content_algorithms=decryption_content_algorithms,
            ),
        )

    assert result == expected
    repository.update_environment_decryption.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        can_decrypt_messages=can_decrypt_messages,
        decryption_messages=decryption_messages,
        decryption_key_algorithms=decryption_key_algorithms,
        decryption_content_algorithms=decryption_content_algorithms,
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("environment", "logout_method", "sign_out_request_url"),
    [
        (
            ApplicationEnvironmentUpdate(
                single_sign_out=True,
                logout_method="front_channel",
                sign_out_request_url="https://example.com/sign-out",
            ),
            "front_channel",
            "https://example.com/sign-out",
        ),
        (ApplicationEnvironmentUpdate(single_sign_out=False), None, None),
    ],
)
async def test_update_application_environment_single_sign_out_persists_selected_settings(
    mock_db,
    environment,
    logout_method,
    sign_out_request_url,
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    expected = {"uuid": environment_uuid, "singleSignOut": environment.single_sign_out}

    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "test"})
        repository.update_environment_single_sign_out = AsyncMock(return_value=expected)

        result = await ApplicationEnvironmentService().update_application_environment_name(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            environment=environment,
        )

    assert result == expected
    repository.update_environment_single_sign_out.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
        single_sign_out=environment.single_sign_out,
        logout_method=logout_method,
        sign_out_request_url=sign_out_request_url,
    )


@pytest.mark.asyncio
async def test_update_application_environment_rejects_disabling_staging_single_sign_out(
    mock_db,
):
    with patch("src.app.services.application_environment_service.application_environment_repository") as repository:
        repository.get_environment = AsyncMock(return_value={"tenant_code": "staging"})
        repository.update_environment_single_sign_out = AsyncMock()

        with pytest.raises(
            BadRequestException,
            match="Single sign-out is required for staging environments",
        ):
            await ApplicationEnvironmentService().update_application_environment_name(
                db=mock_db,
                application_uuid=uuid.uuid4(),
                environment_uuid=uuid.uuid4(),
                environment=ApplicationEnvironmentUpdate(single_sign_out=False),
            )

    repository.update_environment_single_sign_out.assert_not_awaited()
