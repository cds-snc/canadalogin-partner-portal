from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..app.core.config import EnvironmentOption, settings
from ..app.core.db.database import Base, local_session
from ..app.models.application import Application
from ..app.models.application_configuration import ApplicationConfiguration
from ..app.models.application_configuration_client_type import ApplicationConfigurationClientType
from ..app.models.application_configuration_status import ApplicationConfigurationStatus
from ..app.models.authentication_protocol import AuthenticationProtocol
from ..app.models.department import Department
from ..app.models.partner_group import PartnerGroup
from ..app.models.tenant import Tenant

logger = logging.getLogger(__name__)

LOCAL_DEPARTMENT_GC_ORG_ID = 2222
LOCAL_PARTNER_GROUP_UUID = UUID("00000000-0000-7000-8000-000000000001")
LOCAL_APPLICATION_UUID = UUID("00000000-0000-7000-8000-000000000002")
LOCAL_APPLICATION_CONFIGURATION_UUID = UUID("00000000-0000-7000-8000-000000000003")


@dataclass(frozen=True)
class LocalPartnerGroupSeed:
    uuid: UUID
    name_en: str
    name_fr: str


@dataclass(frozen=True)
class LocalApplicationSeed:
    uuid: UUID
    partner_group_uuid: UUID
    name_en: str
    name_fr: str


@dataclass(frozen=True)
class LocalApplicationConfigurationSeed:
    uuid: UUID
    partner_label: str
    application_url_en: str
    application_url_fr: str


LOCAL_PARTNER_GROUP = LocalPartnerGroupSeed(
    uuid=LOCAL_PARTNER_GROUP_UUID,
    name_en="Local Partner Group",
    name_fr="Groupe partenaire local",
)
LOCAL_APPLICATION = LocalApplicationSeed(
    uuid=LOCAL_APPLICATION_UUID,
    partner_group_uuid=LOCAL_PARTNER_GROUP_UUID,
    name_en="Local Application",
    name_fr="Application locale",
)
LOCAL_APPLICATION_CONFIGURATION = LocalApplicationConfigurationSeed(
    uuid=LOCAL_APPLICATION_CONFIGURATION_UUID,
    partner_label="Local Partner Application",
    application_url_en="https://local.application.example/en",
    application_url_fr="https://local.application.example/fr",
)


def ensure_local_environment(environment: EnvironmentOption) -> None:
    if environment is not EnvironmentOption.LOCAL:
        raise RuntimeError("Local application ERD seed data can only run with ENVIRONMENT=local")


async def _get_local_department(session: AsyncSession) -> Department:
    result = await session.execute(
        select(Department).where(
            Department.gc_org_id == LOCAL_DEPARTMENT_GC_ORG_ID,
            Department.is_deleted.is_(False),
        )
    )
    department = result.scalar_one_or_none()
    if department is None:
        raise RuntimeError(f"Department with gc_org_id={LOCAL_DEPARTMENT_GC_ORG_ID} was not found. Seed the department catalog first.")
    return department


async def _upsert_partner_group(session: AsyncSession, department_id: int) -> PartnerGroup:
    result = await session.execute(select(PartnerGroup).where(PartnerGroup.uuid == LOCAL_PARTNER_GROUP.uuid))
    partner_group = result.scalar_one_or_none()
    if partner_group is None:
        partner_group = PartnerGroup(
            department_id=department_id,
            name_en=LOCAL_PARTNER_GROUP.name_en,
            name_fr=LOCAL_PARTNER_GROUP.name_fr,
            uuid=LOCAL_PARTNER_GROUP.uuid,
        )
        session.add(partner_group)
    else:
        partner_group.department_id = department_id
        partner_group.name_en = LOCAL_PARTNER_GROUP.name_en
        partner_group.name_fr = LOCAL_PARTNER_GROUP.name_fr
        partner_group.deleted_at = None
        partner_group.is_deleted = False

    await session.flush()
    return partner_group


async def _upsert_application(session: AsyncSession, partner_group_id: int) -> Application:
    result = await session.execute(select(Application).where(Application.uuid == LOCAL_APPLICATION.uuid))
    application = result.scalar_one_or_none()
    if application is None:
        application = Application(
            partner_group_id=partner_group_id,
            name_en=LOCAL_APPLICATION.name_en,
            name_fr=LOCAL_APPLICATION.name_fr,
            uuid=LOCAL_APPLICATION.uuid,
        )
        session.add(application)
    else:
        application.partner_group_id = partner_group_id
        application.name_en = LOCAL_APPLICATION.name_en
        application.name_fr = LOCAL_APPLICATION.name_fr
        application.deleted_at = None
        application.is_deleted = False

    await session.flush()
    return application


async def _get_lookup_id(session: AsyncSession, model: type[Base], code: str) -> int:
    lookup_table = model.__table__
    result = await session.execute(
        select(model).where(
            lookup_table.c.code == code,
            lookup_table.c.is_deleted.is_(False),
            lookup_table.c.is_deprecated.is_(False),
        )
    )
    lookup = result.scalar_one_or_none()
    lookup_id = getattr(lookup, "id", None)
    if not isinstance(lookup_id, int):
        raise RuntimeError(f"Active lookup value {code!r} was not found in {model.__tablename__}")
    return lookup_id


async def _upsert_application_configuration(session: AsyncSession, application_id: int) -> ApplicationConfiguration:
    status_id = await _get_lookup_id(session, ApplicationConfigurationStatus, "draft")
    client_type_id = await _get_lookup_id(session, ApplicationConfigurationClientType, "public")
    authentication_protocol_id = await _get_lookup_id(session, AuthenticationProtocol, "oidc")
    tenant_id = await _get_lookup_id(session, Tenant, "test")

    result = await session.execute(
        select(ApplicationConfiguration).where(
            ApplicationConfiguration.uuid == LOCAL_APPLICATION_CONFIGURATION.uuid,
        )
    )
    configuration = result.scalar_one_or_none()
    if configuration is None:
        configuration = ApplicationConfiguration(
            application_id=application_id,
            application_configuration_status_id=status_id,
            application_configuration_client_type_id=client_type_id,
            authentication_protocol_id=authentication_protocol_id,
            tenant_id=tenant_id,
            partner_label=LOCAL_APPLICATION_CONFIGURATION.partner_label,
            application_url_en=LOCAL_APPLICATION_CONFIGURATION.application_url_en,
            application_url_fr=LOCAL_APPLICATION_CONFIGURATION.application_url_fr,
            uuid=LOCAL_APPLICATION_CONFIGURATION.uuid,
        )
        session.add(configuration)
    else:
        configuration.application_id = application_id
        configuration.application_configuration_status_id = status_id
        configuration.application_configuration_client_type_id = client_type_id
        configuration.authentication_protocol_id = authentication_protocol_id
        configuration.tenant_id = tenant_id
        configuration.partner_label = LOCAL_APPLICATION_CONFIGURATION.partner_label
        configuration.application_url_en = LOCAL_APPLICATION_CONFIGURATION.application_url_en
        configuration.application_url_fr = LOCAL_APPLICATION_CONFIGURATION.application_url_fr
        configuration.deleted_at = None
        configuration.is_deleted = False

    await session.flush()
    return configuration


async def seed_local_application_erd(session: AsyncSession, environment: EnvironmentOption) -> None:
    ensure_local_environment(environment)
    department = await _get_local_department(session)
    partner_group = await _upsert_partner_group(session, department.id)
    application = await _upsert_application(session, partner_group.id)
    await _upsert_application_configuration(session, application.id)


async def main() -> None:
    async with local_session() as session:
        async with session.begin():
            await seed_local_application_erd(session, settings.ENVIRONMENT)
    logger.info("Local application ERD seed data is ready")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
