from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID

import pytest
from fastcrud.exceptions.http_exceptions import CustomException
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.authorization import CanonicalRoleCode
from src.app.schemas.rp_application import AccessibleRPApplicationDepartmentAssignRequest
from src.app.services.authorization_service import ResolvedPartnerAccess
from src.app.services.rp_application_service import RPApplicationService

APPLICATION_UUID = UUID("018f6f83-0000-0000-0000-000000000333")
WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000023")
DEPARTMENT_UUID = UUID("018f6f83-0000-0000-0000-000000000777")


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
    }


def _assignment_result(updated_row: dict[str, object] | None) -> Mock:
    result = Mock()
    result.mappings.return_value.one_or_none.return_value = updated_row
    return result


@pytest.mark.asyncio
async def test_department_assignment_uses_atomic_null_compare_and_set() -> None:
    service = RPApplicationService()
    db = Mock(spec=AsyncSession)
    db.execute = AsyncMock(
        return_value=_assignment_result(
            {
                "id": 10,
                "uuid": APPLICATION_UUID,
                "dnr_app_name": "Benefits Portal",
                "department_id": 7,
            }
        )
    )
    service._resolve_accessible_rp_application_access = AsyncMock(  # type: ignore[method-assign]
        return_value=(_unassigned_application(), _resolved_access())
    )
    service._create_audit_log_entry = AsyncMock()  # type: ignore[method-assign]

    with patch("src.app.services.rp_application_service.crud_departments") as departments:
        departments.get = AsyncMock(return_value={"id": 7, "uuid": DEPARTMENT_UUID})

        result = await service.assign_accessible_rp_application_department(
            db=db,
            rp_application_uuid=APPLICATION_UUID,
            current_user={"id": 11, "name": "Local editor"},
            payload=AccessibleRPApplicationDepartmentAssignRequest(
                department_uuid=DEPARTMENT_UUID,
            ),
        )

    statement = db.execute.await_args.args[0]
    rendered_statement = str(statement.compile(compile_kwargs={"literal_binds": True}))
    assert "rp_application.department_id IS NULL" in rendered_statement
    assert "rp_application.is_deleted IS false" in rendered_statement
    assert result["departmentId"] == 7
    service._create_audit_log_entry.assert_awaited_once()


@pytest.mark.asyncio
async def test_department_assignment_compare_and_set_loser_returns_conflict_without_audit() -> None:
    service = RPApplicationService()
    db = Mock(spec=AsyncSession)
    db.execute = AsyncMock(return_value=_assignment_result(None))
    service._resolve_accessible_rp_application_access = AsyncMock(  # type: ignore[method-assign]
        return_value=(_unassigned_application(), _resolved_access())
    )
    service._create_audit_log_entry = AsyncMock()  # type: ignore[method-assign]

    with patch("src.app.services.rp_application_service.crud_departments") as departments:
        departments.get = AsyncMock(return_value={"id": 7, "uuid": DEPARTMENT_UUID})

        with pytest.raises(CustomException) as exc_info:
            await service.assign_accessible_rp_application_department(
                db=db,
                rp_application_uuid=APPLICATION_UUID,
                current_user={"id": 11, "name": "Local editor"},
                payload=AccessibleRPApplicationDepartmentAssignRequest(
                    department_uuid=DEPARTMENT_UUID,
                ),
            )

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "RP application already has a department assigned"
    service._create_audit_log_entry.assert_not_awaited()
