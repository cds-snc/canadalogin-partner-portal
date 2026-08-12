import hashlib
import json
import secrets
import uuid as uuid_pkg
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any, cast

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.authorization import (
    PARTNER_ROLE_CODES,
    CanonicalResourceScopeDecisionPoint,
    CanonicalRoleCode,
    Capability,
    InvitationStatus,
    LifecycleStatus,
    PartnerRoleCode,
    ResourceScopeDecisionReason,
    ResourceScopeRequest,
    RevocationActorSource,
)
from ..core.config import settings
from ..core.exceptions.http_exceptions import BadRequestException, DuplicateValueException, ForbiddenException, NotFoundException
from ..models.audit_log import AuditLog
from ..repositories.crud_rp_application_access_grants import crud_rp_application_access_grants
from ..repositories.crud_rp_application_developer_invitations import crud_rp_application_developer_invitations
from ..repositories.crud_rp_applications import crud_rp_applications
from ..repositories.crud_users import crud_users
from ..repositories.crud_workspaces import crud_workspaces
from ..schemas.authorization_audit import (
    AuthorizationActorType,
    AuthorizationAuditActor,
    AuthorizationAuditResult,
    InvitationTransitionAction,
    InvitationTransitionAuditEvent,
)
from ..schemas.rp_application import RPApplicationRead
from ..schemas.rp_application_access_grant import (
    RPApplicationAccessGrantCreateInternal,
    RPApplicationAccessGrantReadInternal,
)
from ..schemas.rp_application_developer_invitation import (
    RPApplicationDeveloperInvitationCreateInternal,
    RPApplicationDeveloperInvitationReadInternal,
)
from ..schemas.user import UserReadInternal
from ..schemas.workspace import WorkspaceRead
from .authorization_lock_service import (
    lock_workspace_identity_lifecycle,
    lock_workspace_identity_then_target_user,
)
from .authorization_service import (
    AUTHORIZATION_STATE_KEY,
    AuthorizationService,
    get_resolved_authorization_state,
)

PENDING_INVITATION_STATUS = LifecycleStatus.PENDING.value
ACCEPTED_INVITATION_STATUS = LifecycleStatus.ACCEPTED.value
EXPIRED_INVITATION_STATUS = LifecycleStatus.EXPIRED.value
REVOKED_INVITATION_STATUS = LifecycleStatus.REVOKED.value

RP_ADMIN_ROLE = CanonicalRoleCode.RP_ADMIN.value
RP_USER_EDIT_ROLE = CanonicalRoleCode.RP_USER_EDIT.value
READ_ONLY_ROLE = CanonicalRoleCode.READ_ONLY.value

DELEGATED_INVITATION_ROLES = frozenset({CanonicalRoleCode.RP_USER_EDIT, CanonicalRoleCode.READ_ONLY})
VALID_INVITATION_STATUSES = frozenset(
    {
        LifecycleStatus.PENDING,
        LifecycleStatus.ACCEPTED,
        LifecycleStatus.EXPIRED,
        LifecycleStatus.REVOKED,
    }
)


class RPApplicationDeveloperInvitationService:
    def _as_dict(self, value: Any) -> dict[str, Any]:
        if isinstance(value, dict):
            return value
        if hasattr(value, "model_dump"):
            dumped_value = value.model_dump(by_alias=False, exclude_none=True)
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
        for key in ("email", "mail"):
            value = current_user.get(key)
            if value is None:
                continue

            normalized = str(value).strip().lower()
            if normalized:
                return normalized

        return None

    def _normalize_current_user_uuid(
        self,
        current_user: Mapping[str, Any],
    ) -> uuid_pkg.UUID | None:
        raw_user_uuid = current_user.get("uuid")
        if isinstance(raw_user_uuid, uuid_pkg.UUID):
            return raw_user_uuid
        if raw_user_uuid is None:
            return None
        try:
            return uuid_pkg.UUID(str(raw_user_uuid))
        except (TypeError, ValueError, AttributeError):
            return None

    def _require_current_user_actor(
        self,
        current_user: Mapping[str, Any],
    ) -> tuple[int, uuid_pkg.UUID]:
        user_id = self._normalize_current_user_id(current_user)
        user_uuid = self._normalize_current_user_uuid(current_user)
        if user_id is None or user_uuid is None:
            raise ForbiddenException("Authenticated user is missing a local audit identity")
        return user_id, user_uuid

    def _normalize_email(self, invited_email: str) -> str:
        normalized_email = str(invited_email).strip().lower()
        if not normalized_email:
            raise BadRequestException("Invited email is required")
        return normalized_email

    def _canonicalize_invitation_role(self, role: Any) -> PartnerRoleCode:
        raw_role = str(role or "").strip()
        if not raw_role:
            raise BadRequestException("Invitation role is required")

        try:
            canonical_role = CanonicalRoleCode(raw_role)
        except ValueError as exc:
            raise BadRequestException("Unsupported invitation role") from exc
        if canonical_role not in PARTNER_ROLE_CODES:
            raise BadRequestException("Unsupported invitation role")
        return cast(PartnerRoleCode, canonical_role)

    def _validate_invitation_status(self, status: Any) -> InvitationStatus:
        raw_status = str(status or "").strip()
        try:
            lifecycle_status = LifecycleStatus(raw_status)
        except ValueError as exc:
            raise BadRequestException("Unsupported invitation status") from exc
        if lifecycle_status not in VALID_INVITATION_STATUSES:
            raise BadRequestException("Unsupported invitation status")
        return cast(InvitationStatus, lifecycle_status)

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

    def _preauthorize_workspace_management_scope(
        self,
        current_user: Mapping[str, Any],
        workspace_uuid: uuid_pkg.UUID | str,
    ) -> uuid_pkg.UUID:
        """Authorize a public workspace scope before protected lookups.

        Scope mismatches deliberately use the same non-confirming response as
        an absent workspace. Role delegation is checked separately after the
        protected workspace and application context is resolved.
        """

        try:
            normalized_workspace_uuid = uuid_pkg.UUID(str(workspace_uuid))
        except (TypeError, ValueError, AttributeError) as exc:
            raise NotFoundException("Workspace not found") from exc

        authorization_state = get_resolved_authorization_state(current_user)
        if authorization_state is None:
            raise ForbiddenException("Canonical authorization state is required to manage developer invitations")
        decision = CanonicalResourceScopeDecisionPoint().decide(
            ResourceScopeRequest(
                role_scopes=authorization_state.role_scopes,
                capability=Capability.PARTNER_STAFF_ASSIGNMENT,
                resource_workspace_uuid=normalized_workspace_uuid,
            )
        )
        if decision.allowed:
            return normalized_workspace_uuid
        if decision.reason in {
            ResourceScopeDecisionReason.NO_ACTIVE_ASSIGNMENT,
            ResourceScopeDecisionReason.CONFLICTING_ASSIGNMENTS,
            ResourceScopeDecisionReason.WORKSPACE_SCOPE_REQUIRED,
            ResourceScopeDecisionReason.WORKSPACE_SCOPE_MISMATCH,
        }:
            raise NotFoundException("Workspace not found")
        raise ForbiddenException("Only CL Admin or same-workspace RP Admin can manage developer invitations")

    async def _get_workspace_application_context(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID,
        rp_application_uuid: uuid_pkg.UUID | str,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        workspace_data = await self._get_workspace_context(
            db=db,
            workspace_uuid=workspace_uuid,
        )

        rp_application = await crud_rp_applications.get(
            db=db,
            uuid=rp_application_uuid,
            is_deleted=False,
            schema_to_select=RPApplicationRead,
        )
        if rp_application is None:
            raise NotFoundException("RP application not found")

        rp_application_data = self._as_dict(rp_application)
        if rp_application_data.get("workspace_id") != workspace_data.get("id"):
            raise NotFoundException("RP application not found")

        return workspace_data, rp_application_data

    async def _get_workspace_context(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID,
    ) -> dict[str, Any]:
        workspace = await crud_workspaces.get(
            db=db,
            uuid=workspace_uuid,
            is_deleted=False,
            schema_to_select=WorkspaceRead,
        )
        if workspace is None:
            raise NotFoundException("Workspace not found")
        workspace_data = self._as_dict(workspace)
        if not isinstance(workspace_data.get("id"), int) or not isinstance(
            workspace_data.get("uuid"),
            uuid_pkg.UUID,
        ):
            raise NotFoundException("Workspace not found")
        return workspace_data

    async def _get_invitation_context(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID,
        rp_application_uuid: uuid_pkg.UUID | str | None,
    ) -> tuple[dict[str, Any], dict[str, Any] | None]:
        if rp_application_uuid is None:
            return (
                await self._get_workspace_context(
                    db=db,
                    workspace_uuid=workspace_uuid,
                ),
                None,
            )
        return await self._get_workspace_application_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
        )

    async def _get_active_workspace_grant(
        self,
        db: AsyncSession,
        user_id: int,
        workspace_id: int,
    ) -> dict[str, Any] | None:
        return await crud_rp_application_access_grants.get(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            status=LifecycleStatus.ACTIVE.value,
            is_deleted=False,
            schema_to_select=RPApplicationAccessGrantReadInternal,
        )

    async def _ensure_management_access(
        self,
        db: AsyncSession,
        current_user: Mapping[str, Any],
        workspace_id: int,
        workspace_uuid: uuid_pkg.UUID,
    ) -> dict[str, Any] | None:
        authorization_state = get_resolved_authorization_state(current_user)
        if authorization_state is None:
            raise ForbiddenException("Canonical authorization state is required to manage developer invitations")
        if authorization_state.is_cl_admin:
            return None

        resolved_access = authorization_state.partner_access_by_workspace_id().get(workspace_id)
        if resolved_access is None or resolved_access.workspace_uuid != workspace_uuid or resolved_access.role is not CanonicalRoleCode.RP_ADMIN:
            raise ForbiddenException("Only RP Admin can manage developer invitations for this partner context")

        user_id = self._normalize_current_user_id(current_user)
        if user_id is None:
            raise ForbiddenException("Authenticated user is missing a local user identifier")

        # The canonical request state grants authority. The persistence lookup is
        # only used to retain the restricted delegation-provenance foreign key.
        access_grant = await crud_rp_application_access_grants.get(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            role=CanonicalRoleCode.RP_ADMIN.value,
            status=LifecycleStatus.ACTIVE.value,
            is_deleted=False,
            schema_to_select=RPApplicationAccessGrantReadInternal,
        )
        access_grant_data = self._as_dict(access_grant)
        if not isinstance(access_grant_data.get("uuid"), uuid_pkg.UUID):
            raise ForbiddenException("Delegated invitation management requires an active canonical RP Admin grant")
        return access_grant_data

    async def _ensure_assignment_allowed(
        self,
        db: AsyncSession,
        current_user: Mapping[str, Any],
        workspace_id: int,
        workspace_uuid: uuid_pkg.UUID,
        role: Any,
    ) -> tuple[PartnerRoleCode, uuid_pkg.UUID | None]:
        canonical_role = self._canonicalize_invitation_role(role)

        authorization_state = get_resolved_authorization_state(current_user)
        if authorization_state is None:
            raise ForbiddenException("Canonical authorization state is required to manage developer invitations")
        if authorization_state.is_cl_admin:
            return canonical_role, None

        access_grant = await self._ensure_management_access(
            db=db,
            current_user=current_user,
            workspace_id=workspace_id,
            workspace_uuid=workspace_uuid,
        )
        if access_grant is None:
            raise ForbiddenException("Delegated invitation management requires an active RP Admin grant")
        if canonical_role not in DELEGATED_INVITATION_ROLES:
            raise ForbiddenException("Only CL Admin can assign the RP Admin role")

        delegated_by_grant_uuid = access_grant.get("uuid")
        if not isinstance(delegated_by_grant_uuid, uuid_pkg.UUID):
            raise ForbiddenException("Delegated invitation management requires an active RP Admin grant")

        return canonical_role, delegated_by_grant_uuid

    def _require_manageable_invitation_role(
        self,
        current_user: Mapping[str, Any],
        invitation: Mapping[str, Any],
    ) -> PartnerRoleCode:
        """Return a visible role or hide a non-delegable invitation."""

        authorization_state = get_resolved_authorization_state(current_user)
        if authorization_state is None:
            raise ForbiddenException("Canonical authorization state is required to manage developer invitations")
        role = self._canonicalize_invitation_role(invitation.get("role"))
        if not authorization_state.is_cl_admin and role not in DELEGATED_INVITATION_ROLES:
            raise NotFoundException("Developer invitation not found")
        return role

    async def _validate_invitation_scope(
        self,
        db: AsyncSession,
        invitation: Mapping[str, Any],
    ) -> tuple[int, int | None, uuid_pkg.UUID]:
        workspace_id = invitation.get("workspace_id")
        rp_application_id = invitation.get("rp_application_id")
        if not isinstance(workspace_id, int):
            raise NotFoundException("Developer invitation is unavailable")

        workspace = await crud_workspaces.get(
            db=db,
            id=workspace_id,
            is_deleted=False,
            schema_to_select=WorkspaceRead,
        )
        if workspace is None:
            raise NotFoundException("Developer invitation is unavailable")
        workspace_uuid = self._as_dict(workspace).get("uuid")
        if not isinstance(workspace_uuid, uuid_pkg.UUID):
            raise NotFoundException("Developer invitation is unavailable")
        if rp_application_id is not None:
            if not isinstance(rp_application_id, int):
                raise NotFoundException("Developer invitation is unavailable")
            rp_application = await crud_rp_applications.get(
                db=db,
                id=rp_application_id,
                workspace_id=workspace_id,
                is_deleted=False,
                schema_to_select=RPApplicationRead,
            )
            if rp_application is None:
                raise NotFoundException("Developer invitation is unavailable")
        return workspace_id, rp_application_id, workspace_uuid

    async def _get_invitation_workspace_uuid(
        self,
        db: AsyncSession,
        invitation: Mapping[str, Any],
    ) -> uuid_pkg.UUID:
        workspace_id = invitation.get("workspace_id")
        if not isinstance(workspace_id, int):
            raise NotFoundException("Developer invitation is unavailable")
        workspace = await crud_workspaces.get(
            db=db,
            id=workspace_id,
            is_deleted=False,
            schema_to_select=WorkspaceRead,
        )
        workspace_uuid = self._as_dict(workspace).get("uuid")
        if not isinstance(workspace_uuid, uuid_pkg.UUID):
            raise NotFoundException("Developer invitation is unavailable")
        return workspace_uuid

    def _record_invitation_transition_audit(
        self,
        db: AsyncSession,
        *,
        action: InvitationTransitionAction,
        actor_user_uuid: uuid_pkg.UUID | None,
        invitation_uuid: uuid_pkg.UUID,
        workspace_uuid: uuid_pkg.UUID,
        role: PartnerRoleCode,
        previous_status: InvitationStatus | None,
        new_status: InvitationStatus,
        timestamp: datetime,
        target_user_uuid: uuid_pkg.UUID | None = None,
        replacement_invitation_uuid: uuid_pkg.UUID | None = None,
        prior_invitation_uuid: uuid_pkg.UUID | None = None,
        reason_code: str | None = None,
    ) -> None:
        event = InvitationTransitionAuditEvent(
            timestamp=timestamp,
            actor=AuthorizationAuditActor(
                type=(AuthorizationActorType.USER if actor_user_uuid is not None else AuthorizationActorType.SYSTEM),
                user_uuid=actor_user_uuid,
            ),
            result=AuthorizationAuditResult.SUCCEEDED,
            action=action,
            invitation_uuid=invitation_uuid,
            workspace_uuid=workspace_uuid,
            target_user_uuid=target_user_uuid,
            role=role,
            previous_status=previous_status,
            new_status=new_status,
            replacement_invitation_uuid=replacement_invitation_uuid,
            prior_invitation_uuid=prior_invitation_uuid,
            reason_code=reason_code,
        )
        db.add(
            AuditLog(
                user=("authorization_actor" if actor_user_uuid is not None else "authorization_system"),
                user_uuid=actor_user_uuid,
                target="developer_invitation",
                target_uuid=invitation_uuid,
                operation=f"invite_{action.value}",
                description=json.dumps(
                    event.model_dump(mode="json"),
                    separators=(",", ":"),
                ),
                created_at=timestamp,
            )
        )

    async def _find_target_user_by_email(
        self,
        db: AsyncSession,
        *,
        invited_email: str,
    ) -> dict[str, Any] | None:
        target_user = await crud_users.get(
            db=db,
            email=invited_email,
            schema_to_select=UserReadInternal,
        )
        target_user_data = self._as_dict(target_user)
        return target_user_data or None

    def _target_user_id(
        self,
        target_user: Mapping[str, Any] | None,
    ) -> int | None:
        target_user_id = None if target_user is None else target_user.get("id")
        if not isinstance(target_user_id, int):
            return None
        return target_user_id

    def _require_new_invitation_identity(
        self,
        target_user: Mapping[str, Any] | None,
    ) -> None:
        if target_user is None:
            return
        if target_user.get("is_deleted") is True or target_user.get("enabled") is not True:
            raise BadRequestException("The invited identity is not eligible for invitation")
        raise DuplicateValueException("A portal identity already exists for this email; use role assignment")

    async def _ensure_target_has_no_active_workspace_grant(
        self,
        db: AsyncSession,
        *,
        target_user_id: int | None,
        workspace_id: int,
    ) -> None:
        if target_user_id is None:
            return

        active_grant = await self._get_active_workspace_grant(
            db=db,
            user_id=target_user_id,
            workspace_id=workspace_id,
        )
        if active_grant is not None:
            raise DuplicateValueException("The invited identity already has an active role in this partner context; use role replacement")

    async def _mark_invitation_expired_if_needed(
        self,
        db: AsyncSession,
        invitation: dict[str, Any],
        *,
        commit: bool = True,
    ) -> dict[str, Any]:
        status = self._validate_invitation_status(invitation.get("status"))
        if status is not LifecycleStatus.PENDING:
            return invitation

        invite_expires_at = invitation.get("invite_expires_at")
        if not isinstance(invite_expires_at, datetime):
            raise BadRequestException("Developer invitation has an invalid expiry")

        normalized_expiry = invite_expires_at.replace(tzinfo=UTC) if invite_expires_at.tzinfo is None else invite_expires_at.astimezone(UTC)
        if normalized_expiry > datetime.now(UTC):
            return invitation

        updated_at = datetime.now(UTC)
        await crud_rp_application_developer_invitations.update(
            db=db,
            object={
                "status": EXPIRED_INVITATION_STATUS,
                "updated_at": updated_at,
            },
            commit=False,
            uuid=invitation["uuid"],
            is_deleted=False,
        )
        invitation["status"] = EXPIRED_INVITATION_STATUS
        invitation["updated_at"] = updated_at
        invitation_uuid = invitation.get("uuid")
        if not isinstance(invitation_uuid, uuid_pkg.UUID):
            raise NotFoundException("Developer invitation is unavailable")
        workspace_uuid = await self._get_invitation_workspace_uuid(
            db=db,
            invitation=invitation,
        )
        self._record_invitation_transition_audit(
            db,
            action=InvitationTransitionAction.EXPIRE,
            actor_user_uuid=None,
            invitation_uuid=invitation_uuid,
            workspace_uuid=workspace_uuid,
            role=self._canonicalize_invitation_role(invitation.get("role")),
            previous_status=LifecycleStatus.PENDING,
            new_status=LifecycleStatus.EXPIRED,
            timestamp=updated_at,
            reason_code="invite_expired",
        )
        if commit:
            await db.commit()
        return invitation

    async def _list_context_invitations(
        self,
        db: AsyncSession,
        workspace_id: int,
        rp_application_id: int | None = None,
        *,
        invited_email: str | None = None,
        commit_expirations: bool = True,
    ) -> list[dict[str, Any]]:
        filters: dict[str, Any] = {
            "workspace_id": workspace_id,
            "is_deleted": False,
            "schema_to_select": RPApplicationDeveloperInvitationReadInternal,
        }
        if rp_application_id is not None:
            filters["rp_application_id"] = rp_application_id
        if invited_email is not None:
            filters["invited_email__ilike"] = invited_email

        invitations_data = await crud_rp_application_developer_invitations.get_multi(
            db=db,
            **filters,
        )
        invitations = invitations_data.get("data", []) if isinstance(invitations_data, dict) else invitations_data

        normalized_invitations: list[dict[str, Any]] = []
        for invitation in invitations:
            invitation_data = self._as_dict(invitation)
            normalized_invitations.append(
                await self._mark_invitation_expired_if_needed(
                    db=db,
                    invitation=invitation_data,
                    commit=commit_expirations,
                )
            )

        return normalized_invitations

    async def _get_replay_access_grant(
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

        authorization_state = get_resolved_authorization_state(current_user)
        if authorization_state is None:
            raise ForbiddenException("Canonical authorization state is required to replay an invitation")
        if authorization_state.is_cl_admin:
            raise DuplicateValueException("Accepted invitation no longer matches the active grant lineage")
        if authorization_state.partner_access_by_workspace_id().get(workspace_id) is None:
            raise DuplicateValueException("Accepted invitation no longer matches the active grant lineage")

        existing_grant = await crud_rp_application_access_grants.get(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            status=LifecycleStatus.ACTIVE.value,
            is_deleted=False,
            schema_to_select=RPApplicationAccessGrantReadInternal,
        )
        grant_data = self._as_dict(existing_grant)
        if grant_data.get("source_invitation_uuid") != invitation_uuid:
            raise DuplicateValueException("Accepted invitation no longer matches the active grant lineage")

        return grant_data

    async def _create_access_grant_for_invitation(
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
            raise NotFoundException("Developer invitation is unavailable")

        authorization_state = get_resolved_authorization_state(current_user)
        if authorization_state is None:
            raise ForbiddenException("Canonical authorization state is required to accept an invitation")
        if authorization_state.is_cl_admin:
            raise DuplicateValueException("The signed-in identity already has an active canonical role")
        if authorization_state.partner_access_by_workspace_id().get(workspace_id) is not None:
            raise DuplicateValueException("The signed-in identity already has an active role in this partner context; use role replacement")

        existing_grant = await self._get_active_workspace_grant(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
        )
        if existing_grant is not None:
            raise DuplicateValueException("The signed-in identity already has an active role in this partner context; use role replacement")

        role = self._canonicalize_invitation_role(invitation.get("role"))
        created_grant = await crud_rp_application_access_grants.create(
            db=db,
            object=RPApplicationAccessGrantCreateInternal(
                workspace_id=workspace_id,
                user_id=user_id,
                role=role.value,
                status=LifecycleStatus.ACTIVE.value,
                source_invitation_uuid=invitation_uuid,
            ),
            commit=False,
            schema_to_select=RPApplicationAccessGrantReadInternal,
        )
        if created_grant is None:
            raise NotFoundException("Failed to create RP application access grant")

        return self._as_dict(created_grant)

    async def _create_invitation_record(
        self,
        db: AsyncSession,
        *,
        workspace_id: int,
        rp_application_id: int | None,
        invited_email: str,
        invited_by: int | None,
        role: str,
        invite_expires_at: datetime,
        delegated_by_grant_uuid: uuid_pkg.UUID | None,
        gc_notify_notification_id: str | None = None,
        commit: bool = True,
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
                role=self._canonicalize_invitation_role(role).value,
                status=PENDING_INVITATION_STATUS,
                revoked_by_user_id=None,
                revocation_actor_source=None,
                gc_notify_notification_id=gc_notify_notification_id,
                delegated_by_grant_uuid=delegated_by_grant_uuid,
                revocation_reason=None,
                replaced_by_invitation_uuid=None,
            ),
            commit=commit,
            schema_to_select=RPApplicationDeveloperInvitationReadInternal,
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
        rp_application_uuid: uuid_pkg.UUID | str | None,
        current_user: Mapping[str, Any],
    ) -> list[dict[str, Any]]:
        normalized_workspace_uuid = self._preauthorize_workspace_management_scope(
            current_user,
            workspace_uuid,
        )
        workspace_data, rp_application_data = await self._get_invitation_context(
            db=db,
            workspace_uuid=normalized_workspace_uuid,
            rp_application_uuid=rp_application_uuid,
        )
        await self._ensure_management_access(
            db=db,
            current_user=current_user,
            workspace_id=workspace_data["id"],
            workspace_uuid=workspace_data["uuid"],
        )

        invitations = await self._list_context_invitations(
            db=db,
            workspace_id=workspace_data["id"],
            rp_application_id=(rp_application_data["id"] if rp_application_data is not None else None),
        )
        authorization_state = get_resolved_authorization_state(current_user)
        if authorization_state is None:
            raise ForbiddenException("Canonical authorization state is required to manage developer invitations")
        if not authorization_state.is_cl_admin:
            invitations = [
                invitation for invitation in invitations if self._canonicalize_invitation_role(invitation.get("role")) in DELEGATED_INVITATION_ROLES
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
        rp_application_uuid: uuid_pkg.UUID | str | None,
        current_user: Mapping[str, Any],
        *,
        invited_email: str,
        role: str,
        invite_expires_at: datetime,
    ) -> dict[str, Any]:
        normalized_workspace_uuid = self._preauthorize_workspace_management_scope(
            current_user,
            workspace_uuid,
        )
        workspace_data, rp_application_data = await self._get_invitation_context(
            db=db,
            workspace_uuid=normalized_workspace_uuid,
            rp_application_uuid=rp_application_uuid,
        )
        canonical_role, delegated_by_grant_uuid = await self._ensure_assignment_allowed(
            db=db,
            current_user=current_user,
            workspace_id=workspace_data["id"],
            workspace_uuid=workspace_data["uuid"],
            role=role,
        )
        actor_user_id, actor_user_uuid = self._require_current_user_actor(current_user)

        normalized_email = self._normalize_email(invited_email)
        target_user = await self._find_target_user_by_email(
            db,
            invited_email=normalized_email,
        )
        target_user_id = self._target_user_id(target_user)
        await lock_workspace_identity_then_target_user(
            db=db,
            workspace_id=workspace_data["id"],
            email=normalized_email,
            target_user_id=target_user_id,
        )
        try:
            existing_invitations = await self._list_context_invitations(
                db=db,
                workspace_id=workspace_data["id"],
                invited_email=normalized_email,
                commit_expirations=False,
            )
            if any(self._validate_invitation_status(invitation.get("status")) is LifecycleStatus.PENDING for invitation in existing_invitations):
                raise DuplicateValueException("An active invitation already exists for this email and partner context")

            await self._ensure_target_has_no_active_workspace_grant(
                db=db,
                target_user_id=target_user_id,
                workspace_id=workspace_data["id"],
            )
            self._require_new_invitation_identity(target_user)
            created_invitation = await self._create_invitation_record(
                db=db,
                workspace_id=workspace_data["id"],
                rp_application_id=(rp_application_data["id"] if rp_application_data is not None else None),
                invited_email=normalized_email,
                invited_by=actor_user_id,
                role=canonical_role,
                invite_expires_at=invite_expires_at,
                delegated_by_grant_uuid=delegated_by_grant_uuid,
                commit=False,
            )
            created_at = created_invitation.get("created_at")
            if not isinstance(created_at, datetime):
                created_at = datetime.now(UTC)
            self._record_invitation_transition_audit(
                db,
                action=InvitationTransitionAction.CREATE,
                actor_user_uuid=actor_user_uuid,
                invitation_uuid=created_invitation["uuid"],
                workspace_uuid=workspace_data["uuid"],
                role=canonical_role,
                previous_status=None,
                new_status=LifecycleStatus.PENDING,
                timestamp=created_at,
            )
            await db.commit()
            return created_invitation
        except IntegrityError as exc:
            await db.rollback()
            raise DuplicateValueException("An active invitation or role already exists for this partner context") from exc
        except Exception:
            await db.rollback()
            raise

    async def has_pending_invitation_for_email(
        self,
        db: AsyncSession,
        invited_email: str,
    ) -> bool:
        normalized_email = self._normalize_email(invited_email)
        invitations_data = await crud_rp_application_developer_invitations.get_multi(
            db=db,
            invited_email__ilike=normalized_email,
            is_deleted=False,
            schema_to_select=RPApplicationDeveloperInvitationReadInternal,
        )
        invitations = invitations_data.get("data", []) if isinstance(invitations_data, dict) else invitations_data

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
            schema_to_select=RPApplicationDeveloperInvitationReadInternal,
        )
        if invitation is None:
            raise NotFoundException("Developer invitation not found")

        initial_invitation_data = self._as_dict(invitation)
        workspace_id = initial_invitation_data.get("workspace_id")
        if not isinstance(workspace_id, int):
            raise NotFoundException("Developer invitation is unavailable")
        invited_email = self._normalize_email(str(initial_invitation_data.get("invited_email", "")))
        target_user_id, target_user_uuid = self._require_current_user_actor(current_user)
        await lock_workspace_identity_then_target_user(
            db=db,
            workspace_id=workspace_id,
            email=invited_email,
            target_user_id=target_user_id,
        )
        try:
            # Re-read after the lifecycle lock so concurrent acceptance/reissue
            # cannot reuse a stale status or token outcome.
            locked_invitation = await crud_rp_application_developer_invitations.get(
                db=db,
                token_hash=self._hash_token(normalized_token),
                is_deleted=False,
                schema_to_select=RPApplicationDeveloperInvitationReadInternal,
            )
            if locked_invitation is None:
                raise NotFoundException("Developer invitation not found")

            invitation_data = await self._mark_invitation_expired_if_needed(
                db=db,
                invitation=self._as_dict(locked_invitation),
                commit=False,
            )
            status = self._validate_invitation_status(invitation_data.get("status"))
            canonical_role = self._canonicalize_invitation_role(invitation_data.get("role"))
            invited_email = self._normalize_email(str(invitation_data.get("invited_email", "")))

            if status is LifecycleStatus.REVOKED:
                raise BadRequestException("Developer invitation is revoked")
            if status is LifecycleStatus.EXPIRED:
                await db.commit()
                raise BadRequestException("Developer invitation is expired")

            current_user_email = self._extract_current_user_email(current_user)
            if current_user_email != invited_email:
                raise ForbiddenException("Signed-in email does not match this invitation")
            _, _, workspace_uuid = await self._validate_invitation_scope(
                db=db,
                invitation=invitation_data,
            )

            if status is LifecycleStatus.ACCEPTED:
                access_grant = await self._get_replay_access_grant(
                    db=db,
                    invitation=invitation_data,
                    current_user=current_user,
                )
                await db.commit()
                return {
                    "invitation": invitation_data,
                    "access_grant": access_grant,
                    "next_destination": f"/workspaces/{workspace_uuid}",
                }

            # Request authorization was resolved before the transaction lock.
            # Re-resolve the target from persistence while holding the shared
            # lock so an explicit assignment that just committed cannot be
            # hidden by stale request state.
            authoritative_current_user = dict(current_user)
            authoritative_current_user[AUTHORIZATION_STATE_KEY] = await AuthorizationService().resolve_for_user(
                db,
                user_id=target_user_id,
            )
            access_grant = await self._create_access_grant_for_invitation(
                db=db,
                invitation=invitation_data,
                current_user=authoritative_current_user,
            )
            accepted_at = datetime.now(UTC)
            await crud_rp_application_developer_invitations.update(
                db=db,
                object={
                    "status": ACCEPTED_INVITATION_STATUS,
                    "accepted_at": accepted_at,
                    "updated_at": accepted_at,
                },
                commit=False,
                uuid=invitation_data["uuid"],
                status=PENDING_INVITATION_STATUS,
                is_deleted=False,
            )
            invitation_data["status"] = ACCEPTED_INVITATION_STATUS
            invitation_data["accepted_at"] = accepted_at
            invitation_data["updated_at"] = accepted_at
            self._record_invitation_transition_audit(
                db,
                action=InvitationTransitionAction.ACCEPT,
                actor_user_uuid=target_user_uuid,
                invitation_uuid=invitation_data["uuid"],
                workspace_uuid=workspace_uuid,
                target_user_uuid=target_user_uuid,
                role=canonical_role,
                previous_status=LifecycleStatus.PENDING,
                new_status=LifecycleStatus.ACCEPTED,
                timestamp=accepted_at,
            )
            await db.commit()
            return {
                "invitation": invitation_data,
                "access_grant": access_grant,
                "next_destination": f"/workspaces/{workspace_uuid}",
            }
        except IntegrityError as exc:
            await db.rollback()
            raise DuplicateValueException("Invitation acceptance conflicts with an existing partner role or lineage") from exc
        except Exception:
            await db.rollback()
            raise

    async def revoke_developer_invitation(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str | None,
        invitation_uuid: uuid_pkg.UUID | str,
        current_user: Mapping[str, Any],
    ) -> dict[str, Any]:
        normalized_workspace_uuid = self._preauthorize_workspace_management_scope(
            current_user,
            workspace_uuid,
        )
        workspace_data, rp_application_data = await self._get_invitation_context(
            db=db,
            workspace_uuid=normalized_workspace_uuid,
            rp_application_uuid=rp_application_uuid,
        )
        await self._ensure_management_access(
            db=db,
            current_user=current_user,
            workspace_id=workspace_data["id"],
            workspace_uuid=workspace_data["uuid"],
        )
        actor_user_id, actor_user_uuid = self._require_current_user_actor(current_user)
        invitation_filters: dict[str, Any] = {
            "uuid": invitation_uuid,
            "workspace_id": workspace_data["id"],
            "is_deleted": False,
            "schema_to_select": RPApplicationDeveloperInvitationReadInternal,
        }
        if rp_application_data is not None:
            invitation_filters["rp_application_id"] = rp_application_data["id"]
        invitation = await crud_rp_application_developer_invitations.get(
            db=db,
            **invitation_filters,
        )
        if invitation is None:
            raise NotFoundException("Developer invitation not found")

        initial_invitation_data = self._as_dict(invitation)
        invited_email = self._normalize_email(initial_invitation_data.get("invited_email", ""))
        await lock_workspace_identity_lifecycle(
            db=db,
            workspace_id=workspace_data["id"],
            email=invited_email,
        )
        try:
            locked_invitation = await crud_rp_application_developer_invitations.get(
                db=db,
                **invitation_filters,
            )
            if locked_invitation is None:
                raise NotFoundException("Developer invitation not found")
            locked_invitation_data = self._as_dict(locked_invitation)
            role = self._require_manageable_invitation_role(
                current_user,
                locked_invitation_data,
            )
            invitation_data = await self._mark_invitation_expired_if_needed(
                db=db,
                invitation=locked_invitation_data,
                commit=False,
            )

            status = self._validate_invitation_status(invitation_data.get("status"))
            if status is LifecycleStatus.ACCEPTED:
                raise BadRequestException("Accepted invitations cannot be revoked")
            if status is LifecycleStatus.REVOKED:
                await db.commit()
                return invitation_data
            if status is LifecycleStatus.EXPIRED:
                await db.commit()
                return invitation_data

            revoked_at = datetime.now(UTC)
            await crud_rp_application_developer_invitations.update(
                db=db,
                object={
                    "status": REVOKED_INVITATION_STATUS,
                    "revoked_at": revoked_at,
                    "revoked_by_user_id": actor_user_id,
                    "revocation_actor_source": RevocationActorSource.USER.value,
                    "revocation_reason": "revoked_by_authorized_actor",
                    "updated_at": revoked_at,
                },
                commit=False,
                uuid=invitation_uuid,
                status=PENDING_INVITATION_STATUS,
                is_deleted=False,
            )
            invitation_data["status"] = REVOKED_INVITATION_STATUS
            invitation_data["revoked_at"] = revoked_at
            invitation_data["revoked_by_user_id"] = actor_user_id
            invitation_data["revocation_actor_source"] = RevocationActorSource.USER.value
            invitation_data["revocation_reason"] = "revoked_by_authorized_actor"
            invitation_data["updated_at"] = revoked_at
            self._record_invitation_transition_audit(
                db,
                action=InvitationTransitionAction.REVOKE,
                actor_user_uuid=actor_user_uuid,
                invitation_uuid=invitation_data["uuid"],
                workspace_uuid=workspace_data["uuid"],
                role=role,
                previous_status=LifecycleStatus.PENDING,
                new_status=LifecycleStatus.REVOKED,
                timestamp=revoked_at,
                reason_code="revoked_by_authorized_actor",
            )
            await db.commit()
            return invitation_data
        except Exception:
            await db.rollback()
            raise

    async def reissue_developer_invitation(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str | None,
        invitation_uuid: uuid_pkg.UUID | str,
        current_user: Mapping[str, Any],
        *,
        invite_expires_at: datetime,
    ) -> dict[str, Any]:
        normalized_workspace_uuid = self._preauthorize_workspace_management_scope(
            current_user,
            workspace_uuid,
        )
        workspace_data, rp_application_data = await self._get_invitation_context(
            db=db,
            workspace_uuid=normalized_workspace_uuid,
            rp_application_uuid=rp_application_uuid,
        )
        await self._ensure_management_access(
            db=db,
            current_user=current_user,
            workspace_id=workspace_data["id"],
            workspace_uuid=workspace_data["uuid"],
        )
        actor_user_id, actor_user_uuid = self._require_current_user_actor(current_user)
        invitation_filters: dict[str, Any] = {
            "uuid": invitation_uuid,
            "workspace_id": workspace_data["id"],
            "is_deleted": False,
            "schema_to_select": RPApplicationDeveloperInvitationReadInternal,
        }
        if rp_application_data is not None:
            invitation_filters["rp_application_id"] = rp_application_data["id"]
        invitation = await crud_rp_application_developer_invitations.get(
            db=db,
            **invitation_filters,
        )
        if invitation is None:
            raise NotFoundException("Developer invitation not found")

        initial_invitation_data = self._as_dict(invitation)
        normalized_email = self._normalize_email(initial_invitation_data["invited_email"])
        target_user = await self._find_target_user_by_email(
            db,
            invited_email=normalized_email,
        )
        target_user_id = self._target_user_id(target_user)
        await lock_workspace_identity_then_target_user(
            db=db,
            workspace_id=workspace_data["id"],
            email=normalized_email,
            target_user_id=target_user_id,
        )
        try:
            locked_invitation = await crud_rp_application_developer_invitations.get(
                db=db,
                **invitation_filters,
            )
            if locked_invitation is None:
                raise NotFoundException("Developer invitation not found")
            locked_invitation_data = self._as_dict(locked_invitation)
            self._require_manageable_invitation_role(
                current_user,
                locked_invitation_data,
            )
            invitation_data = await self._mark_invitation_expired_if_needed(
                db=db,
                invitation=locked_invitation_data,
                commit=False,
            )
            status = self._validate_invitation_status(invitation_data.get("status"))
            if status is LifecycleStatus.ACCEPTED:
                raise BadRequestException("Accepted invitations cannot be reissued")
            if invitation_data.get("replaced_by_invitation_uuid") is not None:
                raise DuplicateValueException("Developer invitation has already been reissued")

            canonical_role, delegated_by_grant_uuid = await self._ensure_assignment_allowed(
                db=db,
                current_user=current_user,
                workspace_id=workspace_data["id"],
                workspace_uuid=workspace_data["uuid"],
                role=invitation_data.get("role"),
            )
            existing_invitations = await self._list_context_invitations(
                db=db,
                workspace_id=workspace_data["id"],
                invited_email=normalized_email,
                commit_expirations=False,
            )
            if any(
                candidate.get("uuid") != invitation_data.get("uuid")
                and self._validate_invitation_status(candidate.get("status")) is LifecycleStatus.PENDING
                for candidate in existing_invitations
            ):
                raise DuplicateValueException("An active invitation already exists for this email and partner context")
            await self._ensure_target_has_no_active_workspace_grant(
                db=db,
                target_user_id=target_user_id,
                workspace_id=workspace_data["id"],
            )
            self._require_new_invitation_identity(target_user)

            if status is LifecycleStatus.PENDING:
                revoked_at = datetime.now(UTC)
                await crud_rp_application_developer_invitations.update(
                    db=db,
                    object={
                        "status": REVOKED_INVITATION_STATUS,
                        "revoked_at": revoked_at,
                        "revoked_by_user_id": actor_user_id,
                        "revocation_actor_source": RevocationActorSource.USER.value,
                        "revocation_reason": "reissued",
                        "updated_at": revoked_at,
                    },
                    commit=False,
                    uuid=invitation_uuid,
                    status=PENDING_INVITATION_STATUS,
                    is_deleted=False,
                )

            created_invitation = await self._create_invitation_record(
                db=db,
                workspace_id=workspace_data["id"],
                rp_application_id=invitation_data.get("rp_application_id"),
                invited_email=normalized_email,
                invited_by=actor_user_id,
                role=canonical_role,
                invite_expires_at=invite_expires_at,
                delegated_by_grant_uuid=delegated_by_grant_uuid,
                commit=False,
            )
            reissued_at = created_invitation.get("created_at")
            if not isinstance(reissued_at, datetime):
                reissued_at = datetime.now(UTC)
            self._record_invitation_transition_audit(
                db,
                action=InvitationTransitionAction.REISSUE,
                actor_user_uuid=actor_user_uuid,
                invitation_uuid=created_invitation["uuid"],
                workspace_uuid=workspace_data["uuid"],
                role=canonical_role,
                previous_status=None,
                new_status=LifecycleStatus.PENDING,
                timestamp=reissued_at,
                prior_invitation_uuid=invitation_data["uuid"],
                reason_code="reissued",
            )
            if status in {LifecycleStatus.PENDING, LifecycleStatus.REVOKED}:
                await crud_rp_application_developer_invitations.update(
                    db=db,
                    object={
                        "revocation_reason": "reissued",
                        "replaced_by_invitation_uuid": created_invitation["uuid"],
                        "updated_at": datetime.now(UTC),
                    },
                    commit=False,
                    uuid=invitation_uuid,
                    status=REVOKED_INVITATION_STATUS,
                    is_deleted=False,
                )
            if status is LifecycleStatus.PENDING:
                self._record_invitation_transition_audit(
                    db,
                    action=InvitationTransitionAction.REISSUE,
                    actor_user_uuid=actor_user_uuid,
                    invitation_uuid=invitation_data["uuid"],
                    workspace_uuid=workspace_data["uuid"],
                    role=canonical_role,
                    previous_status=LifecycleStatus.PENDING,
                    new_status=LifecycleStatus.REVOKED,
                    timestamp=revoked_at,
                    replacement_invitation_uuid=created_invitation["uuid"],
                    reason_code="reissued",
                )
            await db.commit()
            return created_invitation
        except IntegrityError as exc:
            await db.rollback()
            raise DuplicateValueException("An active invitation already exists for this email and partner context") from exc
        except Exception:
            await db.rollback()
            raise
