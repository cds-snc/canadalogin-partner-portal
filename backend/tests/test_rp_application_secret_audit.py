import json
from datetime import datetime
from unittest.mock import AsyncMock, Mock
from uuid import UUID

import pytest
import src.app.services.rp_application_service as rp_application_module
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from src.app.api.dependencies import get_current_user, get_rp_application_service
from src.app.core.db.database import async_get_db
from src.app.main import app
from src.app.schemas.rp_application import (
    RPApplicationClientRotatedSecretCreateRequest,
    RPApplicationClientSecretRotateRequest,
)
from src.app.services.rp_application_service import (
    SECRET_AUDIT_EVENT_NAME,
    RPApplicationService,
)

RP_CONFIGURATION_UUID = UUID("018f6f83-0000-0000-0000-000000000333")
ACTOR_UUID = UUID("018f6f83-0000-0000-0000-000000000111")
CURRENT_USER = {
    "uuid": ACTOR_UUID,
    "email": "must-not-appear@example.gc.ca",
    "name": "Must Not Appear",
}
CLIENT_ID = "credential-client-id-must-not-appear"
CLIENT_SECRET = "credential-secret-must-not-appear"
PROVIDER_PAYLOAD_MARKER = "provider-payload-must-not-appear"


def _db() -> Mock:
    return Mock(spec=AsyncSession)


def _provider_context(service: RPApplicationService, provider: Mock) -> None:
    service._get_accessible_secret_context = AsyncMock(  # type: ignore[method-assign]
        return_value=(
            {"uuid": RP_CONFIGURATION_UUID},
            {"providerMarker": PROVIDER_PAYLOAD_MARKER},
            CLIENT_ID,
            provider,
        )
    )


def _audit_payload(log_action: AsyncMock) -> tuple[dict, dict]:
    kwargs = log_action.await_args.kwargs
    return kwargs, json.loads(kwargs["description"])


def _assert_minimized_event(
    log_action: AsyncMock,
    *,
    operation: str,
    action: str,
    outcome: str,
    correlation_id: str,
) -> None:
    kwargs, event = _audit_payload(log_action)
    assert kwargs["user"] == "authorization_actor"
    assert kwargs["user_uuid"] == ACTOR_UUID
    assert kwargs["target"] == "rp_application"
    assert kwargs["target_uuid"] == RP_CONFIGURATION_UUID
    assert kwargs["operation"] == operation
    assert event == {
        "eventVersion": 1,
        "eventName": SECRET_AUDIT_EVENT_NAME,
        "timestamp": event["timestamp"],
        "actor": {"type": "user", "userUuid": str(ACTOR_UUID)},
        "correlationId": correlation_id,
        "rpConfigurationUuid": str(RP_CONFIGURATION_UUID),
        "action": action,
        "outcome": outcome,
    }
    assert datetime.fromisoformat(event["timestamp"].replace("Z", "+00:00")).tzinfo is not None
    serialized = json.dumps(event)
    assert CURRENT_USER["email"] not in serialized
    assert CURRENT_USER["name"] not in serialized
    assert CLIENT_ID not in serialized
    assert CLIENT_SECRET not in serialized
    assert PROVIDER_PAYLOAD_MARKER not in serialized


@pytest.mark.asyncio
async def test_reveal_audits_success_only_after_provider_retrieval(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = RPApplicationService()
    db = _db()
    provider = Mock()
    call_order: list[str] = []

    async def get_client_secret(_client_id: str) -> dict[str, str]:
        call_order.append("provider_retrieval")
        return {
            "clientSecret": CLIENT_SECRET,
            "clientSecretId": "secret-id-must-not-appear",
            "providerMarker": PROVIDER_PAYLOAD_MARKER,
        }

    async def log_action(*_args, **_kwargs) -> None:
        call_order.append("audit")

    provider.get_client_secret = AsyncMock(side_effect=get_client_secret)
    _provider_context(service, provider)
    audit = AsyncMock(side_effect=log_action)
    monkeypatch.setattr(rp_application_module.AuditService, "log_action", audit)

    result = await service.get_accessible_rp_application_client_credentials(
        db=db,
        rp_application_uuid=RP_CONFIGURATION_UUID,
        current_user=CURRENT_USER,
        ibm_admin_client=provider,
        correlation_id="request-reveal-1",
    )

    assert call_order == ["provider_retrieval", "audit"]
    assert result["clientSecret"] == CLIENT_SECRET
    _assert_minimized_event(
        audit,
        operation="REVEAL_SECRET",
        action="reveal",
        outcome="succeeded",
        correlation_id="request-reveal-1",
    )


@pytest.mark.asyncio
async def test_reveal_failure_audit_preserves_the_provider_exception(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class ProviderFailure(RuntimeError):
        pass

    service = RPApplicationService()
    db = _db()
    provider = Mock()
    provider_error = ProviderFailure(f"provider failed with {CLIENT_SECRET}")
    provider.get_client_secret = AsyncMock(side_effect=provider_error)
    _provider_context(service, provider)
    audit = AsyncMock()
    monkeypatch.setattr(rp_application_module.AuditService, "log_action", audit)

    with pytest.raises(ProviderFailure) as caught:
        await service.get_accessible_rp_application_client_credentials(
            db=db,
            rp_application_uuid=RP_CONFIGURATION_UUID,
            current_user=CURRENT_USER,
            ibm_admin_client=provider,
            correlation_id="request-reveal-failure-1",
        )

    assert caught.value is provider_error
    db.rollback.assert_awaited_once()
    _assert_minimized_event(
        audit,
        operation="REVEAL_SECRET",
        action="reveal",
        outcome="failed",
        correlation_id="request-reveal-failure-1",
    )


@pytest.mark.asyncio
async def test_failure_audit_outage_does_not_replace_the_provider_exception(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = RPApplicationService()
    db = _db()
    provider = Mock()
    provider_error = RuntimeError("provider unavailable")
    provider.get_client_secret = AsyncMock(side_effect=provider_error)
    _provider_context(service, provider)
    monkeypatch.setattr(
        rp_application_module.AuditService,
        "log_action",
        AsyncMock(side_effect=RuntimeError("audit unavailable")),
    )

    with pytest.raises(RuntimeError) as caught:
        await service.get_accessible_rp_application_client_credentials(
            db=db,
            rp_application_uuid=RP_CONFIGURATION_UUID,
            current_user=CURRENT_USER,
            ibm_admin_client=provider,
            correlation_id="request-provider-failure-1",
        )

    assert caught.value is provider_error
    assert db.rollback.await_count == 2


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("payload", "expected_operation", "expected_action"),
    [
        (
            RPApplicationClientSecretRotateRequest(
                deleteRotatedSecrets=False,
                description="",
                rotatedSecretExpiredAt=0,
            ),
            "REGENERATE",
            "regenerate",
        ),
        (
            RPApplicationClientSecretRotateRequest(
                deleteRotatedSecrets=False,
                description="planned rotation",
                rotatedSecretExpiredAt=1782345600,
            ),
            "ROTATE_SECRET",
            "rotate",
        ),
    ],
)
async def test_current_secret_mutations_emit_structured_success_events(
    monkeypatch: pytest.MonkeyPatch,
    payload: RPApplicationClientSecretRotateRequest,
    expected_operation: str,
    expected_action: str,
) -> None:
    service = RPApplicationService()
    db = _db()
    provider = Mock()
    provider.update_client_secret = AsyncMock(return_value=True)
    provider.get_client_secret = AsyncMock(return_value={"clientSecret": CLIENT_SECRET, "providerMarker": PROVIDER_PAYLOAD_MARKER})
    _provider_context(service, provider)
    audit = AsyncMock()
    monkeypatch.setattr(rp_application_module.AuditService, "log_action", audit)

    await service.rotate_accessible_rp_application_client_secret(
        db=db,
        rp_application_uuid=RP_CONFIGURATION_UUID,
        current_user=CURRENT_USER,
        payload=payload,
        ibm_admin_client=provider,
        correlation_id="request-mutation-1",
    )

    provider.update_client_secret.assert_awaited_once()
    _assert_minimized_event(
        audit,
        operation=expected_operation,
        action=expected_action,
        outcome="succeeded",
        correlation_id="request-mutation-1",
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("payload", "expected_operation", "expected_action"),
    [
        (
            RPApplicationClientSecretRotateRequest(
                deleteRotatedSecrets=False,
                description="",
                rotatedSecretExpiredAt=0,
            ),
            "REGENERATE",
            "regenerate",
        ),
        (
            RPApplicationClientSecretRotateRequest(
                deleteRotatedSecrets=False,
                description="planned rotation",
                rotatedSecretExpiredAt=1782345600,
            ),
            "ROTATE_SECRET",
            "rotate",
        ),
    ],
)
async def test_current_secret_mutation_failures_are_audited_without_replacing_error(
    monkeypatch: pytest.MonkeyPatch,
    payload: RPApplicationClientSecretRotateRequest,
    expected_operation: str,
    expected_action: str,
) -> None:
    service = RPApplicationService()
    db = _db()
    provider = Mock()
    provider_error = RuntimeError(f"mutation failed with {CLIENT_SECRET}")
    provider.update_client_secret = AsyncMock(side_effect=provider_error)
    provider.get_client_secret = AsyncMock()
    _provider_context(service, provider)
    audit = AsyncMock()
    monkeypatch.setattr(rp_application_module.AuditService, "log_action", audit)

    with pytest.raises(RuntimeError) as caught:
        await service.rotate_accessible_rp_application_client_secret(
            db=db,
            rp_application_uuid=RP_CONFIGURATION_UUID,
            current_user=CURRENT_USER,
            payload=payload,
            ibm_admin_client=provider,
            correlation_id="request-mutation-failure-1",
        )

    assert caught.value is provider_error
    provider.get_client_secret.assert_not_awaited()
    _assert_minimized_event(
        audit,
        operation=expected_operation,
        action=expected_action,
        outcome="failed",
        correlation_id="request-mutation-failure-1",
    )


@pytest.mark.asyncio
async def test_rotated_secret_create_and_delete_emit_distinct_safe_events(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = RPApplicationService()
    db = _db()
    provider = Mock()
    provider.update_client_secret = AsyncMock(return_value=True)
    provider.get_client_secret = AsyncMock(
        return_value={
            "additionalConfig": {
                "rotatedSecrets": [
                    {
                        "path": "/rotatedSecrets/0",
                        "value": CLIENT_SECRET,
                        "providerMarker": PROVIDER_PAYLOAD_MARKER,
                    }
                ]
            }
        }
    )
    provider.delete_rotated_client_secrets = AsyncMock(return_value=True)
    _provider_context(service, provider)
    audit = AsyncMock()
    monkeypatch.setattr(rp_application_module.AuditService, "log_action", audit)

    await service.create_accessible_rp_application_rotated_secret(
        db=db,
        rp_application_uuid=RP_CONFIGURATION_UUID,
        current_user=CURRENT_USER,
        payload=RPApplicationClientRotatedSecretCreateRequest(
            description="planned rotation",
            rotatedSecretExpiredAt=1782345600,
        ),
        ibm_admin_client=provider,
        correlation_id="request-create-1",
    )
    _assert_minimized_event(
        audit,
        operation="ROTATE_SECRET",
        action="create_rotated",
        outcome="succeeded",
        correlation_id="request-create-1",
    )

    audit.reset_mock()
    await service.delete_accessible_rp_application_rotated_secret(
        db=db,
        rp_application_uuid=RP_CONFIGURATION_UUID,
        current_user=CURRENT_USER,
        secret_id="/rotatedSecrets/0",
        ibm_admin_client=provider,
        correlation_id="request-delete-1",
    )
    _assert_minimized_event(
        audit,
        operation="DELETE_ROTATED",
        action="delete_rotated",
        outcome="succeeded",
        correlation_id="request-delete-1",
    )


@pytest.mark.asyncio
async def test_rotated_secret_create_failure_is_audited_without_replacing_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = RPApplicationService()
    db = _db()
    provider = Mock()
    provider_error = RuntimeError(f"create failed with {PROVIDER_PAYLOAD_MARKER}")
    provider.update_client_secret = AsyncMock(side_effect=provider_error)
    provider.get_client_secret = AsyncMock()
    _provider_context(service, provider)
    audit = AsyncMock()
    monkeypatch.setattr(rp_application_module.AuditService, "log_action", audit)

    with pytest.raises(RuntimeError) as caught:
        await service.create_accessible_rp_application_rotated_secret(
            db=db,
            rp_application_uuid=RP_CONFIGURATION_UUID,
            current_user=CURRENT_USER,
            payload=RPApplicationClientRotatedSecretCreateRequest(
                description="planned rotation",
                rotatedSecretExpiredAt=1782345600,
            ),
            ibm_admin_client=provider,
            correlation_id="request-create-failure-1",
        )

    assert caught.value is provider_error
    provider.get_client_secret.assert_not_awaited()
    _assert_minimized_event(
        audit,
        operation="ROTATE_SECRET",
        action="create_rotated",
        outcome="failed",
        correlation_id="request-create-failure-1",
    )


@pytest.mark.asyncio
async def test_rotated_secret_delete_failure_is_safe_and_preserves_exception(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    service = RPApplicationService()
    db = _db()
    provider = Mock()
    provider.get_client_secret = AsyncMock(
        return_value={
            "rotatedSecrets": [
                {
                    "path": "/rotatedSecrets/0",
                    "value": CLIENT_SECRET,
                }
            ]
        }
    )
    provider_error = RuntimeError(f"delete failed with {PROVIDER_PAYLOAD_MARKER}")
    provider.delete_rotated_client_secrets = AsyncMock(side_effect=provider_error)
    _provider_context(service, provider)
    audit = AsyncMock()
    monkeypatch.setattr(rp_application_module.AuditService, "log_action", audit)

    with pytest.raises(RuntimeError) as caught:
        await service.delete_accessible_rp_application_rotated_secret(
            db=db,
            rp_application_uuid=RP_CONFIGURATION_UUID,
            current_user=CURRENT_USER,
            secret_id="/rotatedSecrets/0",
            ibm_admin_client=provider,
            correlation_id="request-delete-failure-1",
        )

    assert caught.value is provider_error
    _assert_minimized_event(
        audit,
        operation="DELETE_ROTATED",
        action="delete_rotated",
        outcome="failed",
        correlation_id="request-delete-failure-1",
    )


def test_secret_routes_propagate_the_request_correlation_id() -> None:
    service = Mock()
    service.get_accessible_rp_application_client_credentials = AsyncMock(return_value={"clientId": "client-id", "clientSecret": "secret"})
    service.list_accessible_rp_application_rotated_secrets = AsyncMock(return_value=[])
    service.rotate_accessible_rp_application_client_secret = AsyncMock(return_value={"clientId": "client-id", "clientSecret": "secret"})
    service.create_accessible_rp_application_rotated_secret = AsyncMock(return_value=[])
    service.delete_accessible_rp_application_rotated_secret = AsyncMock(return_value=True)
    db = Mock()
    app.dependency_overrides[get_current_user] = lambda: CURRENT_USER
    app.dependency_overrides[get_rp_application_service] = lambda: service
    app.dependency_overrides[async_get_db] = lambda: db
    headers = {"X-Request-ID": "request-api-secret-1"}
    base_path = f"/api/v1/rp-applications/accessible/{RP_CONFIGURATION_UUID}/client"

    try:
        with TestClient(app) as client:
            responses = [
                client.get(base_path, headers=headers),
                client.get(f"{base_path}/rotated-secrets", headers=headers),
                client.post(
                    f"{base_path}/rotate-secret",
                    headers=headers,
                    json={
                        "deleteRotatedSecrets": False,
                        "description": "",
                        "rotatedSecretExpiredAt": 0,
                    },
                ),
                client.post(
                    f"{base_path}/rotated-secrets",
                    headers=headers,
                    json={
                        "description": "planned rotation",
                        "rotatedSecretExpiredAt": 1782345600,
                    },
                ),
                client.request(
                    "DELETE",
                    f"{base_path}/rotated-secrets",
                    headers=headers,
                    json={"secretId": "/rotatedSecrets/0"},
                ),
            ]
    finally:
        app.dependency_overrides.clear()

    assert [response.status_code for response in responses] == [200, 200, 200, 200, 200]
    for operation in (
        service.get_accessible_rp_application_client_credentials,
        service.list_accessible_rp_application_rotated_secrets,
        service.rotate_accessible_rp_application_client_secret,
        service.create_accessible_rp_application_rotated_secret,
        service.delete_accessible_rp_application_rotated_secret,
    ):
        assert operation.await_args.kwargs["correlation_id"] == "request-api-secret-1"
