from unittest.mock import AsyncMock, patch

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
from src.app.schemas.workspace_member import WorkspaceMemberCreate, WorkspaceMemberUpdate
from src.app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
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