from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch
from uuid import uuid4

import pytest

from src.app.core.authorization import CanonicalRoleCode
from src.app.core.exceptions.http_exceptions import DuplicateValueException, ForbiddenException, NotFoundException
from src.app.schemas.user import (
    UserCreate,
    UserDepartmentUpdate,
    UserReadInternal,
    UserTierUpdate,
    UserUpdate,
)
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)
from src.app.services.user_service import UserService


def _cl_admin_user(*, user_id: int = 1, user_uuid: object | None = None) -> dict:
    return {
        "id": user_id,
        "uuid": user_uuid,
        "name": "CL Admin",
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
    }


class TestUserService:
    @pytest.mark.asyncio
    async def test_pending_invitation_directory_projects_minimum_fields(
        self,
        mock_db,
    ) -> None:
        now = datetime.now(UTC)
        invitation_uuid = uuid4()
        workspace_uuid = uuid4()
        mock_db.scalar = AsyncMock(return_value=1)
        query_result = Mock()
        query_result.all.return_value = [
            SimpleNamespace(
                invitation_uuid=invitation_uuid,
                invited_email="invitee@example.gc.ca",
                workspace_uuid=workspace_uuid,
                workspace_name="Benefits partner",
                role=CanonicalRoleCode.READ_ONLY.value,
                status="pending",
                invite_expires_at=now + timedelta(days=7),
                created_at=now,
            )
        ]
        mock_db.execute = AsyncMock(return_value=query_result)

        result = await UserService().list_pending_invitations(
            db=mock_db,
            page=1,
            items_per_page=10,
            current_user=_cl_admin_user(),
        )

        payload = result["data"][0].model_dump(mode="json", by_alias=True)
        assert payload == {
            "createdAt": now.isoformat().replace("+00:00", "Z"),
            "invitationUuid": str(invitation_uuid),
            "inviteExpiresAt": (now + timedelta(days=7)).isoformat().replace("+00:00", "Z"),
            "invitedEmail": "invitee@example.gc.ca",
            "role": "read_only",
            "status": "pending",
            "workspaceName": "Benefits partner",
            "workspaceUuid": str(workspace_uuid),
        }
        assert result["total_count"] == 1
        assert result["has_more"] is False
        assert set(mock_db.execute.await_args.args[0].selected_columns.keys()) == {
            "created_at",
            "invitation_uuid",
            "invite_expires_at",
            "invited_email",
            "role",
            "status",
            "workspace_name",
            "workspace_uuid",
        }

    @pytest.mark.asyncio
    async def test_pending_invitation_directory_denies_partner_before_query(
        self,
        mock_db,
    ) -> None:
        workspace_uuid = uuid4()
        partner_actor = {
            "id": 51,
            AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
                partner_access=(
                    ResolvedPartnerAccess(
                        workspace_id=17,
                        workspace_uuid=workspace_uuid,
                        role=CanonicalRoleCode.RP_ADMIN,
                    ),
                )
            ),
        }
        mock_db.scalar = AsyncMock()
        mock_db.execute = AsyncMock()

        with pytest.raises(ForbiddenException):
            await UserService().list_pending_invitations(
                db=mock_db,
                page=1,
                items_per_page=10,
                current_user=partner_actor,
            )

        mock_db.scalar.assert_not_awaited()
        mock_db.execute.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_user_directory_access_projection_uses_two_bulk_queries(
        self,
        mock_db,
    ) -> None:
        service = UserService()
        global_user_uuid = uuid4()
        partner_user_uuid = uuid4()
        workspace_uuid = uuid4()
        global_result = Mock()
        global_result.all.return_value = [SimpleNamespace(user_id=10)]
        partner_result = Mock()
        partner_result.all.return_value = [
            SimpleNamespace(
                user_id=11,
                workspace_uuid=workspace_uuid,
                workspace_name="Benefits partner",
                role=CanonicalRoleCode.RP_ADMIN.value,
            )
        ]
        mock_db.execute = AsyncMock(side_effect=[global_result, partner_result])

        result = await service._build_user_access_directory_entries(
            db=mock_db,
            users=[
                {
                    "id": 10,
                    "uuid": global_user_uuid,
                    "name": "CL Admin",
                    "email": "admin@example.gc.ca",
                    "enabled": True,
                    "auth_provider": "canada_login",
                },
                {
                    "id": 11,
                    "uuid": partner_user_uuid,
                    "name": "Partner Admin",
                    "email": "partner@example.gc.ca",
                    "enabled": True,
                    "auth_provider": "canada_login",
                },
            ],
        )

        assert mock_db.execute.await_count == 2
        partner_statement = mock_db.execute.await_args_list[1].args[0]
        assert set(partner_statement.selected_columns.keys()) == {
            "role",
            "user_id",
            "workspace_name",
            "workspace_uuid",
        }
        assert result[0]["globalRole"] == "cl_admin"
        assert result[0]["workspaceAssignments"] == ()
        assert result[1]["globalRole"] is None
        assert result[1]["workspaceAssignments"][0]["workspaceUuid"] == (workspace_uuid)
        assert "authProvider" not in result[0]

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        ("rows", "expected_outcome", "returns_user_uuid"),
        [
            ([], "new_identity", False),
            (
                [
                    SimpleNamespace(
                        uuid=uuid4(),
                        enabled=False,
                        is_deleted=False,
                    )
                ],
                "ineligible_identity",
                False,
            ),
            (
                [
                    SimpleNamespace(
                        uuid=uuid4(),
                        enabled=True,
                        is_deleted=False,
                    )
                ],
                "existing_identity",
                True,
            ),
        ],
    )
    async def test_resolve_invitation_target_returns_safe_outcome(
        self,
        mock_db,
        rows,
        expected_outcome,
        returns_user_uuid,
    ) -> None:
        query_result = Mock()
        query_result.all.return_value = rows
        mock_db.execute = AsyncMock(return_value=query_result)

        result = await UserService().resolve_invitation_target(
            db=mock_db,
            invited_email=" Invitee@Example.GC.CA ",
            current_user=_cl_admin_user(),
        )

        assert result.outcome.value == expected_outcome
        assert (result.user_uuid is not None) is returns_user_uuid

    @pytest.mark.asyncio
    async def test_user_access_administration_projects_canonical_access_only(
        self,
        mock_db,
    ) -> None:
        service = UserService()
        user_uuid = uuid4()
        workspace_uuid = uuid4()
        assignment_uuid = uuid4()
        invitation_uuid = uuid4()
        now = datetime.now(UTC)
        db_user = {
            "id": 51,
            "uuid": user_uuid,
            "name": "Partner user",
            "email": "partner@example.gc.ca",
            "username": "partner@example.gc.ca",
            "enabled": True,
            "auth_provider": "canada_login",
            "auth_subject": "provider-subject",
        }
        global_result = Mock()
        global_result.one_or_none.return_value = None
        workspace_result = Mock()
        workspace_result.all.return_value = [
            SimpleNamespace(
                assignment_uuid=assignment_uuid,
                workspace_uuid=workspace_uuid,
                workspace_name="Benefits partner",
                role=CanonicalRoleCode.RP_USER_EDIT.value,
                assigned_at=now,
            )
        ]
        invitation_result = Mock()
        invitation_result.all.return_value = [
            SimpleNamespace(
                invitation_uuid=invitation_uuid,
                workspace_uuid=workspace_uuid,
                workspace_name="Benefits partner",
                role=CanonicalRoleCode.READ_ONLY.value,
                status="pending",
                invite_expires_at=now + timedelta(days=2),
                created_at=now,
            )
        ]
        mock_db.execute = AsyncMock(side_effect=[global_result, workspace_result, invitation_result])

        with (
            patch("src.app.services.user_service.crud_users") as mock_users,
            patch(
                "src.app.services.user_service.AuthorizationService.resolve_for_user",
                new=AsyncMock(
                    return_value=ResolvedAuthorizationState(
                        partner_access=(
                            ResolvedPartnerAccess(
                                workspace_id=17,
                                workspace_uuid=workspace_uuid,
                                role=CanonicalRoleCode.RP_USER_EDIT,
                            ),
                        )
                    )
                ),
            ),
        ):
            mock_users.get = AsyncMock(return_value=db_user)
            result = await service.get_user_access_administration(
                db=mock_db,
                user_uuid=user_uuid,
                current_user=_cl_admin_user(),
            )

        payload = result.model_dump(mode="json", by_alias=True)
        assert set(mock_db.execute.await_args_list[0].args[0].selected_columns.keys()) == {
            "assigned_at",
            "assignment_uuid",
        }
        assert set(mock_db.execute.await_args_list[1].args[0].selected_columns.keys()) == {
            "assigned_at",
            "assignment_uuid",
            "role",
            "workspace_name",
            "workspace_uuid",
        }
        assert set(mock_db.execute.await_args_list[2].args[0].selected_columns.keys()) == {
            "created_at",
            "invitation_uuid",
            "invite_expires_at",
            "role",
            "status",
            "workspace_name",
            "workspace_uuid",
        }
        assert payload["user"]["uuid"] == str(user_uuid)
        assert payload["workspaceAssignments"][0]["role"] == "rp_user_edit"
        assert payload["pendingInvitations"][0]["invitationUuid"] == str(invitation_uuid)
        assert "authProvider" not in payload["user"]
        assert "authSubject" not in payload["user"]

    @pytest.mark.asyncio
    async def test_user_access_administration_denies_partner_actor_before_lookup(
        self,
        mock_db,
    ) -> None:
        service = UserService()
        workspace_uuid = uuid4()
        partner_actor = {
            "id": 51,
            AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
                partner_access=(
                    ResolvedPartnerAccess(
                        workspace_id=17,
                        workspace_uuid=workspace_uuid,
                        role=CanonicalRoleCode.RP_ADMIN,
                    ),
                )
            ),
        }

        with patch("src.app.services.user_service.crud_users") as mock_users:
            mock_users.get = AsyncMock()
            with pytest.raises(ForbiddenException):
                await service.get_user_access_administration(
                    db=mock_db,
                    user_uuid=uuid4(),
                    current_user=partner_actor,
                )

        mock_users.get.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_create_user_rejects_duplicate_email(self, mock_db, sample_user_data) -> None:
        service = UserService()
        user = UserCreate(**sample_user_data)

        with patch("src.app.services.user_service.crud_users") as mock_users:
            mock_users.exists = AsyncMock(return_value=True)

            with pytest.raises(DuplicateValueException, match="Email is already registered"):
                await service.create_user(db=mock_db, user=user)

    @pytest.mark.asyncio
    async def test_create_user_sets_username_from_email_and_creates_user(self, mock_db, sample_user_data, sample_user_read) -> None:
        service = UserService()
        user = UserCreate(**sample_user_data)

        with patch("src.app.services.user_service.crud_users") as mock_users:
            mock_users.exists = AsyncMock(side_effect=[False, False])
            mock_users.create = AsyncMock(return_value=sample_user_read.model_dump())

            result = await service.create_user(db=mock_db, user=user)

        assert result == sample_user_read.model_dump()
        created_user = mock_users.create.call_args.kwargs["object"]
        assert created_user.username == user.email
        assert created_user.email == user.email
        assert created_user.enabled is True
        mock_users.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_update_user_rejects_partner_actor(self, mock_db, sample_user_read) -> None:
        service = UserService()
        db_user = sample_user_read.model_dump()
        db_user["username"] = "different-user"
        user_uuid = str(sample_user_read.uuid)

        with patch("src.app.services.user_service.crud_users") as mock_users:
            mock_users.get = AsyncMock(return_value=db_user)

            with pytest.raises(ForbiddenException):
                await service.update_user(
                    db=mock_db,
                    user_uuid=user_uuid,
                    current_user={"username": "owner", "id": 1},
                    values=UserUpdate(name="Updated"),
                )

        mock_users.get.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_get_user_by_uuid_returns_user(self, mock_db, sample_user_read) -> None:
        service = UserService()
        user_uuid = str(sample_user_read.uuid)
        db_user = {
            **sample_user_read.model_dump(),
            "role_ids": [3],
            "tier_id": 2,
        }
        expected_user = {
            **sample_user_read.model_dump(),
            "tier_uuid": "tier-uuid-2",
        }

        with patch("src.app.services.user_service.crud_users") as mock_users:
            mock_users.get = AsyncMock(return_value=db_user)

            with patch("src.app.services.user_service.crud_tiers") as mock_tiers:
                mock_tiers.get = AsyncMock(return_value={"uuid": "tier-uuid-2"})

                result = await service.get_user_by_uuid(db=mock_db, user_uuid=user_uuid)

        assert result == expected_user
        assert "role_ids" not in result
        assert "tier_id" not in result
        assert "role_uuids" not in result
        assert "is_superuser" not in result
        assert "has_partner_access_grant" not in result
        assert "auth_subject" not in result
        mock_users.get.assert_awaited_once_with(
            db=mock_db,
            uuid=user_uuid,
            schema_to_select=UserReadInternal,
            is_deleted=False,
        )

    @pytest.mark.asyncio
    async def test_get_user_by_uuid_does_not_expose_legacy_partner_access_boolean(self, mock_db, sample_user_read) -> None:
        service = UserService()
        user_uuid = str(sample_user_read.uuid)
        db_user = {
            **sample_user_read.model_dump(),
            "id": 51,
            "role_ids": [],
            "tier_id": None,
        }

        with patch("src.app.services.user_service.crud_users") as mock_users:
            mock_users.get = AsyncMock(return_value=db_user)

            result = await service.get_user_by_uuid(db=mock_db, user_uuid=user_uuid)

        assert "has_partner_access_grant" not in result

    @pytest.mark.asyncio
    async def test_delete_user_blacklists_token_after_delete(self, mock_db, sample_user_read) -> None:
        service = UserService()
        user_uuid = str(sample_user_read.uuid)
        db_user = {
            **sample_user_read.model_dump(),
            "id": 9,
            "enabled": True,
        }

        with (
            patch("src.app.services.user_service.crud_users") as mock_users,
            patch("src.app.services.user_service.crud_audit_log") as mock_audit,
            patch.object(
                service,
                "_revoke_authorization_for_deactivation",
                new=AsyncMock(),
            ) as revoke_authorization,
        ):
            mock_users.get = AsyncMock(return_value=db_user)
            mock_users.delete = AsyncMock(return_value=None)
            mock_audit.create = AsyncMock(return_value=None)

            with patch("src.app.services.user_service.blacklist_token", new_callable=AsyncMock) as mock_blacklist:
                result = await service.delete_user(
                    db=mock_db,
                    user_uuid=user_uuid,
                    current_user=_cl_admin_user(
                        user_uuid=sample_user_read.uuid,
                    ),
                    token="token-value",
                )

        assert result == {"message": "User deleted"}
        revoke_authorization.assert_awaited_once_with(
            db=mock_db,
            target_user_id=9,
            actor_user_id=1,
        )
        mock_blacklist.assert_awaited_once_with(token="token-value", db=mock_db)

    @pytest.mark.asyncio
    async def test_delete_user_allows_cookie_session_without_blacklist_token(
        self,
        mock_db,
        sample_user_read,
    ) -> None:
        service = UserService()
        user_uuid = str(sample_user_read.uuid)
        db_user = {
            **sample_user_read.model_dump(),
            "id": 9,
            "enabled": True,
        }

        with (
            patch("src.app.services.user_service.crud_users") as mock_users,
            patch("src.app.services.user_service.crud_audit_log") as mock_audit,
            patch.object(
                service,
                "_revoke_authorization_for_deactivation",
                new=AsyncMock(),
            ),
            patch(
                "src.app.services.user_service.blacklist_token",
                new_callable=AsyncMock,
            ) as mock_blacklist,
        ):
            mock_users.get = AsyncMock(return_value=db_user)
            mock_users.delete = AsyncMock(return_value=None)
            mock_audit.create = AsyncMock(return_value=None)

            result = await service.delete_user(
                db=mock_db,
                user_uuid=user_uuid,
                current_user=_cl_admin_user(user_uuid=sample_user_read.uuid),
                token=None,
            )

        assert result == {"message": "User deleted"}
        mock_blacklist.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_cl_admin_can_update_another_active_user(
        self,
        mock_db,
        sample_user_read,
    ) -> None:
        service = UserService()
        db_user = {
            **sample_user_read.model_dump(),
            "id": 9,
            "enabled": True,
        }

        with (
            patch("src.app.services.user_service.crud_users") as mock_users,
            patch("src.app.services.user_service.crud_audit_log") as mock_audit,
        ):
            mock_users.get = AsyncMock(return_value=db_user)
            mock_users.update = AsyncMock(return_value=None)
            mock_audit.create = AsyncMock(return_value=None)

            result = await service.update_user(
                db=mock_db,
                user_uuid=sample_user_read.uuid,
                current_user=_cl_admin_user(user_id=1),
                values=UserUpdate(name="Updated User"),
            )

        assert result == {"message": "User updated"}
        mock_users.update.assert_awaited_once_with(
            db=mock_db,
            object={"name": "Updated User"},
            uuid=sample_user_read.uuid,
        )
        mock_audit.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_disabling_user_revokes_authorization_before_update(
        self,
        mock_db,
        sample_user_read,
    ) -> None:
        service = UserService()
        db_user = {
            **sample_user_read.model_dump(),
            "id": 9,
            "enabled": True,
        }

        with (
            patch("src.app.services.user_service.crud_users") as mock_users,
            patch("src.app.services.user_service.crud_audit_log") as mock_audit,
            patch.object(
                service,
                "_revoke_authorization_for_deactivation",
                new=AsyncMock(),
            ) as revoke_authorization,
        ):
            mock_users.get = AsyncMock(return_value=db_user)
            mock_users.update = AsyncMock(return_value=None)
            mock_audit.create = AsyncMock(return_value=None)

            await service.update_user(
                db=mock_db,
                user_uuid=sample_user_read.uuid,
                current_user=_cl_admin_user(user_id=1),
                values=UserUpdate(enabled=False),
            )

        revoke_authorization.assert_awaited_once_with(
            db=mock_db,
            target_user_id=9,
            actor_user_id=1,
        )
        mock_users.update.assert_awaited_once_with(
            db=mock_db,
            object={"enabled": False},
            uuid=sample_user_read.uuid,
        )

    @pytest.mark.asyncio
    async def test_last_cl_admin_delete_is_blocked_before_user_deletion(
        self,
        mock_db,
        sample_user_read,
    ) -> None:
        service = UserService()
        authorization_service = Mock()
        authorization_service.resolve_for_user = AsyncMock(return_value=ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN))
        authorization_service.revoke_cl_admin = AsyncMock(side_effect=ForbiddenException("The last active CL Admin cannot be revoked."))
        db_user = {
            **sample_user_read.model_dump(),
            "id": 1,
            "enabled": True,
        }

        with (
            patch("src.app.services.user_service.crud_users") as mock_users,
            patch(
                "src.app.services.user_service.AuthorizationService",
                return_value=authorization_service,
            ),
        ):
            mock_users.get = AsyncMock(return_value=db_user)
            mock_users.delete = AsyncMock(return_value=None)

            with pytest.raises(ForbiddenException, match="last active CL Admin"):
                await service.delete_user(
                    db=mock_db,
                    user_uuid=sample_user_read.uuid,
                    current_user=_cl_admin_user(
                        user_id=1,
                        user_uuid=sample_user_read.uuid,
                    ),
                    token="token-value",
                )

        authorization_service.revoke_cl_admin.assert_awaited_once()
        mock_users.delete.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_update_user_tier_rejects_missing_tier(self, mock_db, sample_user_read) -> None:
        service = UserService()
        user_uuid = str(sample_user_read.uuid)
        tier_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b401"

        with patch("src.app.services.user_service.crud_users") as mock_users:
            mock_users.get = AsyncMock(return_value=sample_user_read.model_dump())

            with patch("src.app.services.user_service.crud_tiers") as mock_tiers:
                mock_tiers.get = AsyncMock(return_value=None)

                with pytest.raises(NotFoundException, match="Tier not found"):
                    await service.update_user_tier(
                        db=mock_db,
                        user_uuid=user_uuid,
                        values=UserTierUpdate(tier_uuid=tier_uuid),
                    )

    @pytest.mark.asyncio
    async def test_get_user_department_returns_none_when_department_missing(self, mock_db, sample_user_read) -> None:
        service = UserService()
        db_user = sample_user_read.model_dump()
        db_user["department_id"] = None
        user_uuid = str(sample_user_read.uuid)

        with patch("src.app.services.user_service.crud_users") as mock_users:
            mock_users.get = AsyncMock(return_value=db_user)

            result = await service.get_user_department(db=mock_db, user_uuid=user_uuid)

        assert result is None

    @pytest.mark.asyncio
    async def test_get_user_department_returns_department_abbreviations(self, mock_db, sample_user_read) -> None:
        service = UserService()
        user_uuid = str(sample_user_read.uuid)
        db_user = sample_user_read.model_dump()
        db_user["department_id"] = 9

        with patch("src.app.services.user_service.crud_users") as mock_users:
            mock_users.get = AsyncMock(return_value=db_user)

            with patch("src.app.services.user_service.crud_departments") as mock_departments:
                mock_departments.get = AsyncMock(
                    return_value={
                        "id": 9,
                        "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b501",
                        "name": "Agriculture and Agri-Food Canada",
                        "abbreviation": "AAFC",
                        "abbreviation_fr": "AAC",
                        "created_at": "2026-03-23T00:00:00Z",
                    }
                )

                result = await service.get_user_department(db=mock_db, user_uuid=user_uuid)

        assert result["department_abbreviation"] == "AAFC"
        assert result["department_abbreviation_fr"] == "AAC"

    @pytest.mark.asyncio
    async def test_update_user_department_rejects_missing_department(self, mock_db, sample_user_read) -> None:
        service = UserService()
        user_uuid = str(sample_user_read.uuid)
        department_abbreviation = "AAFC"

        with patch("src.app.services.user_service.crud_users") as mock_users:
            mock_users.get = AsyncMock(return_value=sample_user_read.model_dump())

            with patch("src.app.services.user_service.crud_departments") as mock_departments:
                mock_departments.get = AsyncMock(return_value=None)

                with pytest.raises(NotFoundException, match="Department not found"):
                    await service.update_user_department(
                        db=mock_db,
                        user_uuid=user_uuid,
                        values=UserDepartmentUpdate(department_abbreviation=department_abbreviation),
                    )

    @pytest.mark.asyncio
    async def test_update_user_department_looks_up_department_by_abbreviation(self, mock_db, sample_user_read) -> None:
        service = UserService()
        user_uuid = str(sample_user_read.uuid)

        with patch("src.app.services.user_service.crud_users") as mock_users:
            mock_users.get = AsyncMock(return_value=sample_user_read.model_dump())
            mock_users.update = AsyncMock(return_value=None)

            with patch("src.app.services.user_service.crud_departments") as mock_departments:
                mock_departments.get = AsyncMock(return_value={"id": 14, "abbreviation": "AAFC"})

                result = await service.update_user_department(
                    db=mock_db,
                    user_uuid=user_uuid,
                    values=UserDepartmentUpdate(department_abbreviation="AAFC"),
                )

        assert result == {"message": f"User {sample_user_read.name} department updated"}
        mock_departments.get.assert_awaited_once_with(
            db=mock_db,
            abbreviation="AAFC",
            is_deleted=False,
            schema_to_select=service.update_user_department.__globals__["DepartmentRead"],
        )
        mock_users.update.assert_awaited_once_with(db=mock_db, object={"department_id": 14}, uuid=user_uuid)
