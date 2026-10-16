from uuid import UUID
from unittest.mock import AsyncMock, Mock

import pytest

from src.scripts.sync_user_roles import (
    PartnerGroupRoleAssignment,
    _upsert_partner_group_role,
    load_assignments,
)
from src.app.models.partner_group_role import PartnerGroupRole


class _ScalarResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


def test_load_assignments_parses_global_and_group_scoped_roles(tmp_path):
    assignments_file = tmp_path / "assignments.yaml"
    assignments_file.write_text(
        """
CanadaLogin Administrators:
  - admin@example.ca
partner_group_roles:
  - partner_group_uuid: 00000000-0000-7000-8000-000000000001
    role_name: Partner Developer
    emails:
      - developer@example.ca
""",
        encoding="utf-8",
    )

    assignments = load_assignments(assignments_file)

    assert assignments.global_roles == {
        "CanadaLogin Administrators": ["admin@example.ca"]
    }
    assert assignments.partner_group_roles == [
        PartnerGroupRoleAssignment(
            partner_group_uuid=UUID("00000000-0000-7000-8000-000000000001"),
            role_name="Partner Developer",
            emails=("developer@example.ca",),
        )
    ]


@pytest.mark.asyncio
async def test_upsert_partner_group_role_is_idempotent_and_restores_deleted_grants():
    session = Mock()
    session.execute = AsyncMock(return_value=_ScalarResult(None))

    assert await _upsert_partner_group_role(
        session,
        partner_group_id=20,
        user_id=10,
        role_id=7,
    ) is True
    created_grant = session.add.call_args.args[0]
    assert isinstance(created_grant, PartnerGroupRole)
    assert (created_grant.partner_group_id, created_grant.user_id, created_grant.role_id) == (
        20,
        10,
        7,
    )

    session.execute.return_value = _ScalarResult(created_grant)
    assert await _upsert_partner_group_role(
        session,
        partner_group_id=20,
        user_id=10,
        role_id=7,
    ) is False

    created_grant.is_deleted = True
    created_grant.deleted_at = created_grant.created_at
    assert await _upsert_partner_group_role(
        session,
        partner_group_id=20,
        user_id=10,
        role_id=7,
    ) is True
    assert created_grant.is_deleted is False
    assert created_grant.deleted_at is None
    assert session.add.call_count == 1