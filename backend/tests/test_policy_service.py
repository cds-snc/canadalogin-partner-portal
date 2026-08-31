from unittest.mock import AsyncMock, patch

import pytest

from src.app.core.exceptions.http_exceptions import DuplicateValueException, NotFoundException
from src.app.schemas.access_policy import AccessPolicyCreate, AccessPolicyUpdate
from src.app.services.policy_service import PolicyService


class TestPolicyService:
    @pytest.mark.asyncio
    async def test_create_policy_rejects_duplicate(self, mock_db) -> None:
        service = PolicyService()
        policy = AccessPolicyCreate(subject="member", resource="roles", action="read")

        with patch("src.app.services.policy_service.crud_access_policies") as mock_policies:
            mock_policies.exists = AsyncMock(return_value=True)

            with pytest.raises(DuplicateValueException, match="Policy already exists"):
                await service.create_policy(db=mock_db, policy=policy)

    @pytest.mark.asyncio
    async def test_get_policy_raises_when_missing(self, mock_db) -> None:
        service = PolicyService()

        with patch("src.app.services.policy_service.crud_access_policies") as mock_policies:
            mock_policies.get = AsyncMock(return_value=None)

            with pytest.raises(NotFoundException, match="Policy not found"):
                await service.get_policy(db=mock_db, policy_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b101")

    @pytest.mark.asyncio
    async def test_update_policy_rejects_duplicate_combination(self, mock_db) -> None:
        service = PolicyService()
        current_policy = {
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b101",
            "subject": "member",
            "resource": "roles",
            "action": "read",
        }

        with patch("src.app.services.policy_service.crud_access_policies") as mock_policies:
            mock_policies.get = AsyncMock(return_value=current_policy)
            mock_policies.exists = AsyncMock(return_value={"uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b102"})

            with pytest.raises(DuplicateValueException, match="Policy already exists"):
                await service.update_policy(
                    db=mock_db,
                    policy_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b101",
                    values=AccessPolicyUpdate(action="write"),
                )
