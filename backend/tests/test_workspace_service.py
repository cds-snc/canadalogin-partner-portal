import json
from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock, patch
from uuid import UUID

import pytest
from sqlalchemy.exc import IntegrityError
from src.app.core.authorization import (
    CanonicalRoleCode,
    Capability,
    ResourceScopeDecision,
    ResourceScopeDecisionReason,
)
from src.app.core.exceptions.http_exceptions import (
    BadRequestException,
    CustomException,
    DuplicateValueException,
    ForbiddenException,
    NotFoundException,
    RegistrationDraftConflictException,
)
from src.app.schemas.application_information import (
    ApplicationInformationContactCreate,
    ApplicationInformationContactUpdate,
    ApplicationInformationCreate,
)
from src.app.schemas.rp_application import (
    ApplicationRPConfigurationCopyCreate,
    ApplicationRPConfigurationPartnerEnvironmentUpdate,
    ApplicationRPConfigurationProgressionCreate,
    ApplicationRPConfigurationRegistrationDraftCreate,
    WorkspaceRPApplicationRegistrationCreate,
    WorkspaceRPApplicationRegistrationDraftPatch,
)
from src.app.schemas.rp_application_promotion_request import (
    PromotionRequestUpsert,
    PromotionReviewUpdate,
)
from src.app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from src.app.services.authorization_service import (
    AUTHORIZATION_STATE_KEY,
    ResolvedAuthorizationState,
    ResolvedPartnerAccess,
)
from src.app.services.workspace_service import WorkspaceService

WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000201")
SECOND_WORKSPACE_UUID = UUID("018f6f83-0000-0000-0000-000000000202")


def _cl_admin(user_id: int = 1) -> dict:
    return {
        "id": user_id,
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(global_role=CanonicalRoleCode.CL_ADMIN),
    }


def _partner(
    role: CanonicalRoleCode = CanonicalRoleCode.RP_ADMIN,
    *,
    user_id: int = 42,
    workspace_id: int = 9,
    workspace_uuid: UUID = WORKSPACE_UUID,
) -> dict:
    return {
        "id": user_id,
        AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
            partner_access=(
                ResolvedPartnerAccess(
                    workspace_id=workspace_id,
                    workspace_uuid=workspace_uuid,
                    role=role,
                ),
            )
        ),
    }


def _allowed_scope(
    workspace: dict,
    role: CanonicalRoleCode = CanonicalRoleCode.RP_ADMIN,
) -> AsyncMock:
    return AsyncMock(
        return_value=(
            workspace,
            ResourceScopeDecision(
                allowed=True,
                reason=(
                    ResourceScopeDecisionReason.ALLOWED_GLOBAL
                    if role is CanonicalRoleCode.CL_ADMIN
                    else ResourceScopeDecisionReason.ALLOWED_WORKSPACE
                ),
                role=role,
                workspace_uuid=(None if role is CanonicalRoleCode.CL_ADMIN else UUID(str(workspace["uuid"]))),
            ),
        )
    )


def _complete_registration_answers() -> dict[str, object]:
    return WorkspaceRPApplicationRegistrationCreate(
        application_information_uuid="018f6f83-0000-0000-0000-000000000501",
        configuration_name="Staging integration A",
        partner_environment="Partner staging",
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
    ).model_dump(
        mode="json",
        exclude={"application_information_uuid", "configuration_name", "partner_environment"},
        exclude_none=True,
    )


class TestWorkspaceService:
    @pytest.mark.asyncio
    async def test_partner_environment_update_is_ancestry_scoped_lifecycle_independent_and_safely_audited(self, mock_db) -> None:
        service = WorkspaceService()
        application_uuid = UUID("018f6f83-0000-0000-0000-000000000501")
        configuration_uuid = UUID("018f6f83-0000-0000-0000-000000000701")
        actor_uuid = UUID("018f6f83-0000-0000-0000-000000000041")
        updated_at = datetime(2026, 8, 13, 15, 0, tzinfo=UTC)
        resolved_access = AsyncMock(
            return_value=(
                {"id": 9, "uuid": WORKSPACE_UUID},
                Mock(),
                {
                    "id": 33,
                    "uuid": configuration_uuid,
                    "application_information_id": 17,
                    "onboarding_state": "launched",
                    "oidc_registration_payload": {"client_type": "public"},
                    "registration_draft_version": 7,
                },
            )
        )

        with (
            patch.object(service, "_resolve_application_rp_configuration_access", resolved_access),
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_configurations,
        ):
            mock_configurations.update = AsyncMock(
                return_value={
                    "uuid": configuration_uuid,
                    "partner_environment": "Partnér QA 2",
                    "updated_at": updated_at,
                }
            )
            result = await service.update_application_rp_configuration_partner_environment(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_uuid,
                rp_configuration_uuid=configuration_uuid,
                payload=ApplicationRPConfigurationPartnerEnvironmentUpdate(partnerEnvironment="  Partne\u0301r QA 2  "),
                current_user={**_partner(), "uuid": actor_uuid},
            )

        resolved_access.assert_awaited_once_with(
            db=mock_db,
            workspace_uuid=WORKSPACE_UUID,
            application_information_uuid=application_uuid,
            rp_configuration_uuid=configuration_uuid,
            current_user={**_partner(), "uuid": actor_uuid},
            capability=Capability.RP_CONFIGURATION_WRITE,
        )
        update_arguments = mock_configurations.update.await_args.kwargs
        assert update_arguments["object"]["partner_environment"] == "Partnér QA 2"
        assert set(update_arguments["object"]) == {"partner_environment", "updated_at"}
        assert update_arguments["workspace_id"] == 9
        assert update_arguments["application_information_id"] == 17
        assert update_arguments["uuid"] == configuration_uuid
        assert "onboarding_state" not in update_arguments
        assert update_arguments["commit"] is False
        audit_record = mock_db.add.call_args.args[0]
        audit_payload = json.loads(audit_record.description)
        assert audit_record.operation == "metadata_update"
        assert audit_record.user_uuid == actor_uuid
        assert audit_payload["fieldName"] == "partner_environment"
        assert audit_payload["result"] == "succeeded"
        assert "Partnér QA 2" not in audit_record.description
        assert "client_type" not in audit_record.description
        mock_db.commit.assert_awaited_once()
        assert result == {
            "workspaceUuid": str(WORKSPACE_UUID),
            "applicationInformationUuid": str(application_uuid),
            "rpConfigurationUuid": str(configuration_uuid),
            "partnerEnvironment": "Partnér QA 2",
            "updatedAt": "2026-08-13T15:00:00Z",
        }

    @pytest.mark.asyncio
    async def test_partner_environment_update_denies_read_only_before_mutation(self, mock_db) -> None:
        service = WorkspaceService()
        denied_access = AsyncMock(side_effect=ForbiddenException("Insufficient workspace capability"))

        with (
            patch.object(service, "_resolve_application_rp_configuration_access", denied_access),
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_configurations,
        ):
            with pytest.raises(ForbiddenException):
                await service.update_application_rp_configuration_partner_environment(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=UUID("018f6f83-0000-0000-0000-000000000501"),
                    rp_configuration_uuid=UUID("018f6f83-0000-0000-0000-000000000701"),
                    payload=ApplicationRPConfigurationPartnerEnvironmentUpdate(partnerEnvironment="Partner QA"),
                    current_user=_partner(CanonicalRoleCode.READ_ONLY),
                )

        assert denied_access.await_args.kwargs["capability"] is Capability.RP_CONFIGURATION_WRITE
        mock_configurations.update.assert_not_called()
        mock_db.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_application_scoped_draft_inherits_public_names_from_parent(self, mock_db) -> None:
        service = WorkspaceService()
        create_draft = AsyncMock(return_value={"rp_application_uuid": "rp-1"})
        application_uuid = UUID("018f6f83-0000-0000-0000-000000000501")

        with (
            patch.object(
                service,
                "_require_workspace_capability",
                _allowed_scope({"id": 9, "uuid": str(WORKSPACE_UUID)}),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(
                    return_value={
                        "id": 17,
                        "uuid": application_uuid,
                        "service_name_en": "Benefits Portal",
                        "service_name_fr": "Portail des prestations",
                    }
                ),
            ),
            patch.object(
                service,
                "create_workspace_rp_application_registration_draft",
                create_draft,
            ),
        ):
            result = await service.create_application_rp_configuration_registration_draft(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_uuid,
                payload=ApplicationRPConfigurationRegistrationDraftCreate(
                    configurationName="Partner staging A",
                    partnerEnvironment="Partner QA 2",
                    canadaLoginEnvironment="staging",
                ),
                current_user=_partner(),
                registration_creation_key=UUID("018f6f83-0000-0000-0000-000000000901"),
                correlation_id="request-1",
            )

        assert result == {"rp_application_uuid": "rp-1"}
        forwarded = create_draft.await_args.kwargs["payload"]
        assert forwarded.application_information_uuid == application_uuid
        assert forwarded.configuration_name == "Partner staging A"
        assert forwarded.partner_environment == "Partner QA 2"
        assert forwarded.canada_login_environment == "staging"
        assert forwarded.service_name_en == "Benefits Portal"
        assert forwarded.service_name_fr == "Portail des prestations"

    @pytest.mark.asyncio
    async def test_progression_adapter_copies_production_draft_without_review_request(self, mock_db) -> None:
        service = WorkspaceService()
        application_uuid = UUID("018f6f83-0000-0000-0000-000000000501")
        source_uuid = UUID("018f6f83-0000-0000-0000-000000000701")
        target_uuid = UUID("018f6f83-0000-0000-0000-000000000702")
        source = {
            "id": 33,
            "uuid": source_uuid,
            "workspace_id": 9,
            "application_information_id": 17,
            "configuration_name": "Partner staging A",
            "partner_environment": "Partner staging",
            "canada_login_environment": "staging",
            "oidc_registration_payload": {
                "application_environment_url_en": "https://staging.example/callback",
                "redirect_uris": ["https://staging.example/callback"],
                "client_type": "public",
                "supports_authorization_code_flow": True,
                "requested_scopes": ["openid"],
                "pkce_supported": True,
                "pkce_algorithms": ["S256"],
                "offline_jwk_or_certificate": "must-not-copy",
            },
        }
        target = {
            "id": 34,
            "uuid": target_uuid,
            "workspace_id": 9,
            "application_information_id": 17,
            "configuration_name": "Partner production A",
            "partner_environment": "Partner production",
            "canada_login_environment": "production",
            "registration_draft_version": 1,
            "registration_last_completed_step": "basics",
        }
        mock_db.commit = AsyncMock()

        with (
            patch.object(
                service,
                "_resolve_application_rp_configuration_access",
                AsyncMock(
                    return_value=(
                        {"id": 9, "uuid": WORKSPACE_UUID, "department_id": 7},
                        Mock(),
                        source,
                    )
                ),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(
                    return_value={
                        "id": 17,
                        "uuid": application_uuid,
                        "service_name_en": "Benefits Portal",
                        "service_name_fr": "Portail des prestations",
                    }
                ),
            ),
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_configurations,
            patch("src.app.services.workspace_service.crud_rp_application_promotion_requests") as mock_promotions,
        ):
            mock_configurations.get = AsyncMock(return_value=None)
            mock_configurations.create = AsyncMock(return_value=target)
            mock_promotions.create = AsyncMock(return_value={"id": 4})

            result = await service.create_application_rp_configuration_progression(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_uuid,
                source_rp_configuration_uuid=source_uuid,
                payload=ApplicationRPConfigurationProgressionCreate(
                    targetConfigurationName=" Partner production A ",
                    targetPartnerEnvironment=" Partner production ",
                    targetEnvironment="production",
                ),
                current_user=_partner(),
                progression_creation_key=UUID("018f6f83-0000-0000-0000-000000000902"),
                correlation_id="request-progression",
            )

        assert result["source_rp_configuration_uuid"] == str(source_uuid)
        assert result["target_rp_configuration_uuid"] == str(target_uuid)
        assert "promotion_status" not in result
        assert result["self_serve"] is True
        create_object = mock_configurations.create.await_args.kwargs["object"]
        assert create_object.source_rp_configuration_id == 33
        assert create_object.configuration_name == "Partner production A"
        assert create_object.partner_environment == "Partner production"
        assert create_object.application_information_id == 17
        assert create_object.oidc_registration_payload["client_type"] == "public"
        assert create_object.oidc_registration_payload["pkce_algorithms"] == ["S256"]
        assert "redirect_uris" not in create_object.oidc_registration_payload
        assert "application_environment_url_en" not in create_object.oidc_registration_payload
        assert "offline_jwk_or_certificate" not in create_object.oidc_registration_payload
        assert mock_configurations.create.await_args.kwargs["commit"] is False
        mock_promotions.create.assert_not_called()
        audit_log = mock_db.add.call_args.args[0]
        audit_payload = json.loads(audit_log.description)
        assert audit_payload["eventName"] == "rp_configuration_copy"
        assert audit_payload["sourceRpConfigurationUuid"] == str(source_uuid)
        assert audit_payload["targetRpConfigurationUuid"] == str(target_uuid)
        assert audit_payload["targetEnvironment"] == "production"
        assert "oidc_registration_payload" not in audit_log.description
        assert "redirect_uris" not in audit_log.description
        assert "requested_scopes" not in audit_log.description
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("source_environment", ["test", "staging", "production"])
    @pytest.mark.parametrize("target_environment", ["test", "staging", "production"])
    async def test_copy_supports_every_source_target_environment_pair(
        self,
        mock_db,
        source_environment: str,
        target_environment: str,
    ) -> None:
        service = WorkspaceService()
        application_uuid = UUID("018f6f83-0000-0000-0000-000000000501")
        source_uuid = UUID("018f6f83-0000-0000-0000-000000000701")
        target_uuid = UUID("018f6f83-0000-0000-0000-000000000702")
        source = {
            "id": 33,
            "uuid": source_uuid,
            "workspace_id": 9,
            "application_information_id": 17,
            "configuration_name": "Repeated configuration name",
            "partner_environment": None,
            "canada_login_environment": source_environment,
            "oidc_registration_payload": {"client_type": "public"},
        }
        target = {
            "id": 34,
            "uuid": target_uuid,
            "workspace_id": 9,
            "application_information_id": 17,
            "configuration_name": "Repeated configuration name",
            "partner_environment": "Explicit target environment",
            "canada_login_environment": target_environment,
            "registration_draft_version": 1,
            "registration_last_completed_step": "basics",
        }
        mock_db.commit = AsyncMock()

        with (
            patch.object(
                service,
                "_resolve_application_rp_configuration_access",
                AsyncMock(
                    return_value=(
                        {"id": 9, "uuid": WORKSPACE_UUID, "department_id": 7},
                        Mock(),
                        source,
                    )
                ),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(
                    return_value={
                        "id": 17,
                        "uuid": application_uuid,
                        "service_name_en": "Benefits Portal",
                        "service_name_fr": "Portail des prestations",
                    }
                ),
            ),
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_configurations,
            patch("src.app.services.workspace_service.crud_rp_application_promotion_requests") as mock_promotions,
        ):
            mock_configurations.get = AsyncMock(return_value=None)
            mock_configurations.create = AsyncMock(return_value=target)

            result = await service.create_application_rp_configuration_copy(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_uuid,
                source_rp_configuration_uuid=source_uuid,
                payload=ApplicationRPConfigurationCopyCreate(
                    targetConfigurationName="Repeated configuration name",
                    targetPartnerEnvironment="Explicit target environment",
                    targetEnvironment=target_environment,
                ),
                current_user=_partner(),
                copy_creation_key=UUID("018f6f83-0000-0000-0000-000000000902"),
                correlation_id="request-copy",
            )

        assert result["source_environment"] == source_environment
        assert result["target_environment"] == target_environment
        assert result["copy_policy_version"] == 1
        create_object = mock_configurations.create.await_args.kwargs["object"]
        assert create_object.source_rp_configuration_id == 33
        assert create_object.configuration_name == source["configuration_name"]
        assert create_object.canada_login_environment == target_environment
        assert create_object.partner_environment == "Explicit target environment"
        mock_promotions.create.assert_not_called()
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_copy_replay_returns_the_original_target_without_creating_a_sibling(self, mock_db) -> None:
        service = WorkspaceService()
        application_uuid = UUID("018f6f83-0000-0000-0000-000000000501")
        source_uuid = UUID("018f6f83-0000-0000-0000-000000000701")
        existing = {
            "id": 34,
            "uuid": UUID("018f6f83-0000-0000-0000-000000000702"),
            "workspace_id": 9,
            "application_information_id": 17,
            "configuration_name": "Copied configuration",
            "partner_environment": "Partner QA",
            "canada_login_environment": "test",
            "registration_draft_version": 1,
            "registration_last_completed_step": "basics",
        }
        source_id_result = Mock()
        source_id_result.scalar_one_or_none.return_value = 33
        mock_db.execute = AsyncMock(return_value=source_id_result)
        mock_db.commit = AsyncMock()

        with (
            patch.object(
                service,
                "_resolve_application_rp_configuration_access",
                AsyncMock(
                    return_value=(
                        {"id": 9, "uuid": WORKSPACE_UUID, "department_id": 7},
                        Mock(),
                        {
                            "id": 33,
                            "uuid": source_uuid,
                            "configuration_name": "Source configuration",
                            "partner_environment": "Legacy source",
                            "canada_login_environment": "production",
                        },
                    )
                ),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(
                    return_value={
                        "id": 17,
                        "uuid": application_uuid,
                        "service_name_en": "Benefits Portal",
                        "service_name_fr": "Portail des prestations",
                    }
                ),
            ),
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_configurations,
        ):
            mock_configurations.get = AsyncMock(return_value=existing)
            payload = ApplicationRPConfigurationCopyCreate(
                targetConfigurationName="Copied configuration",
                targetPartnerEnvironment="Partner QA",
                targetEnvironment="test",
            )

            result = await service.create_application_rp_configuration_copy(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_uuid,
                source_rp_configuration_uuid=source_uuid,
                payload=payload,
                current_user=_partner(),
                copy_creation_key=UUID("018f6f83-0000-0000-0000-000000000902"),
            )

        assert result["target_rp_configuration_uuid"] == str(existing["uuid"])
        mock_configurations.create.assert_not_called()
        mock_db.commit.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_copy_rejects_an_idempotency_key_reused_for_different_target_details(self, mock_db) -> None:
        service = WorkspaceService()
        application_uuid = UUID("018f6f83-0000-0000-0000-000000000501")
        source_uuid = UUID("018f6f83-0000-0000-0000-000000000701")
        existing = {
            "id": 34,
            "uuid": UUID("018f6f83-0000-0000-0000-000000000702"),
            "workspace_id": 9,
            "application_information_id": 17,
            "configuration_name": "Original copied configuration",
            "partner_environment": "Partner QA",
            "canada_login_environment": "test",
            "registration_draft_version": 1,
            "registration_last_completed_step": "basics",
        }
        source_id_result = Mock()
        source_id_result.scalar_one_or_none.return_value = 33
        mock_db.execute = AsyncMock(return_value=source_id_result)

        with (
            patch.object(
                service,
                "_resolve_application_rp_configuration_access",
                AsyncMock(
                    return_value=(
                        {"id": 9, "uuid": WORKSPACE_UUID, "department_id": 7},
                        Mock(),
                        {
                            "id": 33,
                            "uuid": source_uuid,
                            "configuration_name": "Source configuration",
                            "canada_login_environment": "production",
                        },
                    )
                ),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(
                    return_value={
                        "id": 17,
                        "uuid": application_uuid,
                        "service_name_en": "Benefits Portal",
                        "service_name_fr": "Portail des prestations",
                    }
                ),
            ),
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_configurations,
        ):
            mock_configurations.get = AsyncMock(return_value=existing)

            with pytest.raises(RegistrationDraftConflictException) as conflict:
                await service.create_application_rp_configuration_copy(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=application_uuid,
                    source_rp_configuration_uuid=source_uuid,
                    payload=ApplicationRPConfigurationCopyCreate(
                        targetConfigurationName="Different copied configuration",
                        targetPartnerEnvironment="Partner QA",
                        targetEnvironment="test",
                    ),
                    current_user=_partner(),
                    copy_creation_key=UUID("018f6f83-0000-0000-0000-000000000902"),
                )

        assert conflict.value.code == "rp_configuration_copy_creation_conflict"
        mock_configurations.create.assert_not_called()
        mock_db.add.assert_not_called()

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "access_error",
        [
            ForbiddenException("Insufficient workspace capability"),
            NotFoundException("RP configuration not found"),
        ],
        ids=["unauthorized", "ancestry-mismatch"],
    )
    async def test_copy_revalidates_authorization_and_source_ancestry_before_mutation(
        self,
        mock_db,
        access_error: Exception,
    ) -> None:
        service = WorkspaceService()
        resolved_access = AsyncMock(side_effect=access_error)

        with (
            patch.object(service, "_resolve_application_rp_configuration_access", resolved_access),
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_configurations,
        ):
            with pytest.raises(type(access_error)):
                await service.create_application_rp_configuration_copy(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=UUID("018f6f83-0000-0000-0000-000000000501"),
                    source_rp_configuration_uuid=UUID("018f6f83-0000-0000-0000-000000000701"),
                    payload=ApplicationRPConfigurationCopyCreate(
                        targetConfigurationName="Copied configuration",
                        targetPartnerEnvironment="Partner QA",
                        targetEnvironment="test",
                    ),
                    current_user=_partner(CanonicalRoleCode.READ_ONLY),
                    copy_creation_key=UUID("018f6f83-0000-0000-0000-000000000902"),
                )

        assert resolved_access.await_args.kwargs["capability"] is Capability.RP_CONFIGURATION_WRITE
        mock_configurations.get.assert_not_called()
        mock_configurations.create.assert_not_called()
        mock_db.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_concurrent_equivalent_copy_replays_the_winning_target(self, mock_db) -> None:
        service = WorkspaceService()
        application_uuid = UUID("018f6f83-0000-0000-0000-000000000501")
        source_uuid = UUID("018f6f83-0000-0000-0000-000000000701")
        target_uuid = UUID("018f6f83-0000-0000-0000-000000000702")
        source = {
            "id": 33,
            "uuid": source_uuid,
            "configuration_name": "Source configuration",
            "canada_login_environment": "production",
            "oidc_registration_payload": {"client_type": "public"},
        }
        existing = {
            "id": 34,
            "uuid": target_uuid,
            "workspace_id": 9,
            "application_information_id": 17,
            "configuration_name": "Copied configuration",
            "partner_environment": "Partner QA",
            "canada_login_environment": "test",
            "registration_draft_version": 1,
            "registration_last_completed_step": "basics",
        }
        source_id_result = Mock()
        source_id_result.scalar_one_or_none.return_value = 33
        mock_db.execute = AsyncMock(return_value=source_id_result)
        mock_db.rollback = AsyncMock()

        with (
            patch.object(
                service,
                "_resolve_application_rp_configuration_access",
                AsyncMock(
                    return_value=(
                        {"id": 9, "uuid": WORKSPACE_UUID, "department_id": 7},
                        Mock(),
                        source,
                    )
                ),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(
                    return_value={
                        "id": 17,
                        "uuid": application_uuid,
                        "service_name_en": "Benefits Portal",
                        "service_name_fr": "Portail des prestations",
                    }
                ),
            ),
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_configurations,
        ):
            mock_configurations.get = AsyncMock(side_effect=[None, existing])
            mock_configurations.create = AsyncMock(side_effect=IntegrityError("INSERT", {}, RuntimeError("duplicate creation key")))

            result = await service.create_application_rp_configuration_copy(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_uuid,
                source_rp_configuration_uuid=source_uuid,
                payload=ApplicationRPConfigurationCopyCreate(
                    targetConfigurationName="Copied configuration",
                    targetPartnerEnvironment="Partner QA",
                    targetEnvironment="test",
                ),
                current_user=_partner(),
                copy_creation_key=UUID("018f6f83-0000-0000-0000-000000000902"),
            )

        assert result["target_rp_configuration_uuid"] == str(target_uuid)
        mock_db.rollback.assert_awaited_once()
        mock_db.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_copy_and_legacy_progression_share_one_idempotent_target(self, mock_db) -> None:
        service = WorkspaceService()
        application_uuid = UUID("018f6f83-0000-0000-0000-000000000501")
        source_uuid = UUID("018f6f83-0000-0000-0000-000000000701")
        target_uuid = UUID("018f6f83-0000-0000-0000-000000000702")
        source = {
            "id": 33,
            "uuid": source_uuid,
            "configuration_name": "Source configuration",
            "partner_environment": None,
            "canada_login_environment": "staging",
        }
        existing = {
            "id": 34,
            "uuid": target_uuid,
            "workspace_id": 9,
            "application_information_id": 17,
            "configuration_name": "Production configuration",
            "partner_environment": "Partner production",
            "canada_login_environment": "production",
            "registration_draft_version": 1,
            "registration_last_completed_step": "basics",
        }
        source_id_result = Mock()
        source_id_result.scalar_one_or_none.return_value = 33
        mock_db.execute = AsyncMock(return_value=source_id_result)

        with (
            patch.object(
                service,
                "_resolve_application_rp_configuration_access",
                AsyncMock(
                    return_value=(
                        {"id": 9, "uuid": WORKSPACE_UUID, "department_id": 7},
                        Mock(),
                        source,
                    )
                ),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(
                    return_value={
                        "id": 17,
                        "uuid": application_uuid,
                        "service_name_en": "Benefits Portal",
                        "service_name_fr": "Portail des prestations",
                    }
                ),
            ),
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_configurations,
        ):
            mock_configurations.get = AsyncMock(return_value=existing)
            copy_result = await service.create_application_rp_configuration_copy(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_uuid,
                source_rp_configuration_uuid=source_uuid,
                payload=ApplicationRPConfigurationCopyCreate(
                    targetConfigurationName="Production configuration",
                    targetPartnerEnvironment="Partner production",
                    targetEnvironment="production",
                ),
                current_user=_partner(),
                copy_creation_key=UUID("018f6f83-0000-0000-0000-000000000902"),
            )
            progression_result = await service.create_application_rp_configuration_progression(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_uuid,
                source_rp_configuration_uuid=source_uuid,
                payload=ApplicationRPConfigurationProgressionCreate(
                    targetConfigurationName="Production configuration",
                    targetPartnerEnvironment="Partner production",
                    targetEnvironment="production",
                ),
                current_user=_partner(),
                progression_creation_key=UUID("018f6f83-0000-0000-0000-000000000902"),
            )

        assert copy_result["target_rp_configuration_uuid"] == str(target_uuid)
        assert progression_result["target_rp_configuration_uuid"] == str(target_uuid)
        mock_configurations.create.assert_not_called()
        mock_db.commit.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_progression_rejects_implicit_or_skipped_environment_path(self, mock_db) -> None:
        service = WorkspaceService()
        with (
            patch.object(
                service,
                "_resolve_application_rp_configuration_access",
                AsyncMock(
                    return_value=(
                        {"id": 9, "uuid": WORKSPACE_UUID, "department_id": 7},
                        Mock(),
                        {
                            "id": 33,
                            "uuid": UUID("018f6f83-0000-0000-0000-000000000701"),
                            "configuration_name": "Partner test A",
                            "canada_login_environment": "test",
                        },
                    )
                ),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(
                    return_value={
                        "id": 17,
                        "uuid": UUID("018f6f83-0000-0000-0000-000000000501"),
                        "service_name_en": "Benefits Portal",
                        "service_name_fr": "Portail des prestations",
                    }
                ),
            ),
        ):
            with pytest.raises(BadRequestException, match="only to staging"):
                await service.create_application_rp_configuration_progression(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_UUID,
                    application_information_uuid=UUID("018f6f83-0000-0000-0000-000000000501"),
                    source_rp_configuration_uuid=UUID("018f6f83-0000-0000-0000-000000000701"),
                    payload=ApplicationRPConfigurationProgressionCreate(
                        targetConfigurationName="Partner production A",
                        targetPartnerEnvironment="Partner production",
                        targetEnvironment="production",
                    ),
                    current_user=_partner(),
                    progression_creation_key=UUID("018f6f83-0000-0000-0000-000000000902"),
                )

    @pytest.mark.asyncio
    async def test_nested_draft_update_replaces_duplicate_names_with_parent_identity(self, mock_db) -> None:
        service = WorkspaceService()
        application_uuid = UUID("018f6f83-0000-0000-0000-000000000501")
        update_draft = AsyncMock(return_value={"configuration_name": "Partner staging B"})

        with (
            patch.object(
                service,
                "_resolve_application_rp_configuration_access",
                AsyncMock(return_value=({"id": 9, "uuid": WORKSPACE_UUID}, Mock(), {})),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(
                    return_value={
                        "id": 17,
                        "uuid": application_uuid,
                        "service_name_en": "Current Benefits Portal",
                        "service_name_fr": "Portail actuel des prestations",
                    }
                ),
            ),
            patch.object(
                service,
                "update_workspace_rp_application_registration_draft",
                update_draft,
            ),
        ):
            await service.update_application_rp_configuration_registration_draft(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_uuid,
                rp_configuration_uuid=UUID("018f6f83-0000-0000-0000-000000000701"),
                payload=WorkspaceRPApplicationRegistrationDraftPatch(
                    stepId="basics",
                    saveMode="completeStep",
                    expectedDraftVersion=1,
                    configurationName="Partner staging B",
                    registrationAnswers={
                        "canadaLoginEnvironment": "staging",
                        "serviceNameEn": "Client supplied English",
                        "serviceNameFr": "Valeur française du client",
                    },
                ),
                current_user=_partner(),
            )

        forwarded = update_draft.await_args.kwargs["payload"]
        assert forwarded.configuration_name == "Partner staging B"
        assert forwarded.registration_answers.service_name_en == "Current Benefits Portal"
        assert forwarded.registration_answers.service_name_fr == "Portail actuel des prestations"

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
                    current_user=_cl_admin(42),
                )

    @pytest.mark.asyncio
    async def test_create_workspace_generates_slug_and_sets_department(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_departments") as mock_departments,
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
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
            result = await service.create_workspace(
                db=mock_db,
                workspace=WorkspaceCreate(
                    name="Benefits Workspace",
                    description="Primary workspace",
                    department_uuid="018f6f83-0000-0000-0000-000000000101",
                ),
                current_user=_cl_admin(42),
            )

        assert result["slug"] == "benefits-workspace"
        mock_workspaces.create.assert_awaited_once()
        create_kwargs = mock_workspaces.create.await_args.kwargs
        assert create_kwargs["object"].department_id == 7
        assert create_kwargs["object"].created_by == 42
        assert create_kwargs["object"].slug == "benefits-workspace"
        assert "crud_workspace_members" not in service.create_workspace.__globals__

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
                    current_user=_cl_admin(42),
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

            result = await service.list_workspaces(
                db=mock_db,
                current_user=_cl_admin(),
            )

        assert result == []
        mock_workspaces.get_multi.assert_awaited_once_with(
            db=mock_db,
            is_deleted=False,
            schema_to_select=service.list_workspaces.__globals__["WorkspaceRead"],
        )

    @pytest.mark.asyncio
    async def test_list_current_user_workspaces_uses_only_canonical_grants(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
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
                current_user={
                    "id": 42,
                    AUTHORIZATION_STATE_KEY: ResolvedAuthorizationState(
                        partner_access=(
                            ResolvedPartnerAccess(
                                workspace_id=9,
                                workspace_uuid=WORKSPACE_UUID,
                                role=CanonicalRoleCode.RP_ADMIN,
                            ),
                            ResolvedPartnerAccess(
                                workspace_id=11,
                                workspace_uuid=SECOND_WORKSPACE_UUID,
                                role=CanonicalRoleCode.READ_ONLY,
                            ),
                        )
                    ),
                },
            )

        assert [workspace["id"] for workspace in result] == [9, 11]
        assert mock_workspaces.get.await_count == 2

    @pytest.mark.asyncio
    async def test_list_current_user_workspaces_delegates_to_all_for_superuser(self, mock_db) -> None:
        service = WorkspaceService()
        all_workspaces = [{"id": 9, "uuid": "018f6f83-0000-0000-0000-000000000201"}]

        with patch.object(service, "list_workspaces", AsyncMock(return_value=all_workspaces)) as mock_list_workspaces:
            result = await service.list_current_user_workspaces(
                db=mock_db,
                current_user=_cl_admin(42),
            )

        assert result == all_workspaces
        mock_list_workspaces.assert_awaited_once_with(
            db=mock_db,
            current_user=_cl_admin(42),
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
                    current_user=_cl_admin(),
                )

        mock_workspaces.get.assert_awaited_once_with(
            db=mock_db,
            uuid=WORKSPACE_UUID,
            is_deleted=False,
            schema_to_select=service.get_workspace_by_uuid.__globals__["WorkspaceRead"],
        )

    @pytest.mark.asyncio
    async def test_get_workspace_by_uuid_hides_workspace_without_canonical_scope(self, mock_db) -> None:
        service = WorkspaceService()

        with patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces:
            mock_workspaces.get = AsyncMock()
            with pytest.raises(NotFoundException, match="Workspace not found"):
                await service.get_workspace_by_uuid(
                    db=mock_db,
                    workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                    current_user={"id": 55, "is_superuser": False},
                )

        mock_workspaces.get.assert_not_awaited()

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
                current_user=_partner(),
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
    async def test_upsert_workspace_rp_application_promotion_request_creates_pending_request(self, mock_db) -> None:
        service = WorkspaceService()
        workspace_uuid = "018f6f83-0000-0000-0000-000000000201"
        rp_application_uuid = "018f6f83-0000-0000-0000-000000000701"
        workspace = {
            "id": 9,
            "uuid": workspace_uuid,
            "name": "Benefits Workspace",
        }
        rp_application = {
            "id": 33,
            "uuid": rp_application_uuid,
            "workspace_id": 9,
            "department_id": 7,
            "application_information_id": 17,
            "dnr_app_name": "Benefits Portal",
            "canada_login_environment": "production",
            "status": None,
            "created_by": 42,
            "created_at": "2026-07-30T16:00:00",
            "updated_at": None,
            "deleted_at": None,
            "is_deleted": False,
            "onboarding_state": "submitted",
        }
        stored_request = {
            "id": 4,
            "rp_application_id": 33,
            "target_environment": "production",
            "status": "review_tracked",
            "review_status": "pending",
            "external_reference": "CAB-123",
            "reviewed_by_user_id": None,
            "reviewed_by_team": None,
            "requested_at": datetime(2026, 8, 11, 12, 0, tzinfo=UTC),
            "reviewed_at": None,
            "decided_at": None,
            "created_at": datetime(2026, 8, 11, 12, 0, tzinfo=UTC),
            "updated_at": None,
        }

        with (
            patch.object(
                service,
                "_require_workspace_capability",
                _allowed_scope(workspace),
            ),
            patch.object(
                service,
                "_get_workspace_rp_application",
                AsyncMock(return_value=rp_application),
            ),
            patch("src.app.services.workspace_service.crud_rp_application_promotion_requests") as mock_promotion_requests,
        ):
            mock_promotion_requests.get = AsyncMock(side_effect=[None, stored_request])
            mock_promotion_requests.create = AsyncMock(return_value={"id": 4})

            result = await service.upsert_workspace_rp_application_promotion_request(
                db=mock_db,
                workspace_uuid=workspace_uuid,
                rp_application_uuid=rp_application_uuid,
                payload=PromotionRequestUpsert(external_reference="CAB-123"),
                current_user=_partner(),
            )

        assert result["status"] == "pending"
        mock_promotion_requests.create.assert_awaited_once()
        create_kwargs = mock_promotion_requests.create.await_args.kwargs
        assert create_kwargs["db"] is mock_db
        assert create_kwargs["object"].rp_application_id == 33
        assert create_kwargs["object"].target_environment == "production"
        assert create_kwargs["object"].status == "review_tracked"
        assert create_kwargs["object"].review_status == "pending"
        assert create_kwargs["object"].external_reference == "CAB-123"
        assert create_kwargs["object"].requested_at is not None
        assert create_kwargs["commit"] is False
        assert mock_db.add.call_args.args[0].operation == "review_request"
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_pending_production_review_metadata_update_preserves_request_time_and_outcome_fields(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()
        requested_at = datetime(2026, 8, 11, 12, 0, tzinfo=UTC)
        workspace = {
            "id": 9,
            "uuid": WORKSPACE_UUID,
            "name": "Benefits Workspace",
        }
        rp_application = {
            "id": 33,
            "uuid": "018f6f83-0000-0000-0000-000000000701",
            "workspace_id": 9,
            "canada_login_environment": "production",
        }
        pending_request = {
            "id": 4,
            "rp_application_id": 33,
            "target_environment": "production",
            "status": "review_tracked",
            "review_status": "pending",
            "external_reference": "CAB-123",
            "reviewed_by_user_id": None,
            "reviewed_by_team": None,
            "requested_at": requested_at,
            "reviewed_at": None,
            "decided_at": None,
            "created_at": requested_at,
            "updated_at": None,
        }
        stored_request = {
            **pending_request,
            "external_reference": "CAB-456",
            "updated_at": datetime(2026, 8, 11, 12, 30, tzinfo=UTC),
        }

        with (
            patch.object(service, "_require_workspace_capability", _allowed_scope(workspace)),
            patch.object(
                service,
                "_get_workspace_rp_application",
                AsyncMock(return_value=rp_application),
            ),
            patch("src.app.services.workspace_service.crud_rp_application_promotion_requests") as mock_reviews,
        ):
            mock_reviews.get = AsyncMock(side_effect=[pending_request, stored_request])
            mock_reviews.update = AsyncMock(return_value={"id": 4})

            result = await service.upsert_workspace_rp_application_promotion_request(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                rp_application_uuid=rp_application["uuid"],
                payload=PromotionRequestUpsert(external_reference="CAB-456"),
                current_user=_partner(),
            )

        assert result["status"] == "pending"
        assert result["external_reference"] == "CAB-456"
        assert result["requested_at"] == requested_at
        update = mock_reviews.update.await_args.kwargs
        assert set(update["object"]) == {"external_reference", "updated_at"}
        assert update["object"]["external_reference"] == "CAB-456"
        assert update["review_status"] == "pending"
        assert update["commit"] is False
        assert mock_db.add.call_args.args[0].operation == "review_update"
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("review_status", ["approved", "rejected"])
    async def test_partner_cannot_reset_terminal_production_review(
        self,
        mock_db,
        review_status: str,
    ) -> None:
        service = WorkspaceService()
        workspace = {"id": 9, "uuid": WORKSPACE_UUID, "name": "Benefits Workspace"}
        rp_application = {
            "id": 33,
            "uuid": "018f6f83-0000-0000-0000-000000000701",
            "canada_login_environment": "production",
        }

        with (
            patch.object(service, "_require_workspace_capability", _allowed_scope(workspace)),
            patch.object(
                service,
                "_get_workspace_rp_application",
                AsyncMock(return_value=rp_application),
            ),
            patch("src.app.services.workspace_service.crud_rp_application_promotion_requests") as mock_reviews,
        ):
            mock_reviews.get = AsyncMock(
                return_value={
                    "id": 4,
                    "rp_application_id": 33,
                    "review_status": review_status,
                }
            )
            mock_reviews.update = AsyncMock()

            with pytest.raises(
                BadRequestException,
                match="Only a pending Production-review request can be updated",
            ):
                await service.upsert_workspace_rp_application_promotion_request(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_UUID,
                    rp_application_uuid=rp_application["uuid"],
                    payload=PromotionRequestUpsert(external_reference="CAB-456"),
                    current_user=_partner(),
                )

        mock_reviews.update.assert_not_awaited()
        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_ambiguous_historical_review_is_not_mapped_or_replaced(self, mock_db) -> None:
        service = WorkspaceService()
        workspace = {"id": 9, "uuid": WORKSPACE_UUID, "name": "Benefits Workspace"}
        rp_application = {
            "id": 33,
            "uuid": "018f6f83-0000-0000-0000-000000000701",
            "canada_login_environment": "production",
        }

        with (
            patch.object(service, "_require_workspace_capability", _allowed_scope(workspace)),
            patch.object(
                service,
                "_get_workspace_rp_application",
                AsyncMock(return_value=rp_application),
            ),
            patch("src.app.services.workspace_service.crud_rp_application_promotion_requests") as mock_reviews,
        ):
            mock_reviews.get = AsyncMock(
                return_value={
                    "id": 4,
                    "rp_application_id": 33,
                    "target_environment": "production",
                    "status": "changes_requested",
                    "review_status": None,
                    "requested_at": datetime(2026, 8, 11, 12, 0, tzinfo=UTC),
                    "created_at": datetime(2026, 8, 11, 12, 0, tzinfo=UTC),
                }
            )
            mock_reviews.create = AsyncMock()
            mock_reviews.update = AsyncMock()

            with pytest.raises(
                BadRequestException,
                match="Historical Production-review record requires reconciliation",
            ):
                await service.get_workspace_rp_application_promotion_request(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_UUID,
                    rp_application_uuid=rp_application["uuid"],
                    current_user=_partner(CanonicalRoleCode.READ_ONLY),
                )

            with pytest.raises(
                BadRequestException,
                match="Historical Production-review record requires reconciliation",
            ):
                await service.upsert_workspace_rp_application_promotion_request(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_UUID,
                    rp_application_uuid=rp_application["uuid"],
                    payload=PromotionRequestUpsert(external_reference="CAB-456"),
                    current_user=_partner(),
                )

            with pytest.raises(
                BadRequestException,
                match="Historical Production-review record requires reconciliation",
            ):
                await service.review_workspace_rp_application_promotion_request(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_UUID,
                    rp_application_uuid=rp_application["uuid"],
                    payload=PromotionReviewUpdate(
                        status="rejected",
                        reviewed_by_team="CanadaLogin review",
                    ),
                    current_user=_cl_admin(),
                )

            summary = await service._attach_rp_application_promotion_request_summary(
                mock_db,
                rp_application,
            )

        assert summary["production_review_reconciliation_required"] is True
        assert summary.get("production_review_status") is None

        mock_reviews.create.assert_not_awaited()
        mock_reviews.update.assert_not_awaited()
        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_nested_promotion_read_exposes_public_source_and_target_lineage(self, mock_db) -> None:
        service = WorkspaceService()
        application_uuid = UUID("018f6f83-0000-0000-0000-000000000501")
        source_uuid = UUID("018f6f83-0000-0000-0000-000000000701")
        target_uuid = UUID("018f6f83-0000-0000-0000-000000000702")
        target = {
            "id": 34,
            "uuid": target_uuid,
            "workspace_id": 9,
            "application_information_id": 17,
            "configuration_name": "Partner production A",
            "canada_login_environment": "production",
        }
        source_id_result = Mock()
        source_id_result.scalar_one_or_none.return_value = 33
        source_uuid_result = Mock()
        source_uuid_result.scalar_one_or_none.return_value = source_uuid
        mock_db.execute = AsyncMock(side_effect=[source_id_result, source_uuid_result])

        with (
            patch.object(
                service,
                "_resolve_application_rp_configuration_access",
                AsyncMock(
                    return_value=(
                        {"id": 9, "uuid": WORKSPACE_UUID, "department_id": 7},
                        Mock(),
                        target,
                    )
                ),
            ),
            patch.object(
                service,
                "_get_rp_application_promotion_request_record",
                AsyncMock(return_value={"id": 4}),
            ),
            patch.object(
                service,
                "_build_rp_application_promotion_request_read",
                AsyncMock(
                    return_value={
                        "target_environment": "production",
                        "status": "pending",
                        "external_reference": "CAB-123",
                        "reviewed_by_user_uuid": None,
                        "reviewed_by_team": None,
                        "requested_at": datetime(2026, 8, 11, 12, 0, tzinfo=UTC),
                        "reviewed_at": None,
                        "decided_at": None,
                        "created_at": datetime(2026, 8, 11, 12, 0, tzinfo=UTC),
                        "updated_at": None,
                    }
                ),
            ),
        ):
            result = await service.get_application_rp_configuration_promotion_request(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_uuid,
                rp_configuration_uuid=target_uuid,
                current_user=_cl_admin(),
            )

        assert result["application_information_uuid"] == application_uuid
        assert result["source_rp_configuration_uuid"] == source_uuid
        assert result["target_rp_configuration_uuid"] == target_uuid
        assert result["target_configuration_name"] == "Partner production A"

    @pytest.mark.asyncio
    async def test_review_workspace_rp_application_promotion_request_updates_review_metadata(self, mock_db) -> None:
        service = WorkspaceService()
        workspace_uuid = "018f6f83-0000-0000-0000-000000000201"
        rp_application_uuid = "018f6f83-0000-0000-0000-000000000701"
        workspace = {
            "id": 9,
            "uuid": workspace_uuid,
            "name": "Benefits Workspace",
        }
        rp_application = {
            "id": 33,
            "uuid": rp_application_uuid,
            "workspace_id": 9,
            "department_id": 7,
            "application_information_id": 17,
            "dnr_app_name": "Benefits Portal",
            "canada_login_environment": "production",
            "status": None,
            "created_by": 42,
            "created_at": "2026-07-30T16:00:00",
            "updated_at": None,
            "deleted_at": None,
            "is_deleted": False,
            "onboarding_state": "under_review",
        }
        promotion_request = {
            "id": 4,
            "rp_application_id": 33,
            "target_environment": "production",
            "status": "review_tracked",
            "review_status": "pending",
            "external_reference": "CAB-123",
            "reviewed_by_user_id": None,
            "reviewed_by_team": None,
            "requested_at": "2026-08-11T11:45:00+00:00",
            "reviewed_at": None,
            "decided_at": None,
            "created_at": "2026-08-11T11:45:00+00:00",
        }
        approved_request = {
            **promotion_request,
            "review_status": "approved",
            "reviewed_by_user_id": 1,
            "reviewed_by_team": "CanadaLogin",
            "reviewed_at": "2026-08-11T12:15:00+00:00",
            "decided_at": "2026-08-11T12:15:00+00:00",
            "updated_at": "2026-08-11T12:15:00+00:00",
        }

        with (
            patch.object(
                service,
                "_require_workspace_capability",
                _allowed_scope(workspace, CanonicalRoleCode.CL_ADMIN),
            ),
            patch.object(
                service,
                "_get_workspace_rp_application",
                AsyncMock(return_value=rp_application),
            ),
            patch("src.app.services.workspace_service.crud_rp_application_promotion_requests") as mock_promotion_requests,
            patch("src.app.services.workspace_service.crud_users") as mock_users,
        ):
            mock_promotion_requests.get = AsyncMock(side_effect=[promotion_request, approved_request])
            mock_promotion_requests.update = AsyncMock(return_value={"id": 4})
            mock_users.get = AsyncMock(return_value=None)

            result = await service.review_workspace_rp_application_promotion_request(
                db=mock_db,
                workspace_uuid=workspace_uuid,
                rp_application_uuid=rp_application_uuid,
                payload=PromotionReviewUpdate(
                    status="approved",
                    external_reference="CAB-123",
                    reviewed_by_team="CanadaLogin",
                ),
                current_user=_cl_admin(),
            )

        assert result["status"] == "approved"
        mock_promotion_requests.update.assert_awaited_once()
        update_kwargs = mock_promotion_requests.update.await_args.kwargs
        assert update_kwargs["db"] is mock_db
        assert update_kwargs["id"] == 4
        assert update_kwargs["object"]["review_status"] == "approved"
        assert "status" not in update_kwargs["object"]
        assert update_kwargs["object"]["external_reference"] == "CAB-123"
        assert update_kwargs["object"]["reviewed_by_team"] == "CanadaLogin"
        assert update_kwargs["object"]["reviewed_by_user_id"] == 1
        assert update_kwargs["object"]["reviewed_at"] is not None
        assert update_kwargs["object"]["decided_at"] is not None
        assert update_kwargs["review_status"] == "pending"
        assert update_kwargs["commit"] is False
        assert mock_db.add.call_args.args[0].operation == "review_decision"
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("review_status", ["approved", "rejected"])
    async def test_cl_admin_cannot_decide_terminal_production_review_again(
        self,
        mock_db,
        review_status: str,
    ) -> None:
        service = WorkspaceService()
        workspace = {"id": 9, "uuid": WORKSPACE_UUID, "name": "Benefits Workspace"}
        rp_application = {
            "id": 33,
            "uuid": "018f6f83-0000-0000-0000-000000000701",
            "canada_login_environment": "production",
        }

        with (
            patch.object(
                service,
                "_require_workspace_capability",
                _allowed_scope(workspace, CanonicalRoleCode.CL_ADMIN),
            ),
            patch.object(
                service,
                "_get_workspace_rp_application",
                AsyncMock(return_value=rp_application),
            ),
            patch("src.app.services.workspace_service.crud_rp_application_promotion_requests") as mock_reviews,
        ):
            mock_reviews.get = AsyncMock(
                return_value={
                    "id": 4,
                    "rp_application_id": 33,
                    "review_status": review_status,
                }
            )
            mock_reviews.update = AsyncMock()

            with pytest.raises(
                BadRequestException,
                match="Only a pending Production-review request can receive an outcome",
            ):
                await service.review_workspace_rp_application_promotion_request(
                    db=mock_db,
                    workspace_uuid=WORKSPACE_UUID,
                    rp_application_uuid=rp_application["uuid"],
                    payload=PromotionReviewUpdate(status="rejected"),
                    current_user=_cl_admin(),
                )

        mock_reviews.update.assert_not_awaited()
        mock_db.add.assert_not_called()
        mock_db.commit.assert_not_awaited()

    def test_workspace_member_crud_methods_are_retired(self) -> None:
        service = WorkspaceService()

        for method_name in (
            "list_workspace_members",
            "add_workspace_member",
            "update_workspace_member_role",
            "remove_workspace_member",
        ):
            assert not hasattr(service, method_name)

    @pytest.mark.asyncio
    async def test_create_workspace_application_information_sets_workspace_and_creator(self, mock_db) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members", create=True) as mock_workspace_members,
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
                current_user=_partner(),
            )

        assert result["workspace_id"] == 9
        create_kwargs = mock_application_information.create.await_args.kwargs
        assert create_kwargs["object"].workspace_id == 9
        assert create_kwargs["object"].created_by == 42
        assert create_kwargs["object"].service_name_en == "Example service"
        assert create_kwargs["object"].service_name_fr == "Service exemple"

    @pytest.mark.asyncio
    async def test_list_application_rp_configurations_scopes_records_to_parent(self, mock_db) -> None:
        service = WorkspaceService()
        workspace = {
            "id": 9,
            "uuid": WORKSPACE_UUID,
            "name": "Benefits Workspace",
        }
        application_information = {
            "id": 17,
            "uuid": "018f6f83-0000-0000-0000-000000000501",
            "service_name_en": "Canonical Benefits Portal",
            "service_name_fr": "Portail canonique des prestations",
        }
        configuration = {
            "id": 33,
            "uuid": "018f6f83-0000-0000-0000-000000000701",
            "configuration_name": "Partner staging A",
            "dnr_app_name": "Stale child name",
            "canada_login_environment": "staging",
            "onboarding_state": "draft",
            "registration_last_completed_step": "basics",
            "oidc_registration_payload": {
                "service_name_en": "Stale payload name",
                "service_name_fr": "Ancien nom de charge utile",
            },
        }

        with (
            patch.object(
                service,
                "_require_workspace_capability",
                _allowed_scope(workspace, CanonicalRoleCode.RP_ADMIN),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(return_value=application_information),
            ) as mock_get_application,
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications,
        ):
            mock_rp_applications.get_multi = AsyncMock(return_value={"data": [configuration]})

            result = await service.list_application_rp_configurations(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_information["uuid"],
                current_user=_partner(),
            )

        assert result[0]["configurationName"] == "Partner staging A"
        assert str(result[0]["applicationInformationUuid"]) == application_information["uuid"]
        assert result[0]["serviceNameEn"] == "Canonical Benefits Portal"
        assert result[0]["serviceNameFr"] == "Portail canonique des prestations"
        assert result[0]["resumeTaskPath"].endswith("/registration/endpoints")
        mock_get_application.assert_awaited_once_with(
            db=mock_db,
            workspace_id=9,
            application_information_uuid=application_information["uuid"],
        )
        mock_rp_applications.get_multi.assert_awaited_once_with(
            db=mock_db,
            workspace_id=9,
            application_information_id=17,
            sort_columns="id",
            sort_orders="asc",
            is_deleted=False,
            schema_to_select=service.list_application_rp_configurations.__globals__["RPApplicationRead"],
        )

    @pytest.mark.asyncio
    async def test_application_rp_configuration_view_uses_parent_names_without_duplicate_aliases(self, mock_db) -> None:
        service = WorkspaceService()
        workspace = {
            "id": 9,
            "uuid": WORKSPACE_UUID,
            "name": "Benefits Workspace",
        }
        application_information = {
            "id": 17,
            "uuid": "018f6f83-0000-0000-0000-000000000501",
            "service_name_en": "Canonical Benefits Portal",
            "service_name_fr": "Portail canonique des prestations",
        }
        configuration = {
            "id": 33,
            "uuid": "018f6f83-0000-0000-0000-000000000701",
            "configuration_name": "Partner staging A",
            "partner_environment": None,
            "canada_login_environment": "staging",
            "onboarding_state": "draft",
            "registration_draft_version": 6,
            "registration_last_completed_step": "encryption",
            "oidc_registration_payload": {
                "service_name_en": "Stale child English name",
                "service_name_fr": "Ancien nom français enfant",
            },
        }

        with (
            patch.object(
                service,
                "_require_workspace_capability",
                _allowed_scope(workspace, CanonicalRoleCode.RP_ADMIN),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(return_value=application_information),
            ),
            patch.object(
                service,
                "_get_application_rp_configuration",
                AsyncMock(return_value=configuration),
            ),
        ):
            result = await service.get_application_rp_configuration_configuration(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid=application_information["uuid"],
                rp_configuration_uuid=configuration["uuid"],
                current_user=_partner(),
            )

        assert result["serviceNameEn"] == "Canonical Benefits Portal"
        assert result["serviceNameFr"] == "Portail canonique des prestations"
        assert result["configurationName"] == "Partner staging A"
        assert str(result["applicationInformationUuid"]) == application_information["uuid"]

    @pytest.mark.asyncio
    async def test_get_application_rp_configuration_filters_complete_ancestry(self, mock_db) -> None:
        service = WorkspaceService()
        configuration = {
            "id": 33,
            "uuid": "018f6f83-0000-0000-0000-000000000701",
            "workspace_id": 9,
            "application_information_id": 17,
            "dnr_app_name": "Benefits Portal",
            "configuration_name": "Partner staging A",
        }

        with (
            patch("src.app.services.workspace_service.crud_rp_applications") as mock_rp_applications,
            patch.object(
                service,
                "_attach_rp_application_promotion_request_summary",
                AsyncMock(return_value=configuration),
            ),
        ):
            mock_rp_applications.get = AsyncMock(return_value=configuration)

            result = await service._get_application_rp_configuration(
                db=mock_db,
                workspace_id=9,
                application_information_id=17,
                rp_configuration_uuid=configuration["uuid"],
            )

        assert result == configuration
        mock_rp_applications.get.assert_awaited_once_with(
            db=mock_db,
            workspace_id=9,
            application_information_id=17,
            uuid=configuration["uuid"],
            is_deleted=False,
            schema_to_select=service._get_application_rp_configuration.__globals__["RPApplicationRead"],
        )

    @pytest.mark.asyncio
    async def test_delete_workspace_application_information_rejects_every_retained_rp_configuration(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members", create=True) as mock_workspace_members,
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
                match="Retained RP configurations must be resolved before deleting the Application",
            ):
                await service.delete_workspace_application_information(
                    db=mock_db,
                    workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                    application_information_uuid="018f6f83-0000-0000-0000-000000000501",
                    current_user=_partner(),
                )

        mock_rp_applications.exists.assert_awaited_once_with(
            db=mock_db,
            application_information_id=17,
        )

    @pytest.mark.asyncio
    async def test_add_application_information_contact_sets_parent_and_creator(self, mock_db) -> None:
        service = WorkspaceService()
        actor_result = Mock()
        actor_result.scalar_one_or_none.return_value = UUID("018f6f83-0000-0000-0000-000000000301")
        mock_db.execute = AsyncMock(return_value=actor_result)

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members", create=True) as mock_workspace_members,
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
                    "name_en": None,
                    "name_fr": None,
                    "first_name": "Jane",
                    "last_name": "Doe",
                    "responsibility_en": "Product owner",
                    "responsibility_fr": "Responsable du produit",
                    "email": "jane.doe@example.gc.ca",
                    "phone_number": "555-555-5555",
                    "alternate_phone_number": None,
                    "identity_confirmed_at": "2026-07-30T15:15:00Z",
                    "identity_confirmed_by": 42,
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
                    first_name="Jane",
                    last_name="Doe",
                    responsibility_en="Product owner",
                    responsibility_fr="Responsable du produit",
                    email="jane.doe@example.gc.ca",
                    phone_number="555-555-5555",
                ),
                current_user=_partner(),
            )

        assert result["application_information_id"] == 17
        create_kwargs = mock_contacts.create.await_args.kwargs
        assert create_kwargs["object"].application_information_id == 17
        assert create_kwargs["object"].created_by == 42
        assert create_kwargs["object"].first_name == "Jane"
        assert create_kwargs["object"].last_name == "Doe"
        assert create_kwargs["object"].identity_confirmed_by == 42
        assert str(create_kwargs["object"].email) == "jane.doe@example.gc.ca"

    @pytest.mark.asyncio
    async def test_contact_read_preserves_unconfirmed_legacy_names_without_guessing(self, mock_db) -> None:
        result = await WorkspaceService._build_application_information_contact_read(
            db=mock_db,
            contact={
                "id": 3,
                "uuid": "018f6f83-0000-0000-0000-000000000601",
                "application_information_id": 17,
                "created_by": 42,
                "name_en": "Jane Mary Doe",
                "name_fr": "Jeanne Marie Doe",
                "first_name": None,
                "last_name": None,
                "responsibility_en": "Product owner",
                "responsibility_fr": "Responsable du produit",
                "email": "jane.doe@example.gc.ca",
                "phone_number": None,
                "alternate_phone_number": None,
                "identity_confirmed_at": None,
                "identity_confirmed_by": None,
                "created_at": "2026-07-30T15:15:00Z",
                "updated_at": None,
                "deleted_at": None,
                "is_deleted": False,
            },
        )

        assert result["name_en"] == "Jane Mary Doe"
        assert result["name_fr"] == "Jeanne Marie Doe"
        assert result["first_name"] is None
        assert result["last_name"] is None
        assert result["identity_confirmation_required"] is True
        assert result["identity_confirmed_by_user_uuid"] is None
        assert "identity_confirmed_by" not in result
        mock_db.execute.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_updating_legacy_contact_identity_confirms_names_with_public_actor_uuid(self, mock_db) -> None:
        service = WorkspaceService()
        actor_uuid = UUID("018f6f83-0000-0000-0000-000000000301")
        actor_result = Mock()
        actor_result.scalar_one_or_none.return_value = actor_uuid
        mock_db.execute = AsyncMock(return_value=actor_result)
        legacy_contact = {
            "id": 3,
            "uuid": "018f6f83-0000-0000-0000-000000000601",
            "application_information_id": 17,
            "created_by": 42,
            "name_en": "Jane Mary Doe",
            "name_fr": "Jeanne Marie Doe",
            "first_name": None,
            "last_name": None,
            "responsibility_en": "Product owner",
            "responsibility_fr": "Responsable du produit",
            "email": "jane.doe@example.gc.ca",
            "phone_number": None,
            "alternate_phone_number": None,
            "identity_confirmed_at": None,
            "identity_confirmed_by": None,
            "created_at": "2026-07-30T15:15:00Z",
            "updated_at": None,
            "deleted_at": None,
            "is_deleted": False,
        }
        confirmed_contact = {
            **legacy_contact,
            "first_name": "Jane",
            "last_name": "Doe",
            "identity_confirmed_at": "2026-08-13T00:00:00Z",
            "identity_confirmed_by": 42,
            "updated_at": "2026-08-13T00:00:00Z",
        }

        with (
            patch.object(
                service,
                "_require_workspace_capability",
                _allowed_scope({"id": 9, "uuid": str(WORKSPACE_UUID)}),
            ),
            patch.object(
                service,
                "_get_workspace_application_information",
                AsyncMock(return_value={"id": 17}),
            ),
            patch.object(
                service,
                "_get_application_information_contact",
                AsyncMock(side_effect=[legacy_contact, confirmed_contact]),
            ),
            patch("src.app.services.workspace_service.crud_application_information_contacts") as mock_contacts,
        ):
            mock_contacts.update = AsyncMock()
            result = await service.update_application_information_contact(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                application_information_uuid="018f6f83-0000-0000-0000-000000000501",
                contact_uuid=legacy_contact["uuid"],
                payload=ApplicationInformationContactUpdate(
                    first_name="Jane",
                    last_name="Doe",
                ),
                current_user=_partner(),
            )

        update_object = mock_contacts.update.await_args.kwargs["object"]
        changed_fields = update_object.model_dump(exclude_unset=True)
        assert changed_fields["first_name"] == "Jane"
        assert changed_fields["last_name"] == "Doe"
        assert changed_fields["identity_confirmed_by"] == 42
        assert changed_fields["identity_confirmed_at"] is not None
        assert "responsibility_en" not in changed_fields
        assert "responsibility_fr" not in changed_fields
        assert result["identity_confirmation_required"] is False
        assert result["identity_confirmed_by_user_uuid"] == str(actor_uuid)
        assert "identity_confirmed_by" not in result

    @pytest.mark.asyncio
    async def test_create_workspace_rp_application_sets_workspace_department_and_registration_payload(self, mock_db) -> None:
        service = WorkspaceService()
        service._resolve_workspace_application_information_id = AsyncMock(return_value=17)  # type: ignore[method-assign]

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members", create=True) as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_application_information") as mock_application_information,
            patch("src.app.services.workspace_service.crud_rp_application_access_grants", create=True) as mock_access_grants,
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
            mock_access_grants.get = AsyncMock(return_value=None)
            mock_access_grants.create = AsyncMock(
                return_value={
                    "uuid": "018f6f83-0000-0000-0000-000000000702",
                    "workspace_id": 9,
                    "user_id": 42,
                    "role": "RP User (Edit)",
                    "status": "active",
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
                    configuration_name="Staging integration A",
                    partner_environment="Partner staging",
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
                current_user=_partner(),
            )

        assert result["workspace_id"] == 9
        create_kwargs = mock_rp_applications.create.await_args.kwargs
        assert create_kwargs["object"].workspace_id == 9
        assert create_kwargs["object"].department_id == 7
        assert create_kwargs["object"].application_information_id == 17
        assert create_kwargs["object"].dnr_app_name == "Benefits Portal"
        assert create_kwargs["object"].canada_login_environment == "staging"
        assert create_kwargs["object"].oidc_registration_payload["client_type"] == "confidential"
        mock_access_grants.get.assert_not_awaited()
        mock_access_grants.create.assert_not_awaited()
        mock_workspace_members.get.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_create_workspace_rp_application_does_not_promote_legacy_access_rows(self, mock_db) -> None:
        service = WorkspaceService()
        service._resolve_workspace_application_information_id = AsyncMock(return_value=17)  # type: ignore[method-assign]

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members", create=True) as mock_workspace_members,
            patch("src.app.services.workspace_service.crud_application_information") as mock_application_information,
            patch("src.app.services.workspace_service.crud_rp_application_access_grants", create=True) as mock_access_grants,
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
            mock_access_grants.get = AsyncMock(
                return_value={
                    "uuid": "018f6f83-0000-0000-0000-000000000702",
                    "workspace_id": 9,
                    "user_id": 42,
                    "role": "Read Only",
                    "status": "active",
                }
            )
            mock_access_grants.create = AsyncMock(return_value=None)
            mock_access_grants.update = AsyncMock(return_value=None)
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

            await service.create_workspace_rp_application(
                db=mock_db,
                workspace_uuid="018f6f83-0000-0000-0000-000000000201",
                payload=WorkspaceRPApplicationRegistrationCreate(
                    application_information_uuid="018f6f83-0000-0000-0000-000000000501",
                    configuration_name="Staging integration A",
                    partner_environment="Partner staging",
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
                current_user=_partner(),
            )

        mock_access_grants.create.assert_not_awaited()
        mock_access_grants.get.assert_not_awaited()
        mock_access_grants.update.assert_not_awaited()
        mock_workspace_members.get.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_get_workspace_rp_application_usage_summary_uses_ibm_admin_telemetry_for_selected_day(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()
        mock_ibm_sv_admin_service = Mock()
        mock_ibm_sv_admin_service.get_application_total_logins = AsyncMock(return_value={"response": {"total": 11, "successful": 9, "failed": 2}})

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members", create=True) as mock_workspace_members,
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
                current_user=_partner(),
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
    async def test_get_workspace_rp_application_usage_summary_rejects_missing_ibm_application_id(
        self,
        mock_db,
    ) -> None:
        service = WorkspaceService()
        mock_ibm_sv_admin_service = Mock()
        mock_ibm_sv_admin_service.get_application_total_logins = AsyncMock()

        with (
            patch("src.app.services.workspace_service.crud_workspaces") as mock_workspaces,
            patch("src.app.services.workspace_service.crud_workspace_members", create=True) as mock_workspace_members,
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
                    current_user=_partner(),
                    ibm_sv_admin_service=mock_ibm_sv_admin_service,
                )

        assert exc_info.value.status_code == 409
        assert exc_info.value.detail == "RP application is not linked to an IBM Security Verify application"
        mock_ibm_sv_admin_service.get_application_total_logins.assert_not_called()
