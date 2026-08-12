from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID

import pytest

from src.app.api.dependencies import get_rp_application_service
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.exceptions.http_exceptions import ForbiddenException
from src.app.main import app
from src.app.repositories.dependencies import get_ibm_sv_admin_client
from src.app.services.authorization_service import (
    AuthorizationResolutionError,
    AuthorizationService,
    ResolvedAuthorizationState,
)

WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000023")


def query_result(rows: list[tuple]) -> Mock:
    result = Mock()
    result.all.return_value = rows
    return result


def authorization_db(
    *,
    global_rows: list[tuple] | None = None,
    partner_rows: list[tuple] | None = None,
) -> Mock:
    db = Mock()
    db.execute = AsyncMock(
        side_effect=[
            query_result(global_rows or []),
            query_result(partner_rows or []),
        ]
    )
    return db


def active_partner_row(
    *,
    grant_id: int = 1,
    workspace_id: int = 23,
    workspace_uuid: UUID = WORKSPACE_UUID,
    role: str = "rp_user_edit",
) -> tuple:
    return (
        grant_id,
        "active",
        role,
        False,
        None,
        None,
        None,
        workspace_id,
        workspace_uuid,
        False,
    )


def active_global_row(*, assignment_id: int = 1, role: str = "cl_admin") -> tuple:
    return (assignment_id, "active", None, None, role, False)


class TestAuthorizationResolution:
    @pytest.mark.asyncio
    async def test_resolves_only_normalized_global_and_partner_state(self) -> None:
        global_state = await AuthorizationService().resolve_for_user(
            authorization_db(global_rows=[active_global_row()]),
            user_id=10,
        )
        partner_state = await AuthorizationService().resolve_for_user(
            authorization_db(partner_rows=[active_partner_row()]),
            user_id=11,
        )

        assert global_state.global_role is CanonicalRoleCode.CL_ADMIN
        assert global_state.partner_access == ()
        assert partner_state.global_role is None
        assert partner_state.partner_access[0].workspace_uuid == WORKSPACE_UUID
        assert partner_state.partner_access[0].role is CanonicalRoleCode.RP_USER_EDIT

    @pytest.mark.asyncio
    async def test_unknown_and_legacy_active_roles_fail_closed(self) -> None:
        with pytest.raises(AuthorizationResolutionError, match="global role"):
            await AuthorizationService().resolve_for_user(
                authorization_db(global_rows=[active_global_row(role="admin")]),
                user_id=10,
            )

        with pytest.raises(AuthorizationResolutionError, match="partner role"):
            await AuthorizationService().resolve_for_user(
                authorization_db(partner_rows=[active_partner_row(role="workspace_member")]),
                user_id=11,
            )

    @pytest.mark.asyncio
    async def test_mixed_and_duplicate_active_state_fails_closed(self) -> None:
        with pytest.raises(AuthorizationResolutionError, match="cannot be combined"):
            await AuthorizationService().resolve_for_user(
                authorization_db(
                    global_rows=[active_global_row()],
                    partner_rows=[active_partner_row()],
                ),
                user_id=10,
            )

        with pytest.raises(AuthorizationResolutionError, match="multiple active partner"):
            await AuthorizationService().resolve_for_user(
                authorization_db(
                    partner_rows=[
                        active_partner_row(grant_id=1),
                        active_partner_row(grant_id=2, role="read_only"),
                    ]
                ),
                user_id=11,
            )

    @pytest.mark.asyncio
    async def test_contradictory_active_grant_fails_closed(self) -> None:
        contradictory_row = list(active_partner_row())
        contradictory_row[5] = "2026-08-11T00:00:00Z"

        with pytest.raises(AuthorizationResolutionError, match="contradictory"):
            await AuthorizationService().resolve_for_user(
                authorization_db(partner_rows=[tuple(contradictory_row)]),
                user_id=11,
            )


class TestClAdminRevocation:
    @pytest.mark.asyncio
    async def test_last_active_cl_admin_cannot_be_revoked(self) -> None:
        assignment = SimpleNamespace(user_id=10)
        result = Mock()
        result.scalars.return_value.all.return_value = [assignment]
        db = Mock()
        db.execute = AsyncMock(return_value=result)
        db.flush = AsyncMock()
        db.add = Mock()
        actor = SimpleNamespace(
            id=10,
            uuid=UUID("018f6f83-0000-0000-0000-000000000010"),
        )
        service = AuthorizationService()

        with (
            patch(
                "src.app.services.authorization_service.lock_cl_admin_roster",
                new=AsyncMock(),
            ),
            patch(
                "src.app.services.authorization_service.lock_authorization_target_user",
                new=AsyncMock(),
            ),
            patch.object(service, "_require_active_user", new=AsyncMock(return_value=actor)),
            patch.object(service, "_require_cl_admin_actor", new=AsyncMock()),
            patch.object(
                service,
                "resolve_for_user",
                new=AsyncMock(return_value=ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN)),
            ),
            pytest.raises(ForbiddenException, match="last active CL Admin"),
        ):
            await service.revoke_cl_admin(
                db,
                target_user_id=10,
                revoked_by_user_id=10,
            )

        db.flush.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_revocation_updates_normalized_assignment_when_another_admin_exists(
        self,
    ) -> None:
        target = SimpleNamespace(
            user_id=10,
            uuid=UUID("018f6f83-0000-0000-0000-000000000020"),
            status="active",
            revoked_at=None,
            revoked_by_user_id=None,
            updated_at=None,
        )
        result = Mock()
        result.scalars.return_value.all.return_value = [
            target,
            SimpleNamespace(user_id=11),
        ]
        db = Mock()
        db.execute = AsyncMock(return_value=result)
        db.flush = AsyncMock()
        db.add = Mock()
        actor = SimpleNamespace(
            id=11,
            uuid=UUID("018f6f83-0000-0000-0000-000000000011"),
        )
        target_user = SimpleNamespace(
            id=10,
            uuid=UUID("018f6f83-0000-0000-0000-000000000010"),
        )
        service = AuthorizationService()

        with (
            patch(
                "src.app.services.authorization_service.lock_cl_admin_roster",
                new=AsyncMock(),
            ),
            patch(
                "src.app.services.authorization_service.lock_authorization_target_user",
                new=AsyncMock(),
            ),
            patch.object(
                service,
                "_require_active_user",
                new=AsyncMock(side_effect=[actor, target_user]),
            ),
            patch.object(service, "_require_cl_admin_actor", new=AsyncMock()),
            patch.object(
                service,
                "resolve_for_user",
                new=AsyncMock(return_value=ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN)),
            ),
        ):
            await service.revoke_cl_admin(
                db,
                target_user_id=10,
                revoked_by_user_id=11,
            )

        assert target.status == "revoked"
        assert target.revoked_by_user_id == 11
        assert target.revoked_at == target.updated_at
        db.flush.assert_awaited_once()


class TestAuthorizationOpenAPI:
    def test_target_accessible_application_and_role_reference_contracts_are_published(self) -> None:
        document = app.openapi()
        paths = document["paths"]

        me_schema = paths["/api/v1/user/me/"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
        accessible_schema = paths["/api/v1/rp-applications/accessible"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
        accessible_detail_schema = paths["/api/v1/rp-applications/accessible/{rp_application_uuid}"]["get"]["responses"]["200"]["content"][
            "application/json"
        ]["schema"]
        role_schema = paths["/api/v1/roles"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]

        assert me_schema["$ref"].endswith("/AuthenticatedUserRead")
        assert accessible_schema["items"]["$ref"].endswith("/RPApplicationSummaryRead")
        assert accessible_detail_schema["$ref"].endswith("/AccessibleRPApplicationRead")
        assert role_schema["items"]["$ref"].endswith("/CanonicalRoleReferenceRead")

    def test_accessible_route_family_replaces_misleading_mine_contract(self) -> None:
        paths = set(app.openapi()["paths"])

        expected_paths = {
            "/api/v1/rp-applications/accessible",
            "/api/v1/rp-applications/accessible/{rp_application_uuid}",
            "/api/v1/rp-applications/accessible/{rp_application_uuid}/client",
            "/api/v1/rp-applications/accessible/{rp_application_uuid}/client/rotate-secret",
            "/api/v1/rp-applications/accessible/{rp_application_uuid}/client/rotated-secrets",
            "/api/v1/rp-applications/accessible/{rp_application_uuid}/department",
            "/api/v1/rp-applications/accessible/{rp_application_uuid}/mau-report",
            "/api/v1/rp-applications/accessible/{rp_application_uuid}/oauth-setup",
        }

        assert expected_paths <= paths
        assert not any(path.startswith("/api/v1/rp-applications/mine") for path in paths)

    def test_legacy_authorization_mutation_routes_are_absent(self) -> None:
        paths = app.openapi()["paths"]

        assert "/api/v1/policies" not in paths
        assert "/api/v1/policy" not in paths
        assert "/api/v1/policy/{policy_uuid}" not in paths
        assert set(paths["/api/v1/role/{role_code}"]) == {"get"}
        assert set(paths["/api/v1/roles"]) == {"get"}
        assert "/api/v1/user/{user_uuid}/roles" not in paths
        assert "/api/v1/user/{user_uuid}/roles/{role_uuid}" not in paths
        assert "/api/v1/db_user/{user_uuid}" not in paths
        assert "/api/v1/rp-application" not in paths
        assert "/api/v1/rp-application/{rp_application_uuid}" not in paths
        assert "/api/v1/rp-applications" not in paths
        verify_application_path = "/api/v1/ibm-sv-admin/applications/{application_id}"
        assert "put" not in paths[verify_application_path]
        assert "delete" not in paths[verify_application_path]
        assert "/api/v1/workspaces/{workspace_uuid}/members" not in paths
        assert "/api/v1/workspaces/{workspace_uuid}/members/{user_uuid}" not in paths

    def test_retired_rp_mutations_do_not_resolve_the_service(self, client) -> None:
        resolution_spy = Mock()

        def resolve_service() -> Mock:
            resolution_spy()
            return Mock()

        app.dependency_overrides[get_rp_application_service] = resolve_service
        try:
            responses = (
                client.post("/api/v1/rp-application", json={}),
                client.patch(
                    f"/api/v1/rp-application/{WORKSPACE_UUID}",
                    json={},
                ),
                client.delete(f"/api/v1/rp-application/{WORKSPACE_UUID}"),
            )
        finally:
            app.dependency_overrides.clear()

        assert all(response.status_code == 404 for response in responses)
        resolution_spy.assert_not_called()

    def test_retired_verify_app_mutations_do_not_resolve_the_client(
        self,
        client,
    ) -> None:
        resolution_spy = Mock()

        def resolve_client() -> Mock:
            resolution_spy()
            return Mock()

        app.dependency_overrides[get_ibm_sv_admin_client] = resolve_client
        try:
            responses = (
                client.put(
                    "/api/v1/ibm-sv-admin/applications/verify-app-1",
                    json={},
                ),
                client.delete("/api/v1/ibm-sv-admin/applications/verify-app-1"),
            )
        finally:
            app.dependency_overrides.clear()

        assert all(response.status_code == 405 for response in responses)
        resolution_spy.assert_not_called()
