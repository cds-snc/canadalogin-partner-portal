import hashlib
import secrets
import uuid as uuid_pkg
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.exceptions.http_exceptions import BadRequestException, DuplicateValueException, ForbiddenException, NotFoundException
from ..repositories.crud_rp_application_access_grants import crud_rp_application_access_grants
from ..repositories.crud_rp_application_developer_invitations import crud_rp_application_developer_invitations
from ..repositories.crud_rp_applications import crud_rp_applications
from ..repositories.crud_workspaces import crud_workspaces
from ..schemas.rp_application import RPApplicationRead
from ..schemas.rp_application_access_grant import (
    RPApplicationAccessGrantCreateInternal,
    RPApplicationAccessGrantRead,
)
from ..schemas.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitationCreateInternal,
    RPApplicationDeveloperInvitationRead,
)
from ..schemas.workspace import WorkspaceRead

PENDING_INVITATION_STATUS = "pending"
ACCEPTED_INVITATION_STATUS = "accepted"
EXPIRED_INVITATION_STATUS = "expired"
REVOKED_INVITATION_STATUS = "revoked"

RP_ADMIN_ROLE = "RP Admin"
RP_USER_EDIT_ROLE = "RP User (Edit)"
READ_ONLY_ROLE = "Read Only"

INVITATION_ROLE_LABELS = {
    "rp admin": RP_ADMIN_ROLE,
    "rp user (edit)": RP_USER_EDIT_ROLE,
    "read only": READ_ONLY_ROLE,
}
DELEGATED_INVITATION_ROLE_KEYS = frozenset({"rp user (edit)", "read only"})


class RPApplicationDeveloperInvitationService:
    def _as_dict(self, value: Any) -> dict[str, Any]:
        if isinstance(value, dict):
            return value
        if hasattr(value, "model_dump"):
            dumped_value = value.model_dump(by_alias=True, exclude_none=True)
            if isinstance(dumped_value, dict):
                return dumped_value
        if isinstance(value, Mapping):
            return dict(value)
        return {}

    def _normalize_current_user_id(self, current_user: Mapping[str, Any]) -> int | None:
        raw_user_id = current_user.get("id")
        if raw_user_id is None or isinstance(raw_user_id, bool):
            return None

        if isinstance(raw_user_id, int):
            return raw_user_id

        normalized = str(raw_user_id).strip()
        if not normalized:
            return None

        try:
            return int(normalized)
        except ValueError:
            return None

    def _extract_current_user_email(self, current_user: Mapping[str, Any]) -> str | None:
        for key in ("email", "mail", "userName", "username"):
            value = current_user.get(key)
            if value is None:
                continue

            normalized = str(value).strip().lower()
            if normalized:
                return normalized

        return None

    def _normalize_email(self, invited_email: str) -> str:
        normalized_email = str(invited_email).strip().lower()
        if not normalized_email:
            raise BadRequestException("Invited email is required")
        return normalized_email

    def _normalize_invitation_role_key(self, role: Any) -> str:
        normalized_role = str(role or "").strip().lower()
        if not normalized_role:
            raise BadRequestException("Invitation role is required")
        if normalized_role not in INVITATION_ROLE_LABELS:
            raise BadRequestException("Unsupported invitation role")
        return normalized_role

    def _canonicalize_invitation_role(self, role: Any) -> str:
        return INVITATION_ROLE_LABELS[self._normalize_invitation_role_key(role)]

    def _normalize_access_grant_role(self, role: Any) -> str | None:
        normalized_role = str(role or "").strip().lower()
        return normalized_role or None

    def _normalize_expiry(self, invite_expires_at: datetime) -> datetime:
        if invite_expires_at.tzinfo is None:
            normalized_expiry = invite_expires_at.replace(tzinfo=UTC)
        else:
            normalized_expiry = invite_expires_at.astimezone(UTC)

        if normalized_expiry <= datetime.now(UTC):
            raise BadRequestException("Invitation expiry must be in the future")

        return normalized_expiry

    def _build_acceptance_url(self, token: str) -> str:
        base_url = settings.RP_APPLICATION_INVITE_URL_BASE.rstrip("/")
        return f"{base_url}/{token}"

    def _hash_token(self, token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    async def _get_workspace_application_context(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        workspace = await crud_workspaces.get(
            db=db,
            uuid=workspace_uuid,
            is_deleted=False,
            schema_to_select=WorkspaceRead,
        )
        if workspace is None:
            raise NotFoundException("Workspace not found")

        rp_application = await crud_rp_applications.get(
            db=db,
            uuid=rp_application_uuid,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        if rp_application is None:
            raise NotFoundException("RP application not found")

        workspace_data = self._as_dict(workspace)
        rp_application_data = self._as_dict(rp_application)
        if rp_application_data.get("workspace_id") != workspace_data.get("id"):
            raise NotFoundException("RP application not found")

        return workspace_data, rp_application_data

    async def _get_active_workspace_grant(
        self,
        db: AsyncSession,
        current_user: Mapping[str, Any],
        workspace_id: int,
    ) -> dict[str, Any] | None:
        user_id = self._normalize_current_user_id(current_user)
        if user_id is None:
            return None

        return await crud_rp_application_access_grants.get(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            status="active",
            is_deleted=False,
            schema_to_select=RPApplicationAccessGrantRead,
        )

    async def _ensure_management_access(
        self,
        db: AsyncSession,
        current_user: Mapping[str, Any],
        workspace_id: int,
    ) -> dict[str, Any] | None:
        if current_user.get("is_superuser"):
            return None

        access_grant = await self._get_active_workspace_grant(
            db=db,
            current_user=current_user,
            workspace_id=workspace_id,
        )
        normalized_role = self._normalize_access_grant_role(
            self._as_dict(access_grant).get("role")
        )
        if normalized_role != "rp admin":
            raise ForbiddenException(
                "Only RP Admin can manage developer invitations for this partner context"
            )

        return self._as_dict(access_grant)

    async def _ensure_assignment_allowed(
        self,
        db: AsyncSession,
        current_user: Mapping[str, Any],
        workspace_id: int,
        role: Any,
    ) -> tuple[str, uuid_pkg.UUID | None]:
        canonical_role = self._canonicalize_invitation_role(role)

        if current_user.get("is_superuser"):
            return canonical_role, None

        access_grant = await self._ensure_management_access(
            db=db,
            current_user=current_user,
            workspace_id=workspace_id,
        )
        normalized_role = self._normalize_invitation_role_key(canonical_role)
        if normalized_role not in DELEGATED_INVITATION_ROLE_KEYS:
            raise ForbiddenException("Only CL Admin can assign the RP Admin role")

        delegated_by_grant_uuid = access_grant.get("uuid")
        if not isinstance(delegated_by_grant_uuid, uuid_pkg.UUID):
            raise ForbiddenException(
                "Delegated invitation management requires an active RP Admin grant"
            )

        return canonical_role, delegated_by_grant_uuid

    async def _mark_invitation_expired_if_needed(
        self,
        db: AsyncSession,
        invitation: dict[str, Any],
    ) -> dict[str, Any]:
        if invitation.get("status") != PENDING_INVITATION_STATUS:
            return invitation

        invite_expires_at = invitation.get("invite_expires_at")
        if not isinstance(invite_expires_at, datetime):
            return invitation

        normalized_expiry = (
            invite_expires_at.replace(tzinfo=UTC)
            if invite_expires_at.tzinfo is None
            else invite_expires_at.astimezone(UTC)
        )
        if normalized_expiry > datetime.now(UTC):
            return invitation

        updated_at = datetime.now(UTC)
        await crud_rp_application_developer_invitations.update(
            db=db,
            object={
                "status": EXPIRED_INVITATION_STATUS,
                "updated_at": updated_at,
            },
            uuid=invitation["uuid"],
            is_deleted=False,
        )
        invitation["status"] = EXPIRED_INVITATION_STATUS
        invitation["updated_at"] = updated_at
        return invitation

    async def _list_context_invitations(
        self,
        db: AsyncSession,
        workspace_id: int,
        rp_application_id: int,
        *,
        invited_email: str | None = None,
    ) -> list[dict[str, Any]]:
        filters: dict[str, Any] = {
            "workspace_id": workspace_id,
            "rp_application_id": rp_application_id,
            "is_deleted": False,
            "schema_to_select": RPApplicationDeveloperInvitationRead,
        }
        if invited_email is not None:
            filters["invited_email"] = invited_email

        invitations_data = await crud_rp_application_developer_invitations.get_multi(
            db=db,
            **filters,
        )
        invitations = (
            invitations_data.get("data", [])
            if isinstance(invitations_data, dict)
            else invitations_data
        )

        normalized_invitations: list[dict[str, Any]] = []
        for invitation in invitations:
            invitation_data = self._as_dict(invitation)
            normalized_invitations.append(
                await self._mark_invitation_expired_if_needed(db=db, invitation=invitation_data)
            )

        return normalized_invitations

    async def _upsert_access_grant_for_invitation(
        self,
        db: AsyncSession,
        invitation: dict[str, Any],
        current_user: Mapping[str, Any],
    ) -> dict[str, Any]:
        user_id = self._normalize_current_user_id(current_user)
        if user_id is None:
            raise ForbiddenException("Authenticated user is missing a local user identifier")

        workspace_id = invitation.get("workspace_id")
        invitation_uuid = invitation.get("uuid")
        if not isinstance(workspace_id, int) or not isinstance(invitation_uuid, uuid_pkg.UUID):
            raise NotFoundException("Developer invitation is missing required workspace context")

        role = self._canonicalize_invitation_role(invitation.get("role"))
        existing_grant = await crud_rp_application_access_grants.get(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            status="active",
            is_deleted=False,
            schema_to_select=RPApplicationAccessGrantRead,
        )
        if existing_grant is None:
            created_grant = await crud_rp_application_access_grants.create(
                db=db,
                object=RPApplicationAccessGrantCreateInternal(
                    workspace_id=workspace_id,
                    user_id=user_id,
                    role=role,
                    status="active",
                    source_invitation_uuid=invitation_uuid,
                ),
                schema_to_select=RPApplicationAccessGrantRead,
            )
            if created_grant is None:
                raise NotFoundException("Failed to create RP application access grant")

            return self._as_dict(created_grant)

        grant_data = self._as_dict(existing_grant)
        grant_role = self._normalize_access_grant_role(grant_data.get("role"))
        invitation_role = self._normalize_invitation_role_key(role)
        if (
            grant_role != invitation_role
            or grant_data.get("source_invitation_uuid") != invitation_uuid
        ):
            updated_at = datetime.now(UTC)
            await crud_rp_application_access_grants.update(
                db=db,
                object={
                    "role": role,
                    "source_invitation_uuid": invitation_uuid,
                    "updated_at": updated_at,
                },
                uuid=grant_data["uuid"],
                is_deleted=False,
            )
            grant_data["role"] = role
            grant_data["source_invitation_uuid"] = invitation_uuid
            grant_data["updated_at"] = updated_at

        return grant_data

    async def _create_invitation_record(
        self,
        db: AsyncSession,
        *,
        workspace_id: int,
        rp_application_id: int,
        invited_email: str,
        invited_by: int | None,
        role: str,
        invite_expires_at: datetime,
        delegated_by_grant_uuid: uuid_pkg.UUID | None,
        gc_notify_notification_id: str | None = None,
    ) -> dict[str, Any]:
        raw_token = secrets.token_urlsafe(32)
        created_invitation = await crud_rp_application_developer_invitations.create(
            db=db,
            object=RPApplicationDeveloperInvitationCreateInternal(
                workspace_id=workspace_id,
                rp_application_id=rp_application_id,
                invited_email=invited_email,
                token_hash=self._hash_token(raw_token),
                invite_expires_at=self._normalize_expiry(invite_expires_at),
                invited_by=invited_by,
                role=role,
                status=PENDING_INVITATION_STATUS,
                gc_notify_notification_id=gc_notify_notification_id,
                delegated_by_grant_uuid=delegated_by_grant_uuid,
            ),
            schema_to_select=RPApplicationDeveloperInvitationRead,
        )
        if created_invitation is None:
            raise NotFoundException("Failed to create developer invitation")

        invitation_data = self._as_dict(created_invitation)
        invitation_data["acceptance_url"] = self._build_acceptance_url(raw_token)
        return invitation_data

    async def list_developer_invitations(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: Mapping[str, Any],
    ) -> list[dict[str, Any]]:
        workspace_data, rp_application_data = await self._get_workspace_application_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
        )
        await self._ensure_management_access(
            db=db,
            current_user=current_user,
            workspace_id=workspace_data["id"],
        )

        invitations = await self._list_context_invitations(
            db=db,
            workspace_id=workspace_data["id"],
            rp_application_id=rp_application_data["id"],
        )
        if not current_user.get("is_superuser"):
            invitations = [
                invitation
                for invitation in invitations
                if self._normalize_invitation_role_key(invitation.get("role"))
                in DELEGATED_INVITATION_ROLE_KEYS
            ]

        return sorted(
            invitations,
            key=lambda invitation: invitation.get("created_at") or datetime.min.replace(tzinfo=UTC),
            reverse=True,
        )

    async def create_developer_invitation(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: Mapping[str, Any],
        *,
        invited_email: str,
        role: str,
        invite_expires_at: datetime,
        gc_notify_notification_id: str | None = None,
    ) -> dict[str, Any]:
        workspace_data, rp_application_data = await self._get_workspace_application_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
        )
        canonical_role, delegated_by_grant_uuid = await self._ensure_assignment_allowed(
            db=db,
            current_user=current_user,
            workspace_id=workspace_data["id"],
            role=role,
        )

        normalized_email = self._normalize_email(invited_email)
        existing_invitations = await self._list_context_invitations(
            db=db,
            workspace_id=workspace_data["id"],
            rp_application_id=rp_application_data["id"],
            invited_email=normalized_email,
        )
        for invitation in existing_invitations:
            status = invitation.get("status")
            if status == PENDING_INVITATION_STATUS:
                raise DuplicateValueException(
                    "An active invitation already exists for this email and partner context"
                )
            if status == ACCEPTED_INVITATION_STATUS:
                raise DuplicateValueException(
                    "An accepted invitation already exists for this email and partner context"
                )

        return await self._create_invitation_record(
            db=db,
            workspace_id=workspace_data["id"],
            rp_application_id=rp_application_data["id"],
            invited_email=normalized_email,
            invited_by=self._normalize_current_user_id(current_user),
            role=canonical_role,
            invite_expires_at=invite_expires_at,
            delegated_by_grant_uuid=delegated_by_grant_uuid,
            gc_notify_notification_id=gc_notify_notification_id,
        )

    async def has_pending_invitation_for_email(
        self,
        db: AsyncSession,
        invited_email: str,
    ) -> bool:
        normalized_email = self._normalize_email(invited_email)
        invitations_data = await crud_rp_application_developer_invitations.get_multi(
            db=db,
            invited_email=normalized_email,
            is_deleted=False,
            schema_to_select=RPApplicationDeveloperInvitationRead,
        )
        invitations = (
            invitations_data.get("data", [])
            if isinstance(invitations_data, dict)
            else invitations_data
        )

        for invitation in invitations:
            invitation_data = await self._mark_invitation_expired_if_needed(
                db=db,
                invitation=self._as_dict(invitation),
            )
            if invitation_data.get("status") == PENDING_INVITATION_STATUS:
                return True

        return False

    async def accept_developer_invitation(
        self,
        db: AsyncSession,
        token: str,
        current_user: Mapping[str, Any],
    ) -> dict[str, Any]:
        normalized_token = str(token).strip()
        if not normalized_token:
            raise NotFoundException("Developer invitation not found")

        invitation = await crud_rp_application_developer_invitations.get(
            db=db,
            token_hash=self._hash_token(normalized_token),
            is_deleted=False,
            schema_to_select=RPApplicationDeveloperInvitationRead,
        )
        if invitation is None:
            raise NotFoundException("Developer invitation not found")

        invitation_data = await self._mark_invitation_expired_if_needed(
            db=db,
            invitation=self._as_dict(invitation),
        )
        invited_email = self._normalize_email(str(invitation_data.get("invited_email", "")))
        current_user_email = self._extract_current_user_email(current_user)
        if current_user_email != invited_email:
            raise ForbiddenException("Signed-in email does not match this invitation")

        if invitation_data.get("status") == REVOKED_INVITATION_STATUS:
            raise BadRequestException("Developer invitation is revoked")
        if invitation_data.get("status") == EXPIRED_INVITATION_STATUS:
            raise BadRequestException("Developer invitation is expired")

        access_grant = await self._upsert_access_grant_for_invitation(
            db=db,
            invitation=invitation_data,
            current_user=current_user,
        )
        if invitation_data.get("status") == ACCEPTED_INVITATION_STATUS:
            return {
                "invitation": invitation_data,
                "access_grant": access_grant,
            }

        accepted_at = datetime.now(UTC)
        await crud_rp_application_developer_invitations.update(
            db=db,
            object={
                "status": ACCEPTED_INVITATION_STATUS,
                "accepted_at": accepted_at,
                "updated_at": accepted_at,
            },
            uuid=invitation_data["uuid"],
            is_deleted=False,
        )
        invitation_data["status"] = ACCEPTED_INVITATION_STATUS
        invitation_data["accepted_at"] = accepted_at
        invitation_data["updated_at"] = accepted_at
        return {
            "invitation": invitation_data,
            "access_grant": access_grant,
        }

    async def revoke_developer_invitation(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        invitation_uuid: uuid_pkg.UUID | str,
        current_user: Mapping[str, Any],
    ) -> dict[str, Any]:
        workspace_data, rp_application_data = await self._get_workspace_application_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
        )
        invitation = await crud_rp_application_developer_invitations.get(
            db=db,
            uuid=invitation_uuid,
            workspace_id=workspace_data["id"],
            rp_application_id=rp_application_data["id"],
            is_deleted=False,
            schema_to_select=RPApplicationDeveloperInvitationRead,
        )
        if invitation is None:
            raise NotFoundException("Developer invitation not found")

        invitation_data = await self._mark_invitation_expired_if_needed(
            db=db,
            invitation=self._as_dict(invitation),
        )
        if not current_user.get("is_superuser") and self._normalize_invitation_role_key(
            invitation_data.get("role")
        ) not in DELEGATED_INVITATION_ROLE_KEYS:
            raise NotFoundException("Developer invitation not found")

        await self._ensure_management_access(
            db=db,
            current_user=current_user,
            workspace_id=workspace_data["id"],
        )
        if invitation_data.get("status") == ACCEPTED_INVITATION_STATUS:
            raise BadRequestException("Accepted invitations cannot be revoked")
        if invitation_data.get("status") == REVOKED_INVITATION_STATUS:
            return invitation_data

        revoked_at = datetime.now(UTC)
        await crud_rp_application_developer_invitations.update(
            db=db,
            object={
                "status": REVOKED_INVITATION_STATUS,
                "revoked_at": revoked_at,
                "updated_at": revoked_at,
            },
            uuid=invitation_uuid,
            is_deleted=False,
        )
        invitation_data["status"] = REVOKED_INVITATION_STATUS
        invitation_data["revoked_at"] = revoked_at
        invitation_data["updated_at"] = revoked_at
        return invitation_data

    async def reissue_developer_invitation(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        invitation_uuid: uuid_pkg.UUID | str,
        current_user: Mapping[str, Any],
        *,
        invite_expires_at: datetime,
        gc_notify_notification_id: str | None = None,
    ) -> dict[str, Any]:
        workspace_data, rp_application_data = await self._get_workspace_application_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
        )
        invitation = await crud_rp_application_developer_invitations.get(
            db=db,
            uuid=invitation_uuid,
            workspace_id=workspace_data["id"],
            rp_application_id=rp_application_data["id"],
            is_deleted=False,
            schema_to_select=RPApplicationDeveloperInvitationRead,
        )
        if invitation is None:
            raise NotFoundException("Developer invitation not found")

        invitation_data = await self._mark_invitation_expired_if_needed(
            db=db,
            invitation=self._as_dict(invitation),
        )
        canonical_role, delegated_by_grant_uuid = await self._ensure_assignment_allowed(
            db=db,
            current_user=current_user,
            workspace_id=workspace_data["id"],
            role=invitation_data.get("role"),
        )
        if invitation_data.get("status") == ACCEPTED_INVITATION_STATUS:
            raise BadRequestException("Accepted invitations cannot be reissued")

        if invitation_data.get("status") == PENDING_INVITATION_STATUS:
            revoked_at = datetime.now(UTC)
            await crud_rp_application_developer_invitations.update(
                db=db,
                object={
                    "status": REVOKED_INVITATION_STATUS,
                    "revoked_at": revoked_at,
                    "updated_at": revoked_at,
                },
                uuid=invitation_uuid,
                is_deleted=False,
            )

        return await self._create_invitation_record(
            db=db,
            workspace_id=workspace_data["id"],
            rp_application_id=rp_application_data["id"],
            invited_email=self._normalize_email(invitation_data["invited_email"]),
            invited_by=self._normalize_current_user_id(current_user),
            role=canonical_role,
            invite_expires_at=invite_expires_at,
            delegated_by_grant_uuid=delegated_by_grant_uuid,
            gc_notify_notification_id=gc_notify_notification_id,
        )
