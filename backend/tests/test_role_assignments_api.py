import json
from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.api.dependencies import get_authorization_service, get_current_user
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.db.database import async_get_db
from src.app.core.exceptions.http_exceptions import ForbiddenException
from src.app.main import app
from src.app.schemas.authorization import (
    ClAdminAssignmentEligibilityRead,
    ClAdminAssignmentEligibilityReason,
    RoleAssignmentCandidateRead,
    RoleAssignmentRead,
)

ACTOR_USER_ID = 41
WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000201")
TARGET_USER_UUID = UUID("018f6f83-0000-0000-0000-000000000012")
ASSIGNMENT_UUID = UUID("018f6f83-0000-0000-0000-000000000301")
NOW = datetime(2026, 8, 11, 18, 0, tzinfo=UTC)


def _assignment(*, role: str, workspace_uuid: UUID | None) -> RoleAssignmentRead:
    return RoleAssignmentRead(
        assignment_uuid=ASSIGNMENT_UUID,
        user_uuid=TARGET_USER_UUID,
        user_name="Target User",
        user_email="target@example.test",
        role=role,
        workspace_uuid=workspace_uuid,
        assigned_at=NOW,
    )


def _database() -> Mock:
    db = Mock(spec=AsyncSession)
    db.commit = AsyncMock()
    db.rollback = AsyncMock()
    return db


def _install_overrides(*, service: Mock, db: Mock) -> None:
    app.dependency_overrides[get_current_user] = lambda: {
        "id": ACTOR_USER_ID,
        "uuid": UUID("018f6f83-0000-0000-0000-000000000011"),
    }
    app.dependency_overrides[get_authorization_service] = lambda: service
    app.dependency_overrides[async_get_db] = lambda: db


class TestClAdminRoleAssignmentApi:
    def test_public_uuid_list_assign_and_revoke_contract(self) -> None:
        service = Mock()
        cl_assignment = _assignment(role="cl_admin", workspace_uuid=None)
        service.list_cl_admin_assignments = AsyncMock(return_value=[cl_assignment])
        service.get_cl_admin_assignment_eligibility = AsyncMock(
            return_value=ClAdminAssignmentEligibilityRead(
                user_uuid=TARGET_USER_UUID,
                eligible=False,
                reason=ClAdminAssignmentEligibilityReason.ACTIVE_PARTNER_ACCESS,
            )
        )
        service.assign_cl_admin_by_uuid = AsyncMock(return_value=cl_assignment)
        service.revoke_cl_admin_by_uuid = AsyncMock(return_value=None)
        db = _database()
        _install_overrides(service=service, db=db)

        try:
            with TestClient(app) as client:
                list_response = client.get("/api/v1/role-assignments/cl-admin")
                assign_response = client.post(
                    "/api/v1/role-assignments/cl-admin",
                    json={"userUuid": str(TARGET_USER_UUID)},
                )
                eligibility_response = client.get(f"/api/v1/role-assignments/cl-admin/{TARGET_USER_UUID}/eligibility")
                revoke_response = client.delete(f"/api/v1/role-assignments/cl-admin/{TARGET_USER_UUID}")
        finally:
            app.dependency_overrides.clear()

        assert list_response.status_code == 200
        assert list_response.json() == [
            {
                "assignedAt": NOW.isoformat().replace("+00:00", "Z"),
                "assignmentUuid": str(ASSIGNMENT_UUID),
                "role": "cl_admin",
                "userEmail": "target@example.test",
                "userName": "Target User",
                "userUuid": str(TARGET_USER_UUID),
                "workspaceUuid": None,
            }
        ]
        assert assign_response.status_code == 201
        assert assign_response.json() == list_response.json()[0]
        assert eligibility_response.status_code == 200
        assert eligibility_response.json() == {
            "eligible": False,
            "reason": "active_partner_access",
            "userUuid": str(TARGET_USER_UUID),
        }
        assert revoke_response.status_code == 200
        assert revoke_response.json() == {"message": "CL Admin assignment revoked."}
        service.list_cl_admin_assignments.assert_awaited_once_with(
            db,
            actor_user_id=ACTOR_USER_ID,
        )
        service.assign_cl_admin_by_uuid.assert_awaited_once_with(
            db,
            target_user_uuid=TARGET_USER_UUID,
            assigned_by_user_id=ACTOR_USER_ID,
        )
        service.get_cl_admin_assignment_eligibility.assert_awaited_once_with(
            db,
            target_user_uuid=TARGET_USER_UUID,
            actor_user_id=ACTOR_USER_ID,
        )
        service.revoke_cl_admin_by_uuid.assert_awaited_once_with(
            db,
            target_user_uuid=TARGET_USER_UUID,
            revoked_by_user_id=ACTOR_USER_ID,
        )
        assert db.commit.await_count == 2
        db.rollback.assert_not_awaited()


class TestWorkspaceRoleAssignmentApi:
    def test_list_candidate_assign_replace_and_revoke_contract(self) -> None:
        service = Mock()
        read_only_assignment = _assignment(
            role="read_only",
            workspace_uuid=WORKSPACE_UUID,
        )
        edit_assignment = read_only_assignment.model_copy(update={"role": CanonicalRoleCode.RP_USER_EDIT})
        candidate = RoleAssignmentCandidateRead(
            uuid=TARGET_USER_UUID,
            name="Target User",
            email="target@example.test",
        )
        service.list_workspace_role_assignments = AsyncMock(return_value=[read_only_assignment])
        service.search_workspace_role_assignment_candidates = AsyncMock(return_value=[candidate])
        service.assign_partner_role_by_uuid = AsyncMock(return_value=read_only_assignment)
        service.replace_partner_role_by_uuid = AsyncMock(return_value=edit_assignment)
        service.revoke_partner_role_by_uuid = AsyncMock(return_value=None)
        db = _database()
        _install_overrides(service=service, db=db)
        base = f"/api/v1/workspaces/{WORKSPACE_UUID}"

        try:
            with TestClient(app) as client:
                list_response = client.get(f"{base}/role-assignments")
                candidate_response = client.get(
                    f"{base}/role-assignment-candidates",
                    params={"q": "target@example.test"},
                )
                assign_response = client.post(
                    f"{base}/role-assignments",
                    json={
                        "userUuid": str(TARGET_USER_UUID),
                        "role": "read_only",
                    },
                )
                replace_response = client.patch(
                    f"{base}/role-assignments/{TARGET_USER_UUID}",
                    json={"role": "rp_user_edit"},
                )
                revoke_response = client.delete(f"{base}/role-assignments/{TARGET_USER_UUID}")
        finally:
            app.dependency_overrides.clear()

        assert list_response.status_code == 200
        assert list_response.json()[0]["workspaceUuid"] == str(WORKSPACE_UUID)
        assert candidate_response.status_code == 200
        assert candidate_response.json() == [
            {
                "uuid": str(TARGET_USER_UUID),
                "name": "Target User",
                "email": "target@example.test",
            }
        ]
        assert assign_response.status_code == 201
        assert assign_response.json()["role"] == "read_only"
        assert replace_response.status_code == 200
        assert replace_response.json()["role"] == "rp_user_edit"
        assert revoke_response.status_code == 200
        assert revoke_response.json() == {"message": "Workspace role assignment revoked."}
        service.search_workspace_role_assignment_candidates.assert_awaited_once_with(
            db,
            workspace_uuid=WORKSPACE_UUID,
            actor_user_id=ACTOR_USER_ID,
            query="target@example.test",
        )
        service.assign_partner_role_by_uuid.assert_awaited_once_with(
            db,
            workspace_uuid=WORKSPACE_UUID,
            target_user_uuid=TARGET_USER_UUID,
            role="read_only",
            assigned_by_user_id=ACTOR_USER_ID,
        )
        service.replace_partner_role_by_uuid.assert_awaited_once_with(
            db,
            workspace_uuid=WORKSPACE_UUID,
            target_user_uuid=TARGET_USER_UUID,
            role="rp_user_edit",
            replaced_by_user_id=ACTOR_USER_ID,
        )
        service.revoke_partner_role_by_uuid.assert_awaited_once_with(
            db,
            workspace_uuid=WORKSPACE_UUID,
            target_user_uuid=TARGET_USER_UUID,
            revoked_by_user_id=ACTOR_USER_ID,
        )
        assert db.commit.await_count == 3
        db.rollback.assert_not_awaited()

    def test_failed_mutation_rolls_back_and_returns_safe_error(self) -> None:
        service = Mock()
        service.assign_partner_role_by_uuid = AsyncMock(
            side_effect=ForbiddenException("Only same-workspace RP Admin can manage partner staff assignments")
        )
        db = _database()
        _install_overrides(service=service, db=db)

        try:
            with TestClient(app) as client:
                response = client.post(
                    f"/api/v1/workspaces/{WORKSPACE_UUID}/role-assignments",
                    json={
                        "userUuid": str(TARGET_USER_UUID),
                        "role": "read_only",
                    },
                )
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "forbidden"
        db.commit.assert_not_awaited()
        db.rollback.assert_awaited_once()

    def test_request_contract_rejects_global_roles_and_extra_fields(self) -> None:
        service = Mock()
        service.assign_partner_role_by_uuid = AsyncMock()
        service.search_workspace_role_assignment_candidates = AsyncMock()
        db = _database()
        _install_overrides(service=service, db=db)
        url = f"/api/v1/workspaces/{WORKSPACE_UUID}/role-assignments"

        try:
            with TestClient(app) as client:
                global_role_response = client.post(
                    url,
                    json={
                        "userUuid": str(TARGET_USER_UUID),
                        "role": "cl_admin",
                    },
                )
                extra_field_response = client.post(
                    url,
                    json={
                        "userUuid": str(TARGET_USER_UUID),
                        "role": "read_only",
                        "workspaceId": 9,
                    },
                )
                short_query_response = client.get(
                    f"/api/v1/workspaces/{WORKSPACE_UUID}/role-assignment-candidates",
                    params={"q": "x"},
                )
                long_query_response = client.get(
                    f"/api/v1/workspaces/{WORKSPACE_UUID}/role-assignment-candidates",
                    params={"q": "x" * 101},
                )
        finally:
            app.dependency_overrides.clear()

        assert global_role_response.status_code == 422
        assert extra_field_response.status_code == 422
        assert short_query_response.status_code == 422
        assert long_query_response.status_code == 422
        service.assign_partner_role_by_uuid.assert_not_awaited()
        service.search_workspace_role_assignment_candidates.assert_not_awaited()
        db.commit.assert_not_awaited()


class TestRoleAssignmentOpenApi:
    def test_openapi_publishes_only_the_public_camel_case_contract(self) -> None:
        document = app.openapi()
        paths = document["paths"]

        assert set(paths["/api/v1/role-assignments/cl-admin"]) >= {
            "get",
            "post",
        }
        assert set(paths["/api/v1/role-assignments/cl-admin/{userUuid}"]) >= {"delete"}
        assert set(paths["/api/v1/role-assignments/cl-admin/{userUuid}/eligibility"]) >= {"get"}
        assert set(paths["/api/v1/workspaces/{workspaceUuid}/role-assignments"]) >= {
            "get",
            "post",
        }
        assert set(paths["/api/v1/workspaces/{workspaceUuid}/role-assignments/{userUuid}"]) >= {"patch", "delete"}
        assert "/api/v1/workspaces/{workspaceUuid}/role-assignment-candidates" in paths

        path_parameters = paths["/api/v1/workspaces/{workspaceUuid}/role-assignments/{userUuid}"]["patch"]["parameters"]
        assert {parameter["name"] for parameter in path_parameters} == {
            "userUuid",
            "workspaceUuid",
        }

        schemas = document["components"]["schemas"]
        assignment_properties = schemas["RoleAssignmentRead"]["properties"]
        candidate_properties = schemas["RoleAssignmentCandidateRead"]["properties"]
        create_properties = schemas["PartnerRoleAssignmentCreate"]["properties"]
        eligibility_properties = schemas["ClAdminAssignmentEligibilityRead"]["properties"]

        assert set(assignment_properties) == {
            "assignedAt",
            "assignmentUuid",
            "role",
            "userEmail",
            "userName",
            "userUuid",
            "workspaceUuid",
        }
        assert set(candidate_properties) == {"email", "name", "uuid"}
        assert set(create_properties) == {"role", "userUuid"}
        assert set(eligibility_properties) == {"eligible", "reason", "userUuid"}
        assert set(schemas["ClAdminAssignmentEligibilityReason"]["enum"]) == {
            "active_partner_access",
            "already_cl_admin",
            "eligible",
            "inactive_user",
        }
        serialized_contract = json.dumps(
            {
                "assignment": assignment_properties,
                "candidate": candidate_properties,
                "create": create_properties,
            }
        )
        assert '"userId"' not in serialized_contract
        assert '"workspaceId"' not in serialized_contract
        assert '"roleId"' not in serialized_contract

        role_schema = create_properties["role"]
        assert set(role_schema["enum"]) == {
            "read_only",
            "rp_admin",
            "rp_user_edit",
        }
