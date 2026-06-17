from datetime import datetime, timezone

import uuid as uuid_pkg
from unittest.mock import AsyncMock, Mock, patch

import pytest
from fastcrud import PaginatedListResponse

from src.app.api.v1.audit_logs import read_audit_logs
from src.app.schemas.audit_log import AuditLogRead
from src.app.services.audit_service import AuditService


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


class TestAuditLogRoutes:
    @pytest.mark.asyncio
    async def test_read_audit_logs_delegates_to_service(self, mock_db, current_user_dict):
        mock_service = Mock()
        mock_service.list_audit_logs = AsyncMock(return_value={"data": [], "total_count": 0, "page": 1, "items_per_page": 10})

        result = await unwrap_endpoint(read_audit_logs)(
            Mock(), mock_db, mock_service, current_user_dict,
            page=1, items_per_page=10,
        )

        assert result == {"data": [], "total_count": 0, "page": 1, "items_per_page": 10}
        mock_service.list_audit_logs.assert_awaited_once()
        call_kwargs = mock_service.list_audit_logs.call_args.kwargs
        assert call_kwargs["db"] is mock_db
        assert call_kwargs["page"] == 1
        assert call_kwargs["items_per_page"] == 10

    @pytest.mark.asyncio
    async def test_read_audit_logs_passes_filters(self, mock_db, current_user_dict):
        mock_service = Mock()
        mock_service.list_audit_logs = AsyncMock(return_value={"data": [], "total_count": 0, "page": 1, "items_per_page": 10})

        user_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b301"
        target_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b302"
        created_at_gte = datetime(2026, 6, 1, tzinfo=timezone.utc)
        created_at_lte = datetime(2026, 6, 11, tzinfo=timezone.utc)
        result = await unwrap_endpoint(read_audit_logs)(
            Mock(), mock_db, mock_service, current_user_dict,
            page=1, items_per_page=10,
            user_uuid=user_uuid, target="rp_application",
            operation="CREATE",
            target_uuid=target_uuid,
            created_at_gte=created_at_gte,
            created_at_lte=created_at_lte,
        )

        assert result == {"data": [], "total_count": 0, "page": 1, "items_per_page": 10}
        mock_service.list_audit_logs.assert_awaited_once()
        call_kwargs = mock_service.list_audit_logs.call_args.kwargs
        assert call_kwargs["db"] is mock_db
        assert str(call_kwargs["user_uuid"]) == user_uuid
        assert call_kwargs["target"] == "rp_application"
        assert call_kwargs["operation"] == "CREATE"
        assert str(call_kwargs["target_uuid"]) == target_uuid
        assert call_kwargs["created_at_gte"] == created_at_gte
        assert call_kwargs["created_at_lte"] == created_at_lte


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

    @pytest.mark.asyncio
    async def test_list_audit_logs_passes_date_filters(self, mock_db):
        service = AuditService()
        created_at_gte = datetime(2026, 6, 1, tzinfo=timezone.utc)
        created_at_lte = datetime(2026, 6, 11, tzinfo=timezone.utc)

        with (
            patch("src.app.services.audit_service.crud_audit_log.get_multi") as mock_get_multi,
            patch("src.app.services.audit_service.paginated_response") as mock_paginated,
        ):
            mock_get_multi.return_value = Mock(data=[], total_count=0)
            mock_paginated.return_value = {"data": [], "total_count": 0, "has_more": False, "page": 1, "items_per_page": 10}

            result = await service.list_audit_logs(
                db=mock_db,
                page=1,
                items_per_page=10,
                created_at_gte=created_at_gte,
                created_at_lte=created_at_lte,
            )

        assert isinstance(result, PaginatedListResponse)
        assert result.data == []
        assert result.total_count == 0
        assert result.page == 1
        assert result.items_per_page == 10
        mock_get_multi.assert_awaited_once()
        call_kwargs = mock_get_multi.call_args.kwargs
        assert call_kwargs["created_at__gte"] == created_at_gte
        assert call_kwargs["created_at__lte"] == created_at_lte
