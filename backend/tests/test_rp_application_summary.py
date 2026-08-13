import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from src.app.core.authorization import CanonicalRoleCode, Capability
from src.app.services.rp_application_summary import build_rp_application_summary
from src.app.services.workspace_service import WorkspaceService

WORKSPACE_UUID = uuid.UUID("018f6f83-0000-0000-0000-000000000201")
APPLICATION_UUID = uuid.UUID("018f6f83-0000-0000-0000-000000000701")


def test_shared_summary_is_secret_free_and_points_drafts_to_the_next_task() -> None:
    summary = build_rp_application_summary(
        application={
            "uuid": APPLICATION_UUID,
            "application_information_uuid": "018f6f83-0000-0000-0000-000000000501",
            "dnr_app_name": "Legacy benefits name",
            "configuration_name": "Staging integration A",
            "partner_environment": "Partner QA 2",
            "canada_login_environment": "staging",
            "onboarding_state": "draft",
            "promotion_status": "review_tracked",
            "registration_last_completed_step": "endpoints",
            "oidc_registration_payload": {
                "service_name_en": "Benefits Portal",
                "service_name_fr": "Portail des prestations",
                "offline_jwk_or_certificate": "sensitive public-key material",
            },
        },
        workspace_uuid=WORKSPACE_UUID,
        workspace_name="Benefits Workspace",
        role=CanonicalRoleCode.RP_ADMIN,
        can_resume_registration=True,
    )

    assert summary["serviceNameEn"] == "Benefits Portal"
    assert summary["serviceNameFr"] == "Portail des prestations"
    assert summary["configurationName"] == "Staging integration A"
    assert summary["partnerEnvironment"] == "Partner QA 2"
    assert summary["resumeTaskPath"] == (
        f"/workspaces/{WORKSPACE_UUID}/applications/"
        "018f6f83-0000-0000-0000-000000000501/"
        f"rp-configurations/{APPLICATION_UUID}/registration/client-and-access"
    )
    assert "oidc_registration_payload" not in summary
    assert "offline_jwk_or_certificate" not in summary


def test_shared_summary_uses_a_bilingual_safe_fallback_and_hides_resume_from_read_only_roles() -> None:
    summary = build_rp_application_summary(
        application={
            "uuid": APPLICATION_UUID,
            "dnr_app_name": "Benefits Portal",
            "onboarding_state": "draft",
            "oidc_registration_payload": {},
        },
        workspace_uuid=WORKSPACE_UUID,
        workspace_name="Benefits Workspace",
        role=CanonicalRoleCode.READ_ONLY,
        can_resume_registration=False,
    )

    assert summary["serviceNameEn"] == "Benefits Portal"
    assert summary["serviceNameFr"] == "Benefits Portal"
    assert summary["configurationName"] is None
    assert summary["partnerEnvironment"] is None
    assert summary["resumeTaskPath"] is None


@pytest.mark.asyncio
async def test_workspace_summary_list_uses_the_shared_stable_order() -> None:
    service = WorkspaceService()
    service._require_workspace_capability = AsyncMock(  # type: ignore[method-assign]
        return_value=(
            {"id": 9, "name": "Benefits Workspace", "uuid": WORKSPACE_UUID},
            SimpleNamespace(role=CanonicalRoleCode.RP_ADMIN),
        )
    )
    service._attach_rp_application_promotion_request_summary = AsyncMock(  # type: ignore[method-assign]
        side_effect=lambda *, rp_application, **_: rp_application
    )

    with patch("src.app.services.workspace_service.crud_rp_applications") as mock_applications:
        mock_applications.get_multi = AsyncMock(
            return_value={
                "data": [
                    {"uuid": APPLICATION_UUID, "dnr_app_name": "Benefits Portal"},
                ]
            }
        )

        result = await service.list_workspace_rp_applications(
            db=AsyncMock(),
            workspace_uuid=WORKSPACE_UUID,
            current_user={"id": 42},
        )

    assert result[0]["uuid"] == APPLICATION_UUID
    assert mock_applications.get_multi.await_args.kwargs["sort_columns"] == "id"
    assert mock_applications.get_multi.await_args.kwargs["sort_orders"] == "asc"


@pytest.mark.asyncio
async def test_configuration_read_uses_local_answers_and_redacts_offline_key_material() -> None:
    service = WorkspaceService()
    service._require_workspace_capability = AsyncMock(  # type: ignore[method-assign]
        return_value=(
            {"id": 9, "name": "Benefits Workspace", "uuid": WORKSPACE_UUID},
            object(),
        )
    )
    service._get_workspace_rp_application = AsyncMock(  # type: ignore[method-assign]
        return_value={
            "uuid": APPLICATION_UUID,
            "dnr_app_name": "Benefits Portal",
            "partner_environment": "Partner staging",
            "canada_login_environment": "staging",
            "onboarding_state": "draft",
            "promotion_status": None,
            "registration_draft_version": 4,
            "registration_last_completed_step": "endpoints",
            "oidc_registration_payload": {
                "application_url": "https://benefits.canada.ca",
                "legacy_provider_only_value": "must not escape",
                "offline_jwk_or_certificate": ("-----BEGIN CERTIFICATE-----\nPUBLIC\n-----END CERTIFICATE-----"),
                "service_name_en": "Benefits Portal",
                "service_name_fr": "Portail des prestations",
            },
        }
    )

    result = await service.get_workspace_rp_application_configuration(
        db=AsyncMock(),
        workspace_uuid=WORKSPACE_UUID,
        rp_application_uuid=APPLICATION_UUID,
        current_user={"id": 42},
    )

    assert result["offlinePublicKeyProvided"] is True
    assert result["partnerEnvironment"] == "Partner staging"
    assert result["registrationAnswers"]["offlineJwkOrCertificate"] is None
    assert str(result["registrationAnswers"]["applicationEnvironmentUrlEn"]) == ("https://benefits.canada.ca/")
    assert "legacyProviderOnlyValue" not in result["registrationAnswers"]
    assert service._require_workspace_capability.await_args.kwargs["capability"] is Capability.RP_CONFIGURATION_READ
