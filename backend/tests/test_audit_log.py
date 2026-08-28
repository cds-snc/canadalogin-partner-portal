import uuid as uuid_pkg
from unittest.mock import AsyncMock, patch

import pytest
from src.app.services.audit_service import AuditService


class TestAuditService:
    @pytest.mark.asyncio
    async def test_log_action_delegates_to_repository(self, mock_db):
        user_uuid = uuid_pkg.UUID("018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301")
        target_uuid = uuid_pkg.UUID("018f6f83-0f2b-7b0f-b2fb-96c4d8a4b302")
        service = AuditService()

        with patch(
            "src.app.services.audit_service.crud_audit_log.create",
            new=AsyncMock(),
        ) as mock_create:
            await service.log_action(
                db=mock_db,
                user="Test User",
                user_uuid=user_uuid,
                target="rp_application",
                target_uuid=target_uuid,
                operation="CREATE",
                description="Created RP application 'Test App'",
            )

        mock_create.assert_awaited_once()
        call_kwargs = mock_create.call_args.kwargs
        assert call_kwargs["db"] is mock_db
        created_obj = call_kwargs["object"]
        assert created_obj.user == "Test User"
        assert created_obj.user_uuid == user_uuid
        assert created_obj.target == "rp_application"
        assert created_obj.target_uuid == target_uuid
        assert created_obj.operation == "CREATE"
        assert created_obj.description == "Created RP application 'Test App'"

    @pytest.mark.asyncio
    async def test_log_action_without_user_uuid(self, mock_db):
        service = AuditService()

        with patch(
            "src.app.services.audit_service.crud_audit_log.create",
            new=AsyncMock(),
        ) as mock_create:
            await service.log_action(
                db=mock_db,
                user="System",
                target="rp_application",
                operation="SYNC",
                description="Scheduled sync completed",
            )

        mock_create.assert_awaited_once()
        created_obj = mock_create.call_args.kwargs["object"]
        assert created_obj.user == "System"
        assert created_obj.user_uuid is None
