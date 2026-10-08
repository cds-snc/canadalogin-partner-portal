import uuid as uuid_pkg
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.db.database import Base
from ..models.application import Application
from ..models.application_configuration import ApplicationConfiguration
from ..models.application_configuration_status import ApplicationConfigurationStatus
from ..models.tenant import Tenant


class ApplicationEnvironmentRepository:
    async def get_application_id(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
    ) -> int | None:
        statement = select(Application.id).where(
            Application.uuid == application_uuid,
            Application.is_deleted.is_(False),
        )
        return (await db.execute(statement)).scalar_one_or_none()

    async def get_active_lookup_id(
        self,
        db: AsyncSession,
        model: type[Base],
        code: str,
    ) -> int | None:
        lookup_table = model.__table__
        statement = select(lookup_table.c.id).where(
            lookup_table.c.code == code,
            lookup_table.c.is_deleted.is_(False),
            lookup_table.c.is_deprecated.is_(False),
        )
        return (await db.execute(statement)).scalar_one_or_none()

    async def source_environment_exists(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        source_environment_uuid: uuid_pkg.UUID,
    ) -> bool:
        statement = (
            select(ApplicationConfiguration.id)
            .select_from(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .join(Tenant, Tenant.id == ApplicationConfiguration.tenant_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == source_environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
                Tenant.code.in_(("test", "staging")),
                Tenant.is_deleted.is_(False),
            )
        )
        return (await db.execute(statement)).scalar_one_or_none() is not None

    async def create_environment(
        self,
        db: AsyncSession,
        *,
        application_id: int,
        status_id: int,
        client_type_id: int,
        authentication_protocol_id: int,
        tenant_id: int,
        partner_label: str,
        application_url_en: str,
        application_url_fr: str,
        tenant_code: str,
        status_code: str,
        config: dict[str, object],
    ) -> dict[str, Any]:
        configuration = ApplicationConfiguration(
            application_id=application_id,
            application_configuration_status_id=status_id,
            application_configuration_client_type_id=client_type_id,
            authentication_protocol_id=authentication_protocol_id,
            tenant_id=tenant_id,
            partner_label=partner_label,
            application_url_en=application_url_en,
            application_url_fr=application_url_fr,
            config=config,
        )
        db.add(configuration)
        await db.commit()
        await db.refresh(configuration)
        return {
            "uuid": configuration.uuid,
            "partner_label": configuration.partner_label,
            "tenant_code": tenant_code,
            "status_code": status_code,
            "config": configuration.config,
            "created_at": configuration.created_at,
            "updated_at": configuration.updated_at,
        }

    async def get_application_metadata_by_ibm_application_ids(
        self,
        db: AsyncSession,
        ibm_application_ids: set[str],
    ) -> dict[str, dict[str, Any]]:
        if not ibm_application_ids:
            return {}

        statement = (
            select(
                ApplicationConfiguration.ibm_application_id,
                Application.uuid.label("application_uuid"),
                func.count(ApplicationConfiguration.id).label("environment_count"),
            )
            .select_from(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                ApplicationConfiguration.ibm_application_id.in_(ibm_application_ids),
                ApplicationConfiguration.is_deleted.is_(False),
                Application.is_deleted.is_(False),
            )
            .group_by(
                ApplicationConfiguration.ibm_application_id,
                Application.uuid,
            )
        )
        metadata_rows = (await db.execute(statement)).mappings().all()
        return {
            str(row["ibm_application_id"]): {
                "application_uuid": row["application_uuid"],
                "environment_count": int(row["environment_count"]),
            }
            for row in metadata_rows
            if row["ibm_application_id"] is not None
        }

    async def get_application_summary(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
    ) -> dict[str, Any] | None:
        statement = select(
            Application.uuid,
            Application.name_en,
            Application.name_fr,
        ).where(
            Application.uuid == application_uuid,
            Application.is_deleted.is_(False),
        )
        result = await db.execute(statement)
        summary = result.mappings().one_or_none()
        return dict(summary) if summary is not None else None

    async def list_environments(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        offset: int,
        limit: int,
    ) -> dict[str, Any]:
        conditions = (
            ApplicationConfiguration.application_id == Application.id,
            Application.uuid == application_uuid,
            Application.is_deleted.is_(False),
            ApplicationConfiguration.is_deleted.is_(False),
            ApplicationConfigurationStatus.is_deleted.is_(False),
            Tenant.is_deleted.is_(False),
        )
        statement = (
            select(
                ApplicationConfiguration.uuid,
                ApplicationConfiguration.partner_label,
                Tenant.code.label("tenant_code"),
                ApplicationConfigurationStatus.code.label("status_code"),
                ApplicationConfiguration.config,
                ApplicationConfiguration.created_at,
                ApplicationConfiguration.updated_at,
            )
            .select_from(Application)
            .join(
                ApplicationConfiguration,
                ApplicationConfiguration.application_id == Application.id,
            )
            .join(
                ApplicationConfigurationStatus,
                ApplicationConfigurationStatus.id == ApplicationConfiguration.application_configuration_status_id,
            )
            .join(Tenant, Tenant.id == ApplicationConfiguration.tenant_id)
            .where(*conditions)
            .order_by(
                func.coalesce(
                    ApplicationConfiguration.updated_at,
                    ApplicationConfiguration.created_at,
                ).desc(),
                ApplicationConfiguration.id.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
        count_statement = (
            select(func.count())
            .select_from(Application)
            .join(
                ApplicationConfiguration,
                ApplicationConfiguration.application_id == Application.id,
            )
            .join(
                ApplicationConfigurationStatus,
                ApplicationConfigurationStatus.id == ApplicationConfiguration.application_configuration_status_id,
            )
            .join(Tenant, Tenant.id == ApplicationConfiguration.tenant_id)
            .where(*conditions)
        )
        environments = (await db.execute(statement)).mappings().all()
        total_count = (await db.execute(count_statement)).scalar_one()
        return {
            "data": [dict(environment) for environment in environments],
            "total_count": int(total_count),
        }


application_environment_repository = ApplicationEnvironmentRepository()
