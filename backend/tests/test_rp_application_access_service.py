from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID

import pytest
from fastcrud.exceptions.http_exceptions import CustomException
from sqlalchemy.ext.asyncio import AsyncSession
from src.app.core.authorization import CanonicalRoleCode
from src.app.core.exceptions.http_exceptions import NotFoundException
from src.app.schemas.rp_application import AccessibleRPApplicationDepartmentAssignRequest
from src.app.services.authorization_service import ResolvedPartnerAccess
from src.app.services.rp_application_service import RPApplicationService

APPLICATION_UUID = UUID("018f6f83-0000-0000-0000-000000000333")
WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000023")
DEPARTMENT_UUID = UUID("018f6f83-0000-0000-0000-000000000777")
APPLICATION_INFORMATION_UUID = UUID("018f6f83-0000-0000-0000-000000000555")


def _resolved_access() -> ResolvedPartnerAccess:
    return ResolvedPartnerAccess(
        workspace_id=23,
        workspace_uuid=WORKSPACE_UUID,
        role=CanonicalRoleCode.RP_USER_EDIT,
    )


def _unassigned_application() -> dict[str, object]:
    return {
        "id": 10,
        "uuid": APPLICATION_UUID,
        "workspace_id": 23,
        "dnr_app_name": "Benefits Portal",
        "department_id": None,
        "application_information_id": 17,
    }


@pytest.mark.asyncio
async def test_department_assignment_adapter_is_idempotent_for_workspace_department() -> None:
    service = RPApplicationService()
    db = Mock(spec=AsyncSession)
    db.execute = AsyncMock()
    service._resolve_accessible_rp_application_access = AsyncMock(  # type: ignore[method-assign]
        return_value=(_unassigned_application(), _resolved_access())
    )
    service._get_effective_workspace_department = AsyncMock(  # type: ignore[method-assign]
        return_value=(7, DEPARTMENT_UUID)
    )
    service._create_audit_log_entry = AsyncMock()  # type: ignore[method-assign]

    result = await service.assign_accessible_rp_application_department(
        db=db,
        rp_application_uuid=APPLICATION_UUID,
        current_user={"id": 11, "name": "Local editor"},
        payload=AccessibleRPApplicationDepartmentAssignRequest(
            department_uuid=DEPARTMENT_UUID,
        ),
    )

    assert result["departmentId"] == 7
    db.execute.assert_not_awaited()
    service._create_audit_log_entry.assert_not_awaited()


@pytest.mark.asyncio
async def test_department_assignment_adapter_rejects_non_workspace_department() -> None:
    service = RPApplicationService()
    db = Mock(spec=AsyncSession)
    db.execute = AsyncMock()
    service._resolve_accessible_rp_application_access = AsyncMock(  # type: ignore[method-assign]
        return_value=(_unassigned_application(), _resolved_access())
    )
    service._get_effective_workspace_department = AsyncMock(  # type: ignore[method-assign]
        return_value=(7, DEPARTMENT_UUID)
    )
    service._create_audit_log_entry = AsyncMock()  # type: ignore[method-assign]

    with pytest.raises(CustomException) as exc_info:
        await service.assign_accessible_rp_application_department(
            db=db,
            rp_application_uuid=APPLICATION_UUID,
            current_user={"id": 11, "name": "Local editor"},
            payload=AccessibleRPApplicationDepartmentAssignRequest(
                department_uuid=UUID("018f6f83-0000-0000-0000-000000000778"),
            ),
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "RP configuration Department is inherited from its workspace"
    db.execute.assert_not_awaited()
    service._create_audit_log_entry.assert_not_awaited()


@pytest.mark.asyncio
async def test_effective_department_is_resolved_from_active_workspace() -> None:
    service = RPApplicationService()
    db = Mock(spec=AsyncSession)
    row = Mock(department_id=7, uuid=DEPARTMENT_UUID)
    result = Mock()
    result.one_or_none.return_value = row
    db.execute = AsyncMock(return_value=result)

    department_id, department_uuid = await service._get_effective_workspace_department(
        db=db,
        rp_application_data=_unassigned_application(),
    )

    statement = db.execute.await_args.args[0]
    rendered_statement = str(statement.compile(compile_kwargs={"literal_binds": True}))
    assert "workspace.id = 23" in rendered_statement
    assert "workspace.is_deleted IS false" in rendered_statement
    assert "department.is_deleted IS false" in rendered_statement
    assert department_id == 7
    assert department_uuid == DEPARTMENT_UUID


@pytest.mark.asyncio
async def test_accessible_rp_application_validates_application_ancestry() -> None:
    service = RPApplicationService()
    db = Mock(spec=AsyncSession)
    application_information_result = Mock()
    application_information_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=application_information_result)
    service._list_granted_workspace_roles = AsyncMock(  # type: ignore[method-assign]
        return_value={23: _resolved_access()}
    )

    with patch("src.app.services.rp_application_service.crud_rp_applications") as rp_applications:
        rp_applications.get = AsyncMock(return_value=_unassigned_application())

        with pytest.raises(NotFoundException):
            await service._resolve_accessible_rp_application_access(
                db=db,
                rp_application_uuid=APPLICATION_UUID,
                current_user={"id": 11, "name": "Local editor"},
                allowed_grant_roles=frozenset({CanonicalRoleCode.RP_USER_EDIT}),
                expected_workspace_uuid=WORKSPACE_UUID,
                expected_application_information_uuid=APPLICATION_INFORMATION_UUID,
            )

    statement = db.execute.await_args.args[0]
    rendered_statement = str(statement.compile(compile_kwargs={"literal_binds": True}))
    assert "application_information.id = 17" in rendered_statement
    assert "application_information.workspace_id = 23" in rendered_statement
    assert APPLICATION_INFORMATION_UUID.hex in rendered_statement
    assert "application_information.is_deleted IS false" in rendered_statement
