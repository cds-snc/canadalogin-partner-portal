from __future__ import annotations

from uuid import UUID

import pytest

from src.app.core.config import EnvironmentOption
from src.app.models.application import Application
from src.app.models.application_configuration import ApplicationConfiguration
from src.app.models.application_configuration_client_type import ApplicationConfigurationClientType
from src.app.models.application_configuration_status import ApplicationConfigurationStatus
from src.app.models.authentication_protocol import AuthenticationProtocol
from src.app.models.department import Department
from src.app.models.partner_group import PartnerGroup
from src.app.models.partner_group_role import PartnerGroupRole
from src.app.models.role import Role
from src.app.models.tenant import Tenant
from src.scripts.seed_local_application_erd import (
    LOCAL_APPLICATION_CONFIGURATION,
    LOCAL_APPLICATION_CONFIGURATIONS,
    LOCAL_DEPARTMENT_GC_ORG_ID,
    LOCAL_PARTNER_DEVELOPER_ROLE_NAME,
    ensure_local_environment,
    seed_local_application_erd,
)


class _ScalarResult:
    def __init__(self, value: object | None) -> None:
        self.value = value

    def scalar_one_or_none(self) -> object | None:
        return self.value


class _SeedSession:
    def __init__(self) -> None:
        self.department = Department(name="Example department", gc_org_id=LOCAL_DEPARTMENT_GC_ORG_ID)
        self.department.id = 7
        self.partner_group: PartnerGroup | None = None
        self.partner_group_role: PartnerGroupRole | None = None
        self.application: Application | None = None
        self.application_configurations: dict[UUID, ApplicationConfiguration] = {}
        self.partner_developer_role = Role(
            name=LOCAL_PARTNER_DEVELOPER_ROLE_NAME,
        )
        self.partner_developer_role.id = 21
        self.lookup_rows = {
            ApplicationConfigurationStatus: {
                "draft": ApplicationConfigurationStatus(code="draft", display_order=1),
                "submitted": ApplicationConfigurationStatus(code="submitted", display_order=2),
                "published": ApplicationConfigurationStatus(code="published", display_order=3),
            },
            ApplicationConfigurationClientType: {
                "public": ApplicationConfigurationClientType(code="public", display_order=1),
            },
            AuthenticationProtocol: {
                "oidc": AuthenticationProtocol(code="oidc", display_order=1),
            },
            Tenant: {
                "test": Tenant(code="test", display_order=1),
                "staging": Tenant(code="staging", display_order=2),
                "production": Tenant(code="production", display_order=3),
            },
        }
        for lookup_id, lookup in enumerate(
            (
                *self.lookup_rows[ApplicationConfigurationStatus].values(),
                *self.lookup_rows[ApplicationConfigurationClientType].values(),
                *self.lookup_rows[AuthenticationProtocol].values(),
                *self.lookup_rows[Tenant].values(),
            ),
            start=31,
        ):
            lookup.id = lookup_id

    async def execute(self, statement: object) -> _ScalarResult:
        entity = statement.column_descriptions[0]["entity"]
        if entity is Department:
            return _ScalarResult(self.department)
        if entity is PartnerGroup:
            return _ScalarResult(self.partner_group)
        if entity is Application:
            return _ScalarResult(self.application)
        if entity is Role:
            return _ScalarResult(self.partner_developer_role)
        if entity is PartnerGroupRole:
            return _ScalarResult(self.partner_group_role)
        if entity in self.lookup_rows:
            lookup_code = next(
                value
                for value in statement.compile().params.values()
                if value in self.lookup_rows[entity]
            )
            return _ScalarResult(self.lookup_rows[entity][lookup_code])
        if entity is ApplicationConfiguration:
            configuration_uuid = next(
                value
                for value in statement.compile().params.values()
                if isinstance(value, UUID)
            )
            return _ScalarResult(self.application_configurations.get(configuration_uuid))
        raise AssertionError(f"Unexpected seed query entity: {entity}")

    def add(self, value: object) -> None:
        if isinstance(value, PartnerGroup):
            value.id = 11
            self.partner_group = value
        elif isinstance(value, PartnerGroupRole):
            value.id = 12
            self.partner_group_role = value
        elif isinstance(value, Application):
            value.id = 22
            self.application = value
        elif isinstance(value, ApplicationConfiguration):
            value.id = 33 + len(self.application_configurations)
            self.application_configurations[value.uuid] = value
        else:
            raise AssertionError(f"Unexpected seed object: {value}")

    async def flush(self) -> None:
        return None


def test_local_seed_refuses_non_local_environment() -> None:
    with pytest.raises(RuntimeError, match="ENVIRONMENT=local"):
        ensure_local_environment(EnvironmentOption.STAGING)


@pytest.mark.asyncio
async def test_local_seed_is_repeatable() -> None:
    session = _SeedSession()

    await seed_local_application_erd(session, EnvironmentOption.LOCAL)
    first_partner_group = session.partner_group
    first_application = session.application

    await seed_local_application_erd(session, EnvironmentOption.LOCAL)

    assert session.partner_group is first_partner_group
    assert session.application is first_application
    assert session.partner_group is not None
    assert session.partner_group_role is not None
    assert session.application is not None
    assert len(session.application_configurations) == 11
    assert session.partner_group.department_id == session.department.id
    assert session.application.partner_group_id == session.partner_group.id
    assert session.partner_group_role.partner_group_id == session.partner_group.id
    assert session.partner_group_role.role_id == session.partner_developer_role.id
    for configuration_seed in LOCAL_APPLICATION_CONFIGURATIONS:
        configuration = session.application_configurations[configuration_seed.uuid]
        assert configuration.application_id == session.application.id
        assert configuration.application_configuration_status_id == (
            session.lookup_rows[ApplicationConfigurationStatus][
                configuration_seed.status_code
            ].id
        )
        assert configuration.application_configuration_client_type_id == (
            session.lookup_rows[ApplicationConfigurationClientType]["public"].id
        )
        assert configuration.authentication_protocol_id == (
            session.lookup_rows[AuthenticationProtocol]["oidc"].id
        )
        assert configuration.tenant_id == session.lookup_rows[Tenant][configuration_seed.tenant_code].id

    first_configuration = session.application_configurations[
        LOCAL_APPLICATION_CONFIGURATION.uuid
    ]
    assert first_configuration.partner_label == LOCAL_APPLICATION_CONFIGURATION.partner_label
    assert first_configuration.application_url_en == LOCAL_APPLICATION_CONFIGURATION.application_url_en
    assert first_configuration.application_url_fr == LOCAL_APPLICATION_CONFIGURATION.application_url_fr
    assert {configuration_seed.status_code for configuration_seed in LOCAL_APPLICATION_CONFIGURATIONS} == {
        "draft",
        "published",
        "submitted",
    }
    assert {configuration_seed.tenant_code for configuration_seed in LOCAL_APPLICATION_CONFIGURATIONS} == {
        "production",
        "staging",
        "test",
    }
