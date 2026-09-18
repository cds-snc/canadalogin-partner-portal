from sqlalchemy.dialects.postgresql import JSONB

from src.app.core.db.database import Base
from src.app.models import (
    Application,
    ApplicationConfiguration,
    ApplicationConfigurationClientType,
    ApplicationConfigurationDefaultAttributeMapping,
    ApplicationConfigurationStatus,
    AuthenticationProtocol,
    ClientAuthMethod,
    EncryptionContentAlgorithm,
    EncryptionKeyAlgorithm,
    LogoutMethod,
    PartnerGroup,
    SigningAlgorithm,
    Tenant,
)

ERD_TABLES = {
    "partner_group",
    "application",
    "application_configuration",
    "application_configuration_status",
    "application_configuration_default_attribute_mapping",
    "tenant",
    "signing_algorithm",
    "encryption_key_algorithm",
    "encryption_content_algorithm",
    "application_configuration_client_type",
    "client_auth_method",
    "authentication_protocol",
    "logout_method",
}

UUID_TABLES = ERD_TABLES - {"application_configuration_default_attribute_mapping"}
LIFECYCLE_COLUMNS = {"created_at", "updated_at", "deleted_at", "is_deleted"}


def test_application_erd_models_register_all_tables() -> None:
    assert ERD_TABLES.issubset(Base.metadata.tables)


def test_application_erd_models_include_lifecycle_columns() -> None:
    for table_name in ERD_TABLES:
        assert LIFECYCLE_COLUMNS.issubset(Base.metadata.tables[table_name].columns.keys())


def test_application_erd_uuid_columns_match_the_erd() -> None:
    for table_name in UUID_TABLES:
        assert "uuid" in Base.metadata.tables[table_name].columns

    assert "uuid" not in Base.metadata.tables["application_configuration_default_attribute_mapping"].columns


def test_application_erd_relationships_and_types() -> None:
    foreign_keys = {
        "partner_group": {"department_id": "department.id"},
        "application": {"partner_group_id": "partner_group.id"},
        "application_configuration": {
            "application_id": "application.id",
            "application_configuration_status_id": "application_configuration_status.id",
            "application_configuration_client_type_id": "application_configuration_client_type.id",
            "authentication_protocol_id": "authentication_protocol.id",
            "tenant_id": "tenant.id",
        },
    }
    string_lengths = {
        "partner_group": {"name_en": 256, "name_fr": 256},
        "application": {"name_en": 256, "name_fr": 256},
        "application_configuration": {
            "partner_label": 512,
            "application_url_en": 512,
            "application_url_fr": 512,
            "config_version": 32,
            "ibm_application_id": 128,
            "ibm_client_id": 128,
            "dnr_application_name": 128,
        },
    }

    for table_name, columns in foreign_keys.items():
        table = Base.metadata.tables[table_name]
        for column_name, target in columns.items():
            column = table.columns[column_name]
            assert column.index is True
            assert column.nullable is False
            assert {foreign_key.target_fullname for foreign_key in column.foreign_keys} == {target}

    for table_name, columns in string_lengths.items():
        table = Base.metadata.tables[table_name]
        for column_name, length in columns.items():
            assert table.columns[column_name].type.length == length

    application_configuration = Base.metadata.tables["application_configuration"]
    assert "client_label" not in application_configuration.columns
    for column_name in ("partner_label", "application_url_en", "application_url_fr"):
        assert application_configuration.columns[column_name].nullable is False

    assert isinstance(Base.metadata.tables["application_configuration"].columns["config"].type, JSONB)


def test_application_erd_lookup_codes_are_unique() -> None:
    lookup_models = (
        ApplicationConfigurationStatus,
        Tenant,
        SigningAlgorithm,
        EncryptionKeyAlgorithm,
        EncryptionContentAlgorithm,
        ApplicationConfigurationClientType,
        ClientAuthMethod,
        AuthenticationProtocol,
        LogoutMethod,
    )

    for model in lookup_models:
        assert model.__table__.columns["code"].unique is True
        assert model.__table__.columns["code"].index is True
        assert model.__table__.columns["display_order"].nullable is False
        assert model.__table__.columns["display_order"].index is True
        assert model.__table__.columns["is_deprecated"].nullable is False
        assert model.__table__.columns["is_deprecated"].index is True


def test_application_erd_model_classes_are_registered() -> None:
    assert {
        model.__tablename__
        for model in (
            PartnerGroup,
            Application,
            ApplicationConfiguration,
            ApplicationConfigurationStatus,
            AuthenticationProtocol,
            ApplicationConfigurationDefaultAttributeMapping,
            Tenant,
            SigningAlgorithm,
            EncryptionKeyAlgorithm,
            EncryptionContentAlgorithm,
            ApplicationConfigurationClientType,
            ClientAuthMethod,
            LogoutMethod,
        )
    } == ERD_TABLES
