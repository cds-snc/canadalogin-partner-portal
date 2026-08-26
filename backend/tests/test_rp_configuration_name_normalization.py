from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from src.app.core.rp_configuration import normalize_configuration_name, normalize_partner_environment
from src.app.schemas.rp_application import (
    RPApplicationCreateInternal,
    RPApplicationUpdateInternal,
)


def test_configuration_name_trims_unicode_whitespace_and_normalizes_nfc() -> None:
    decomposed = "Cafe\N{COMBINING ACUTE ACCENT}"
    normalized = normalize_configuration_name(f"\N{EM SPACE}{decomposed}\N{NO-BREAK SPACE}")

    assert normalized == "Café"
    assert len(normalized) == 4


@pytest.mark.parametrize("value", ["", "   ", "\N{EM SPACE}\N{NO-BREAK SPACE}"])
def test_configuration_name_rejects_blank_results(value: str) -> None:
    with pytest.raises(ValueError, match="must not be blank"):
        normalize_configuration_name(value)


def test_configuration_name_applies_limit_after_normalization() -> None:
    decomposed = "e\N{COMBINING ACUTE ACCENT}" * 128
    assert normalize_configuration_name(decomposed) == "é" * 128

    with pytest.raises(ValueError, match="at most 128"):
        normalize_configuration_name("x" * 129)


def test_partner_environment_trims_unicode_whitespace_and_normalizes_nfc() -> None:
    decomposed = "Cafe\N{COMBINING ACUTE ACCENT} QA"

    assert normalize_partner_environment(f"\N{EM SPACE}{decomposed}\N{NO-BREAK SPACE}") == "Café QA"


@pytest.mark.parametrize("value", ["", "   ", "\N{EM SPACE}\N{NO-BREAK SPACE}"])
def test_partner_environment_rejects_blank_results(value: str) -> None:
    with pytest.raises(ValueError, match="must not be blank"):
        normalize_partner_environment(value)


def test_partner_environment_applies_limit_after_normalization() -> None:
    assert normalize_partner_environment("e\N{COMBINING ACUTE ACCENT}" * 128) == "é" * 128

    with pytest.raises(ValueError, match="at most 128"):
        normalize_partner_environment("x" * 129)


def test_internal_create_and_update_contracts_share_normalization() -> None:
    created = RPApplicationCreateInternal(
        department_id=None,
        dnr_app_name="Benefits Portal",
        configuration_name="  Cafe\N{COMBINING ACUTE ACCENT}  ",
        partner_environment="  QA Cafe\N{COMBINING ACUTE ACCENT}  ",
    )
    updated = RPApplicationUpdateInternal(
        configuration_name="\N{EM SPACE}Production B\N{EM SPACE}",
        partner_environment="\N{EM SPACE}Partner staging\N{EM SPACE}",
        updated_at=datetime.now(UTC),
    )

    assert created.configuration_name == "Café"
    assert created.partner_environment == "QA Café"
    assert updated.configuration_name == "Production B"
    assert updated.partner_environment == "Partner staging"


def test_internal_contract_rejects_non_text_and_blank_names() -> None:
    with pytest.raises(ValidationError, match="configuration name must be text"):
        RPApplicationCreateInternal(
            department_id=None,
            dnr_app_name="Benefits Portal",
            configuration_name=123,  # type: ignore[arg-type]
        )

    with pytest.raises(ValidationError, match="configuration name must not be blank"):
        RPApplicationUpdateInternal(
            configuration_name="  ",
            updated_at=datetime.now(UTC),
        )
