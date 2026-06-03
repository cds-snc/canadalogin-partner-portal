from __future__ import annotations

from typing import Any


class _CrudRPApplications:
	async def get(self, *args: Any, **kwargs: Any) -> dict[str, Any] | None:
		raise NotImplementedError("crud_rp_applications.get is not configured in the demo backend yet")

	async def get_multi(self, *args: Any, **kwargs: Any) -> dict[str, list[dict[str, Any]]]:
		raise NotImplementedError("crud_rp_applications.get_multi is not configured in the demo backend yet")

	async def update(self, *args: Any, **kwargs: Any) -> dict[str, Any] | None:
		raise NotImplementedError("crud_rp_applications.update is not configured in the demo backend yet")


crud_rp_applications = _CrudRPApplications()