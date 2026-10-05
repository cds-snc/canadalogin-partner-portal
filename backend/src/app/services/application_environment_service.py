import uuid as uuid_pkg
from typing import Any

from fastcrud import compute_offset, paginated_response
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions.http_exceptions import BadRequestException, NotFoundException
from ..models.application_configuration_client_type import ApplicationConfigurationClientType
from ..models.application_configuration_status import ApplicationConfigurationStatus
from ..models.authentication_protocol import AuthenticationProtocol
from ..models.tenant import Tenant
from ..repositories.application_environment_repository import application_environment_repository
from ..schemas.application_environment import ApplicationEnvironmentCreate


class ApplicationEnvironmentService:
    async def create_application_environment(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment: ApplicationEnvironmentCreate,
    ) -> dict[str, Any]:
        application_id = await application_environment_repository.get_application_id(
            db=db,
            application_uuid=application_uuid,
        )
        if application_id is None:
            raise NotFoundException("Application not found")

        if environment.copy_existing and environment.source_environment_uuid is not None:
            if not await application_environment_repository.source_environment_exists(
                db=db,
                application_uuid=application_uuid,
                source_environment_uuid=environment.source_environment_uuid,
            ):
                raise BadRequestException("Source environment not found")

        status_id = await application_environment_repository.get_active_lookup_id(
            db=db,
            model=ApplicationConfigurationStatus,
            code="submitted",
        )
        client_type_id = await application_environment_repository.get_active_lookup_id(
            db=db,
            model=ApplicationConfigurationClientType,
            code=environment.client_type,
        )
        authentication_protocol_id = await application_environment_repository.get_active_lookup_id(
            db=db,
            model=AuthenticationProtocol,
            code="oidc",
        )
        tenant_id = await application_environment_repository.get_active_lookup_id(
            db=db,
            model=Tenant,
            code=environment.tenant_code,
        )
        if status_id is None:
            raise BadRequestException("Active status lookup was not found")
        if client_type_id is None:
            raise BadRequestException("Active client type lookup was not found")
        if authentication_protocol_id is None:
            raise BadRequestException("Active authentication protocol lookup was not found")
        if tenant_id is None:
            raise BadRequestException("Active tenant lookup was not found")

        config = environment.model_dump(by_alias=True, exclude_none=True, mode="json")
        return await application_environment_repository.create_environment(
            db=db,
            application_id=application_id,
            status_id=status_id,
            client_type_id=client_type_id,
            authentication_protocol_id=authentication_protocol_id,
            tenant_id=tenant_id,
            partner_label=environment.environment_name,
            application_url_en=str(environment.application_url_en),
            application_url_fr=str(environment.application_url_fr),
            tenant_code=environment.tenant_code,
            status_code="submitted",
            config=config,
        )

    async def list_application_environments(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        page: int,
        items_per_page: int,
    ) -> dict[str, Any]:
        application = await application_environment_repository.get_application_summary(
            db=db,
            application_uuid=application_uuid,
        )
        if application is None:
            raise NotFoundException("Application not found")

        environments = await application_environment_repository.list_environments(
            db=db,
            application_uuid=application_uuid,
            offset=compute_offset(page, items_per_page),
            limit=items_per_page,
        )
        return {
            "application": application,
            **paginated_response(
                crud_data=environments,
                page=page,
                items_per_page=items_per_page,
            ),
        }
