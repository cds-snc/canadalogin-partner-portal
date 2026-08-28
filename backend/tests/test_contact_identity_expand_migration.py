import importlib.util
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from src.app.models.application_information_contact import ApplicationInformationContact
from src.app.schemas.application_information import (
    ApplicationInformationContactCreate,
    ApplicationInformationContactCreateInternal,
    ApplicationInformationContactRead,
)

MIGRATION_PATH = Path(__file__).parents[1] / "src" / "migrations" / "versions" / "0027_contact_identity_expand.py"


def _load_migration_module():
    spec = importlib.util.spec_from_file_location(
        "contact_identity_expand_migration",
        MIGRATION_PATH,
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_contact_identity_expand_is_nullable_indexed_and_non_inferential() -> None:
    migration = _load_migration_module()
    assert migration.revision == "0027_contact_identity_expand"
    assert migration.down_revision == "0026_rp_config_expand"
    assert len(migration.revision) <= 32

    with (
        patch.object(migration.op, "add_column") as add_column,
        patch.object(migration.op, "create_index") as create_index,
        patch.object(migration.op, "alter_column") as alter_column,
        patch.object(
            migration.op,
            "f",
            return_value="ix_application_information_contact_identity_confirmed_by",
        ),
    ):
        migration.upgrade()

    columns = {call.args[1].name: call.args[1] for call in add_column.call_args_list}
    assert set(columns) == {
        "first_name",
        "last_name",
        "alternate_phone_number",
        "identity_confirmed_at",
        "identity_confirmed_by",
    }
    assert all(column.nullable is True for column in columns.values())
    assert columns["first_name"].type.length == 100
    assert columns["last_name"].type.length == 100
    assert columns["alternate_phone_number"].type.length == 50
    assert {foreign_key.target_fullname for foreign_key in columns["identity_confirmed_by"].foreign_keys} == {"user.id"}
    assert create_index.call_args.args[1:] == (
        "application_information_contact",
        ["identity_confirmed_by"],
    )
    assert create_index.call_args.kwargs == {"unique": False}
    assert [call.args[1] for call in alter_column.call_args_list] == [
        "name_en",
        "name_fr",
    ]
    assert all(call.kwargs["nullable"] is True for call in alter_column.call_args_list)

    source = MIGRATION_PATH.read_text(encoding="utf-8")
    assert "UPDATE application_information_contact" not in source
    assert "INSERT INTO application_information_contact" not in source
    assert "DELETE FROM application_information_contact" not in source


def test_contact_identity_downgrade_restores_legacy_contract_when_safe() -> None:
    migration = _load_migration_module()
    result = MagicMock()
    result.scalar_one.return_value = 0
    connection = MagicMock()
    connection.execute.return_value = result

    with (
        patch.object(migration.op, "get_bind", return_value=connection),
        patch.object(migration.op, "drop_index") as drop_index,
        patch.object(migration.op, "drop_column") as drop_column,
        patch.object(migration.op, "alter_column") as alter_column,
        patch.object(
            migration.op,
            "f",
            return_value="ix_application_information_contact_identity_confirmed_by",
        ),
    ):
        migration.downgrade()

    drop_index.assert_called_once()
    assert [call.args[1] for call in drop_column.call_args_list] == [
        "identity_confirmed_by",
        "identity_confirmed_at",
        "alternate_phone_number",
        "last_name",
        "first_name",
    ]
    assert [call.args[1] for call in alter_column.call_args_list] == [
        "name_fr",
        "name_en",
    ]
    assert all(call.kwargs["nullable"] is False for call in alter_column.call_args_list)


def test_contact_identity_downgrade_fails_before_data_loss() -> None:
    migration = _load_migration_module()
    result = MagicMock()
    result.scalar_one.return_value = 1
    connection = MagicMock()
    connection.execute.return_value = result

    with (
        patch.object(migration.op, "get_bind", return_value=connection),
        patch.object(migration.op, "drop_column") as drop_column,
    ):
        with pytest.raises(RuntimeError, match="locale-neutral person names"):
            migration.downgrade()

    drop_column.assert_not_called()


def test_contact_model_and_dual_read_contract_preserve_legacy_values() -> None:
    table = ApplicationInformationContact.__table__
    assert table.columns["name_en"].nullable is True
    assert table.columns["name_fr"].nullable is True
    assert table.columns["first_name"].type.length == 100
    assert table.columns["last_name"].type.length == 100
    assert {foreign_key.target_fullname for foreign_key in table.columns["identity_confirmed_by"].foreign_keys} == {"user.id"}

    legacy = ApplicationInformationContactRead.model_validate(
        {
            "id": 3,
            "uuid": "018f6f83-0000-0000-0000-000000000601",
            "applicationInformationId": 17,
            "nameEn": "Jane Doe",
            "nameFr": "Jeanne Doe",
            "responsibilityEn": "Product owner",
            "responsibilityFr": "Responsable du produit",
            "email": "jane.doe@example.gc.ca",
            "identityConfirmationRequired": True,
            "createdAt": "2026-08-13T00:00:00Z",
            "isDeleted": False,
        }
    )
    assert legacy.first_name is None
    assert legacy.last_name is None
    assert legacy.name_en == "Jane Doe"
    assert legacy.name_fr == "Jeanne Doe"
    assert legacy.identity_confirmation_required is True

    confirmed_internal = ApplicationInformationContactCreateInternal(
        application_information_id=17,
        first_name="Jane",
        last_name="Doe",
        responsibility_en="Product owner",
        responsibility_fr="Responsable du produit",
        email="jane.doe@example.gc.ca",
        identity_confirmed_at="2026-08-13T00:00:00Z",
        identity_confirmed_by=42,
    )
    assert confirmed_internal.name_en is None
    assert confirmed_internal.name_fr is None
    assert confirmed_internal.identity_confirmed_by == 42


def test_public_create_uses_locale_neutral_identity_after_cutover() -> None:
    payload = ApplicationInformationContactCreate(
        first_name=" Jane ",
        last_name=" Doe ",
        responsibility_en="Product owner",
        responsibility_fr="Responsable du produit",
        email="jane.doe@example.gc.ca",
    )
    assert payload.first_name == "Jane"
    assert payload.last_name == "Doe"
    serialized = payload.model_dump(by_alias=True)
    assert serialized["firstName"] == "Jane"
    assert "nameEn" not in serialized
