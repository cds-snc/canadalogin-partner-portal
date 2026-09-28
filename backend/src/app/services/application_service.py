import uuid as uuid_pkg
from typing import Any

from fastcrud import compute_offset, paginated_response
from sqlalchemy.ext.asyncio import AsyncSession

from ..repositories.application_repository import application_repository


class ApplicationService:
    async def list_current_user_applications(
        self,
        db: AsyncSession,
        user_uuid: uuid_pkg.UUID | str,
        page: int,
        items_per_page: int,
    ) -> dict[str, Any]:
        applications = await application_repository.list_for_user(
            db=db,
            user_uuid=user_uuid,
            offset=compute_offset(page, items_per_page),
            limit=items_per_page,
        )
        return paginated_response(
            crud_data=applications,
            page=page,
            items_per_page=items_per_page,
        )
