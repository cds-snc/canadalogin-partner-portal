import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock

import pytest

from src.app.models.application_configuration import ApplicationConfiguration
from src.app.repositories.application_environment_repository import (
    ApplicationEnvironmentRepository,
)
from src.app.schemas.application_environment import ApplicationEnvironmentRead


@pytest.mark.asyncio
@pytest.mark.parametrize("client_id", ["stored-client-id", None])
@pytest.mark.parametrize("read_list", [False, True])
async def test_environment_reads_select_stored_client_id(mock_db, client_id, read_list):
    environment = {
        "uuid": uuid.uuid4(),
        "client_id": client_id,
        "partner_label": "Test environment",
        "tenant_code": "test",
        "status_code": "active",
        "created_at": datetime.now(UTC),
    }
    query_result = Mock()
    query_result.mappings.return_value.one_or_none.return_value = environment
    query_result.mappings.return_value.all.return_value = [environment]
    count_result = Mock()
    count_result.scalar_one.return_value = 1
    mock_db.execute = AsyncMock(side_effect=[query_result, count_result])
    repository = ApplicationEnvironmentRepository()
    application_uuid = uuid.uuid4()

    if read_list:
        result = await repository.list_environments(
            db=mock_db,
            application_uuid=application_uuid,
            offset=0,
            limit=10,
        )
        assert result["total_count"] == 1
        result = result["data"][0]
    else:
        result = await repository.get_environment(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment["uuid"],
        )

    statement = mock_db.execute.await_args_list[0].args[0]
    assert "client_id" in statement.selected_columns
    assert statement.selected_columns["client_id"].element.compare(
        ApplicationConfiguration.__table__.c.ibm_client_id
    )
    assert result["client_id"] == client_id
    assert ApplicationEnvironmentRead.model_validate(result).model_dump(by_alias=True)["clientId"] == client_id


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
    assert result["client_id"] is None


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


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("url_field", "config_key", "application_url"),
    [
        ("application_url_en", "applicationUrlEn", "https://en.example.com/"),
        ("application_url_fr", "applicationUrlFr", "https://fr.example.com/"),
    ],
)
async def test_update_environment_url_persists_column_and_config(
    mock_db,
    url_field,
    config_key,
    application_url,
):
    configuration = ApplicationConfiguration(
        application_id=1,
        application_configuration_status_id=2,
        application_configuration_client_type_id=3,
        authentication_protocol_id=4,
        tenant_id=5,
        partner_label="portal",
        application_url_en="https://old-en.example.com/",
        application_url_fr="https://old-fr.example.com/",
        config={"environmentName": "portal"},
    )
    mock_db.execute = AsyncMock()
    execute_result = Mock()
    execute_result.scalar_one_or_none.return_value = configuration
    mock_db.execute.return_value = execute_result
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    repository = ApplicationEnvironmentRepository()
    repository.get_environment = AsyncMock(return_value={"uuid": configuration.uuid})

    result = await repository.update_environment_url(
        db=mock_db,
        application_uuid=uuid.uuid4(),
        environment_uuid=configuration.uuid,
        application_url=application_url,
        config_key=config_key,
        url_field=url_field,
    )

    assert result == {"uuid": configuration.uuid}
    assert getattr(configuration, url_field) == application_url
    assert configuration.config == {
        "environmentName": "portal",
        config_key: application_url,
    }
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(configuration)


@pytest.mark.asyncio
async def test_update_environment_redirect_uris_preserves_existing_config(mock_db):
    configuration = ApplicationConfiguration(
        application_id=1,
        application_configuration_status_id=2,
        application_configuration_client_type_id=3,
        authentication_protocol_id=4,
        tenant_id=5,
        partner_label="portal",
        application_url_en="https://en.example.com/",
        application_url_fr="https://fr.example.com/",
        config={"environmentName": "portal", "clientType": "public"},
    )
    mock_db.execute = AsyncMock()
    execute_result = Mock()
    execute_result.scalar_one_or_none.return_value = configuration
    mock_db.execute.return_value = execute_result
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    redirect_uris = ["https://example.com/callback"]
    repository = ApplicationEnvironmentRepository()
    repository.get_environment = AsyncMock(return_value={"uuid": configuration.uuid})

    result = await repository.update_environment_redirect_uris(
        db=mock_db,
        application_uuid=uuid.uuid4(),
        environment_uuid=configuration.uuid,
        redirect_uris=redirect_uris,
    )

    assert result == {"uuid": configuration.uuid}
    assert configuration.config == {
        "environmentName": "portal",
        "clientType": "public",
        "redirectUris": redirect_uris,
    }
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(configuration)


@pytest.mark.asyncio
async def test_update_environment_post_logout_redirect_uris_preserves_existing_config(
    mock_db,
):
    configuration = ApplicationConfiguration(
        application_id=1,
        application_configuration_status_id=2,
        application_configuration_client_type_id=3,
        authentication_protocol_id=4,
        tenant_id=5,
        partner_label="portal",
        application_url_en="https://en.example.com/",
        application_url_fr="https://fr.example.com/",
        config={"environmentName": "portal", "clientType": "public"},
    )
    mock_db.execute = AsyncMock()
    execute_result = Mock()
    execute_result.scalar_one_or_none.return_value = configuration
    mock_db.execute.return_value = execute_result
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    post_logout_redirect_uris = ["https://example.com/logout"]
    repository = ApplicationEnvironmentRepository()
    repository.get_environment = AsyncMock(return_value={"uuid": configuration.uuid})

    result = await repository.update_environment_post_logout_redirect_uris(
        db=mock_db,
        application_uuid=uuid.uuid4(),
        environment_uuid=configuration.uuid,
        post_logout_redirect_uris=post_logout_redirect_uris,
    )

    assert result == {"uuid": configuration.uuid}
    assert configuration.config == {
        "environmentName": "portal",
        "clientType": "public",
        "postLogoutRedirectUris": post_logout_redirect_uris,
    }
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(configuration)


@pytest.mark.asyncio
@pytest.mark.parametrize("single_sign_out", [True, False])
async def test_update_environment_single_sign_out_preserves_or_clears_dependent_config(
    mock_db,
    single_sign_out,
):
    configuration = ApplicationConfiguration(
        application_id=1,
        application_configuration_status_id=2,
        application_configuration_client_type_id=3,
        authentication_protocol_id=4,
        tenant_id=5,
        partner_label="portal",
        application_url_en="https://en.example.com/",
        application_url_fr="https://fr.example.com/",
        config={
            "environmentName": "portal",
            "clientType": "public",
            "logoutMethod": "back_channel",
            "signOutRequestUrl": "https://old.example.com/sign-out",
        },
    )
    mock_db.execute = AsyncMock()
    execute_result = Mock()
    execute_result.scalar_one_or_none.return_value = configuration
    mock_db.execute.return_value = execute_result
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    repository = ApplicationEnvironmentRepository()
    repository.get_environment = AsyncMock(return_value={"uuid": configuration.uuid})

    result = await repository.update_environment_single_sign_out(
        db=mock_db,
        application_uuid=uuid.uuid4(),
        environment_uuid=configuration.uuid,
        single_sign_out=single_sign_out,
        logout_method="front_channel" if single_sign_out else None,
        sign_out_request_url=(
            "https://new.example.com/sign-out" if single_sign_out else None
        ),
    )

    assert result == {"uuid": configuration.uuid}
    assert configuration.config["environmentName"] == "portal"
    assert configuration.config["clientType"] == "public"
    assert configuration.config["singleSignOut"] is single_sign_out
    if single_sign_out:
        assert configuration.config["logoutMethod"] == "front_channel"
        assert configuration.config["signOutRequestUrl"] == "https://new.example.com/sign-out"
    else:
        assert "logoutMethod" not in configuration.config
        assert "signOutRequestUrl" not in configuration.config
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(configuration)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("client_type", "pkce_supported"),
    [("public", True), ("confidential", False)],
)
async def test_update_environment_client_type_updates_lookup_and_config(
    mock_db,
    client_type,
    pkce_supported,
):
    configuration = ApplicationConfiguration(
        application_id=1,
        application_configuration_status_id=2,
        application_configuration_client_type_id=3,
        authentication_protocol_id=4,
        tenant_id=5,
        partner_label="portal",
        application_url_en="https://en.example.com/",
        application_url_fr="https://fr.example.com/",
        config={
            "environmentName": "portal",
            "clientAuthMethod": "client_secret_basic",
            "jwksUri": "https://example.com/jwks",
        },
    )
    mock_db.execute = AsyncMock()
    execute_result = Mock()
    execute_result.scalar_one_or_none.return_value = configuration
    mock_db.execute.return_value = execute_result
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    repository = ApplicationEnvironmentRepository()
    repository.get_environment = AsyncMock(return_value={"uuid": configuration.uuid})

    result = await repository.update_environment_client_type(
        db=mock_db,
        application_uuid=uuid.uuid4(),
        environment_uuid=configuration.uuid,
        client_type_id=7,
        client_type=client_type,
        pkce_supported=pkce_supported,
    )

    assert result == {"uuid": configuration.uuid}
    assert configuration.application_configuration_client_type_id == 7
    assert configuration.config["environmentName"] == "portal"
    assert configuration.config["clientType"] == client_type
    assert configuration.config["pkceSupported"] is pkce_supported
    if client_type == "public":
        assert "clientAuthMethod" not in configuration.config
        assert "jwksUri" not in configuration.config
    else:
        assert configuration.config["clientAuthMethod"] == "client_secret_basic"
        assert configuration.config["jwksUri"] == "https://example.com/jwks"
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(configuration)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("client_auth_method", "jwks_uri"),
    [
        ("private_key_jwt", "https://example.com/new-jwks"),
        ("client_secret_basic", None),
    ],
)
async def test_update_environment_authentication_method_preserves_or_clears_jwks(
    mock_db,
    client_auth_method,
    jwks_uri,
):
    configuration = ApplicationConfiguration(
        application_id=1,
        application_configuration_status_id=2,
        application_configuration_client_type_id=3,
        authentication_protocol_id=4,
        tenant_id=5,
        partner_label="portal",
        application_url_en="https://en.example.com/",
        application_url_fr="https://fr.example.com/",
        config={
            "environmentName": "portal",
            "redirectUris": ["https://example.com/callback"],
            "jwksUri": "https://example.com/old-jwks",
        },
    )
    mock_db.execute = AsyncMock()
    execute_result = Mock()
    execute_result.scalar_one_or_none.return_value = configuration
    mock_db.execute.return_value = execute_result
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    repository = ApplicationEnvironmentRepository()
    repository.get_environment = AsyncMock(return_value={"uuid": configuration.uuid})

    result = await repository.update_environment_authentication_method(
        db=mock_db,
        application_uuid=uuid.uuid4(),
        environment_uuid=configuration.uuid,
        client_auth_method=client_auth_method,
        jwks_uri=jwks_uri,
    )

    assert result == {"uuid": configuration.uuid}
    assert configuration.config["environmentName"] == "portal"
    assert configuration.config["redirectUris"] == ["https://example.com/callback"]
    assert configuration.config["clientAuthMethod"] == client_auth_method
    if client_auth_method == "private_key_jwt":
        assert configuration.config["jwksUri"] == jwks_uri
    else:
        assert "jwksUri" not in configuration.config
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(configuration)


@pytest.mark.asyncio
async def test_update_environment_verification_preserves_existing_config(mock_db):
    configuration = ApplicationConfiguration(
        application_id=1,
        application_configuration_status_id=2,
        application_configuration_client_type_id=3,
        authentication_protocol_id=4,
        tenant_id=5,
        partner_label="portal",
        application_url_en="https://en.example.com/",
        application_url_fr="https://fr.example.com/",
        config={
            "environmentName": "portal",
            "redirectUris": ["https://example.com/callback"],
            "verificationMessages": ["id_token"],
            "verificationSignatureAlgorithms": ["RS256"],
        },
    )
    mock_db.execute = AsyncMock()
    execute_result = Mock()
    execute_result.scalar_one_or_none.return_value = configuration
    mock_db.execute.return_value = execute_result
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    repository = ApplicationEnvironmentRepository()
    repository.get_environment = AsyncMock(return_value={"uuid": configuration.uuid})

    result = await repository.update_environment_verification(
        db=mock_db,
        application_uuid=uuid.uuid4(),
        environment_uuid=configuration.uuid,
        verification_messages=["userinfo"],
        verification_signature_algorithms=["PS256", "ES256"],
    )

    assert result == {"uuid": configuration.uuid}
    assert configuration.config["environmentName"] == "portal"
    assert configuration.config["redirectUris"] == ["https://example.com/callback"]
    assert configuration.config["verificationMessages"] == ["userinfo"]
    assert configuration.config["verificationSignatureAlgorithms"] == [
        "PS256",
        "ES256",
    ]
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(configuration)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("can_sign_messages", "signing_messages", "signing_signature_algorithms"),
    [
        (True, ["request_object"], ["RS256"]),
        (False, [], []),
    ],
)
async def test_update_environment_signing_preserves_existing_config(
    mock_db,
    can_sign_messages,
    signing_messages,
    signing_signature_algorithms,
):
    configuration = ApplicationConfiguration(
        application_id=1,
        application_configuration_status_id=2,
        application_configuration_client_type_id=3,
        authentication_protocol_id=4,
        tenant_id=5,
        partner_label="portal",
        application_url_en="https://en.example.com/",
        application_url_fr="https://fr.example.com/",
        config={
            "environmentName": "portal",
            "redirectUris": ["https://example.com/callback"],
            "canSignMessages": True,
            "signingMessages": ["token_endpoint"],
            "signingSignatureAlgorithms": ["RS256"],
        },
    )
    mock_db.execute = AsyncMock()
    execute_result = Mock()
    execute_result.scalar_one_or_none.return_value = configuration
    mock_db.execute.return_value = execute_result
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    repository = ApplicationEnvironmentRepository()
    repository.get_environment = AsyncMock(return_value={"uuid": configuration.uuid})

    result = await repository.update_environment_signing(
        db=mock_db,
        application_uuid=uuid.uuid4(),
        environment_uuid=configuration.uuid,
        can_sign_messages=can_sign_messages,
        signing_messages=signing_messages,
        signing_signature_algorithms=signing_signature_algorithms,
    )

    assert result == {"uuid": configuration.uuid}
    assert configuration.config["environmentName"] == "portal"
    assert configuration.config["redirectUris"] == ["https://example.com/callback"]
    assert configuration.config["canSignMessages"] is can_sign_messages
    assert configuration.config["signingMessages"] == signing_messages
    assert configuration.config["signingSignatureAlgorithms"] == signing_signature_algorithms
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(configuration)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("can_encrypt_requests", "encryption_key_algorithms", "encryption_content_algorithms"),
    [
        (True, ["RSA-OAEP"], ["A256GCM"]),
        (False, [], []),
    ],
)
async def test_update_environment_encryption_preserves_existing_config(
    mock_db,
    can_encrypt_requests,
    encryption_key_algorithms,
    encryption_content_algorithms,
):
    configuration = ApplicationConfiguration(
        application_id=1,
        application_configuration_status_id=2,
        application_configuration_client_type_id=3,
        authentication_protocol_id=4,
        tenant_id=5,
        partner_label="portal",
        application_url_en="https://en.example.com/",
        application_url_fr="https://fr.example.com/",
        config={
            "environmentName": "portal",
            "redirectUris": ["https://example.com/callback"],
            "canEncryptRequests": True,
            "encryptionKeyAlgorithms": ["RSA-OAEP-256"],
            "encryptionContentAlgorithms": ["A128GCM"],
        },
    )
    mock_db.execute = AsyncMock()
    execute_result = Mock()
    execute_result.scalar_one_or_none.return_value = configuration
    mock_db.execute.return_value = execute_result
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    repository = ApplicationEnvironmentRepository()
    repository.get_environment = AsyncMock(return_value={"uuid": configuration.uuid})

    result = await repository.update_environment_encryption(
        db=mock_db,
        application_uuid=uuid.uuid4(),
        environment_uuid=configuration.uuid,
        can_encrypt_requests=can_encrypt_requests,
        encryption_key_algorithms=encryption_key_algorithms,
        encryption_content_algorithms=encryption_content_algorithms,
    )

    assert result == {"uuid": configuration.uuid}
    assert configuration.config["environmentName"] == "portal"
    assert configuration.config["redirectUris"] == ["https://example.com/callback"]
    assert configuration.config["canEncryptRequests"] is can_encrypt_requests
    assert configuration.config["encryptionKeyAlgorithms"] == encryption_key_algorithms
    assert configuration.config["encryptionContentAlgorithms"] == encryption_content_algorithms
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(configuration)


@pytest.mark.asyncio
async def test_update_environment_decryption_preserves_existing_config(
    mock_db,
):
    configuration = ApplicationConfiguration(
        application_id=1,
        application_configuration_status_id=2,
        application_configuration_client_type_id=3,
        authentication_protocol_id=4,
        tenant_id=5,
        partner_label="portal",
        application_url_en="https://en.example.com/",
        application_url_fr="https://fr.example.com/",
        config={
            "environmentName": "portal",
            "redirectUris": ["https://example.com/callback"],
        },
    )
    execute_result = Mock()
    execute_result.scalar_one_or_none.return_value = configuration
    mock_db.execute.return_value = execute_result
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    repository = ApplicationEnvironmentRepository()
    repository.get_environment = AsyncMock(return_value={"uuid": configuration.uuid})

    result = await repository.update_environment_decryption(
        db=mock_db,
        application_uuid=uuid.uuid4(),
        environment_uuid=configuration.uuid,
        can_decrypt_messages=True,
        decryption_messages=["id_token", "userinfo"],
        decryption_key_algorithms=["RSA-OAEP"],
        decryption_content_algorithms=["A256GCM"],
    )

    assert result == {"uuid": configuration.uuid}
    assert configuration.config["environmentName"] == "portal"
    assert configuration.config["redirectUris"] == ["https://example.com/callback"]
    assert configuration.config["canDecryptMessages"] is True
    assert configuration.config["decryptionMessages"] == ["id_token", "userinfo"]
    assert configuration.config["decryptionKeyAlgorithms"] == ["RSA-OAEP"]
    assert configuration.config["decryptionContentAlgorithms"] == ["A256GCM"]
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(configuration)
