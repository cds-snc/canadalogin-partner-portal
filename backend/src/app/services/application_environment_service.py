import uuid as uuid_pkg
from typing import Any

from fastcrud import compute_offset, paginated_response
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions.http_exceptions import NotFoundException
from ..repositories.application_environment_repository import application_environment_repository


class ApplicationEnvironmentService:
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
