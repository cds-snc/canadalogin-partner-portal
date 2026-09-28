import uuid as uuid_pkg
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.application import Application
from ..models.application_configuration import ApplicationConfiguration
from ..models.application_configuration_status import ApplicationConfigurationStatus
from ..models.tenant import Tenant


class ApplicationEnvironmentRepository:
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
                ApplicationConfigurationStatus.id
                == ApplicationConfiguration.application_configuration_status_id,
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
                ApplicationConfigurationStatus.id
                == ApplicationConfiguration.application_configuration_status_id,
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
