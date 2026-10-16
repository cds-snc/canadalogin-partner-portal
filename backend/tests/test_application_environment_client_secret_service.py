import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.core.exceptions.http_exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from src.app.schemas.application_environment_client_secret import (
    ApplicationEnvironmentClientSecretCreateRequest,
    ApplicationEnvironmentClientSecretRotateRequest,
)
from src.app.services.application_environment_client_secret_service import (
    ApplicationEnvironmentClientSecretService,
)


@pytest.mark.asyncio
async def test_get_client_credentials_uses_environment_client_and_audits_read(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    user_uuid = uuid.uuid4()
    repository_result = {
        "uuid": environment_uuid,
        "partner_label": "Production",
        "ibm_application_id": "ibm-app-1",
        "ibm_client_id": "environment-client-1",
    }
    provider = Mock()
    provider.get_client_secret = AsyncMock(
        return_value={
            "clientSecret": "secret-value",
            "clientSecretId": "secret-id",
        }
    )
    audit_service = Mock()
    audit_service.log_action = AsyncMock()
    service = ApplicationEnvironmentClientSecretService(audit_service=audit_service)

    with patch(
        "src.app.services.application_environment_client_secret_service.application_environment_repository"
    ) as repository:
        repository.get_client_secret_context = AsyncMock(return_value=repository_result)
        result = await service.get_client_credentials(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            current_user={"name": "Developer", "uuid": user_uuid},
            ibm_admin_client=provider,
        )

    assert result == {
        "clientId": "environment-client-1",
        "clientSecret": "secret-value",
        "clientSecretId": "secret-id",
    }
    repository.get_client_secret_context.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
        environment_uuid=environment_uuid,
    )
    provider.get_client_secret.assert_awaited_once_with("environment-client-1")
    audit_service.log_action.assert_awaited_once()
    audit_args = audit_service.log_action.await_args.kwargs
    assert audit_args["target"] == "application_environment"
    assert audit_args["target_uuid"] == environment_uuid
    assert audit_args["user_uuid"] == user_uuid
    assert audit_args["operation"] == "REVEAL_SECRET"
    assert "secret-value" not in audit_args["description"]


@pytest.mark.asyncio
async def test_production_partner_developer_cannot_reveal_active_secret(mock_db):
    provider = Mock()
    provider.get_client_secret = AsyncMock(return_value={"clientSecret": "secret"})
    service = ApplicationEnvironmentClientSecretService()

    with (
        patch(
            "src.app.services.application_environment_client_secret_service.application_environment_repository"
        ) as repository,
        patch(
            "src.app.services.partner_group_role_service.PartnerGroupRoleService.get_user_roles_for_application",
            new_callable=AsyncMock,
            return_value=[{"name": "Partner Developer"}],
        ),
    ):
        repository.get_client_secret_context = AsyncMock(
            return_value={
                "uuid": uuid.uuid4(),
                "tenant_code": "production",
                "ibm_client_id": "production-client",
            }
        )

        with pytest.raises(ForbiddenException):
            await service.get_client_credentials(
                db=mock_db,
                application_uuid=uuid.uuid4(),
                environment_uuid=uuid.uuid4(),
                current_user={"uuid": uuid.uuid4()},
                ibm_admin_client=provider,
            )

    provider.get_client_secret.assert_not_awaited()


@pytest.mark.parametrize(
    ("role_name", "expected_permissions"),
    [
        (
            "Partner Production Administrator",
            {
                "can_reveal_secret": True,
                "can_view_rotated_secrets": True,
                "can_rotate_secret": False,
                "can_expire_rotated_secrets": False,
            },
        ),
        (
            "Partner Developer",
            {
                "can_reveal_secret": False,
                "can_view_rotated_secrets": True,
                "can_rotate_secret": False,
                "can_expire_rotated_secrets": False,
            },
        ),
        (
            "Other role",
            {
                "can_reveal_secret": False,
                "can_view_rotated_secrets": False,
                "can_rotate_secret": False,
                "can_expire_rotated_secrets": False,
            },
        ),
    ],
)
@pytest.mark.asyncio
async def test_production_permissions_follow_application_role(
    mock_db, role_name, expected_permissions
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    current_user = {"uuid": uuid.uuid4()}
    service = ApplicationEnvironmentClientSecretService()

    with (
        patch(
            "src.app.services.application_environment_client_secret_service.application_environment_repository"
        ) as repository,
        patch(
            "src.app.services.partner_group_role_service.PartnerGroupRoleService.get_user_roles_for_application",
            new_callable=AsyncMock,
            return_value=[{"name": role_name}],
        ),
    ):
        repository.get_client_secret_context = AsyncMock(
            return_value={
                "uuid": environment_uuid,
                "tenant_code": "production",
                "ibm_client_id": "production-client",
            }
        )

        permissions = await service.get_client_secret_permissions(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            current_user=current_user,
        )

    assert permissions == expected_permissions


@pytest.mark.parametrize(
    ("role_name", "operation"),
    [
        ("Partner Production Administrator", "rotate"),
        ("Partner Developer", "rotate"),
        ("Partner Production Administrator", "create"),
        ("Partner Developer", "create"),
        ("Partner Production Administrator", "expire"),
        ("Partner Developer", "expire"),
    ],
)
@pytest.mark.asyncio
async def test_production_roles_cannot_mutate_secrets(
    mock_db, role_name, operation
):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    provider = Mock()
    provider.update_client_secret = AsyncMock()
    provider.get_client_secret = AsyncMock(return_value={"rotatedSecrets": []})
    provider.delete_rotated_client_secrets = AsyncMock(return_value=True)
    service = ApplicationEnvironmentClientSecretService()

    with (
        patch(
            "src.app.services.application_environment_client_secret_service.application_environment_repository"
        ) as repository,
        patch(
            "src.app.services.partner_group_role_service.PartnerGroupRoleService.get_user_roles_for_application",
            new_callable=AsyncMock,
            return_value=[{"name": role_name}],
        ),
    ):
        repository.get_client_secret_context = AsyncMock(
            return_value={
                "uuid": environment_uuid,
                "tenant_code": "production",
                "ibm_client_id": "production-client",
            }
        )

        with pytest.raises(ForbiddenException):
            if operation == "rotate":
                await service.rotate_secret(
                    db=mock_db,
                    application_uuid=application_uuid,
                    environment_uuid=environment_uuid,
                    current_user={"uuid": uuid.uuid4()},
                    payload=ApplicationEnvironmentClientSecretRotateRequest(),
                    ibm_admin_client=provider,
                )
            elif operation == "create":
                await service.create_rotated_secret(
                    db=mock_db,
                    application_uuid=application_uuid,
                    environment_uuid=environment_uuid,
                    current_user={"uuid": uuid.uuid4()},
                    payload=ApplicationEnvironmentClientSecretCreateRequest(
                        description="test"
                    ),
                    ibm_admin_client=provider,
                )
            else:
                await service.delete_rotated_secret(
                    db=mock_db,
                    application_uuid=application_uuid,
                    environment_uuid=environment_uuid,
                    current_user={"uuid": uuid.uuid4()},
                    value="secret-value",
                    ibm_admin_client=provider,
                )

    provider.update_client_secret.assert_not_awaited()
    provider.delete_rotated_client_secrets.assert_not_awaited()


def test_rotated_secret_create_request_defaults_to_seven_days():
    before = datetime.now(UTC)
    request = ApplicationEnvironmentClientSecretCreateRequest(description="deploy")
    after = datetime.now(UTC)
    expires_in = datetime.fromtimestamp(request.rotated_secret_expired_at, UTC) - before

    assert timedelta(days=7) - timedelta(seconds=1) <= expires_in
    assert expires_in <= timedelta(days=7) + (after - before)


def test_rotate_request_defaults_to_seven_days_but_preserves_explicit_zero():
    before = datetime.now(UTC)
    default_request = ApplicationEnvironmentClientSecretRotateRequest.model_validate({})
    after = datetime.now(UTC)
    expires_in = datetime.fromtimestamp(default_request.rotated_secret_expired_at, UTC) - before
    regenerate_request = ApplicationEnvironmentClientSecretRotateRequest.model_validate(
        {"rotatedSecretExpiredAt": 0}
    )

    assert timedelta(days=7) - timedelta(seconds=1) <= expires_in
    assert expires_in <= timedelta(days=7) + (after - before)
    assert regenerate_request.rotated_secret_expired_at == 0


@pytest.mark.asyncio
async def test_list_rotated_secrets_audits_environment_read(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = {
        "uuid": environment_uuid,
        "partner_label": "Production",
        "ibm_client_id": "environment-client-2",
    }
    provider = Mock()
    provider.get_client_secret = AsyncMock(
        return_value={
            "additionalConfig": {
                "rotatedSecrets": [
                    {
                        "description": "deployment",
                        "value": "{sha512}redacted",
                        "rotatedAt": 1779824867.0,
                        "expiredAt": 1782345600.0,
                    }
                ]
            }
        }
    )
    audit_service = Mock()
    audit_service.log_action = AsyncMock()
    service = ApplicationEnvironmentClientSecretService(audit_service=audit_service)

    with patch(
        "src.app.services.application_environment_client_secret_service.application_environment_repository"
    ) as repository:
        repository.get_client_secret_context = AsyncMock(return_value=environment)
        result = await service.list_rotated_secrets(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            current_user={"email": "developer@example.gc.ca"},
            ibm_admin_client=provider,
        )

    assert result == [
        {
            "description": "deployment",
            "expiredAt": 1782345600,
            "rotatedAt": 1779824867,
            "value": "{sha512}redacted",
            "secretId": "/rotatedSecrets/0",
        }
    ]
    audit_args = audit_service.log_action.await_args.kwargs
    assert audit_args["operation"] == "VIEW_ROTATED"
    assert audit_args["target_uuid"] == environment_uuid
    assert "{sha512}redacted" not in audit_args["description"]


@pytest.mark.asyncio
async def test_production_developer_can_view_rotated_secret_metadata_only(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    provider = Mock()
    provider.get_client_secret = AsyncMock(
        return_value={
            "rotatedSecrets": [
                {
                    "description": "deployment",
                    "value": "production-secret-value",
                    "rotatedAt": 1779824867,
                    "expiredAt": 1782345600,
                }
            ]
        }
    )
    audit_service = Mock()
    audit_service.log_action = AsyncMock()
    service = ApplicationEnvironmentClientSecretService(audit_service=audit_service)

    with (
        patch(
            "src.app.services.application_environment_client_secret_service.application_environment_repository"
        ) as repository,
        patch(
            "src.app.services.partner_group_role_service.PartnerGroupRoleService.get_user_roles_for_application",
            new_callable=AsyncMock,
            return_value=[{"name": "Partner Developer"}],
        ),
    ):
        repository.get_client_secret_context = AsyncMock(
            return_value={
                "uuid": environment_uuid,
                "tenant_code": "production",
                "ibm_client_id": "production-client",
            }
        )
        secrets = await service.list_rotated_secrets(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            current_user={"uuid": uuid.uuid4()},
            ibm_admin_client=provider,
        )

    assert secrets == [
        {
            "description": "deployment",
            "expiredAt": 1782345600,
            "rotatedAt": 1779824867,
            "value": None,
            "secretId": "/rotatedSecrets/0",
        }
    ]


@pytest.mark.asyncio
async def test_rotate_secret_preserves_regenerate_semantics_and_audits(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = {
        "uuid": environment_uuid,
        "partner_label": "Production",
        "ibm_client_id": "environment-client-3",
    }
    provider = Mock()
    provider.update_client_secret = AsyncMock()
    provider.get_client_secret = AsyncMock(
        return_value={"clientSecret": "replacement-secret"}
    )
    audit_service = Mock()
    audit_service.log_action = AsyncMock()
    service = ApplicationEnvironmentClientSecretService(audit_service=audit_service)

    with patch(
        "src.app.services.application_environment_client_secret_service.application_environment_repository"
    ) as repository:
        repository.get_client_secret_context = AsyncMock(return_value=environment)
        await service.rotate_secret(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            current_user={"name": "Developer"},
            payload=ApplicationEnvironmentClientSecretRotateRequest.model_validate(
                {"rotatedSecretExpiredAt": 0}
            ),
            ibm_admin_client=provider,
        )

    provider.update_client_secret.assert_awaited_once_with(
        "environment-client-3",
        {
            "deleteRotatedSecrets": False,
            "description": "",
            "rotatedSecretExpiredAt": 0,
        },
    )
    audit_args = audit_service.log_action.await_args.kwargs
    assert audit_args["operation"] == "REGENERATE"
    assert "replacement-secret" not in audit_args["description"]


@pytest.mark.asyncio
async def test_create_rotated_secret_sends_default_expiry_and_audits(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = {
        "uuid": environment_uuid,
        "partner_label": "Production",
        "ibm_client_id": "environment-client-4",
    }
    provider = Mock()
    provider.update_client_secret = AsyncMock()
    provider.get_client_secret = AsyncMock(return_value={"rotatedSecrets": []})
    audit_service = Mock()
    audit_service.log_action = AsyncMock()
    service = ApplicationEnvironmentClientSecretService(audit_service=audit_service)
    payload = ApplicationEnvironmentClientSecretCreateRequest(description="deployment")

    with patch(
        "src.app.services.application_environment_client_secret_service.application_environment_repository"
    ) as repository:
        repository.get_client_secret_context = AsyncMock(return_value=environment)
        result = await service.create_rotated_secret(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            current_user={"name": "Developer"},
            payload=payload,
            ibm_admin_client=provider,
        )

    assert result == []
    provider.update_client_secret.assert_awaited_once_with(
        "environment-client-4",
        {
            "deleteRotatedSecrets": False,
            "description": "deployment",
            "rotatedSecretExpiredAt": payload.rotated_secret_expired_at,
        },
    )
    audit_args = audit_service.log_action.await_args.kwargs
    assert audit_args["operation"] == "ROTATE_SECRET"
    assert audit_args["target_uuid"] == environment_uuid


@pytest.mark.asyncio
async def test_delete_rotated_secret_audits_delete_without_secret_value(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    secret_value = "{sha512}redacted"
    environment = {
        "uuid": environment_uuid,
        "partner_label": "Production",
        "ibm_client_id": "environment-client-5",
    }
    provider = Mock()
    provider.get_client_secret = AsyncMock(
        return_value={"rotatedSecrets": [{"value": secret_value}]}
    )
    provider.delete_rotated_client_secrets = AsyncMock(return_value=True)
    audit_service = Mock()
    audit_service.log_action = AsyncMock()
    service = ApplicationEnvironmentClientSecretService(audit_service=audit_service)

    with patch(
        "src.app.services.application_environment_client_secret_service.application_environment_repository"
    ) as repository:
        repository.get_client_secret_context = AsyncMock(return_value=environment)
        result = await service.delete_rotated_secret(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            current_user={"name": "Developer"},
            value=secret_value,
            ibm_admin_client=provider,
        )

    assert result is True
    provider.delete_rotated_client_secrets.assert_awaited_once_with(
        "environment-client-5",
        [secret_value],
    )
    audit_args = audit_service.log_action.await_args.kwargs
    assert audit_args["operation"] == "DELETE_ROTATED"
    assert audit_args["target_uuid"] == environment_uuid
    assert secret_value not in audit_args["description"]


@pytest.mark.asyncio
async def test_rotate_secret_uses_default_expiry_and_audits_rotation(mock_db):
    application_uuid = uuid.uuid4()
    environment_uuid = uuid.uuid4()
    environment = {
        "uuid": environment_uuid,
        "partner_label": "Production",
        "ibm_client_id": "environment-client-6",
    }
    provider = Mock()
    provider.update_client_secret = AsyncMock()
    provider.get_client_secret = AsyncMock(return_value={"clientSecret": "new-secret"})
    audit_service = Mock()
    audit_service.log_action = AsyncMock()
    service = ApplicationEnvironmentClientSecretService(audit_service=audit_service)
    payload = ApplicationEnvironmentClientSecretRotateRequest.model_validate({})

    with patch(
        "src.app.services.application_environment_client_secret_service.application_environment_repository"
    ) as repository:
        repository.get_client_secret_context = AsyncMock(return_value=environment)
        await service.rotate_secret(
            db=mock_db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
            current_user={"name": "Developer"},
            payload=payload,
            ibm_admin_client=provider,
        )

    provider.update_client_secret.assert_awaited_once_with(
        "environment-client-6",
        payload.model_dump(by_alias=True),
    )
    audit_args = audit_service.log_action.await_args.kwargs
    assert audit_args["operation"] == "ROTATE_SECRET"
    assert audit_args["target_uuid"] == environment_uuid


@pytest.mark.asyncio
async def test_secret_operations_reject_unknown_environment_without_provider_call(mock_db):
    provider = Mock()
    provider.get_client_secret = AsyncMock()
    service = ApplicationEnvironmentClientSecretService()

    with patch(
        "src.app.services.application_environment_client_secret_service.application_environment_repository"
    ) as repository:
        repository.get_client_secret_context = AsyncMock(return_value=None)
        with pytest.raises(NotFoundException, match="Application environment not found"):
            await service.get_client_credentials(
                db=mock_db,
                application_uuid=uuid.uuid4(),
                environment_uuid=uuid.uuid4(),
                current_user={},
                ibm_admin_client=provider,
            )

    provider.get_client_secret.assert_not_awaited()


@pytest.mark.asyncio
async def test_secret_operations_reject_environment_without_ibm_client_id(mock_db):
    provider = Mock()
    provider.get_client_secret = AsyncMock()
    service = ApplicationEnvironmentClientSecretService()

    with patch(
        "src.app.services.application_environment_client_secret_service.application_environment_repository"
    ) as repository:
        repository.get_client_secret_context = AsyncMock(
            return_value={"uuid": uuid.uuid4(), "ibm_client_id": None}
        )
        with pytest.raises(BadRequestException, match="no IBM Verify client configured"):
            await service.get_client_credentials(
                db=mock_db,
                application_uuid=uuid.uuid4(),
                environment_uuid=uuid.uuid4(),
                current_user={},
                ibm_admin_client=provider,
            )

    provider.get_client_secret.assert_not_awaited()
