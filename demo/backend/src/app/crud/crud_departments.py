from __future__ import annotations

from typing import Any


class _CrudDepartments:
	async def get(self, *args: Any, **kwargs: Any) -> dict[str, Any] | None:
		raise NotImplementedError("crud_departments.get is not configured in the demo backend yet")


crud_departments = _CrudDepartments()