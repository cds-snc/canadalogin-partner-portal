from fastapi import APIRouter

from src.app.core.config import AppSettings
from src.app.core.setup import create_application


def test_openapi_omits_optional_metadata_when_unconfigured() -> None:
    app = create_application(
        APIRouter(),
        AppSettings(
            APP_NAME="Partner Portal",
            APP_DESCRIPTION=None,
            CONTACT_NAME=None,
            CONTACT_EMAIL=None,
            LICENSE_NAME=None,
        ),
        create_tables_on_start=False,
    )

    info = app.openapi()["info"]

    assert info["title"] == "Partner Portal"
    assert "contact" not in info
    assert "license" not in info


def test_openapi_includes_configured_contact_and_license_metadata() -> None:
    app = create_application(
        APIRouter(),
        AppSettings(
            APP_NAME="Partner Portal",
            CONTACT_NAME="CDS Auth Team",
            CONTACT_EMAIL="dev@example.com",
            LICENSE_NAME="MIT",
        ),
        create_tables_on_start=False,
    )

    info = app.openapi()["info"]

    assert info["contact"] == {
        "email": "dev@example.com",
        "name": "CDS Auth Team",
    }
    assert info["license"] == {"name": "MIT"}
