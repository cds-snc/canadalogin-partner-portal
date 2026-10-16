import uuid
from unittest.mock import AsyncMock, Mock

import pytest
from sqlalchemy.dialects import postgresql

from src.app.repositories.partner_group_role_repository import (
    PartnerGroupRoleRepository,
)
from src.app.schemas.partner_group_role import PartnerGroupRoleCreateInternal


@pytest.mark.asyncio
async def test_group_roles_are_read_from_explicit_user_mapping():
    user_result = Mock()
    user_result.scalar_one_or_none.return_value = 10
    partner_group_result = Mock()
    partner_group_result.scalar_one_or_none.return_value = 20
    roles_result = Mock()
    roles_result.mappings.return_value.all.return_value = []
    db = Mock()
    db.execute = AsyncMock(
        side_effect=[user_result, partner_group_result, roles_result]
    )

    await PartnerGroupRoleRepository().get_active_user_roles_for_partner_group(
        db=db,
        user_uuid=uuid.uuid4(),
        partner_group_uuid=uuid.uuid4(),
    )

    role_query = db.execute.await_args_list[2].args[0]
    compiled_query = str(role_query.compile(dialect=postgresql.dialect()))

    assert "partner_group_role.user_id" in compiled_query
    assert "JOIN user_role" not in compiled_query


def test_partner_group_role_create_schema_includes_user_id():
    assignment = PartnerGroupRoleCreateInternal(
        partner_group_id=20,
        user_id=10,
        role_id=7,
    )

    assert assignment.model_dump() == {
        "partner_group_id": 20,
        "user_id": 10,
        "role_id": 7,
    }