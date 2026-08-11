from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.core.exceptions.http_exceptions import (
    CustomException,
    DuplicateValueException,
    ForbiddenException,
    NotFoundException,
)
from src.app.schemas.application_information import (
    ApplicationInformationContactCreate,
    ApplicationInformationCreate,
)
from src.app.schemas.rp_application import (
    WorkspaceRPApplicationRegistrationCreate,
    WorkspaceRPApplicationRegistrationUpdate,
)
from src.app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from src.app.schemas.workspace_member import WorkspaceMemberCreate, WorkspaceMemberUpdate
from src.app.services.workspace_service import WorkspaceService


class TestWorkspaceService:
    @pytest.mark.asyncio
    async def test_create_workspace_rejects_missing_department(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_departments") as mock_departments:
            mock_departments.get = AsyncMock(return_value=None)

            with pytest.raises(NotFoundException, match="Department not found"):
                await service.create_workspace(
                    db=mock_db,
                    workspace=WorkspaceCreate(
                        name="Benefits Workspace",
                        department_uuid="018f6f83-0000-0000-0000-000000000101",
                    ),
                    current_user={"id": 42},
                )

    @pytest.mark.asyncio
    async def test_create_workspace_generates_slug_and_sets_department(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_departments") as mock_departments,
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
        ):
            mock_departments.get = AsyncMock(return_value={"id": 7})
            mock_workspaces.get = AsyncMock(return_value=None)
            mock_workspaces.create = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.create = AsyncMock(return_value={"id": 1})

            result = await service.create_workspace(
                db=mock_db,
                workspace=WorkspaceCreate(
                    name="Benefits Workspace",
                    description="Primary workspace",
                    department_uuid="018f6f83-0000-0000-0000-000000000101",
                ),
                current_user={"id": 42},
            )

        assert result["slug"] == "benefits-workspace"
        mock_workspaces.create.assert_awaited_once()
        create_kwargs = mock_workspaces.create.await_args.kwargs
        assert create_kwargs["object"].department_id == 7
        assert create_kwargs["object"].created_by == 42
        assert create_kwargs["object"].slug == "benefits-workspace"
        mock_workspace_members.create.assert_awaited_once()
        membership_kwargs = mock_workspace_members.create.await_args.kwargs
        assert membership_kwargs["object"].workspace_id == 9
        assert membership_kwargs["object"].user_id == 42
        assert membership_kwargs["object"].invited_by == 42
        assert membership_kwargs["object"].role == "workspace_admin"

    @pytest.mark.asyncio
    async def test_create_workspace_rejects_duplicate_slug(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_departments") as mock_departments,
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
        ):
            mock_departments.get = AsyncMock(return_value={"id": 7})
            mock_workspaces.get = AsyncMock(return_value={"uuid": "018f6f83-0000-0000-0000-000000000201"})

            with pytest.raises(DuplicateValueException, match="Workspace slug not available"):
                await service.create_workspace(
                    db=mock_db,
                    workspace=WorkspaceCreate(
                        name="Benefits Workspace",
                        slug="benefits-workspace",
                        department_uuid="018f6f83-0000-0000-0000-000000000101",
                    ),
                    current_user={"id": 42},
                )

    @pytest.mark.asyncio
    async def test_list_workspaces_filters_out_soft_deleted_workspaces(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get_multi = AsyncMock(
                return_value={
                    "data": [],
                    "total_count": 0,
                    "has_more": False,
                    "page": 1,
                    "items_per_page": 10,
                }
            )

            result = await service.list_workspaces(db=mock_db)

        assert result == []
        mock_workspaces.get_multi.assert_awaited_once_with(
            db=mock_db,
            is_deleted=False,
            schema_to_select=service.list_workspaces.__globals__["WorkspaceRead"],
        )

    @pytest.mark.asyncio
    async def test_list_current_user_workspaces_filters_to_active_memberships(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
        ):
            mock_workspace_members.get_multi = AsyncMock(
                return_value={
                    "data": [
                        {"workspace_id": 9},
                        {"workspace_id": 11},
                        {"workspace_id": 9},
                    ]
                }
            )
            mock_workspaces.get = AsyncMock(
                side_effect=[
                    {
                        "id": 9,
                        "uuid": "018f6f83-0000-0000-0000-000000000201",
                        "name": "Benefits Workspace",
                        "slug": "benefits-workspace",
                        "department_id": 7,
                        "description": "Primary workspace",
                        "created_by": 42,
                        "created_at": "2026-07-30T12:00:00",
                        "updated_at": None,
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                    {
                        "id": 11,
                        "uuid": "018f6f83-0000-0000-0000-000000000202",
                        "name": "Claims Workspace",
                        "slug": "claims-workspace",
                        "department_id": 8,
                        "description": "Claims workspace",
                        "created_by": 42,
                        "created_at": "2026-07-30T13:00:00",
                        "updated_at": None,
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                ]
            )

            result = await service.list_current_user_workspaces(
                db=mock_db,
                current_user={"id": 42, "is_superuser": False},
            )

        assert [workspace["id"] for workspace in result] == [9, 11]
        mock_workspace_members.get_multi.assert_awaited_once_with(
            db=mock_db,
            user_id=42,
            is_deleted=False,
            schema_to_select=service.list_current_user_workspaces.__globals__["WorkspaceMemberRead"],
        )
        assert mock_workspaces.get.await_count == 2

    @pytest.mark.asyncio
    async def test_list_current_user_workspaces_delegates_to_all_for_superuser(self, mock_db) -> None:
        service = WorkspaceService()
        all_workspaces = [{"id": 9, "uuid": "018f6f83-0000-0000-0000-000000000201"}]

        with patch.object(service, "list_workspaces", AsyncMock(return_value=all_workspaces)) as mock_list_workspaces:
            result = await service.list_current_user_workspaces(
                db=mock_db,
                current_user={"id": 42, "is_superuser": True},
            )

        assert result == all_workspaces
        mock_list_workspaces.assert_awaited_once_with(db=mock_db)

    @pytest.mark.asyncio
    async def test_get_workspace_by_uuid_raises_when_missing(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value=None)

            with pytest.raises(NotFoundException, match="Workspace not found"):
                await service.get_workspace_by_uuid(
                    db=mock_db,
                    workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                )

        mock_workspaces.get.assert_awaited_once_with(
            db=mock_db,
            uuid="018f6f83-0000-0000-0000-000000000201",
            is_deleted=False,
            schema_to_select=service.get_workspace_by_uuid.__globals__["WorkspaceRead"],
        )

    @pytest.mark.asyncio
    async def test_get_workspace_by_uuid_hides_workspace_when_current_user_is_not_a_member(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(return_value=None)

            with pytest.raises(NotFoundException, match="Workspace not found"):
                await service.get_workspace_by_uuid(
                    db=mock_db,
                    workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                    current_user={"id": 55, "is_superuser": False},
                )

        mock_workspace_members.get.assert_awaited_once_with(
            db=mock_db,
            workspace_id=9,
            user_id=55,
            is_deleted=False,
        )

    @pytest.mark.asyncio
    async def test_update_workspace_updates_department_and_regenerated_slug(self, mock_db) -> None:
        service = WorkspaceService()
        workspace_uuid = "018f6f83-0000-0000-0000-000000000201"

        with (
            patch("src.app.services.workspace_service.crud_departments") as mock_departments,
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
        ):
            mock_departments.get = AsyncMock(return_value={"id": 11})
            mock_workspaces.get = AsyncMock(
                side_effect=[
                    {
                        "id": 9,
                        "uuid": workspace_uuid,
                        "name": "Benefits Workspace",
                        "slug": "benefits-workspace",
                        "department_id": 7,
                        "description": "Primary workspace",
                        "created_by": 42,
                        "created_at": "2026-07-30T12:00:00",
                        "updated_at": None,
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                    None,
                    {
                        "id": 9,
                        "uuid": workspace_uuid,
                        "name": "Renamed Workspace",
                        "slug": "renamed-workspace",
                        "department_id": 11,
                        "description": "Updated workspace",
                        "created_by": 42,
                        "created_at": "2026-07-30T12:00:00",
                        "updated_at": "2026-07-30T13:00:00",
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                ]
            )
            mock_workspaces.update = AsyncMock(return_value=None)

            result = await service.update_workspace(
                db=mock_db,
                workspace_uuid=workspace_uuid,
                values=WorkspaceUpdate(
                    name="Renamed Workspace",
                    slug=None,
                    description="Updated workspace",
                    department_uuid="018f6f83-0000-0000-0000-000000000301",
                ),
            )

        assert result["department_id"] == 11
        assert result["slug"] == "renamed-workspace"
        mock_workspaces.update.assert_awaited_once_with(
            db=mock_db,
            object={
                "name": "Renamed Workspace",
                "slug": "renamed-workspace",
                "description": "Updated workspace",
                "department_id": 11,
            },
            uuid=workspace_uuid,
        )

    @pytest.mark.asyncio
    async def test_list_workspace_members_rejects_non_admin_members(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(return_value=None)

            with pytest.raises(ForbiddenException, match="You do not have enough privileges"):
                await service.list_workspace_members(
                    db=mock_db,
                    workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                    current_user={"id": 55, "is_superuser": False},
                )

    @pytest.mark.asyncio
    async def test_add_workspace_member_rejects_duplicate_membership(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_users") as mock_users,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(
                side_effect=[
                    {"role": "workspace_admin"},
                    {"uuid": "018f6f83-0000-0000-0000-000000000401"},
                ]
            )
            mock_users.get = AsyncMock(return_value={"id": 99, "uuid": "018f6f83-0000-0000-0000-000000000301"})

            with pytest.raises(DuplicateValueException, match="User is already a workspace member"):
                await service.add_workspace_member(
                    db=mock_db,
                    workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                    payload=WorkspaceMemberCreate(
                        user_uuid="018f6f83-0000-0000-0000-000000000301",
                        role="workspace_member",
                    ),
                    current_user={"id": 42, "is_superuser": False},
                )

    @pytest.mark.asyncio
    async def test_add_workspace_member_creates_membership_with_user_details(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_users") as mock_users,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(side_effect=[{"role": "workspace_admin"}, None])
            mock_workspace_members.create = AsyncMock(
                return_value={
                    "id": 12,
                    "uuid": "018f6f83-0000-0000-0000-000000000402",
                    "workspace_id": 9,
                    "user_id": 99,
                    "role": "workspace_member",
                    "created_at": "2026-07-30T14:00:00",
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_users.get = AsyncMock(
                side_effect=[
                    {
                        "id": 99,
                        "uuid": "018f6f83-0000-0000-0000-000000000301",
                        "email": "member@example.gc.ca",
                        "name": "Member User",
                    },
                    {
                        "id": 99,
                        "uuid": "018f6f83-0000-0000-0000-000000000301",
                        "email": "member@example.gc.ca",
                        "name": "Member User",
                    },
                ]
            )

            result = await service.add_workspace_member(
                db=mock_db,
                workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                payload=WorkspaceMemberCreate(
                    user_uuid="018f6f83-0000-0000-0000-000000000301",
                    role="workspace_member",
                ),
                current_user={"id": 42, "is_superuser": False},
            )

        assert result["user_email"] == "member@example.gc.ca"
        assert result["user_name"] == "Member User"
        assert result["role"] == "workspace_member"

    @pytest.mark.asyncio
    async def test_update_workspace_member_role_changes_role(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_users") as mock_users,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(
                side_effect=[
                    {"role": "workspace_admin"},
                    {
                        "id": 12,
                        "uuid": "018f6f83-0000-0000-0000-000000000402",
                        "workspace_id": 9,
                        "user_id": 99,
                        "role": "workspace_member",
                        "created_at": "2026-07-30T14:00:00",
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                    {
                        "id": 12,
                        "uuid": "018f6f83-0000-0000-0000-000000000402",
                        "workspace_id": 9,
                        "user_id": 99,
                        "role": "workspace_admin",
                        "created_at": "2026-07-30T14:00:00",
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                ]
            )
            mock_workspace_members.update = AsyncMock(return_value=None)
            mock_users.get = AsyncMock(
                side_effect=[
                    {"id": 99, "uuid": "018f6f83-0000-0000-0000-000000000301"},
                    {
                        "id": 99,
                        "uuid": "018f6f83-0000-0000-0000-000000000301",
                        "email": "member@example.gc.ca",
                        "name": "Member User",
                    },
                ]
            )

            result = await service.update_workspace_member_role(
                db=mock_db,
                workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                user_uuid="018f6f83-0000-0000-0000-000000000301",
                payload=WorkspaceMemberUpdate(role="workspace_admin"),
                current_user={"id": 42, "is_superuser": False},
            )

        assert result["role"] == "workspace_admin"
        mock_workspace_members.update.assert_awaited_once_with(
            db=mock_db,
            object={"role": "workspace_admin"},
            uuid="018f6f83-0000-0000-0000-000000000402",
        )

    @pytest.mark.asyncio
    async def test_remove_workspace_member_soft_deletes_membership(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_users") as mock_users,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(
                side_effect=[
                    {"role": "workspace_admin"},
                    {
                        "id": 12,
                        "uuid": "018f6f83-0000-0000-0000-000000000402",
                        "workspace_id": 9,
                        "user_id": 99,
                        "role": "workspace_member",
                        "created_at": "2026-07-30T14:00:00",
                        "deleted_at": None,
                        "is_deleted": False,
                    },
                ]
            )
            mock_workspace_members.delete = AsyncMock(return_value=None)
            mock_users.get = AsyncMock(return_value={"id": 99, "uuid": "018f6f83-0000-0000-0000-000000000301"})

            result = await service.remove_workspace_member(
                db=mock_db,
                workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                user_uuid="018f6f83-0000-0000-0000-000000000301",
                current_user={"id": 42, "is_superuser": False},
            )

        assert result == {"message": "Workspace member removed"}
        mock_workspace_members.delete.assert_awaited_once_with(
            db=mock_db,
            uuid="018f6f83-0000-0000-0000-000000000402",
        )

    @pytest.mark.asyncio
    async def test_create_workspace_application_information_sets_workspace_and_creator(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_application_information") as mock_application_information,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(return_value={"role": "workspace_admin"})
            mock_application_information.create = AsyncMock(
                return_value={
                    "id": 17,
                    "uuid": "018f6f83-0000-0000-0000-000000000501",
                    "workspace_id": 9,
                    "created_by": 42,
                    "service_name_en": "Example service",
                    "service_name_fr": "Service exemple",
                    "overview": "Overview",
                    "technology_and_protocol": "OIDC",
                    "security_and_privacy": "Protected B",
                    "usage": "Usage",
                    "migration_or_transition_plan": "Plan",
                    "created_at": "2026-07-30T15:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )

            result = await service.create_workspace_application_information(
                db=mock_db,
                workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                payload=ApplicationInformationCreate(
                    service_name_en="Example service",
                    service_name_fr="Service exemple",
                    overview="Overview",
                    technology_and_protocol="OIDC",
                    security_and_privacy="Protected B",
                    usage="Usage",
                    migration_or_transition_plan="Plan",
                ),
                current_user={"id": 42, "is_superuser": False},
            )

        assert result["workspace_id"] == 9
        create_kwargs = mock_application_information.create.await_args.kwargs
        assert create_kwargs["object"].workspace_id == 9
        assert create_kwargs["object"].created_by == 42
        assert create_kwargs["object"].service_name_en == "Example service"
        assert create_kwargs["object"].service_name_fr == "Service exemple"

    @pytest.mark.asyncio
    async def test_delete_workspace_application_information_rejects_linked_rp_applications(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_application_information") as mock_application_information,
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(return_value={"role": "workspace_admin"})
            mock_application_information.get = AsyncMock(
                return_value={
                    "id": 17,
                    "uuid": "018f6f83-0000-0000-0000-000000000501",
                    "workspace_id": 9,
                    "created_by": 42,
                    "service_name_en": "Example service",
                    "service_name_fr": "Service exemple",
                    "overview": "Overview",
                    "technology_and_protocol": "OIDC",
                    "security_and_privacy": "Protected B",
                    "usage": "Usage",
                    "migration_or_transition_plan": "Plan",
                    "created_at": "2026-07-30T15:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_rp_applications.exists = AsyncMock(return_value=True)

            with pytest.raises(
                CustomException,
                match="Linked RP applications must be unlinked or removed before deleting application information",
            ):
                await service.delete_workspace_application_information(
                    db=mock_db,
                    workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                    application_information_uuid="018f6f83-0000-0000-0000-000000000501",
                    current_user={"id": 42, "is_superuser": False},
                )

        mock_rp_applications.exists.assert_awaited_once_with(
            db=mock_db,
            application_information_id=17,
            is_deleted=False,
        )

    @pytest.mark.asyncio
    async def test_add_application_information_contact_sets_parent_and_creator(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_application_information") as mock_application_information,
            patch("src.app.services.workspace_service.crud_application_information_contacts") as mock_contacts,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(return_value={"role": "workspace_admin"})
            mock_application_information.get = AsyncMock(
                return_value={
                    "id": 17,
                    "uuid": "018f6f83-0000-0000-0000-000000000501",
                    "workspace_id": 9,
                    "created_by": 42,
                    "service_name_en": "Example service",
                    "service_name_fr": "Service exemple",
                    "overview": "Overview",
                    "technology_and_protocol": "OIDC",
                    "security_and_privacy": "Protected B",
                    "usage": "Usage",
                    "migration_or_transition_plan": "Plan",
                    "created_at": "2026-07-30T15:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_contacts.create = AsyncMock(
                return_value={
                    "id": 3,
                    "uuid": "018f6f83-0000-0000-0000-000000000601",
                    "application_information_id": 17,
                    "created_by": 42,
                    "name_en": "Jane Doe",
                    "name_fr": "Jeanne Doe",
                    "responsibility_en": "Product owner",
                    "responsibility_fr": "Responsable du produit",
                    "email": "jane.doe@example.gc.ca",
                    "phone_number": "555-555-5555",
                    "created_at": "2026-07-30T15:15:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )

            result = await service.add_application_information_contact(
                db=mock_db,
                workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                application_information_uuid="018f6f83-0000-0000-0000-000000000501",
                payload=ApplicationInformationContactCreate(
                    name_en="Jane Doe",
                    name_fr="Jeanne Doe",
                    responsibility_en="Product owner",
                    responsibility_fr="Responsable du produit",
                    email="jane.doe@example.gc.ca",
                    phone_number="555-555-5555",
                ),
                current_user={"id": 42, "is_superuser": False},
            )

        assert result["application_information_id"] == 17
        create_kwargs = mock_contacts.create.await_args.kwargs
        assert create_kwargs["object"].application_information_id == 17
        assert create_kwargs["object"].created_by == 42
        assert str(create_kwargs["object"].email) == "jane.doe@example.gc.ca"

    @pytest.mark.asyncio
    async def test_create_workspace_rp_application_sets_workspace_department_and_registration_payload(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_application_information") as mock_application_information,
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(return_value={"role": "workspace_admin"})
            mock_application_information.get = AsyncMock(
                return_value={
                    "id": 17,
                    "uuid": "018f6f83-0000-0000-0000-000000000501",
                    "workspace_id": 9,
                    "service_name_en": "Benefits Portal",
                    "service_name_fr": "Portail des prestations",
                    "overview": "Overview",
                    "technology_and_protocol": "OIDC",
                    "security_and_privacy": "Protected B",
                    "usage": "Usage",
                    "migration_or_transition_plan": "Plan",
                    "created_at": "2026-07-30T15:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_rp_applications.create = AsyncMock(
                return_value={
                    "id": 33,
                    "uuid": "018f6f83-0000-0000-0000-000000000701",
                    "workspace_id": 9,
                    "department_id": 7,
                    "application_information_id": 17,
                    "dnr_app_name": "Benefits Portal",
                    "canada_login_environment": "staging",
                    "status": None,
                    "created_by": 42,
                    "created_at": "2026-07-30T16:00:00",
                    "deleted_at": None,
                    "is_deleted": False,
                    "ibm_sv_application_id": None,
                    "oidc_registration_payload": {"service_name_en": "Benefits Portal"},
                    "application_owner": None,
                }
            )

            result = await service.create_workspace_rp_application(
                db=mock_db,
                workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                payload=WorkspaceRPApplicationRegistrationCreate(
                    application_information_uuid="018f6f83-0000-0000-0000-000000000501",
                    canada_login_environment="staging",
                    service_name_en="Benefits Portal",
                    service_name_fr="Portail des prestations",
                    application_environment_url_en="https://benefits.canada.ca",
                    application_environment_url_fr="https://prestations.canada.ca",
                    redirect_uris=["https://benefits.canada.ca/callback"],
                    post_logout_redirect_uris=["https://benefits.canada.ca/logout-complete"],
                    logout_mode="front_channel",
                    logout_uri="https://benefits.canada.ca/logout",
                    client_type="confidential",
                    supports_authorization_code_flow=True,
                    client_auth_method="client_secret_basic",
                    requested_scopes=["openid", "profile"],
                    sector_identifier="https://benefits.canada.ca",
                    shares_pairwise_identifiers=False,
                    pkce_supported=True,
                    pkce_algorithms=["S256"],
                    request_signing_supported=False,
                    request_signing_roadmap=False,
                    signature_validation_supported=True,
                    signature_validation_targets=["id_token"],
                    signature_validation_algorithms=["RS256"],
                    request_encryption_supported=False,
                    request_encryption_roadmap=False,
                    message_decryption_supported=True,
                    message_decryption_targets=["id_token"],
                    message_decryption_key_management_algorithms=["RSA-OAEP-256"],
                    message_decryption_content_algorithms=["A256GCM"],
                ),
                current_user={"id": 42, "is_superuser": False},
            )

        assert result["workspace_id"] == 9
        create_kwargs = mock_rp_applications.create.await_args.kwargs
        assert create_kwargs["object"].workspace_id == 9
        assert create_kwargs["object"].department_id == 7
        assert create_kwargs["object"].application_information_id == 17
        assert create_kwargs["object"].dnr_app_name == "Benefits Portal"
        assert create_kwargs["object"].canada_login_environment == "staging"
        assert create_kwargs["object"].oidc_registration_payload["client_type"] == "confidential"

    @pytest.mark.asyncio
    async def test_update_workspace_rp_application_merges_questionnaire_payload(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(return_value={"role": "workspace_admin"})
            mock_rp_applications.get = AsyncMock(
                side_effect=[
                    {
                        "id": 33,
                        "uuid": "018f6f83-0000-0000-0000-000000000701",
                        "workspace_id": 9,
                        "department_id": 7,
                        "application_information_id": 17,
                        "dnr_app_name": "Benefits Portal",
                        "canada_login_environment": "staging",
                        "status": None,
                        "created_by": 42,
                        "created_at": "2026-07-30T16:00:00",
                        "deleted_at": None,
                        "is_deleted": False,
                        "ibm_sv_application_id": None,
                        "oidc_registration_payload": {
                            "service_name_en": "Benefits Portal",
                            "pkce_supported": True,
                            "requested_scopes": ["openid", "profile"],
                        },
                        "application_owner": None,
                    },
                    {
                        "id": 33,
                        "uuid": "018f6f83-0000-0000-0000-000000000701",
                        "workspace_id": 9,
                        "department_id": 7,
                        "application_information_id": 17,
                        "dnr_app_name": "Benefits Portal Updated",
                        "canada_login_environment": "staging",
                        "status": None,
                        "created_by": 42,
                        "created_at": "2026-07-30T16:00:00",
                        "deleted_at": None,
                        "is_deleted": False,
                        "ibm_sv_application_id": None,
                        "oidc_registration_payload": {
                            "service_name_en": "Benefits Portal Updated",
                            "pkce_supported": True,
                            "requested_scopes": ["openid", "profile", "email"],
                        },
                        "application_owner": None,
                    },
                ]
            )
            mock_rp_applications.update = AsyncMock(return_value=None)

            result = await service.update_workspace_rp_application(
                db=mock_db,
                workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                rp_application_uuid="018f6f83-0000-0000-0000-000000000701",
                payload=WorkspaceRPApplicationRegistrationUpdate(
                    service_name_en="Benefits Portal Updated",
                    requested_scopes=["openid", "profile", "email"],
                ),
                current_user={"id": 42, "is_superuser": False},
            )

        assert result["dnr_app_name"] == "Benefits Portal Updated"
        update_kwargs = mock_rp_applications.update.await_args.kwargs
        assert update_kwargs["object"]["dnr_app_name"] == "Benefits Portal Updated"
        assert update_kwargs["object"]["oidc_registration_payload"]["requested_scopes"] == [
            "openid",
            "profile",
            "email",
        ]

    @pytest.mark.asyncio
    async def test_get_workspace_rp_application_usage_summary_uses_ibm_admin_telemetry_for_selected_day(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()
        mock_ibm_sv_admin_service = Mock()
        mock_ibm_sv_admin_service.get_application_total_logins = AsyncMock(
            return_value={"response": {"total": 11, "successful": 9, "failed": 2}}
        )

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(return_value={"role": "workspace_admin"})
            mock_rp_applications.get = AsyncMock(
                return_value={
                    "id": 33,
                    "uuid": "018f6f83-0000-0000-0000-000000000701",
                    "workspace_id": 9,
                    "department_id": 7,
                    "application_information_id": 17,
                    "dnr_app_name": "Benefits Portal",
                    "canada_login_environment": "staging",
                    "status": None,
                    "created_by": 42,
                    "created_at": "2026-07-30T16:00:00",
                    "deleted_at": None,
                    "is_deleted": False,
                    "ibm_sv_application_id": "ibm-app-123",
                    "oidc_registration_payload": {},
                    "application_owner": None,
                }
            )

            result = await service.get_workspace_rp_application_usage_summary(
                db=mock_db,
                workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                rp_application_uuid="018f6f83-0000-0000-0000-000000000701",
                current_user={"id": 42, "is_superuser": False},
                ibm_sv_admin_service=mock_ibm_sv_admin_service,
                selected_date="1775692800000",
            )

        assert result == {"total": 11, "succeeded": 9, "failed": 2}
        mock_ibm_sv_admin_service.get_application_total_logins.assert_awaited_once_with(
            application_id="ibm-app-123",
            from_date="1775692800000",
            to_date="1775779199999",
        )

    @pytest.mark.asyncio
    async def test_get_workspace_rp_application_audit_events_search_after_delegates_cursor(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()
        mock_ibm_sv_admin_service = Mock()
        mock_ibm_sv_admin_service.get_application_audit_trail_search_after = AsyncMock(
            return_value={"events": [], "next": None, "total": 20}
        )

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(return_value={"role": "workspace_admin"})
            mock_rp_applications.get = AsyncMock(
                return_value={
                    "id": 33,
                    "uuid": "018f6f83-0000-0000-0000-000000000701",
                    "workspace_id": 9,
                    "department_id": 7,
                    "application_information_id": 17,
                    "dnr_app_name": "Benefits Portal",
                    "canada_login_environment": "staging",
                    "status": None,
                    "created_by": 42,
                    "created_at": "2026-07-30T16:00:00",
                    "deleted_at": None,
                    "is_deleted": False,
                    "ibm_sv_application_id": "ibm-app-123",
                    "oidc_registration_payload": {},
                    "application_owner": None,
                }
            )

            result = await service.get_workspace_rp_application_audit_events_search_after(
                db=mock_db,
                workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                rp_application_uuid="018f6f83-0000-0000-0000-000000000701",
                current_user={"id": 42, "is_superuser": False},
                ibm_sv_admin_service=mock_ibm_sv_admin_service,
                selected_date="1775692800000",
                size=25,
                search_after='"1775692800000", "event-2"',
            )

        assert result == {"events": [], "next": None, "total": 20}
        mock_ibm_sv_admin_service.get_application_audit_trail_search_after.assert_awaited_once_with(
            application_id="ibm-app-123",
            from_date="1775692800000",
            to_date="1775779199999",
            size=25,
            search_after='"1775692800000", "event-2"',
        )

    @pytest.mark.asyncio
    async def test_get_workspace_rp_application_usage_summary_rejects_missing_ibm_application_id(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()
        mock_ibm_sv_admin_service = Mock()
        mock_ibm_sv_admin_service.get_application_total_logins = AsyncMock()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members") as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications,
        ):
            mock_workspaces.get = AsyncMock(
                return_value={
                    "id": 9,
                    "uuid": "018f6f83-0000-0000-0000-000000000201",
                    "name": "Benefits Workspace",
                    "slug": "benefits-workspace",
                    "department_id": 7,
                    "description": "Primary workspace",
                    "created_by": 42,
                    "created_at": "2026-07-30T12:00:00",
                    "updated_at": None,
                    "deleted_at": None,
                    "is_deleted": False,
                }
            )
            mock_workspace_members.get = AsyncMock(return_value={"role": "workspace_admin"})
            mock_rp_applications.get = AsyncMock(
                return_value={
                    "id": 33,
                    "uuid": "018f6f83-0000-0000-0000-000000000701",
                    "workspace_id": 9,
                    "department_id": 7,
                    "application_information_id": 17,
                    "dnr_app_name": "Benefits Portal",
                    "canada_login_environment": "staging",
                    "status": None,
                    "created_by": 42,
                    "created_at": "2026-07-30T16:00:00",
                    "deleted_at": None,
                    "is_deleted": False,
                    "ibm_sv_application_id": None,
                    "oidc_registration_payload": {},
                    "application_owner": None,
                }
            )

            with pytest.raises(CustomException) as exc_info:
                await service.get_workspace_rp_application_usage_summary(
                    db=mock_db,
                    workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                    rp_application_uuid="018f6f83-0000-0000-0000-000000000701",
                    current_user={"id": 42, "is_superuser": False},
                    ibm_sv_admin_service=mock_ibm_sv_admin_service,
                )

        assert exc_info.value.status_code == 409
        assert exc_info.value.detail == "RP application is not linked to an IBM Security Verify application"
        mock_ibm_sv_admin_service.get_application_total_logins.assert_not_called()
