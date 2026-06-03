class _CRUDUsersPlaceholder:
	async def get(self, *args, **kwargs):  # noqa: ANN002, ANN003
		raise NotImplementedError("crud_users.get is not configured in the demo backend yet")


crud_users = _CRUDUsersPlaceholder()