from __future__ import annotations

from typing import Any


class _CrudWorkspaces:
	async def get_multi(self, db: Any, department_id: int | None, is_deleted: bool = False) -> dict[str, list[dict[str, Any]]]:
		return {"data": []}


crud_workspaces = _CrudWorkspaces()