from unittest.mock import AsyncMock, patch

import pytest

from src.app.core.security import authenticate_user
from src.app.models.access_policy import AccessPolicy
from src.app.models.role import Role
from src.app.schemas.access_policy import AccessPolicyOut
from src.app.schemas.user import UserCreateInternal, UserRead


class TestLocalPasswordAuthentication:
    @pytest.mark.asyncio
    async def test_authenticate_user_rejects_external_user_without_password(self, mock_db):
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        external_user = {
            "id": 1,
            "uuid": user_uuid,
            "username": "oidcuser",
            "email": "oidc.user@example.com",
            "hashed_password": None,
        }

        with patch("src.app.core.security.crud_users") as mock_crud:
            mock_crud.get = AsyncMock(return_value=external_user)

            result = await authenticate_user(user_uuid, "irrelevant", mock_db)

            assert result is False


class TestExternalIdentitySchemas:
    def test_user_create_internal_accepts_external_identity_fields(self):
        user = UserCreateInternal(
            name="OIDC User",
            username="oidc.user@example.com",
            email="oidc.user@example.com",
            auth_provider="oidc",
            auth_subject="subject-123",
        )

        assert user.username == "oidc.user@example.com"
        assert user.auth_provider == "oidc"
        assert user.auth_subject == "subject-123"

    def test_access_policy_out_uses_pydantic_v2_from_attributes(self):
        assert AccessPolicyOut.model_config.get("from_attributes") is True

    def test_user_read_exposes_public_role_and_tier_uuids_only(self):
        assert "role_uuids" in UserRead.model_fields
        assert "tier_uuid" in UserRead.model_fields
        assert "role_ids" not in UserRead.model_fields
        assert "tier_id" not in UserRead.model_fields

    def test_access_control_tables_include_timestamps_and_soft_delete_columns(self):
        required_columns = {"created_at", "updated_at", "deleted_at", "is_deleted"}

        assert required_columns.issubset(AccessPolicy.__table__.columns.keys())
        assert required_columns.issubset(Role.__table__.columns.keys())
