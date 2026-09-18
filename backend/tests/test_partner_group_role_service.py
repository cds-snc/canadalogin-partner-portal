import uuid
from unittest.mock import AsyncMock, patch

import pytest

from src.app.core.exceptions.http_exceptions import NotFoundException
from src.app.services.partner_group_role_service import PartnerGroupRoleService


@pytest.mark.asyncio
async def test_get_user_roles_for_partner_group_returns_matching_roles(mock_db):
    user_uuid = uuid.uuid4()
    partner_group_uuid = uuid.uuid4()
    matching_roles = [
        {"uuid": uuid.uuid4(), "name": "Partner Developer"},
        {"uuid": uuid.uuid4(), "name": "Partner Production Administrator"},
    ]

    with patch(
        "src.app.services.partner_group_role_service.partner_group_role_repository"
    ) as repository:
        repository.active_user_exists = AsyncMock(return_value=True)
        repository.active_partner_group_exists = AsyncMock(return_value=True)
        repository.get_active_user_roles_for_partner_group = AsyncMock(
            return_value=matching_roles
        )

        roles = await PartnerGroupRoleService().get_user_roles_for_partner_group(
            db=mock_db,
            user_uuid=user_uuid,
            partner_group_uuid=partner_group_uuid,
        )

    assert roles == matching_roles
    repository.get_active_user_roles_for_partner_group.assert_awaited_once_with(
        db=mock_db,
        user_uuid=user_uuid,
        partner_group_uuid=partner_group_uuid,
    )


@pytest.mark.asyncio
async def test_get_user_roles_for_partner_group_rejects_missing_user(mock_db):
    with patch(
        "src.app.services.partner_group_role_service.partner_group_role_repository"
    ) as repository:
        repository.active_user_exists = AsyncMock(return_value=False)

        with pytest.raises(NotFoundException, match="User not found"):
            await PartnerGroupRoleService().get_user_roles_for_partner_group(
                db=mock_db,
                user_uuid=uuid.uuid4(),
                partner_group_uuid=uuid.uuid4(),
            )


@pytest.mark.asyncio
async def test_get_user_roles_for_application_resolves_partner_group(mock_db):
    user_uuid = uuid.uuid4()
    application_uuid = uuid.uuid4()
    partner_group_uuid = uuid.uuid4()
    matching_roles = [{"uuid": uuid.uuid4(), "name": "Partner Developer"}]

    with patch(
        "src.app.services.partner_group_role_service.partner_group_role_repository"
    ) as repository:
        repository.active_user_exists = AsyncMock(return_value=True)
        repository.active_partner_group_exists = AsyncMock(return_value=True)
        repository.get_active_application_partner_group_uuid = AsyncMock(
            return_value=partner_group_uuid
        )
        repository.get_active_user_roles_for_partner_group = AsyncMock(
            return_value=matching_roles
        )

        roles = await PartnerGroupRoleService().get_user_roles_for_application(
            db=mock_db,
            user_uuid=user_uuid,
            application_uuid=application_uuid,
        )

    assert roles == matching_roles
    repository.get_active_application_partner_group_uuid.assert_awaited_once_with(
        db=mock_db,
        application_uuid=application_uuid,
    )
    repository.get_active_user_roles_for_partner_group.assert_awaited_once_with(
        db=mock_db,
        user_uuid=user_uuid,
        partner_group_uuid=partner_group_uuid,
    )


@pytest.mark.asyncio
async def test_user_has_role_for_partner_group_returns_false_without_mapping(mock_db):
    with patch(
        "src.app.services.partner_group_role_service.partner_group_role_repository"
    ) as repository:
        repository.active_user_exists = AsyncMock(return_value=True)
        repository.active_partner_group_exists = AsyncMock(return_value=True)
        repository.get_active_user_roles_for_partner_group = AsyncMock(return_value=[])

        has_role = await PartnerGroupRoleService().user_has_role_for_partner_group(
            db=mock_db,
            user_uuid=uuid.uuid4(),
            partner_group_uuid=uuid.uuid4(),
        )

    assert has_role is False
