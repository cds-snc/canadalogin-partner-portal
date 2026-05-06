from unittest.mock import AsyncMock, patch

import pytest

from src.app.schemas.application_info import (
    ApplicationContactCreate,
    ApplicationContactUpdate,
    ApplicationInfoCreate,
    ApplicationInfoUpdate,
)
from src.app.services.workspace_service import WorkspaceService


class TestApplicationInfoService:
    @pytest.mark.asyncio
    async def test_create_application_info_requires_workspace_admin_and_persists_record(self, mock_db) -> None:
        service = WorkspaceService()
        workspace_uuid = "018f6f83-0000-0000-0000-000000000111"
        values = ApplicationInfoCreate(
            application_name="Benefits Portal",
            about_application="Public-facing benefits service",
            program_line_of_business="Benefits",
            application_url="https://benefits.example.gc.ca",
            application_description="Benefits access for citizens",
            technology="Web portal",
            authentication_protocol="OIDC",
            tech_stack="FastAPI + React",
            has_access_management_layer=True,
            requests_profile_data_pushes=False,
            rollback_strategy="Blue-green rollback",
            credential_assurance_level="2",
            identity_assurance_level="2",
            identity_proofing_method="EXTERNAL_ID_PROVIDER",
            is_cbas=True,
            has_account_recovery=True,
            authority_to_collect_personal_information="Department act",
            has_privacy_notice=True,
            user_types=["PUBLIC"],
            monthly_active_users=12000,
            peak_usage_periods="Tax season",
            personal_information_collected=["FIRST_NAME", "LAST_NAME", "EMAIL_ADDRESS"],
            current_sign_in_options=["GC_KEY"],
            consolidator_used="NONE",
            current_mfa_options="NONE",
            uses_canadalogin_migration=True,
            migration_rationale="Required for migration",
            schedule_blackout_periods="None",
            transition_risks="Risk",
            transition_mitigations="Mitigation",
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 9, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                    mock_application_infos.create = AsyncMock(
                        return_value={
                            "id": 1,
                            "workspace_id": 42,
                            "application_name": "Benefits Portal",
                            "uuid": "018f6f83-0000-0000-0000-000000000222",
                        }
                    )

                    created = await service.create_application_info(
                        db=mock_db,
                        workspace_uuid=workspace_uuid,
                        values=values,
                        current_user={"id": 10},
                    )

        assert created["application_name"] == "Benefits Portal"
        mock_application_infos.create.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_list_application_infos_requires_workspace_membership(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 9, "workspace_id": 42, "user_id": 10, "role": "workspace_viewer"}
                )

                with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                    mock_application_infos.get_multi = AsyncMock(
                        return_value={
                            "data": [
                                {
                                    "id": 1,
                                    "workspace_id": 42,
                                    "application_name": "Benefits Portal",
                                }
                            ]
                        }
                    )

                    with patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications:
                        mock_rp_applications.get = AsyncMock(return_value=None)

                        result = await service.list_application_infos(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000111",
                            current_user={"id": 10},
                        )

        assert result[0]["application_name"] == "Benefits Portal"

    @pytest.mark.asyncio
    async def test_add_application_contact_creates_contact_under_application_info(self, mock_db) -> None:
        service = WorkspaceService()
        values = ApplicationContactCreate(
            first_name="Alex",
            last_name="Martin",
            title_role="Product owner",
            email="alex.martin@example.gc.ca",
            phone_number="555-111-2222",
            alternate_phone_number="555-333-4444",
            contact_type="Business",
            action="ADD",
            contact_roles=["Main support contact", "Authorized Production"],
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 9, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                    mock_application_infos.get = AsyncMock(
                        return_value={"id": 7, "workspace_id": 42, "uuid": "018f6f83-0000-0000-0000-000000000777"}
                    )

                    with patch("src.app.services.workspace_service.crud_application_contacts") as mock_application_contacts:
                        mock_application_contacts.create = AsyncMock(
                            return_value={
                                "id": 3,
                                "application_info_id": 7,
                                "first_name": "Alex",
                                "contact_roles": ["Main support contact", "Authorized Production"],
                            }
                        )

                        created = await service.create_application_contact(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000111",
                            application_info_uuid="018f6f83-0000-0000-0000-000000000777",
                            values=values,
                            current_user={"id": 10},
                        )

        assert created["first_name"] == "Alex"
        assert created["contact_roles"] == ["Main support contact", "Authorized Production"]

    @pytest.mark.asyncio
    async def test_list_application_contacts_returns_nested_contacts(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 9, "workspace_id": 42, "user_id": 10, "role": "workspace_viewer"}
                )

                with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                    mock_application_infos.get = AsyncMock(
                        return_value={"id": 7, "workspace_id": 42, "uuid": "018f6f83-0000-0000-0000-000000000777"}
                    )

                    with patch("src.app.services.workspace_service.crud_application_contacts") as mock_application_contacts:
                        mock_application_contacts.get_multi = AsyncMock(
                            return_value={
                                "data": [
                                    {
                                        "id": 3,
                                        "application_info_id": 7,
                                        "first_name": "Alex",
                                        "last_name": "Martin",
                                    }
                                ]
                            }
                        )

                        result = await service.list_application_contacts(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000111",
                            application_info_uuid="018f6f83-0000-0000-0000-000000000777",
                            current_user={"id": 10},
                        )

        assert result[0]["last_name"] == "Martin"

    @pytest.mark.asyncio
    async def test_update_application_info_requires_workspace_admin_and_updates_record(self, mock_db) -> None:
        service = WorkspaceService()
        values = ApplicationInfoUpdate(
            application_name="Updated Benefits Portal",
            about_application="Updated public-facing benefits service",
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 9, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                    mock_application_infos.get = AsyncMock(
                        return_value={
                            "id": 7,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000777",
                        }
                    )
                    mock_application_infos.update = AsyncMock(
                        return_value={
                            "id": 7,
                            "workspace_id": 42,
                            "application_name": "Updated Benefits Portal",
                        }
                    )

                    updated = await service.update_application_info(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000111",
                        application_info_uuid="018f6f83-0000-0000-0000-000000000777",
                        values=values,
                        current_user={"id": 10},
                    )

        assert updated["application_name"] == "Updated Benefits Portal"
        mock_application_infos.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_delete_application_info_requires_workspace_admin_and_soft_deletes_record(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 9, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                    mock_application_infos.get = AsyncMock(
                        return_value={
                            "id": 7,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000777",
                        }
                    )
                    mock_application_infos.delete = AsyncMock(return_value=True)

                    result = await service.delete_application_info(
                        db=mock_db,
                        workspace_uuid="018f6f83-0000-0000-0000-000000000111",
                        application_info_uuid="018f6f83-0000-0000-0000-000000000777",
                        current_user={"id": 10},
                    )

        assert result == {"message": "application info deleted"}
        mock_application_infos.delete.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_update_application_contact_requires_workspace_admin_and_updates_record(self, mock_db) -> None:
        service = WorkspaceService()
        values = ApplicationContactUpdate(
            title_role="Director",
            phone_number="555-999-0000",
        )

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 9, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                    mock_application_infos.get = AsyncMock(
                        return_value={
                            "id": 7,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000777",
                        }
                    )

                    with patch("src.app.services.workspace_service.crud_application_contacts") as mock_application_contacts:
                        mock_application_contacts.get = AsyncMock(
                            return_value={
                                "id": 3,
                                "application_info_id": 7,
                                "uuid": "018f6f83-0000-0000-0000-000000000333",
                            }
                        )
                        mock_application_contacts.update = AsyncMock(
                            return_value={
                                "id": 3,
                                "application_info_id": 7,
                                "title_role": "Director",
                                "phone_number": "555-999-0000",
                            }
                        )

                        updated = await service.update_application_contact(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000111",
                            application_info_uuid="018f6f83-0000-0000-0000-000000000777",
                            application_contact_uuid="018f6f83-0000-0000-0000-000000000333",
                            values=values,
                            current_user={"id": 10},
                        )

        assert updated["title_role"] == "Director"
        mock_application_contacts.update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_delete_application_contact_requires_workspace_admin_and_soft_deletes_record(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock(return_value={"id": 42, "department_id": 7})

            with patch("src.app.services.workspace_service.crud_workspace_members") as mock_members:
                mock_members.get = AsyncMock(
                    return_value={"id": 9, "workspace_id": 42, "user_id": 10, "role": "workspace_admin"}
                )

                with patch("src.app.services.workspace_service.crud_application_infos") as mock_application_infos:
                    mock_application_infos.get = AsyncMock(
                        return_value={
                            "id": 7,
                            "workspace_id": 42,
                            "uuid": "018f6f83-0000-0000-0000-000000000777",
                        }
                    )

                    with patch("src.app.services.workspace_service.crud_application_contacts") as mock_application_contacts:
                        mock_application_contacts.get = AsyncMock(
                            return_value={
                                "id": 3,
                                "application_info_id": 7,
                                "uuid": "018f6f83-0000-0000-0000-000000000333",
                            }
                        )
                        mock_application_contacts.delete = AsyncMock(return_value=True)

                        result = await service.delete_application_contact(
                            db=mock_db,
                            workspace_uuid="018f6f83-0000-0000-0000-000000000111",
                            application_info_uuid="018f6f83-0000-0000-0000-000000000777",
                            application_contact_uuid="018f6f83-0000-0000-0000-000000000333",
                            current_user={"id": 10},
                        )

        assert result == {"message": "application contact deleted"}
        mock_application_contacts.delete.assert_awaited_once()
