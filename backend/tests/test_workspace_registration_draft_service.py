import json
import logging
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from src.app.core.exceptions.http_exceptions import (
    BadRequestException,
    RegistrationDraftConflictException,
)
from src.app.core.logging_privacy import hash_log_value
from src.app.schemas.onboarding import (
    WorkspaceRPApplicationOnboardingLifecycleTransitionRequest,
)
from src.app.schemas.rp_application import (
    WorkspaceRPApplicationRegistrationCreate,
    WorkspaceRPApplicationRegistrationDraftCreate,
    WorkspaceRPApplicationRegistrationDraftPatch,
)
from src.app.services.workspace_service import WorkspaceService

WORKSPACE_UUID = "018f6f83-0000-0000-0000-000000000201"
APPLICATION_UUID = "018f6f83-0000-0000-0000-000000000701"
CREATION_KEY = "018f6f83-0000-0000-0000-000000000801"
APPLICATION_INFORMATION_UUID = "018f6f83-0000-0000-0000-000000000901"
ENDPOINTS_CONTRACT_PATH = Path(__file__).resolve().parents[2] / "tests/contracts/workspace-rp-registration-endpoints-complete-step.json"


def _endpoints_contract() -> dict:
    return json.loads(ENDPOINTS_CONTRACT_PATH.read_text(encoding="utf-8"))


def _workspace() -> dict:
    return {
        "department_id": 7,
        "id": 9,
        "name": "Benefits Workspace",
        "uuid": WORKSPACE_UUID,
    }


def _draft(**overrides: object) -> dict:
    return {
        "application_information_id": 13,
        "configuration_name": "Test integration A",
        "partner_environment": "Partner test",
        "canada_login_environment": "test",
        "created_by": 42,
        "dnr_app_name": "Benefits Portal",
        "is_deleted": False,
        "oidc_registration_payload": {
            "canada_login_environment": "test",
            "service_name_en": "Benefits Portal",
            "service_name_fr": "Portail des prestations",
        },
        "onboarding_state": "draft",
        "registration_draft_version": 1,
        "registration_last_completed_step": "basics",
        "uuid": APPLICATION_UUID,
        "workspace_id": 9,
        **overrides,
    }


def _create_payload() -> WorkspaceRPApplicationRegistrationDraftCreate:
    return WorkspaceRPApplicationRegistrationDraftCreate(
        applicationInformationUuid=APPLICATION_INFORMATION_UUID,
        configurationName="Test integration A",
        partnerEnvironment="Partner test",
        canadaLoginEnvironment="test",
        serviceNameEn="Benefits Portal",
        serviceNameFr="Portail des prestations",
    )


def _service() -> WorkspaceService:
    service = WorkspaceService()
    service._require_workspace_capability = AsyncMock(return_value=(_workspace(), None))  # type: ignore[method-assign]
    service._resolve_workspace_application_information_id = AsyncMock(return_value=13)  # type: ignore[method-assign]
    service._resolve_workspace_application_information_uuid = AsyncMock(  # type: ignore[method-assign]
        return_value=APPLICATION_INFORMATION_UUID
    )
    return service


def _complete_answers() -> dict:
    return WorkspaceRPApplicationRegistrationCreate(
        applicationInformationUuid=APPLICATION_INFORMATION_UUID,
        configurationName="Test integration A",
        partnerEnvironment="Partner test",
        canadaLoginEnvironment="test",
        serviceNameEn="Benefits Portal",
        serviceNameFr="Portail des prestations",
        applicationEnvironmentUrlEn="https://benefits.canada.ca",
        applicationEnvironmentUrlFr="https://prestations.canada.ca",
        redirectUris=["https://benefits.canada.ca/callback"],
        postLogoutRedirectUris=[],
        logoutMode="front_channel",
        logoutUri="https://benefits.canada.ca/logout",
        clientType="confidential",
        supportsAuthorizationCodeFlow=True,
        clientAuthMethod="client_secret_basic",
        requestedScopes=["openid", "profile"],
        sectorIdentifier="https://benefits.canada.ca",
        sharesPairwiseIdentifiers=False,
        pkceSupported=True,
        pkceAlgorithms=["S256"],
        requestSigningSupported=False,
        requestSigningRoadmap=False,
        signatureValidationSupported=True,
        signatureValidationTargets=["id_token"],
        signatureValidationAlgorithms=["RS256"],
        requestEncryptionSupported=False,
        requestEncryptionRoadmap=False,
        messageDecryptionSupported=True,
        messageDecryptionTargets=["id_token"],
        messageDecryptionKeyManagementAlgorithms=["RSA-OAEP-256"],
        messageDecryptionContentAlgorithms=["A256GCM"],
    ).model_dump(
        mode="json",
        exclude={"application_information_uuid", "configuration_name", "partner_environment"},
        exclude_none=True,
    )


@pytest.mark.asyncio
async def test_same_creation_key_and_basics_returns_existing_draft(mock_db) -> None:
    service = _service()
    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.get = AsyncMock(return_value=_draft())
        applications.create = AsyncMock()

        result = await service.create_workspace_rp_application_registration_draft(
            db=mock_db,
            workspace_uuid=WORKSPACE_UUID,
            payload=_create_payload(),
            current_user={"id": 42},
            registration_creation_key=CREATION_KEY,
        )

    assert result["rp_application_uuid"] == APPLICATION_UUID
    assert result["registration_draft_version"] == 1
    applications.create.assert_not_awaited()


@pytest.mark.asyncio
async def test_creation_key_reuse_with_different_actor_fails_safely(mock_db) -> None:
    service = _service()
    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.get = AsyncMock(return_value=_draft(created_by=99))

        with pytest.raises(
            RegistrationDraftConflictException,
            match="creation key is already in use",
        ) as exc_info:
            await service.create_workspace_rp_application_registration_draft(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                payload=_create_payload(),
                current_user={"id": 42},
                registration_creation_key=CREATION_KEY,
            )

    assert exc_info.value.code == "registration_draft_creation_conflict"


@pytest.mark.asyncio
async def test_creation_key_reuse_with_changed_basics_link_fails_safely(mock_db) -> None:
    service = _service()
    service._resolve_workspace_application_information_id = AsyncMock(return_value=14)  # type: ignore[method-assign]
    payload = WorkspaceRPApplicationRegistrationDraftCreate(
        applicationInformationUuid=APPLICATION_INFORMATION_UUID,
        configurationName="Test integration A",
        partnerEnvironment="Partner test",
        canadaLoginEnvironment="test",
        serviceNameEn="Benefits Portal",
        serviceNameFr="Portail des prestations",
    )
    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.get = AsyncMock(return_value=_draft(application_information_id=13))

        with pytest.raises(RegistrationDraftConflictException) as exc_info:
            await service.create_workspace_rp_application_registration_draft(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                payload=payload,
                current_user={"id": 42},
                registration_creation_key=CREATION_KEY,
            )

    assert exc_info.value.code == "registration_draft_creation_conflict"


@pytest.mark.asyncio
async def test_creation_key_reuse_with_changed_partner_environment_fails_safely(mock_db) -> None:
    service = _service()
    payload = _create_payload().model_copy(update={"partner_environment": "Partner test 2"})
    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.get = AsyncMock(return_value=_draft())

        with pytest.raises(RegistrationDraftConflictException) as exc_info:
            await service.create_workspace_rp_application_registration_draft(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                payload=payload,
                current_user={"id": 42},
                registration_creation_key=CREATION_KEY,
            )

    assert exc_info.value.code == "registration_draft_creation_conflict"


@pytest.mark.asyncio
async def test_new_draft_starts_at_version_one_with_basics_completed(
    mock_db,
    caplog,
) -> None:
    service = _service()
    created = _draft()
    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.get = AsyncMock(return_value=None)
        applications.create = AsyncMock(return_value=created)

        with caplog.at_level(logging.INFO):
            result = await service.create_workspace_rp_application_registration_draft(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                payload=_create_payload(),
                current_user={"id": 42},
                registration_creation_key=CREATION_KEY,
                correlation_id="request-123",
            )

    create_object = applications.create.await_args.kwargs["object"]
    assert create_object.registration_draft_version == 1
    assert create_object.registration_last_completed_step == "basics"
    assert create_object.partner_environment == "Partner test"
    assert "partner_environment" not in create_object.oidc_registration_payload
    assert str(create_object.registration_creation_key) == CREATION_KEY
    assert result["registration_last_completed_step"] == "basics"
    assert "event=draft_create" in caplog.text
    assert f"application_information_reference={hash_log_value(APPLICATION_INFORMATION_UUID)}" in caplog.text
    assert APPLICATION_INFORMATION_UUID not in caplog.text
    assert WORKSPACE_UUID not in caplog.text
    assert "changed_field_names=canada_login_environment,service_name_en,service_name_fr" in caplog.text
    assert "Benefits Portal" not in caplog.text
    assert "Portail des prestations" not in caplog.text
    assert "correlation_id=request-123" in caplog.text


@pytest.mark.asyncio
async def test_legacy_draft_derives_only_contiguous_completed_steps(mock_db) -> None:
    service = _service()
    service._get_workspace_rp_application = AsyncMock(  # type: ignore[method-assign]
        return_value=_draft(
            registration_draft_version=0,
            registration_last_completed_step=None,
            oidc_registration_payload={
                "canada_login_environment": "test",
                "service_name_en": "Benefits Portal",
                "service_name_fr": "Portail des prestations",
                "request_signing_supported": False,
                "request_signing_roadmap": False,
            },
        )
    )

    result = await service.get_workspace_rp_application_registration_draft(
        db=mock_db,
        workspace_uuid=WORKSPACE_UUID,
        rp_application_uuid=APPLICATION_UUID,
        current_user={"id": 42},
    )

    assert result["registration_draft_version"] == 0
    assert result["registration_last_completed_step"] == "basics"


@pytest.mark.asyncio
async def test_completed_step_update_is_versioned_and_path_scope_conditional(
    mock_db,
    caplog,
) -> None:
    service = _service()
    existing = _draft()
    updated = _draft(
        registration_draft_version=2,
        registration_last_completed_step="endpoints",
        oidc_registration_payload={
            **existing["oidc_registration_payload"],
            "application_environment_url_en": "https://benefits.canada.ca",
            "application_environment_url_fr": "https://prestations.canada.ca",
            "post_logout_redirect_uris": ["https://benefits.canada.ca/signed-out"],
            "redirect_uris": [
                "https://benefits.canada.ca/callback",
                "https://prestations.canada.ca/rappel",
            ],
            "logout_mode": "front_channel",
            "logout_uri": "https://benefits.canada.ca/logout",
            "requested_scopes": ["openid"],
            "supports_authorization_code_flow": True,
        },
    )
    service._get_workspace_rp_application = AsyncMock(return_value=existing)  # type: ignore[method-assign]
    contract = _endpoints_contract()
    contract["expectedDraftVersion"] = 1
    payload = WorkspaceRPApplicationRegistrationDraftPatch.model_validate(contract)
    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.update = AsyncMock(return_value=updated)

        with caplog.at_level(logging.INFO):
            result = await service.update_workspace_rp_application_registration_draft(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                rp_application_uuid=APPLICATION_UUID,
                payload=payload,
                current_user={"id": 42},
                correlation_id="request-456",
            )

    update_kwargs = applications.update.await_args.kwargs
    assert update_kwargs["workspace_id"] == 9
    assert update_kwargs["onboarding_state"] == "draft"
    assert update_kwargs["registration_draft_version"] == 1
    assert update_kwargs["object"]["registration_draft_version"] == 2
    assert update_kwargs["object"]["oidc_registration_payload"]["post_logout_redirect_uris"] == ["https://benefits.canada.ca/signed-out"]
    assert update_kwargs["object"]["oidc_registration_payload"]["redirect_uris"] == [
        "https://benefits.canada.ca/callback",
        "https://prestations.canada.ca/rappel",
    ]
    assert update_kwargs["return_columns"] == [
        "uuid",
        "dnr_app_name",
        "configuration_name",
        "partner_environment",
        "oidc_registration_payload",
        "onboarding_state",
        "registration_draft_version",
        "registration_last_completed_step",
    ]
    assert result["registration_last_completed_step"] == "endpoints"
    assert result["registration_draft_version"] == 2
    assert result["registration_answers"]["post_logout_redirect_uris"] == ["https://benefits.canada.ca/signed-out"]
    assert result["registration_answers"]["redirect_uris"] == [
        "https://benefits.canada.ca/callback",
        "https://prestations.canada.ca/rappel",
    ]
    assert "event=draft_save" in caplog.text
    assert f"application_information_reference={hash_log_value(APPLICATION_INFORMATION_UUID)}" in caplog.text
    assert APPLICATION_INFORMATION_UUID not in caplog.text
    assert APPLICATION_UUID not in caplog.text
    assert "step_id=endpoints" in caplog.text
    assert "https://benefits.canada.ca" not in caplog.text


@pytest.mark.asyncio
async def test_basics_update_changes_configuration_identity_without_application_identity(mock_db) -> None:
    service = _service()
    existing = _draft()
    updated = _draft(
        configuration_name="Partner test B",
        registration_draft_version=2,
    )
    service._get_workspace_rp_application = AsyncMock(return_value=existing)  # type: ignore[method-assign]
    payload = WorkspaceRPApplicationRegistrationDraftPatch(
        stepId="basics",
        saveMode="completeStep",
        expectedDraftVersion=1,
        configurationName=" Partner test B ",
        registrationAnswers={
            "canadaLoginEnvironment": "test",
            "serviceNameEn": "Benefits Portal",
            "serviceNameFr": "Portail des prestations",
        },
    )

    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.update = AsyncMock(return_value=updated)
        result = await service.update_workspace_rp_application_registration_draft(
            db=mock_db,
            workspace_uuid=WORKSPACE_UUID,
            rp_application_uuid=APPLICATION_UUID,
            payload=payload,
            current_user={"id": 42},
        )

    update_object = applications.update.await_args.kwargs["object"]
    assert update_object["configuration_name"] == "Partner test B"
    assert update_object["canada_login_environment"] == "test"
    assert result["configuration_name"] == "Partner test B"


@pytest.mark.asyncio
async def test_resaving_an_earlier_completed_step_relocks_dependent_steps(mock_db) -> None:
    service = _service()
    existing = _draft(
        registration_draft_version=6,
        registration_last_completed_step="encryption",
        oidc_registration_payload=_complete_answers(),
    )
    updated = _draft(
        registration_draft_version=7,
        registration_last_completed_step="basics",
        oidc_registration_payload={
            **_complete_answers(),
            "canada_login_environment": "production",
        },
    )
    service._get_workspace_rp_application = AsyncMock(return_value=existing)  # type: ignore[method-assign]
    payload = WorkspaceRPApplicationRegistrationDraftPatch(
        stepId="basics",
        saveMode="completeStep",
        expectedDraftVersion=6,
        registrationAnswers={
            "canadaLoginEnvironment": "production",
            "serviceNameEn": "Benefits Portal",
            "serviceNameFr": "Portail des prestations",
        },
    )

    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.update = AsyncMock(return_value=updated)
        result = await service.update_workspace_rp_application_registration_draft(
            db=mock_db,
            workspace_uuid=WORKSPACE_UUID,
            rp_application_uuid=APPLICATION_UUID,
            payload=payload,
            current_user={"id": 42},
        )

    update_object = applications.update.await_args.kwargs["object"]
    assert update_object["registration_last_completed_step"] == "basics"
    assert result["registration_last_completed_step"] == "basics"


@pytest.mark.asyncio
async def test_future_step_and_stale_version_fail_without_writes(mock_db) -> None:
    service = _service()
    service._get_workspace_rp_application = AsyncMock(return_value=_draft())  # type: ignore[method-assign]
    future_payload = WorkspaceRPApplicationRegistrationDraftPatch(
        stepId="signing",
        saveMode="partial",
        expectedDraftVersion=1,
        registrationAnswers={"requestSigningSupported": False},
    )
    stale_payload = WorkspaceRPApplicationRegistrationDraftPatch(
        stepId="endpoints",
        saveMode="partial",
        expectedDraftVersion=0,
        registrationAnswers={},
    )
    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.update = AsyncMock()
        with pytest.raises(BadRequestException, match="earlier registration steps"):
            await service.update_workspace_rp_application_registration_draft(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                rp_application_uuid=APPLICATION_UUID,
                payload=future_payload,
                current_user={"id": 42},
            )
        with pytest.raises(RegistrationDraftConflictException) as exc_info:
            await service.update_workspace_rp_application_registration_draft(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                rp_application_uuid=APPLICATION_UUID,
                payload=stale_payload,
                current_user={"id": 42},
            )

    assert exc_info.value.code == "registration_draft_version_conflict"
    applications.update.assert_not_awaited()


@pytest.mark.asyncio
async def test_final_submission_is_complete_versioned_and_atomic(mock_db, caplog) -> None:
    service = _service()
    existing = _draft(
        registration_draft_version=3,
        registration_last_completed_step="encryption",
        oidc_registration_payload=_complete_answers(),
    )
    submitted = _draft(
        onboarding_state="submitted",
        registration_draft_version=4,
        registration_last_completed_step="encryption",
        oidc_registration_payload=_complete_answers(),
    )
    service._get_workspace_rp_application = AsyncMock(return_value=existing)  # type: ignore[method-assign]
    payload = WorkspaceRPApplicationOnboardingLifecycleTransitionRequest(
        targetState="submitted",
        expectedDraftVersion=3,
    )

    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.update = AsyncMock(return_value=submitted)
        with caplog.at_level(logging.INFO):
            result = await service.transition_workspace_rp_application_onboarding_state(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                rp_application_uuid=APPLICATION_UUID,
                payload=payload,
                current_user={"id": 42},
                correlation_id="request-789",
            )

    update = applications.update.await_args.kwargs
    assert update["workspace_id"] == 9
    assert update["uuid"] == APPLICATION_UUID
    assert update["onboarding_state"] == "draft"
    assert update["registration_draft_version"] == 3
    assert update["is_deleted"] is False
    assert update["object"]["onboarding_state"] == "submitted"
    assert update["object"]["registration_draft_version"] == 4
    assert update["return_columns"] == [
        "uuid",
        "dnr_app_name",
        "configuration_name",
        "partner_environment",
        "oidc_registration_payload",
        "onboarding_state",
        "registration_draft_version",
        "registration_last_completed_step",
    ]
    assert result == {
        "workspace_uuid": WORKSPACE_UUID,
        "rp_application_uuid": APPLICATION_UUID,
        "onboarding_state": "submitted",
        "registration_draft_version": 4,
        "service_name_en": "Benefits Portal",
        "service_name_fr": "Portail des prestations",
    }
    assert "event=final_submit" in caplog.text
    assert f"application_information_reference={hash_log_value(APPLICATION_INFORMATION_UUID)}" in caplog.text
    assert APPLICATION_INFORMATION_UUID not in caplog.text
    assert APPLICATION_UUID not in caplog.text
    assert "result=success" in caplog.text
    assert "correlation_id=request-789" in caplog.text
    assert "Benefits Portal" not in caplog.text


@pytest.mark.asyncio
async def test_final_submission_rejects_stale_or_incomplete_draft_without_write(
    mock_db,
    caplog,
) -> None:
    service = _service()
    service._get_workspace_rp_application = AsyncMock(return_value=_draft())  # type: ignore[method-assign]

    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.update = AsyncMock()
        with pytest.raises(RegistrationDraftConflictException) as conflict:
            await service.transition_workspace_rp_application_onboarding_state(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                rp_application_uuid=APPLICATION_UUID,
                payload=WorkspaceRPApplicationOnboardingLifecycleTransitionRequest(
                    targetState="submitted",
                    expectedDraftVersion=0,
                ),
                current_user={"id": 42},
            )
        with pytest.raises(BadRequestException, match="questionnaire must be complete"):
            await service.transition_workspace_rp_application_onboarding_state(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                rp_application_uuid=APPLICATION_UUID,
                payload=WorkspaceRPApplicationOnboardingLifecycleTransitionRequest(
                    targetState="submitted",
                    expectedDraftVersion=1,
                ),
                current_user={"id": 42},
            )

    assert conflict.value.code == "registration_draft_version_conflict"
    applications.update.assert_not_awaited()


@pytest.mark.asyncio
async def test_final_submission_rejects_complete_answers_when_partner_environment_is_missing(mock_db) -> None:
    service = _service()
    service._get_workspace_rp_application = AsyncMock(  # type: ignore[method-assign]
        return_value=_draft(
            partner_environment=None,
            registration_draft_version=3,
            registration_last_completed_step="encryption",
            oidc_registration_payload=_complete_answers(),
        )
    )

    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.update = AsyncMock()
        with pytest.raises(BadRequestException, match="questionnaire must be complete"):
            await service.transition_workspace_rp_application_onboarding_state(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                rp_application_uuid=APPLICATION_UUID,
                payload=WorkspaceRPApplicationOnboardingLifecycleTransitionRequest(
                    targetState="submitted",
                    expectedDraftVersion=3,
                ),
                current_user={"id": 42},
            )

    applications.update.assert_not_awaited()


@pytest.mark.asyncio
async def test_final_submission_retry_returns_existing_submitted_record_without_write(
    mock_db,
    caplog,
) -> None:
    service = _service()
    submitted = _draft(
        onboarding_state="submitted",
        registration_draft_version=4,
        registration_last_completed_step="encryption",
        oidc_registration_payload=_complete_answers(),
    )
    service._get_workspace_rp_application = AsyncMock(return_value=submitted)  # type: ignore[method-assign]

    with patch("src.app.services.workspace_service.crud_rp_applications") as applications:
        applications.update = AsyncMock()
        with caplog.at_level(logging.INFO):
            result = await service.transition_workspace_rp_application_onboarding_state(
                db=mock_db,
                workspace_uuid=WORKSPACE_UUID,
                rp_application_uuid=APPLICATION_UUID,
                payload=WorkspaceRPApplicationOnboardingLifecycleTransitionRequest(
                    targetState="submitted",
                    expectedDraftVersion=3,
                ),
                current_user={"id": 42},
            )

    assert result["onboarding_state"] == "submitted"
    assert result["registration_draft_version"] == 4
    assert result["rp_application_uuid"] == APPLICATION_UUID
    assert "oidc_registration_payload" not in result
    assert "event=final_submit" not in caplog.text
    applications.update.assert_not_awaited()
