"""Shared secret-free RP application summary mapping."""

import uuid as uuid_pkg
from collections.abc import Mapping
from typing import Any

from ..core.authorization import CanonicalRoleCode
from ..schemas.rp_application import RegistrationDataStep, RPApplicationSummaryRead

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
    onboarding_state = _text(_value(application, "onboarding_state", "onboardingState")) or None
    last_completed_step = _text(_value(application, "registration_last_completed_step", "registrationLastCompletedStep")) or None
    resume_task_path: str | None = None
    if can_resume_registration and onboarding_state == "draft":
        next_step = _next_registration_step(last_completed_step)
        resume_task_path = f"/workspaces/{workspace_uuid}/applications/{application['uuid']}/registration/{next_step}"

    return RPApplicationSummaryRead(
        uuid=application["uuid"],
        workspace_uuid=workspace_uuid,
        workspace_name=workspace_name,
        service_name_en=service_name_en,
        service_name_fr=service_name_fr,
        canada_login_environment=_value(application, "canada_login_environment", "canadaLoginEnvironment"),
        onboarding_state=onboarding_state,
        promotion_status=_text(_value(application, "promotion_status", "promotionStatus")) or None,
        registration_last_completed_step=last_completed_step,
        resume_task_path=resume_task_path,
        role=role,
    ).model_dump(by_alias=True)
