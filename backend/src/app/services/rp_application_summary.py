"""Shared secret-free RP application summary mapping."""

import uuid as uuid_pkg
from collections.abc import Mapping
from typing import Any, cast

from ..core.authorization import CanonicalRoleCode
from ..schemas.rp_application import (
    ApplicationRPConfigurationSummaryRead,
    RegistrationDataStep,
    RPApplicationSummaryRead,
)
from ..schemas.rp_application_promotion_request import ProductionReviewStatus

_REGISTRATION_STEPS: tuple[RegistrationDataStep | str, ...] = (
    "basics",
    "endpoints",
    "client-and-access",
    "signing",
    "encryption",
    "review",
)


def _registration_payload(application: Mapping[str, Any]) -> Mapping[str, Any]:
    payload = application.get("oidc_registration_payload", application.get("oidcRegistrationPayload"))
    return payload if isinstance(payload, Mapping) else {}


def _text(value: Any) -> str:
    return str(value).strip() if value is not None else ""


def _value(source: Mapping[str, Any], snake_name: str, camel_name: str) -> Any:
    return source.get(snake_name, source.get(camel_name))


def _next_registration_step(last_completed_step: Any) -> str:
    normalized = _text(last_completed_step)
    if normalized not in _REGISTRATION_STEPS:
        return "basics"
    index = _REGISTRATION_STEPS.index(normalized)
    return str(_REGISTRATION_STEPS[min(index + 1, len(_REGISTRATION_STEPS) - 1)])


def build_rp_application_summary(
    *,
    application: Mapping[str, Any],
    workspace_uuid: uuid_pkg.UUID,
    workspace_name: str,
    role: CanonicalRoleCode | None,
    can_resume_registration: bool,
) -> dict[str, Any]:
    """Map one stored RP record to the list contract used by both surfaces."""

    payload = _registration_payload(application)
    service_name_en = _text(_value(payload, "service_name_en", "serviceNameEn")) or _text(_value(application, "dnr_app_name", "dnrAppName"))
    service_name_fr = _text(_value(payload, "service_name_fr", "serviceNameFr")) or service_name_en
    registration_completed_at = _value(
        application,
        "registration_completed_at",
        "registrationCompletedAt",
    )
    last_completed_step = _text(_value(application, "registration_last_completed_step", "registrationLastCompletedStep")) or None
    application_information_uuid = _value(
        application,
        "application_information_uuid",
        "applicationInformationUuid",
    )
    resume_task_path: str | None = None
    if can_resume_registration and registration_completed_at is None and application_information_uuid:
        next_step = _next_registration_step(last_completed_step)
        resume_task_path = (
            f"/workspaces/{workspace_uuid}/applications/{application_information_uuid}"
            f"/rp-configurations/{application['uuid']}/registration/{next_step}"
        )

    return RPApplicationSummaryRead(
        uuid=application["uuid"],
        workspace_uuid=workspace_uuid,
        workspace_name=workspace_name,
        service_name_en=service_name_en,
        service_name_fr=service_name_fr,
        configuration_name=_text(_value(application, "configuration_name", "configurationName")) or None,
        partner_environment=_text(_value(application, "partner_environment", "partnerEnvironment")) or None,
        canada_login_environment=_value(application, "canada_login_environment", "canadaLoginEnvironment"),
        registration_completed_at=registration_completed_at,
        production_review_status=cast(
            ProductionReviewStatus | None,
            _text(_value(application, "production_review_status", "productionReviewStatus")) or None,
        ),
        production_review_reconciliation_required=bool(
            _value(
                application,
                "production_review_reconciliation_required",
                "productionReviewReconciliationRequired",
            )
        ),
        registration_last_completed_step=cast(RegistrationDataStep | None, last_completed_step),
        resume_task_path=resume_task_path,
        role=role,
    ).model_dump(by_alias=True)


def build_application_rp_configuration_summary(
    *,
    application: Mapping[str, Any],
    application_information: Mapping[str, Any],
    workspace_uuid: uuid_pkg.UUID,
    workspace_name: str,
    role: CanonicalRoleCode | None,
    can_resume_registration: bool,
) -> dict[str, Any]:
    """Map one RP record to its parent-scoped, secret-free summary."""

    application_with_parent = dict(application)
    application_with_parent["application_information_uuid"] = application_information["uuid"]
    summary = build_rp_application_summary(
        application=application_with_parent,
        workspace_uuid=workspace_uuid,
        workspace_name=workspace_name,
        role=role,
        can_resume_registration=can_resume_registration,
    )
    summary.update(
        {
            "applicationInformationUuid": application_information["uuid"],
            "serviceNameEn": application_information["service_name_en"],
            "serviceNameFr": application_information["service_name_fr"],
        }
    )
    return ApplicationRPConfigurationSummaryRead.model_validate(summary).model_dump(by_alias=True)
