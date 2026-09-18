from __future__ import annotations

import pytest

from src.app.core.config import EnvironmentOption
from src.app.models.application import Application
from src.app.models.application_configuration import ApplicationConfiguration
from src.app.models.application_configuration_client_type import ApplicationConfigurationClientType
from src.app.models.application_configuration_status import ApplicationConfigurationStatus
from src.app.models.authentication_protocol import AuthenticationProtocol
from src.app.models.department import Department
from src.app.models.partner_group import PartnerGroup
from src.app.models.tenant import Tenant
from src.scripts.seed_local_application_erd import (
    LOCAL_APPLICATION_CONFIGURATION,
    LOCAL_DEPARTMENT_GC_ORG_ID,
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
        self.application: Application | None = None
        self.application_configuration: ApplicationConfiguration | None = None
        self.lookup_rows = {
            ApplicationConfigurationStatus: ApplicationConfigurationStatus(code="draft", display_order=1),
            ApplicationConfigurationClientType: ApplicationConfigurationClientType(code="public", display_order=1),
            AuthenticationProtocol: AuthenticationProtocol(code="oidc", display_order=1),
            Tenant: Tenant(code="test", display_order=1),
        }
        for lookup_id, lookup in enumerate(self.lookup_rows.values(), start=31):
            lookup.id = lookup_id

    async def execute(self, statement: object) -> _ScalarResult:
        entity = statement.column_descriptions[0]["entity"]
        if entity is Department:
            return _ScalarResult(self.department)
        if entity is PartnerGroup:
            return _ScalarResult(self.partner_group)
        if entity is Application:
            return _ScalarResult(self.application)
        if entity in self.lookup_rows:
            return _ScalarResult(self.lookup_rows[entity])
        if entity is ApplicationConfiguration:
            return _ScalarResult(self.application_configuration)
        raise AssertionError(f"Unexpected seed query entity: {entity}")

    def add(self, value: object) -> None:
        if isinstance(value, PartnerGroup):
            value.id = 11
            self.partner_group = value
        elif isinstance(value, Application):
            value.id = 22
            self.application = value
        elif isinstance(value, ApplicationConfiguration):
            value.id = 33
            self.application_configuration = value
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
    assert session.application is not None
    assert session.application_configuration is not None
    assert session.partner_group.department_id == session.department.id
    assert session.application.partner_group_id == session.partner_group.id
    assert session.application_configuration.application_id == session.application.id
    assert session.application_configuration.application_configuration_status_id == 31
    assert session.application_configuration.application_configuration_client_type_id == 32
    assert session.application_configuration.authentication_protocol_id == 33
    assert session.application_configuration.tenant_id == 34
    assert session.application_configuration.partner_label == LOCAL_APPLICATION_CONFIGURATION.partner_label
    assert session.application_configuration.application_url_en == LOCAL_APPLICATION_CONFIGURATION.application_url_en
    assert session.application_configuration.application_url_fr == LOCAL_APPLICATION_CONFIGURATION.application_url_fr
