from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from src.app.api.dependencies import get_current_user, get_rp_application_service
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.db.database import async_get_db
from src.app.main import app
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)
from src.app.services.rp_application_service import (
    SECRET_ACCESS_GRANT_ROLES,
    SECRET_CHANGE_AUDIT_OPERATIONS,
    RPApplicationService,
)

WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000023")
RP_CONFIGURATION_UUID = UUID("018f6f83-0000-0000-0000-000000000333")


def _partner_editor() -> dict[str, object]:
    return {
        "id": 77,
        "uuid": UUID("018f6f83-0000-0000-0000-000000000111"),
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=23,
                    workspace_uuid=WORKSPACE_UUID,
                    role=CanonicalRoleCode.RP_USER_EDIT,
                ),
            )
        ),
    }


@pytest.mark.asyncio
async def test_secret_change_csv_is_bounded_to_selected_config_and_contains_no_secret_data() -> None:
    service = RPApplicationService()
    db = Mock()
    service._resolve_accessible_rp_application_access = AsyncMock(  # type: ignore[method-assign]
        return_value=({"uuid": RP_CONFIGURATION_UUID}, object())
    )
    actor_uuid = UUID("018f6f83-0000-0000-0000-000000000112")

    with patch("src.app.services.rp_application_service.crud_audit_log") as audit_repo:
        audit_repo.get_multi = AsyncMock(
            return_value={
                "data": [
                    {
                        "created_at": datetime(2026, 8, 25, 15, 30, tzinfo=UTC),
                        "user_uuid": actor_uuid,
                        "user": "person@example.gc.ca",
                        "operation": "ROTATE_SECRET",
                        "description": "must-not-appear secret-value-123",
                    },
                    {
                        "created_at": datetime(2026, 8, 25, 16, 30, tzinfo=UTC),
                        "user_uuid": None,
                        "user": "legacy.person@example.gc.ca",
                        "operation": "REGENERATE",
                        "description": "must-not-appear regenerated-secret-456",
                    },
                ]
            }
        )

        csv_content = await service.export_accessible_rp_application_secret_change_log(
            db=db,
            rp_application_uuid=RP_CONFIGURATION_UUID,
            current_user=_partner_editor(),
            expected_workspace_uuid=WORKSPACE_UUID,
        )

    rows = csv_content.splitlines()
    assert rows[:2] == [
        "TimeGenerated,Actor,Action,RPConfigurationId",
        f"2026-08-25T15:30:00Z,{actor_uuid},ROTATE_SECRET,{RP_CONFIGURATION_UUID}",
    ]
    assert rows[2].startswith("2026-08-25T16:30:00Z,legacy:")
    assert rows[2].endswith(f",REGENERATE,{RP_CONFIGURATION_UUID}")
    assert "secret-value-123" not in csv_content
    assert "regenerated-secret-456" not in csv_content
    assert "person@example.gc.ca" not in csv_content
    assert "legacy.person@example.gc.ca" not in csv_content
    service._resolve_accessible_rp_application_access.assert_awaited_once_with(
        db=db,
        rp_application_uuid=RP_CONFIGURATION_UUID,
        current_user=_partner_editor(),
        allowed_grant_roles=SECRET_ACCESS_GRANT_ROLES,
        expected_workspace_uuid=WORKSPACE_UUID,
        expected_application_information_uuid=None,
    )
    assert audit_repo.get_multi.await_args.kwargs["target_uuid"] == RP_CONFIGURATION_UUID
    assert audit_repo.get_multi.await_args.kwargs["operation__in"] == SECRET_CHANGE_AUDIT_OPERATIONS


def test_secret_change_csv_api_returns_private_download() -> None:
    service = Mock()
    service.export_accessible_rp_application_secret_change_log = AsyncMock(return_value="TimeGenerated,Actor,Action,RPConfigurationId\n")
    current_user = _partner_editor()
    db = Mock()
    app.dependency_overrides[get_current_user] = lambda: current_user
    app.dependency_overrides[get_rp_application_service] = lambda: service
    app.dependency_overrides[async_get_db] = lambda: db

    try:
        with TestClient(app) as client:
            response = client.get(
                f"/api/v1/rp-applications/accessible/{RP_CONFIGURATION_UUID}/client/secret-change-log",
                params={"workspaceUuid": str(WORKSPACE_UUID)},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert response.headers["content-disposition"] == (f'attachment; filename="secret-change-log-{RP_CONFIGURATION_UUID}.csv"')
    assert response.headers["cache-control"] == "private, no-store"
    service.export_accessible_rp_application_secret_change_log.assert_awaited_once_with(
        db=db,
        rp_application_uuid=RP_CONFIGURATION_UUID,
        current_user=current_user,
        expected_workspace_uuid=WORKSPACE_UUID,
        expected_application_information_uuid=None,
    )
