from __future__ import annotations

from typing import Any


class _CrudWorkspaceMembers:
	async def get(self, *args: Any, **kwargs: Any) -> dict[str, Any] | None:
		raise NotImplementedError("crud_workspace_members.get is not configured in the demo backend yet")

	async def get_multi(self, *args: Any, **kwargs: Any) -> dict[str, list[dict[str, Any]]]:
		raise NotImplementedError("crud_workspace_members.get_multi is not configured in the demo backend yet")

	async def delete(self, *args: Any, **kwargs: Any) -> None:
		raise NotImplementedError("crud_workspace_members.delete is not configured in the demo backend yet")


crud_workspace_members = _CrudWorkspaceMembers()