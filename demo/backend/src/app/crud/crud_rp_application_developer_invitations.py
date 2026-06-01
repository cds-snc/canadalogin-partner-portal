from __future__ import annotations

from typing import Any


class _CrudRPApplicationDeveloperInvitations:
	async def get(self, *args: Any, **kwargs: Any) -> dict[str, Any] | None:
		raise NotImplementedError("crud_rp_application_developer_invitations.get is not configured in the demo backend yet")

	async def get_multi(self, *args: Any, **kwargs: Any) -> dict[str, list[dict[str, Any]]]:
		raise NotImplementedError("crud_rp_application_developer_invitations.get_multi is not configured in the demo backend yet")

	async def update(self, *args: Any, **kwargs: Any) -> dict[str, Any] | None:
		raise NotImplementedError("crud_rp_application_developer_invitations.update is not configured in the demo backend yet")


crud_rp_application_developer_invitations = _CrudRPApplicationDeveloperInvitations()