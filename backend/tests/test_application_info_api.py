import uuid
from unittest.mock import AsyncMock, Mock

import pytest
from pydantic import ValidationError

from src.app.api.v1.workspaces import (
    create_application_contact,
    create_application_info,
    delete_application_contact,
    delete_application_info,
    list_application_contacts,
    list_application_infos,
    update_application_contact,
    update_application_info,
)
from src.app.schemas.application_info import (
    ApplicationContactCreate,
    ApplicationContactUpdate,
    ApplicationInfoCreate,
    ApplicationInfoUpdate,
)


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


def build_application_info_payload(**overrides):
    payload = {
        "about_application": "Public-facing benefits service",
        "application_description": "Benefits access for citizens",
        "application_name": "Benefits Portal",
        "application_url": "https://benefits.example.gc.ca",
        "authority_to_collect_personal_information": "Department act",
        "authentication_protocol": "OIDC",
        "created_at": "2026-04-08T00:00:00",
        "created_by": 10,
        "credential_assurance_level": "2",
        "current_mfa_options": "NONE",
        "current_sign_in_options": ["GC_KEY"],
        "has_access_management_layer": True,
        "has_account_recovery": True,
        "has_privacy_notice": True,
        "id": 201,
        "identity_assurance_level": "2",
        "identity_proofing_method": "EXTERNAL_ID_PROVIDER",
        "is_cbas": True,
        "is_deleted": False,
        "personal_information_collected": ["FIRST_NAME", "EMAIL_ADDRESS"],
        "program_line_of_business": "Benefits",
        "requests_profile_data_pushes": False,
        "rollback_strategy": "Blue-green rollback",
        "tech_stack": "FastAPI + React",
        "technology": "Web portal",
        "user_types": ["PUBLIC"],
        "uses_canadalogin_migration": True,
        "uuid": "018f6f83-0000-0000-0000-000000000201",
        "workspace_id": 101,
    }
    payload.update(overrides)
    return payload


def build_application_contact_payload(**overrides):
    payload = {
        "application_info_id": 201,
        "contact_roles": ["Main support contact"],
        "created_at": "2026-04-08T00:00:00",
        "email": "alex.martin@example.gc.ca",
        "first_name": "Alex",
        "id": 301,
        "is_deleted": False,
        "last_name": "Martin",
        "phone_number": "555-111-2222",
        "title_role": "Product owner",
        "uuid": "018f6f83-0000-0000-0000-000000000301",
    }
    payload.update(overrides)
    return payload


class TestApplicationInfoRoutes:
    def test_application_info_create_accepts_enum_keys(self) -> None:
        payload = ApplicationInfoCreate(
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
            current_sign_in_options=["GC_KEY", "INTERAC_SIGN_IN"],
            user_types=["PUBLIC"],
            personal_information_collected=["FIRST_NAME", "EMAIL_ADDRESS"],
            consolidator_used="NONE",
            current_mfa_options="MFAAS_3",
            uses_canadalogin_migration=False,
        )

        assert payload.identity_proofing_method == "EXTERNAL_ID_PROVIDER"
        assert payload.current_sign_in_options == ["GC_KEY", "INTERAC_SIGN_IN"]

    def test_application_info_create_rejects_unsupported_select_values(self) -> None:
        with pytest.raises(ValidationError):
            ApplicationInfoCreate(
                application_name="Benefits Portal",
                about_application="Public-facing benefits service",
                program_line_of_business="Benefits",
                application_url="https://benefits.example.gc.ca",
                application_description="Benefits access for citizens",
                technology="Web portal",
                authentication_protocol="Unsupported protocol",
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
                current_sign_in_options=["UNSUPPORTED_SIGN_IN"],
                user_types=["PUBLIC"],
                personal_information_collected=["FIRST_NAME"],
                consolidator_used="Unknown consolidator",
                current_mfa_options="Unknown MFA",
                uses_canadalogin_migration=False,
            )

    def test_application_info_create_requires_other_detail_when_needed(self) -> None:
        with pytest.raises(ValidationError):
            ApplicationInfoCreate(
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
                identity_proofing_method="OTHER",
                is_cbas=True,
                has_account_recovery=True,
                authority_to_collect_personal_information="Department act",
                has_privacy_notice=True,
                current_sign_in_options=["GC_KEY"],
                user_types=["PUBLIC"],
                personal_information_collected=["FIRST_NAME"],
                consolidator_used="NONE",
                current_mfa_options="NONE",
                uses_canadalogin_migration=False,
            )

    @pytest.mark.asyncio
    async def test_create_application_info_delegates_to_service(self, mock_db):
        mock_service = Mock()
        mock_service.create_application_info = AsyncMock(
            return_value=build_application_info_payload()
        )

        result = await unwrap_endpoint(create_application_info)(
            Mock(),
            "018f6f83-0000-0000-0000-000000000111",
            ApplicationInfoCreate(
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
            ),
            {"id": 10},
            mock_db,
            mock_service,
        )

        assert result.application_name == "Benefits Portal"
        mock_service.create_application_info.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_list_application_infos_delegates_to_service(self, mock_db):
        mock_service = Mock()
        mock_service.list_application_infos = AsyncMock(
            return_value=[build_application_info_payload()]
        )

        result = await unwrap_endpoint(list_application_infos)(
            Mock(),
            "018f6f83-0000-0000-0000-000000000111",
            mock_db,
            {"id": 10},
            mock_service,
        )

        assert [item.application_name for item in result] == ["Benefits Portal"]
        mock_service.list_application_infos.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_list_application_infos_accepts_uuid_rp_application_identifier(self, mock_db):
        mock_service = Mock()
        mock_service.list_application_infos = AsyncMock(
            return_value=[
                build_application_info_payload(
                    rp_application_uuid=uuid.UUID(
                        "018f6f83-0000-0000-0000-000000000401"
                    )
                )
            ]
        )

        result = await unwrap_endpoint(list_application_infos)(
            Mock(),
            "018f6f83-0000-0000-0000-000000000111",
            mock_db,
            {"id": 10},
            mock_service,
        )

        assert str(result[0].rp_application_uuid) == "018f6f83-0000-0000-0000-000000000401"
        mock_service.list_application_infos.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_contact_routes_delegate_to_service(self, mock_db):
        mock_service = Mock()
        mock_service.create_application_contact = AsyncMock(
            return_value=build_application_contact_payload()
        )
        mock_service.list_application_contacts = AsyncMock(
            return_value=[build_application_contact_payload()]
        )

        create_result = await unwrap_endpoint(create_application_contact)(
            Mock(),
            "018f6f83-0000-0000-0000-000000000111",
            "018f6f83-0000-0000-0000-000000000777",
            ApplicationContactCreate(
                first_name="Alex",
                last_name="Martin",
                title_role="Product owner",
                email="alex.martin@example.gc.ca",
                phone_number="555-111-2222",
                alternate_phone_number="555-333-4444",
                contact_type="Business",
                action="ADD",
                contact_roles=["Main support contact"],
            ),
            {"id": 10},
            mock_db,
            mock_service,
        )
        list_result = await unwrap_endpoint(list_application_contacts)(
            Mock(),
            "018f6f83-0000-0000-0000-000000000111",
            "018f6f83-0000-0000-0000-000000000777",
            {"id": 10},
            mock_db,
            mock_service,
        )

        assert create_result.first_name == "Alex"
        assert [item.first_name for item in list_result] == ["Alex"]

    @pytest.mark.asyncio
    async def test_update_and_delete_application_info_delegate_to_service(self, mock_db):
        mock_service = Mock()
        mock_service.update_application_info = AsyncMock(
            return_value=build_application_info_payload(
                application_name="Updated Benefits Portal"
            )
        )
        mock_service.delete_application_info = AsyncMock(return_value={"message": "application info deleted"})

        update_result = await unwrap_endpoint(update_application_info)(
            Mock(),
            "018f6f83-0000-0000-0000-000000000111",
            "018f6f83-0000-0000-0000-000000000777",
            ApplicationInfoUpdate(application_name="Updated Benefits Portal"),
            {"id": 10},
            mock_db,
            mock_service,
        )
        delete_result = await unwrap_endpoint(delete_application_info)(
            Mock(),
            "018f6f83-0000-0000-0000-000000000111",
            "018f6f83-0000-0000-0000-000000000777",
            {"id": 10},
            mock_db,
            mock_service,
        )

        assert update_result.application_name == "Updated Benefits Portal"
        assert delete_result == {"message": "application info deleted"}

    @pytest.mark.asyncio
    async def test_update_and_delete_application_contact_delegate_to_service(self, mock_db):
        mock_service = Mock()
        mock_service.update_application_contact = AsyncMock(
            return_value=build_application_contact_payload(title_role="Director")
        )
        mock_service.delete_application_contact = AsyncMock(return_value={"message": "application contact deleted"})

        update_result = await unwrap_endpoint(update_application_contact)(
            Mock(),
            "018f6f83-0000-0000-0000-000000000111",
            "018f6f83-0000-0000-0000-000000000777",
            "018f6f83-0000-0000-0000-000000000333",
            ApplicationContactUpdate(title_role="Director"),
            {"id": 10},
            mock_db,
            mock_service,
        )
        delete_result = await unwrap_endpoint(delete_application_contact)(
            Mock(),
            "018f6f83-0000-0000-0000-000000000111",
            "018f6f83-0000-0000-0000-000000000777",
            "018f6f83-0000-0000-0000-000000000333",
            {"id": 10},
            mock_db,
            mock_service,
        )

        assert update_result.title_role == "Director"
        assert delete_result == {"message": "application contact deleted"}
