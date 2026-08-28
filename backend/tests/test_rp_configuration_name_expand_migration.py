import importlib.util
from pathlib import Path
from unittest.mock import patch

from src.app.models.rp_application import RPApplication
from src.app.schemas.rp_application import (
    RPApplicationCreateInternal,
    RPApplicationRead,
    RPApplicationSummaryRead,
)

MIGRATION_PATH = Path(__file__).parents[1] / "src" / "migrations" / "versions" / "0026_rp_configuration_expand.py"


def _load_migration_module():
    spec = importlib.util.spec_from_file_location(
        "rp_configuration_expand_migration",
        MIGRATION_PATH,
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_configuration_name_expand_is_nullable_bounded_and_non_inferential() -> None:
    migration = _load_migration_module()

    assert migration.revision == "0026_rp_config_expand"
    assert migration.down_revision == "0025_workspace_invitations"
    assert len(migration.revision) <= 32

    with (
        patch.object(migration.op, "add_column") as add_column,
        patch.object(migration.op, "create_index") as create_index,
        patch.object(
            migration.op,
            "f",
            return_value="ix_rp_application_source_rp_configuration_id",
        ),
    ):
        migration.upgrade()

    assert add_column.call_count == 2
    table_name, column = add_column.call_args_list[0].args
    assert table_name == "rp_application"
    assert column.name == "configuration_name"
    assert column.type.length == 128
    assert column.nullable is True

    source_table_name, source_column = add_column.call_args_list[1].args
    assert source_table_name == "rp_application"
    assert source_column.name == "source_rp_configuration_id"
    assert source_column.nullable is True
    assert {foreign_key.target_fullname for foreign_key in source_column.foreign_keys} == {"rp_application.id"}
    assert create_index.call_args.args[1:] == (
        "rp_application",
        ["source_rp_configuration_id"],
    )
    assert create_index.call_args.kwargs == {"unique": False}

    source = MIGRATION_PATH.read_text(encoding="utf-8")
    assert "UPDATE rp_application" not in source
    assert "INSERT INTO rp_application" not in source
    assert "DELETE FROM rp_application" not in source


def test_configuration_expand_downgrade_removes_only_the_added_metadata() -> None:
    migration = _load_migration_module()

    with (
        patch.object(migration.op, "drop_index") as drop_index,
        patch.object(migration.op, "drop_column") as drop_column,
        patch.object(
            migration.op,
            "f",
            return_value="ix_rp_application_source_rp_configuration_id",
        ),
    ):
        migration.downgrade()

    drop_index.assert_called_once()
    assert drop_index.call_args.kwargs == {"table_name": "rp_application"}
    assert [call.args for call in drop_column.call_args_list] == [
        ("rp_application", "source_rp_configuration_id"),
        ("rp_application", "configuration_name"),
    ]


def test_configuration_name_final_model_and_wire_contract_are_required_and_camel_case() -> None:
    column = RPApplication.__table__.columns["configuration_name"]
    assert column.nullable is False
    assert column.type.length == 128

    base_payload = {
        "id": 7,
        "uuid": "018f6f83-0000-0000-0000-000000000701",
        "dnrAppName": "Benefits Portal",
        "configurationName": "Production integration A",
        "departmentId": None,
        "createdBy": None,
        "createdAt": "2026-08-13T00:00:00Z",
        "isDeleted": False,
    }
    configuration_read = RPApplicationRead.model_validate(base_payload)
    assert configuration_read.configuration_name == "Production integration A"
    assert configuration_read.model_dump(by_alias=True)["configurationName"] == "Production integration A"

    summary = RPApplicationSummaryRead.model_validate(
        {
            "uuid": base_payload["uuid"],
            "workspaceUuid": "018f6f83-0000-0000-0000-000000000201",
            "workspaceName": "Benefits Workspace",
            "serviceNameEn": "Benefits Portal",
            "serviceNameFr": "Portail des prestations",
            "configurationName": "Staging integration A",
        }
    )
    serialized = summary.model_dump(by_alias=True)
    assert serialized["configurationName"] == "Staging integration A"
    assert "configuration_name" not in serialized


def test_clone_source_model_and_internal_contract_are_optional_and_not_public() -> None:
    column = RPApplication.__table__.columns["source_rp_configuration_id"]
    assert column.nullable is True
    assert {foreign_key.target_fullname for foreign_key in column.foreign_keys} == {"rp_application.id"}
    assert any(index.name == "ix_rp_application_source_rp_configuration_id" for index in RPApplication.__table__.indexes)

    internal = RPApplicationCreateInternal(
        department_id=None,
        dnr_app_name="Benefits Portal clone",
        configuration_name="Clone",
        source_rp_configuration_id=11,
    )
    assert internal.source_rp_configuration_id == 11

    legacy_read = RPApplicationRead.model_validate(
        {
            "id": 7,
            "uuid": "018f6f83-0000-0000-0000-000000000701",
            "dnrAppName": "Benefits Portal",
            "configurationName": "Production integration A",
            "departmentId": None,
            "createdBy": None,
            "createdAt": "2026-08-13T00:00:00Z",
            "isDeleted": False,
        }
    )
    serialized = legacy_read.model_dump(by_alias=True)
    assert "sourceRpConfigurationId" not in serialized
