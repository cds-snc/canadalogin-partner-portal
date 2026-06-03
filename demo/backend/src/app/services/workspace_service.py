from datetime import UTC, datetime
from hashlib import sha256
from typing import Any, cast

from fastapi import HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions.http_exceptions import BadRequestException, ForbiddenException, NotFoundException
from ..crud.crud_departments import crud_departments
from ..crud.crud_rp_applications import crud_rp_applications
from ..crud.crud_rp_application_developer_invitations import crud_rp_application_developer_invitations
from ..crud.crud_workspace_members import crud_workspace_members
from ..crud.crud_workspaces import crud_workspaces


class WorkspaceService:
	async def create_workspace(
		self,
		db: AsyncSession,
		current_user: dict[str, Any],
		values: Any,
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def update_workspace(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		values: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def delete_workspace(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def add_member(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		target_user_uuid: Any,
		role: str,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def list_members(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		current_user: dict[str, Any],
	) -> list[dict[str, Any]]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def remove_member(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		target_user_uuid: Any,
		current_user: dict[str, Any],
	) -> None:
		raise NotImplementedError("Demo workspace service is not implemented yet")

    def _as_dict(self, row: Any | None) -> dict[str, Any] | None:
	    if row is None:
		    return None
	    if isinstance(row, dict):
		    return row
	    if hasattr(row, "model_dump"):
		    return cast(dict[str, Any], row.model_dump())
	    return cast(dict[str, Any], dict(row))

	def _hash_invitation_token(self, raw_token: str) -> str:
		return sha256(raw_token.encode("utf-8")).hexdigest()

	def _get_rp_application_developer_invitation_status(self, invitation: dict[str, Any]) -> str:
		if invitation.get("accepted_at") is not None:
			return "accepted"
		if invitation.get("revoked_at") is not None:
			return "revoked"
		invite_expires_at = invitation.get("invite_expires_at")
		if isinstance(invite_expires_at, datetime) and invite_expires_at <= datetime.now(UTC):
			return "expired"
		return "pending"

	def _serialize_rp_application_developer_invitation(self, invitation: dict[str, Any] | Any) -> dict[str, Any]:
		invitation_data = self._as_dict(invitation)
		if invitation_data is None:
			raise NotFoundException("RP application developer invitation not found")
		return {**invitation_data, "status": self._get_rp_application_developer_invitation_status(invitation_data)}

	async def get_workspace_by_uuid(self, db: AsyncSession, workspace_uuid: Any) -> dict[str, Any]:
		workspace = self._as_dict(await crud_workspaces.get(db=db, uuid=workspace_uuid, is_deleted=False))
		if workspace is None:
			raise NotFoundException("Workspace not found")
		return workspace

	async def _get_workspace_membership(self, db: AsyncSession, workspace_id: int, current_user: dict[str, Any]) -> dict[str, Any] | None:
		return self._as_dict(
			await crud_workspace_members.get(db=db, workspace_id=workspace_id, user_id=current_user["id"], is_deleted=False)
		)

	async def _ensure_workspace_member(self, db: AsyncSession, workspace_id: int, current_user: dict[str, Any], action: str) -> None:
		if await self._get_workspace_membership(db=db, workspace_id=workspace_id, current_user=current_user) is None:
			raise ForbiddenException(f"Only workspace members can {action}")

	async def _ensure_workspace_admin(self, db: AsyncSession, workspace_id: int, current_user: dict[str, Any], action: str) -> None:
		membership = await self._get_workspace_membership(db=db, workspace_id=workspace_id, current_user=current_user)
		if membership is None or membership.get("role") != "workspace_admin":
			raise ForbiddenException(f"Only workspace_admin can {action}")

	async def _get_rp_application_by_uuid(self, db: AsyncSession, workspace_id: int, rp_application_uuid: Any) -> dict[str, Any]:
		rp_application = self._as_dict(
			await crud_rp_applications.get(db=db, uuid=rp_application_uuid, workspace_id=workspace_id, is_deleted=False)
		)
		if rp_application is None:
			raise NotFoundException("RP application not found")
		return rp_application

	async def _has_accepted_rp_application_invitation(self, db: AsyncSession, rp_application_id: int, current_user: dict[str, Any]) -> bool:
		normalized_email = str(current_user.get("email") or "").strip().lower()
		if not normalized_email:
			return False
		invitation_result = await crud_rp_application_developer_invitations.get_multi(
			db=db,
			invited_email=normalized_email,
			rp_application_id=rp_application_id,
			revoked_at=None,
			is_deleted=False,
		)
		invitation_rows = invitation_result.get("data", []) if isinstance(invitation_result, dict) else invitation_result
		for invitation in invitation_rows:
			invitation_data = self._as_dict(invitation)
			if invitation_data is not None and invitation_data.get("accepted_at") is not None:
				return True
		return False

	async def _get_current_user_rp_application_context(self, db: AsyncSession, rp_application_uuid: Any, current_user: dict[str, Any], require_write: bool) -> tuple[dict[str, Any], dict[str, Any]]:
		rp_application = await self._get_rp_application_by_uuid(db=db, workspace_id=0, rp_application_uuid=rp_application_uuid)
		workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=rp_application.get("workspace_uuid") or rp_application.get("workspace_id"))
		membership = await self._get_workspace_membership(db=db, workspace_id=workspace["id"], current_user=current_user)
		if membership is not None and (not require_write or membership.get("role") == "workspace_admin"):
			return rp_application, workspace
		rp_application_id = rp_application.get("id")
		if isinstance(rp_application_id, int) and await self._has_accepted_rp_application_invitation(db=db, rp_application_id=rp_application_id, current_user=current_user):
			return rp_application, workspace
		if require_write:
			raise ForbiddenException("Only workspace_admin or invited developers can update RP applications")
		raise ForbiddenException("Only workspace members or invited developers can view RP applications")

	async def invite_rp_application_developer(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		values: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
		await self._ensure_workspace_admin(db=db, workspace_id=workspace["id"], current_user=current_user, action="invite RP application developers")
		rp_application = await self._get_rp_application_by_uuid(db=db, workspace_id=workspace["id"], rp_application_uuid=rp_application_uuid)
		raw_token = str(getattr(values, "token", "") or "")
		if not raw_token:
			raw_token = str(getattr(values, "email", "") or "")
		created = await crud_rp_application_developer_invitations.create(
			db=db,
			object={
				"workspace_id": workspace["id"],
				"rp_application_id": rp_application["id"],
				"invited_email": str(getattr(values, "email", "") or "").strip().lower(),
				"invited_by": current_user.get("id"),
				"role": "developer",
				"token_hash": self._hash_invitation_token(raw_token),
				"invite_expires_at": datetime.now(UTC),
			},
		)
		return self._serialize_rp_application_developer_invitation(created)

	async def list_current_user_workspaces(
		self,
		db: AsyncSession,
		current_user: dict[str, Any],
	) -> list[dict[str, Any]]:
		result = await crud_workspaces.get_multi(db=db, current_user_id=current_user.get("id"), is_deleted=False)
		return result.get("data", []) if isinstance(result, dict) else result

    async def list_current_user_rp_applications(
        self,
        db: AsyncSession,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
		workspaces = await self.list_current_user_workspaces(db=db, current_user=current_user)
		applications: list[dict[str, Any]] = []
		seen_application_ids: set[int] = set()
		for workspace in workspaces:
			workspace_data = self._as_dict(workspace)
			if workspace_data is None:
				continue
			workspace_id = workspace_data.get("id")
			workspace_uuid = workspace_data.get("uuid")
			if not isinstance(workspace_id, int):
				continue
			result = await crud_rp_applications.get_multi(db=db, workspace_id=workspace_id, is_deleted=False)
			workspace_applications = result.get("data", []) if isinstance(result, dict) else result
			for application in workspace_applications:
				application_data = self._as_dict(application)
				if application_data is None:
					continue
				application_data["workspace_name"] = workspace_data.get("name")
				application_data["workspace_uuid"] = workspace_uuid
				applications.append(application_data)
				application_id = application_data.get("id")
				if isinstance(application_id, int):
					seen_application_ids.add(application_id)
		normalized_email = str(current_user.get("email") or "").strip().lower()
		if normalized_email:
			invitation_result = await crud_rp_application_developer_invitations.get_multi(
				db=db,
				invited_email=normalized_email,
				revoked_at=None,
				is_deleted=False,
			)
			invitation_rows = invitation_result.get("data", []) if isinstance(invitation_result, dict) else invitation_result
			for invitation in invitation_rows:
				invitation_data = self._as_dict(invitation)
				if invitation_data is None or invitation_data.get("accepted_at") is None:
					continue
				rp_application_id = invitation_data.get("rp_application_id")
				if not isinstance(rp_application_id, int) or rp_application_id in seen_application_ids:
					continue
				rp_application = await crud_rp_applications.get(db=db, id=rp_application_id, is_deleted=False)
				workspace = await crud_workspaces.get(db=db, id=invitation_data.get("workspace_id"), is_deleted=False)
				if not rp_application or not workspace:
					continue
				app_data = self._as_dict(rp_application)
				workspace_data = self._as_dict(workspace)
				if app_data is None or workspace_data is None:
					continue
				app_data["workspace_name"] = workspace_data.get("name")
				app_data["workspace_uuid"] = workspace_data.get("uuid")
				applications.append(app_data)
		return applications

	async def get_current_user_rp_application(
		self,
		db: AsyncSession,
		rp_application_uuid: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		rp_application, workspace = await self._get_current_user_rp_application_context(
			db=db,
			rp_application_uuid=rp_application_uuid,
			current_user=current_user,
			require_write=False,
		)
		rp_application["workspace_name"] = workspace.get("name")
		rp_application["workspace_uuid"] = workspace.get("uuid")
		return rp_application

    async def update_current_user_rp_application(
        self,
        db: AsyncSession,
        rp_application_uuid: Any,
        values: Any,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
		existing_rp_application, workspace = await self._get_current_user_rp_application_context(
			db=db,
			rp_application_uuid=rp_application_uuid,
			current_user=current_user,
			require_write=True,
		)
		update_data = values.model_dump(exclude_none=True, by_alias=False)
		if not update_data:
			return await self.get_current_user_rp_application(db=db, rp_application_uuid=rp_application_uuid, current_user=current_user)
		department = await crud_departments.get(db=db, id=workspace.get("department_id"), is_deleted=False)
		abbreviation = str((department or {}).get("abbreviation") or "").strip()
		if abbreviation and "name" in update_data and not str(update_data["name"]).startswith(f"[{abbreviation}] - "):
			update_data["name"] = f"[{abbreviation}] - {update_data["name"]}"
		updated = await crud_rp_applications.update(db=db, uuid=rp_application_uuid, object={**update_data, "updated_at": datetime.now(UTC)})
		if updated is None:
			existing_rp_application.update(update_data)
			return await self.get_current_user_rp_application(db=db, rp_application_uuid=rp_application_uuid, current_user=current_user)
		updated_data = self._as_dict(updated)
		if updated_data is None:
			return await self.get_current_user_rp_application(db=db, rp_application_uuid=rp_application_uuid, current_user=current_user)
		updated_data["workspace_name"] = workspace.get("name")
		updated_data["workspace_uuid"] = workspace.get("uuid")
		return updated_data

    async def accept_rp_application_developer_invitation(
        self,
        db: AsyncSession,
        token: str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
		normalized_email = str(current_user.get("email") or "").strip().lower()
		if not normalized_email:
			raise BadRequestException("Current user email is required")
		invitation = self._as_dict(
			await crud_rp_application_developer_invitations.get(
				db=db,
				token_hash=self._hash_invitation_token(token),
				revoked_at=None,
				is_deleted=False,
			)
		)
		if invitation is None:
			raise NotFoundException("RP application developer invitation not found")
		invited_email = str(invitation.get("invited_email") or "").strip().lower()
		if invited_email != normalized_email:
			raise ForbiddenException("Invitation does not belong to the current user")
		if invitation.get("accepted_at") is not None:
			return invitation
		invite_expires_at = invitation.get("invite_expires_at")
		if not isinstance(invite_expires_at, datetime) or invite_expires_at <= datetime.now(UTC):
			raise BadRequestException("Invitation has expired")
		accepted_time = datetime.now(UTC)
		updated = await crud_rp_application_developer_invitations.update(
			db=db,
			id=invitation["id"],
			object={"accepted_at": accepted_time, "updated_at": accepted_time},
		)
		if updated is not None:
			return self._serialize_rp_application_developer_invitation(updated)
		invitation["accepted_at"] = accepted_time
		invitation["updated_at"] = accepted_time
		return self._serialize_rp_application_developer_invitation(invitation)

	async def list_rp_application_developer_invitations(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		current_user: dict[str, Any],
	) -> list[dict[str, Any]]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def revoke_rp_application_developer_invitation(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		invitation_uuid: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def resend_rp_application_developer_invitation(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		invitation_uuid: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def list_application_infos(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		current_user: dict[str, Any],
	) -> list[dict[str, Any]]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def create_rp_application(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		values: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def update_rp_application(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		values: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def get_rp_application_client_credentials(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def delete_rp_application(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def list_rp_application_rotated_client_secrets(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		current_user: dict[str, Any],
	) -> list[dict[str, Any]]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def create_rp_application_rotated_client_secret(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		current_user: dict[str, Any],
		values: Any = None,
	) -> list[dict[str, Any]]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def delete_rp_application_rotated_client_secret(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		rotated_secret_id: str,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def rotate_rp_application_client_secret(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		current_user: dict[str, Any],
		values: Any = None,
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def get_rp_application_usage_summary(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		selected_date: str,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def get_rp_application_audit_trail(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		selected_date: str,
		current_user: dict[str, Any],
		size: int,
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def get_rp_application_audit_trail_search_after(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		rp_application_uuid: Any,
		selected_date: str,
		current_user: dict[str, Any],
		size: int,
		search_after: str,
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def create_application_info(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		values: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def update_application_info(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		application_info_uuid: Any,
		values: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def delete_application_info(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		application_info_uuid: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def list_application_contacts(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		application_info_uuid: Any,
		current_user: dict[str, Any],
	) -> list[dict[str, Any]]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def create_application_contact(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		application_info_uuid: Any,
		values: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def update_application_contact(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		application_info_uuid: Any,
		application_contact_uuid: Any,
		values: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")

	async def delete_application_contact(
		self,
		db: AsyncSession,
		workspace_uuid: Any,
		application_info_uuid: Any,
		application_contact_uuid: Any,
		current_user: dict[str, Any],
	) -> dict[str, Any]:
		raise NotImplementedError("Demo workspace service is not implemented yet")