from typing import Any

from fastcrud import FastCRUD
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.department import Department


class DepartmentReadRepository:
    """Read-only Department reference repository.

    Department rows remain in the historical schema, but portal runtime code
    cannot mutate the catalog through this exported repository.
    """

    def __init__(self) -> None:
        self._repository = FastCRUD(Department)

    async def get(
        self,
        db: AsyncSession,
        schema_to_select: type[Any] | None = None,
        return_as_model: bool = False,
        one_or_none: bool = False,
        **kwargs: Any,
    ) -> Any:
        return await self._repository.get(
            db=db,
            schema_to_select=schema_to_select,
            return_as_model=return_as_model,
            one_or_none=one_or_none,
            **kwargs,
        )

    async def get_multi(
        self,
        db: AsyncSession,
        offset: int = 0,
        limit: int | None = 100,
        schema_to_select: type[Any] | None = None,
        sort_columns: str | list[str] | None = None,
        sort_orders: str | list[str] | None = None,
        return_as_model: bool = False,
        return_total_count: bool = True,
        **kwargs: Any,
    ) -> Any:
        return await self._repository.get_multi(
            db=db,
            offset=offset,
            limit=limit,
            schema_to_select=schema_to_select,
            sort_columns=sort_columns,
            sort_orders=sort_orders,
            return_as_model=return_as_model,
            return_total_count=return_total_count,
            **kwargs,
        )


crud_departments = DepartmentReadRepository()
