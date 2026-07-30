import pytest
from pydantic import ValidationError

from src.app.schemas.application_information import (
    ApplicationInformationContactCreate,
    ApplicationInformationCreate,
    ApplicationInformationUpdate,
)


class TestApplicationInformationSchemas:
    def test_application_information_create_accepts_bilingual_metadata_and_sections(self) -> None:
        payload = ApplicationInformationCreate(
            service_name_en="Example service",
            service_name_fr="Service exemple",
            overview="Overview text",
            technology_and_protocol="OIDC with backend mediation",
            security_and_privacy="Protected B controls apply",
            usage="Used by partners during onboarding",
            migration_or_transition_plan="Transition in phases",
        )

        assert payload.service_name_en == "Example service"
        assert payload.service_name_fr == "Service exemple"

    def test_application_information_update_accepts_partial_changes(self) -> None:
        payload = ApplicationInformationUpdate(usage="Updated usage guidance")

        assert payload.usage == "Updated usage guidance"
        assert payload.service_name_en is None

    def test_application_information_contact_rejects_invalid_email(self) -> None:
        with pytest.raises(ValidationError):
            ApplicationInformationContactCreate(
                name_en="Jane Doe",
                name_fr="Jeanne Doe",
                responsibility_en="Product owner",
                responsibility_fr="Responsable du produit",
                email="not-an-email",
                phone_number="555-555-5555",
            )