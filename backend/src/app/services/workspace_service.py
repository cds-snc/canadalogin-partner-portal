import logging
import secrets
import uuid as uuid_pkg
from datetime import UTC, datetime, timedelta
from datetime import date as date_cls
from hashlib import sha256
from typing import Any, cast
from urllib.parse import urlencode

from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.exceptions.http_exceptions import BadRequestException, ForbiddenException, NotFoundException
from ..core.utils.slugify import slugify
from ..repositories.crud_application_contacts import crud_application_contacts
from ..repositories.crud_application_infos import crud_application_infos
from ..repositories.crud_departments import crud_departments
from ..repositories.crud_rp_application_developer_invitations import (
    crud_rp_application_developer_invitations,
)
from ..repositories.crud_rp_applications import crud_rp_applications
from ..repositories.crud_users import crud_users
from ..repositories.crud_workspace_members import crud_workspace_members
from ..repositories.crud_workspaces import crud_workspaces
from ..repositories.dependencies import get_ibm_sv_admin_client
from ..schemas.application_info import (
    ApplicationContactCreate,
    ApplicationContactCreateInternal,
    ApplicationContactRead,
    ApplicationContactUpdate,
    ApplicationContactUpdateInternal,
    ApplicationInfoCreate,
    ApplicationInfoCreateInternal,
    ApplicationInfoRead,
    ApplicationInfoUpdate,
    ApplicationInfoUpdateInternal,
)
from ..schemas.workspace import (
    RPApplicationClientCredentialsRead,
    RPApplicationClientRotatedSecretCreateRequest,
    RPApplicationClientRotatedSecretRead,
    RPApplicationClientSecretRotateRequest,
    RPApplicationCreate,
    RPApplicationCreateInternal,
    RPApplicationDeveloperInvitationCreate,
    RPApplicationDeveloperInvitationCreateInternal,
    RPApplicationDeveloperInvitationRead,
    RPApplicationDeveloperInvitationUpdateInternal,
    RPApplicationRead,
    RPApplicationUpdate,
    RPApplicationUsageAuditEventRead,
    RPApplicationUsageAuditTrailRead,
    RPApplicationUsageSummaryRead,
    WorkspaceCreate,
    WorkspaceCreateInternal,
    WorkspaceMemberCreateInternal,
    WorkspaceMemberRead,
    WorkspaceRead,
    WorkspaceUpdate,
)
from ..services.gc_notify_service import GCNotifyService
from ..services.ibm_sv_admin_service import IBMVerifyAdminService

LOGGER = logging.getLogger(__name__)


class WorkspaceService:
    def __init__(
        self,
        ibm_sv_admin_service: IBMVerifyAdminService | None = None,
        gc_notify_service: GCNotifyService | None = None,
    ) -> None:
        self._ibm_sv_admin_service = ibm_sv_admin_service
        self._gc_notify_service = gc_notify_service

    async def _get_ibm_sv_admin_service(self) -> IBMVerifyAdminService:
        if self._ibm_sv_admin_service is not None:
            return self._ibm_sv_admin_service

        client = await get_ibm_sv_admin_client()
        self._ibm_sv_admin_service = IBMVerifyAdminService(client)
        return self._ibm_sv_admin_service

    async def _get_gc_notify_service(self) -> GCNotifyService:
        if self._gc_notify_service is not None:
            return self._gc_notify_service

        self._gc_notify_service = GCNotifyService()
        return self._gc_notify_service

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

    def _build_rp_application_invite_url(self, raw_token: str) -> str:
        return f"{settings.RP_APPLICATION_INVITE_URL_BASE.rstrip('/')}?{urlencode({'token': raw_token})}"

    def _get_rp_application_developer_invitation_status(
        self,
        invitation: dict[str, Any],
    ) -> str:
        if invitation.get("accepted_at") is not None:
            return "accepted"
        if invitation.get("revoked_at") is not None:
            return "revoked"

        invite_expires_at = invitation.get("invite_expires_at")
        if isinstance(invite_expires_at, datetime) and invite_expires_at <= datetime.now(UTC):
            return "expired"

        return "pending"

    def _serialize_rp_application_developer_invitation(
        self,
        invitation: dict[str, Any] | Any,
    ) -> dict[str, Any]:
        invitation_data = self._as_dict(invitation)
        if invitation_data is None:
            raise NotFoundException("RP application developer invitation not found")

        return {
            **invitation_data,
            "status": self._get_rp_application_developer_invitation_status(invitation_data),
        }

    async def _get_workspace_admin_rp_application(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        action: str,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_admin(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            action=action,
        )
        rp_application = self._as_dict(
            await crud_rp_applications.get(
                db=db,
                uuid=rp_application_uuid,
                workspace_id=workspace["id"],
                is_deleted=False,
            )
        )
        if rp_application is None:
            raise NotFoundException("RP application not found")

        return workspace, rp_application

    async def _create_rp_application_developer_invitation(
        self,
        db: AsyncSession,
        *,
        workspace_id: int,
        rp_application: dict[str, Any],
        normalized_email: str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        raw_token = secrets.token_urlsafe(32)
        notify_service = await self._get_gc_notify_service()
        notify_response = await notify_service.send_email(
            recipient_email=normalized_email,
            personalisation={
                "application_name": str(rp_application.get("name") or "RP Application"),
                "invite_url": self._build_rp_application_invite_url(raw_token),
                "invited_by_name": str(
                    current_user.get("name") or current_user.get("email") or "CanadaLogin"
                ),
            },
            reference=f"rp-app-invite:{rp_application.get('id')}:{normalized_email}",
        )

        created = await crud_rp_application_developer_invitations.create(
            db=db,
            object=RPApplicationDeveloperInvitationCreateInternal(
                workspace_id=workspace_id,
                rp_application_id=rp_application["id"],
                invited_email=normalized_email,
                invited_by=current_user.get("id"),
                role="developer",
                token_hash=self._hash_invitation_token(raw_token),
                invite_expires_at=datetime.now(UTC)
                + timedelta(days=settings.RP_APPLICATION_INVITATION_EXPIRE_DAYS),
                gc_notify_notification_id=(notify_response or {}).get("id"),
            ),
            schema_to_select=RPApplicationDeveloperInvitationRead,
        )
        if created is None:
            raise NotFoundException("Failed to create RP application developer invitation")

        return dict(created) if not isinstance(created, dict) else created

    async def _get_rp_application_developer_invitation_for_workspace_admin(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        invitation_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        action: str,
    ) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
        workspace, rp_application = await self._get_workspace_admin_rp_application(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            action=action,
        )
        invitation = self._as_dict(
            await crud_rp_application_developer_invitations.get(
                db=db,
                uuid=invitation_uuid,
                workspace_id=workspace["id"],
                rp_application_id=rp_application["id"],
                is_deleted=False,
            )
        )
        if invitation is None:
            raise NotFoundException("RP application developer invitation not found")

        return workspace, rp_application, invitation

    async def _get_visible_rp_application_from_invitation(
        self,
        db: AsyncSession,
        invitation: dict[str, Any],
    ) -> dict[str, Any] | None:
        rp_application_id = invitation.get("rp_application_id")
        workspace_id = invitation.get("workspace_id")
        if not isinstance(rp_application_id, int) or not isinstance(workspace_id, int):
            return None

        rp_application = self._as_dict(
            await crud_rp_applications.get(
                db=db,
                id=rp_application_id,
                workspace_id=workspace_id,
                is_deleted=False,
            )
        )
        if rp_application is None:
            return None

        workspace = self._as_dict(await crud_workspaces.get(db=db, id=workspace_id, is_deleted=False))
        if workspace is None:
            return None

        workspace_uuid = workspace.get("uuid")
        if not isinstance(workspace_uuid, uuid_pkg.UUID | str):
            return None

        enriched_application = await self._enrich_rp_application_with_ibm_settings(
            rp_application,
            workspace_uuid,
        )
        enriched_application["workspace_name"] = workspace.get("name")
        enriched_application["workspace_uuid"] = workspace_uuid
        return enriched_application

    async def _has_accepted_rp_application_invitation(
        self,
        db: AsyncSession,
        rp_application_id: int,
        current_user: dict[str, Any],
    ) -> bool:
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

    async def _get_current_user_rp_application_context(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        require_write: bool,
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        rp_application = self._as_dict(
            await crud_rp_applications.get(
                db=db,
                uuid=rp_application_uuid,
                is_deleted=False,
            )
        )
        if rp_application is None:
            raise NotFoundException("RP application not found")

        workspace_id = rp_application.get("workspace_id")
        if not isinstance(workspace_id, int):
            raise NotFoundException("Workspace not found")

        workspace = self._as_dict(await crud_workspaces.get(db=db, id=workspace_id, is_deleted=False))
        if workspace is None:
            raise NotFoundException("Workspace not found")

        membership = await self._get_workspace_membership(
            db=db,
            workspace_id=workspace_id,
            current_user=current_user,
        )
        if membership is not None:
            if not require_write or membership.get("role") == "workspace_admin":
                return rp_application, workspace

        rp_application_id = rp_application.get("id")
        if isinstance(rp_application_id, int) and await self._has_accepted_rp_application_invitation(
            db=db,
            rp_application_id=rp_application_id,
            current_user=current_user,
        ):
            return rp_application, workspace

        if require_write:
            raise ForbiddenException("Only workspace_admin or invited developers can update RP applications")
        raise ForbiddenException("Only workspace members or invited developers can view RP applications")

    async def _ensure_workspace_admin(
        self,
        db: AsyncSession,
        workspace_id: int,
        current_user: dict[str, Any],
        action: str,
    ) -> None:
        caller_membership = self._as_dict(
            await crud_workspace_members.get(
                db=db,
                workspace_id=workspace_id,
                user_id=current_user["id"],
                is_deleted=False,
            )
        )
        if caller_membership is None or caller_membership.get("role") != "workspace_admin":
            raise ForbiddenException(f"Only workspace_admin can {action}")

    async def _get_workspace_membership(
        self,
        db: AsyncSession,
        workspace_id: int,
        current_user: dict[str, Any],
    ) -> dict[str, Any] | None:
        return self._as_dict(
            await crud_workspace_members.get(
                db=db,
                workspace_id=workspace_id,
                user_id=current_user["id"],
                is_deleted=False,
            )
        )

    async def _ensure_workspace_member(
        self,
        db: AsyncSession,
        workspace_id: int,
        current_user: dict[str, Any],
        action: str,
    ) -> None:
        caller_membership = await self._get_workspace_membership(
            db=db,
            workspace_id=workspace_id,
            current_user=current_user,
        )
        if caller_membership is None:
            raise ForbiddenException(f"Only workspace members can {action}")

    async def _get_department_abbreviation(self, db: AsyncSession, department_id: int | None) -> str:
        if department_id is None:
            raise BadRequestException("Workspace department is required for RP applications")

        department = await crud_departments.get(db=db, id=department_id, is_deleted=False)
        abbreviation = None if department is None else str(department.get("abbreviation") or "").strip()
        if not abbreviation:
            raise BadRequestException("Workspace department abbreviation is required for RP applications")
        return abbreviation

    def _normalize_rp_application_name(self, name: str, abbreviation: str) -> str:
        base_name = str(name or "").strip()
        if not base_name:
            raise BadRequestException("RP application name is required")

        prefix = f"[{abbreviation}] - "
        if base_name.startswith(prefix):
            return base_name
        return f"{prefix}{base_name}"

    def _extract_ibm_application_id(self, payload: dict[str, Any]) -> str:
        for key in ("id", "applicationId", "appId"):
            raw_value = payload.get(key)
            if raw_value:
                return str(raw_value)

        links = payload.get("_links")
        if isinstance(links, dict):
            self_link = links.get("self")
            if isinstance(self_link, dict):
                href = str(self_link.get("href") or "").strip()
                if href:
                    href_parts = href.rstrip("/").split("/")
                    if href_parts:
                        application_id = href_parts[-1].strip()
                        if application_id:
                            return application_id

        raise BadRequestException("IBM Security Verify application response did not include an application ID")

    def _build_rp_application_owners(self, owners: list[str], current_user: dict[str, Any]) -> list[str]:
        normalized_owners = [str(owner).strip() for owner in owners if str(owner).strip()]
        creator_auth_subject = str(current_user.get("auth_subject") or "").strip()
        if creator_auth_subject and creator_auth_subject not in normalized_owners:
            normalized_owners.append(creator_auth_subject)
        return normalized_owners

    async def _get_application_info_by_uuid(
        self,
        db: AsyncSession,
        workspace_id: int,
        application_info_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        application_info = await crud_application_infos.get(
            db=db,
            uuid=application_info_uuid,
            workspace_id=workspace_id,
            is_deleted=False,
        )
        if application_info is None:
            raise NotFoundException("Application info not found")
        return application_info

    async def _get_rp_application_by_application_info_id(
        self,
        db: AsyncSession,
        application_info_id: int,
    ) -> dict[str, Any] | None:
        rp_application = await crud_rp_applications.get(
            db=db,
            application_info_id=application_info_id,
            is_deleted=False,
        )
        return self._as_dict(rp_application)

    async def _get_any_rp_application_by_application_info_id(
        self,
        db: AsyncSession,
        application_info_id: int,
    ) -> dict[str, Any] | None:
        rp_application = await crud_rp_applications.get(
            db=db,
            application_info_id=application_info_id,
        )
        return self._as_dict(rp_application)

    async def _get_application_contact_by_uuid(
        self,
        db: AsyncSession,
        application_info_id: int,
        application_contact_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        application_contact = await crud_application_contacts.get(
            db=db,
            uuid=application_contact_uuid,
            application_info_id=application_info_id,
            is_deleted=False,
        )
        if application_contact is None:
            raise NotFoundException("Application contact not found")
        return application_contact

    async def create_application_info(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        values: ApplicationInfoCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_admin(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            action="create application information records",
        )
        created = await crud_application_infos.create(
            db=db,
            object=ApplicationInfoCreateInternal(
                workspace_id=workspace["id"],
                created_by=current_user.get("id"),
                **values.model_dump(by_alias=False),
            ),
            schema_to_select=ApplicationInfoRead,
        )
        if created is None:
            raise NotFoundException("Failed to create application info")
        return dict(created) if not isinstance(created, dict) else created

    async def list_application_infos(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_member(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            action="view application information records",
        )
        result = await crud_application_infos.get_multi(
            db=db,
            workspace_id=workspace["id"],
            is_deleted=False,
            schema_to_select=ApplicationInfoRead,
        )
        application_infos = result.get("data", []) if isinstance(result, dict) else result

        enriched_application_infos: list[dict[str, Any]] = []
        for application_info in application_infos:
            application_info_data = self._as_dict(application_info)
            if application_info_data is None:
                continue
            linked_rp_application = await self._get_rp_application_by_application_info_id(
                db=db,
                application_info_id=application_info_data["id"],
            )
            enriched_application_infos.append(
                {
                    **application_info_data,
                    "rp_application_uuid": linked_rp_application.get("uuid") if linked_rp_application else None,
                }
            )

        return enriched_application_infos

    async def invite_rp_application_developer(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        values: RPApplicationDeveloperInvitationCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, rp_application = await self._get_workspace_admin_rp_application(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            action="invite RP application developers",
        )
        normalized_email = str(values.email).strip().lower()
        return await self._create_rp_application_developer_invitation(
            db=db,
            workspace_id=workspace["id"],
            rp_application=rp_application,
            normalized_email=normalized_email,
            current_user=current_user,
        )

    async def list_rp_application_developer_invitations(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        workspace, rp_application = await self._get_workspace_admin_rp_application(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            action="view RP application developer invitations",
        )
        result = await crud_rp_application_developer_invitations.get_multi(
            db=db,
            workspace_id=workspace["id"],
            rp_application_id=rp_application["id"],
            is_deleted=False,
        )
        invitation_rows = result.get("data", []) if isinstance(result, dict) else result
        invitations = [
            self._serialize_rp_application_developer_invitation(invitation)
            for invitation in invitation_rows
        ]

        return sorted(
            invitations,
            key=lambda invitation: cast(datetime | None, invitation.get("created_at")) or datetime.min,
            reverse=True,
        )

    async def revoke_rp_application_developer_invitation(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        invitation_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        _, _, invitation = await self._get_rp_application_developer_invitation_for_workspace_admin(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            invitation_uuid=invitation_uuid,
            current_user=current_user,
            action="revoke RP application developer invitations",
        )

        if invitation.get("accepted_at") is not None:
            raise BadRequestException("Accepted invitations cannot be revoked")

        if invitation.get("revoked_at") is not None:
            return self._serialize_rp_application_developer_invitation(invitation)

        revoked_at = datetime.now(UTC)
        updated = await crud_rp_application_developer_invitations.update(
            db=db,
            id=invitation["id"],
            object=RPApplicationDeveloperInvitationUpdateInternal(
                revoked_at=revoked_at,
                updated_at=revoked_at,
            ),
        )
        if updated is None:
            invitation["revoked_at"] = revoked_at
            invitation["updated_at"] = revoked_at
            return self._serialize_rp_application_developer_invitation(invitation)

        return self._serialize_rp_application_developer_invitation(updated)

    async def resend_rp_application_developer_invitation(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        invitation_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace, rp_application, invitation = (
            await self._get_rp_application_developer_invitation_for_workspace_admin(
                db=db,
                workspace_uuid=workspace_uuid,
                rp_application_uuid=rp_application_uuid,
                invitation_uuid=invitation_uuid,
                current_user=current_user,
                action="resend RP application developer invitations",
            )
        )

        if invitation.get("accepted_at") is not None:
            raise BadRequestException("Accepted invitations cannot be resent")

        invited_email = str(invitation.get("invited_email") or "").strip().lower()
        if not invited_email:
            raise BadRequestException("Invitation email is required")

        existing_result = await crud_rp_application_developer_invitations.get_multi(
            db=db,
            workspace_id=workspace["id"],
            rp_application_id=rp_application["id"],
            invited_email=invited_email,
            revoked_at=None,
            is_deleted=False,
        )
        existing_rows = (
            existing_result.get("data", []) if isinstance(existing_result, dict) else existing_result
        )
        revoked_at = datetime.now(UTC)
        for existing_invitation in existing_rows:
            existing_invitation_data = self._as_dict(existing_invitation)
            if existing_invitation_data is None:
                continue
            if existing_invitation_data.get("accepted_at") is not None:
                continue

            await crud_rp_application_developer_invitations.update(
                db=db,
                id=existing_invitation_data["id"],
                object=RPApplicationDeveloperInvitationUpdateInternal(
                    revoked_at=revoked_at,
                    updated_at=revoked_at,
                ),
            )

        created = await self._create_rp_application_developer_invitation(
            db=db,
            workspace_id=workspace["id"],
            rp_application=rp_application,
            normalized_email=invited_email,
            current_user=current_user,
        )
        return self._serialize_rp_application_developer_invitation(created)

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

        accepted_at = invitation.get("accepted_at")
        if accepted_at is not None:
            return invitation

        invite_expires_at = invitation.get("invite_expires_at")
        if not isinstance(invite_expires_at, datetime) or invite_expires_at <= datetime.now(UTC):
            raise BadRequestException("Invitation has expired")

        accepted_time = datetime.now(UTC)
        updated = await crud_rp_application_developer_invitations.update(
            db=db,
            id=invitation["id"],
            object=RPApplicationDeveloperInvitationUpdateInternal(
                accepted_at=accepted_time,
                updated_at=accepted_time,
            ),
        )
        if updated is not None:
            return dict(updated) if not isinstance(updated, dict) else updated

        invitation["accepted_at"] = accepted_time
        invitation["updated_at"] = accepted_time
        return invitation

    async def update_application_info(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_info_uuid: uuid_pkg.UUID | str,
        values: ApplicationInfoUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_admin(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            action="update application information records",
        )
        existing_application_info = await self._get_application_info_by_uuid(
            db=db,
            workspace_id=workspace["id"],
            application_info_uuid=application_info_uuid,
        )
        update_data = values.model_dump(exclude_none=True, by_alias=False)
        if not update_data:
            return existing_application_info

        updated = await crud_application_infos.update(
            db=db,
            uuid=application_info_uuid,
            workspace_id=workspace["id"],
            object=ApplicationInfoUpdateInternal(
                updated_at=datetime.now(UTC),
                **update_data,
            ),
        )
        if updated is not None:
            return dict(updated) if not isinstance(updated, dict) else updated
        return await self._get_application_info_by_uuid(
            db=db,
            workspace_id=workspace["id"],
            application_info_uuid=application_info_uuid,
        )

    async def delete_application_info(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_info_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, str]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_admin(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            action="delete application information records",
        )
        existing_application_info = await self._get_application_info_by_uuid(
            db=db,
            workspace_id=workspace["id"],
            application_info_uuid=application_info_uuid,
        )
        await crud_application_infos.delete(db=db, id=existing_application_info["id"])
        return {"message": "application info deleted"}

    async def create_application_contact(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_info_uuid: uuid_pkg.UUID | str,
        values: ApplicationContactCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_admin(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            action="manage application contacts",
        )
        application_info = await self._get_application_info_by_uuid(
            db=db,
            workspace_id=workspace["id"],
            application_info_uuid=application_info_uuid,
        )
        created = await crud_application_contacts.create(
            db=db,
            object=ApplicationContactCreateInternal(
                application_info_id=application_info["id"],
                **values.model_dump(by_alias=False),
            ),
            schema_to_select=ApplicationContactRead,
        )
        if created is None:
            raise NotFoundException("Failed to create application contact")
        return dict(created) if not isinstance(created, dict) else created

    async def list_application_contacts(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_info_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_member(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            action="view application contacts",
        )
        application_info = await self._get_application_info_by_uuid(
            db=db,
            workspace_id=workspace["id"],
            application_info_uuid=application_info_uuid,
        )
        result = await crud_application_contacts.get_multi(
            db=db,
            application_info_id=application_info["id"],
            is_deleted=False,
            schema_to_select=ApplicationContactRead,
        )
        return result.get("data", []) if isinstance(result, dict) else result

    async def update_application_contact(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_info_uuid: uuid_pkg.UUID | str,
        application_contact_uuid: uuid_pkg.UUID | str,
        values: ApplicationContactUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_admin(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            action="manage application contacts",
        )
        application_info = await self._get_application_info_by_uuid(
            db=db,
            workspace_id=workspace["id"],
            application_info_uuid=application_info_uuid,
        )
        existing_application_contact = await self._get_application_contact_by_uuid(
            db=db,
            application_info_id=application_info["id"],
            application_contact_uuid=application_contact_uuid,
        )
        update_data = values.model_dump(exclude_none=True, by_alias=False)
        if not update_data:
            return existing_application_contact

        updated = await crud_application_contacts.update(
            db=db,
            uuid=application_contact_uuid,
            application_info_id=application_info["id"],
            object=ApplicationContactUpdateInternal(
                updated_at=datetime.now(UTC),
                **update_data,
            ),
        )
        if updated is not None:
            return dict(updated) if not isinstance(updated, dict) else updated
        return await self._get_application_contact_by_uuid(
            db=db,
            application_info_id=application_info["id"],
            application_contact_uuid=application_contact_uuid,
        )

    async def delete_application_contact(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        application_info_uuid: uuid_pkg.UUID | str,
        application_contact_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, str]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_admin(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            action="manage application contacts",
        )
        application_info = await self._get_application_info_by_uuid(
            db=db,
            workspace_id=workspace["id"],
            application_info_uuid=application_info_uuid,
        )
        existing_application_contact = await self._get_application_contact_by_uuid(
            db=db,
            application_info_id=application_info["id"],
            application_contact_uuid=application_contact_uuid,
        )
        await crud_application_contacts.delete(db=db, id=existing_application_contact["id"])
        return {"message": "application contact deleted"}

    def _normalize_ibm_boolean(self, raw_value: Any) -> bool:
        if isinstance(raw_value, bool):
            return raw_value
        return str(raw_value or "").strip().lower() in {"true", "1", "yes", "on"}

    def _normalize_ibm_string_list(self, raw_value: Any) -> list[str]:
        if not isinstance(raw_value, list):
            return []
        return [str(value).strip() for value in raw_value if str(value).strip()]

    def _extract_ibm_client_id(self, application_detail: dict[str, Any]) -> str:
        candidate_values = [
            application_detail.get("clientId"),
            application_detail.get("client_id"),
        ]

        providers = application_detail.get("providers")
        providers_dict = providers if isinstance(providers, dict) else {}
        oidc_provider = providers_dict.get("oidc")
        oidc_provider_dict = oidc_provider if isinstance(oidc_provider, dict) else {}
        oidc_properties = oidc_provider_dict.get("properties")
        oidc_properties_dict = oidc_properties if isinstance(oidc_properties, dict) else {}

        candidate_values.extend(
            [
                oidc_provider_dict.get("clientId"),
                oidc_properties_dict.get("clientId"),
                oidc_properties_dict.get("client_id"),
            ]
        )

        api_access_clients = application_detail.get("apiAccessClients")
        if isinstance(api_access_clients, list) and api_access_clients:
            first_api_access_client = api_access_clients[0]
            if isinstance(first_api_access_client, dict):
                candidate_values.extend(
                    [
                        first_api_access_client.get("clientId"),
                        first_api_access_client.get("client_id"),
                    ]
                )

        for candidate in candidate_values:
            normalized_candidate = str(candidate or "").strip()
            if normalized_candidate:
                return normalized_candidate

        raise BadRequestException("IBM Security Verify application detail did not include a client ID")

    def _is_public_ibm_client(self, application_detail: dict[str, Any]) -> bool:
        providers = application_detail.get("providers")
        providers_dict = providers if isinstance(providers, dict) else {}
        oidc_provider = providers_dict.get("oidc")
        oidc_provider_dict = oidc_provider if isinstance(oidc_provider, dict) else {}
        oidc_properties = oidc_provider_dict.get("properties")
        oidc_properties_dict = oidc_properties if isinstance(oidc_properties, dict) else {}
        return self._normalize_ibm_boolean(oidc_properties_dict.get("doNotGenerateClientSecret"))

    def _extract_ibm_client_secret_payload(
        self,
        payload: dict[str, Any],
    ) -> RPApplicationClientCredentialsRead:
        candidate_records: list[dict[str, Any]] = []

        if isinstance(payload, dict):
            candidate_records.append(payload)
            for key in ("clientSecrets", "secrets", "items", "resources"):
                nested_value = payload.get(key)
                if isinstance(nested_value, list):
                    candidate_records.extend(
                        [item for item in nested_value if isinstance(item, dict)]
                    )

        for record in candidate_records:
            client_secret = next(
                (
                    str(record.get(key)).strip()
                    for key in ("secret", "clientSecret", "value", "clearText", "plainText", "plaintext")
                    if str(record.get(key) or "").strip()
                ),
                None,
            )
            client_secret_id = next(
                (
                    str(record.get(key)).strip()
                    for key in ("id", "secretId", "clientSecretId")
                    if str(record.get(key) or "").strip()
                ),
                None,
            )

            if client_secret or client_secret_id:
                return RPApplicationClientCredentialsRead(
                    client_id="",
                    client_secret=client_secret,
                    client_secret_id=client_secret_id,
                )

        return RPApplicationClientCredentialsRead(client_id="", client_secret=None, client_secret_id=None)

    def _extract_ibm_rotated_secret_records(self, payload: dict[str, Any]) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        if not isinstance(payload, dict):
            return records

        for key in ("rotatedSecrets", "clientSecrets", "secrets", "items", "resources"):
            nested_value = payload.get(key)
            if isinstance(nested_value, list):
                records.extend([item for item in nested_value if isinstance(item, dict)])

        return records

    def _extract_ibm_rotated_secret_read(
        self,
        record: dict[str, Any],
        fallback_path: str | None = None,
    ) -> RPApplicationClientRotatedSecretRead:
        def parse_optional_int(keys: tuple[str, str]) -> int | None:
            for key in keys:
                raw_value = record.get(key)
                if raw_value is None:
                    continue
                try:
                    return int(raw_value)
                except (TypeError, ValueError):
                    continue
            return None

        secret_value = next(
            (
                str(record.get(key)).strip()
                for key in ("value", "secret", "clientSecret", "clearText", "plainText", "plaintext")
                if str(record.get(key) or "").strip()
            ),
            None,
        )
        secret_id = next(
            (
                str(record.get(key)).strip()
                for key in ("id", "secretId", "clientSecretId", "secret_id", "path")
                if str(record.get(key) or "").strip()
            ),
            None,
        )
        if not secret_id:
            secret_id = str(fallback_path or "").strip() or None

        return RPApplicationClientRotatedSecretRead.model_validate(
            {
                "description": str(record.get("description") or "").strip() or None,
                "expiredAt": parse_optional_int(("expiredAt", "expired_at")),
                "rotatedAt": parse_optional_int(("rotatedAt", "rotated_at")),
                "value": secret_value,
                "secretId": secret_id,
            }
        )

    def _extract_rotated_secret_list(self, payload: dict[str, Any]) -> list[RPApplicationClientRotatedSecretRead]:
        records = self._extract_ibm_rotated_secret_records(payload)
        return [
            self._extract_ibm_rotated_secret_read(record, fallback_path=f"/rotatedSecrets/{index}")
            for index, record in enumerate(records)
        ]

    async def _get_rp_application_client_context(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        action: str,
    ) -> tuple[dict[str, Any], str, dict[str, Any]]:
        ws = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_admin(
            db=db,
            workspace_id=ws["id"],
            current_user=current_user,
            action=action,
        )

        rp_application = await self._get_rp_application_by_uuid(
            db=db,
            workspace_id=ws["id"],
            rp_application_uuid=rp_application_uuid,
        )
        ibm_sv_application_id = str(rp_application.get("ibm_sv_application_id") or "").strip()
        if not ibm_sv_application_id:
            raise BadRequestException("RP application is missing its IBM Security Verify application ID")

        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        application_detail = await ibm_sv_admin_service.get_application_detail(ibm_sv_application_id)
        if not isinstance(application_detail, dict):
            raise BadRequestException("IBM Security Verify application detail response was invalid")

        client_id = self._extract_ibm_client_id(application_detail)
        return application_detail, client_id, rp_application

    def _extract_rp_application_settings_from_ibm_detail(
        self,
        application_detail: dict[str, Any],
    ) -> dict[str, Any]:
        providers = application_detail.get("providers")
        providers_dict = providers if isinstance(providers, dict) else {}

        oidc_provider = providers_dict.get("oidc")
        oidc_provider_dict = oidc_provider if isinstance(oidc_provider, dict) else {}

        oidc_properties = oidc_provider_dict.get("properties")
        oidc_properties_dict = oidc_properties if isinstance(oidc_properties, dict) else {}

        additional_config = oidc_properties_dict.get("additionalConfig")
        additional_config_dict = additional_config if isinstance(additional_config, dict) else {}

        saml_provider = providers_dict.get("saml")
        saml_provider_dict = saml_provider if isinstance(saml_provider, dict) else {}

        saml_properties = saml_provider_dict.get("properties")
        saml_properties_dict = saml_properties if isinstance(saml_properties, dict) else {}

        do_not_generate_client_secret = self._normalize_ibm_boolean(
            oidc_properties_dict.get("doNotGenerateClientSecret")
        )
        redirect_uris = self._normalize_ibm_string_list(oidc_properties_dict.get("redirectUris"))
        post_logout_redirect_uris = self._normalize_ibm_string_list(
            additional_config_dict.get("logoutRedirectURIs")
        )

        return {
            "application_url": str(oidc_provider_dict.get("applicationUrl") or "").strip(),
            "client_auth_method": str(additional_config_dict.get("clientAuthMethod") or "default").strip(),
            "client_type": "public" if do_not_generate_client_secret else "confidential",
            "company_name": str(saml_properties_dict.get("companyName") or "").strip(),
            "description": str(application_detail.get("description") or "").strip(),
            "jwks_uri": str(oidc_properties_dict.get("jwksUri") or "").strip(),
            "logout_method": str(additional_config_dict.get("logoutOption") or "none").strip(),
            "logout_uri": str(additional_config_dict.get("logoutURI") or "").strip(),
            "pkce_enabled": self._normalize_ibm_boolean(
                oidc_provider_dict.get("requirePkceVerification")
            ),
            "post_logout_redirect_uris": post_logout_redirect_uris,
            "redirect_uris": redirect_uris,
        }

    async def _enrich_rp_application_with_ibm_settings(
        self,
        rp_application: dict[str, Any],
        workspace_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        normalized_application = dict(rp_application)
        ibm_sv_application_id = str(normalized_application.get("ibm_sv_application_id") or "").strip()
        if not ibm_sv_application_id:
            normalized_application["settings"] = None
            return normalized_application

        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        try:
            application_detail = await ibm_sv_admin_service.get_application_detail(ibm_sv_application_id)
        except Exception:
            LOGGER.exception(
                "workspace RP application settings fetch failed workspace_uuid=%s ibm_sv_application_id=%s",
                workspace_uuid,
                ibm_sv_application_id,
            )
            normalized_application["settings"] = None
            return normalized_application

        normalized_application["settings"] = self._extract_rp_application_settings_from_ibm_detail(
            application_detail if isinstance(application_detail, dict) else {}
        )
        return normalized_application

    async def _get_rp_application_by_uuid(
        self,
        db: AsyncSession,
        workspace_id: int,
        rp_application_uuid: uuid_pkg.UUID | str,
    ) -> dict[str, Any]:
        rp_application = await crud_rp_applications.get(
            db=db,
            uuid=rp_application_uuid,
            workspace_id=workspace_id,
            is_deleted=False,
        )
        if rp_application is None:
            raise NotFoundException("RP application not found")
        return rp_application

    def _normalize_usage_summary_payload(self, payload: dict[str, Any]) -> RPApplicationUsageSummaryRead:
        def _coerce_int(value: Any) -> int:
            try:
                return int(value)
            except (TypeError, ValueError):
                return 0

        def _get_nested_value(source: Any, *keys: str) -> Any:
            current: Any = source
            for key in keys:
                if not isinstance(current, dict) or key not in current:
                    return None
                current = current[key]
            return current

        payload_data = payload if isinstance(payload, dict) else {}
        response_data = payload_data.get("response") if isinstance(payload_data, dict) else {}
        report_data = response_data.get("report") if isinstance(response_data, dict) else {}
        if not isinstance(report_data, dict):
            report_data = {}

        succeeded = _coerce_int(_get_nested_value(report_data, "successful_logins", "doc_count"))
        failed = _coerce_int(_get_nested_value(report_data, "failed_logins", "doc_count"))
        total = succeeded + failed

        return RPApplicationUsageSummaryRead(total=total, succeeded=succeeded, failed=failed)

    def _get_exact_day_epoch_range(self, selected_date: str) -> tuple[str, str]:
        raw_selected_date = str(selected_date or "").strip()
        try:
            if raw_selected_date.isdigit():
                timestamp_value = int(raw_selected_date)
                timestamp_seconds = (
                    timestamp_value / 1000
                    if timestamp_value > 9_999_999_999
                    else timestamp_value
                )
                parsed_date = datetime.fromtimestamp(timestamp_seconds, tz=UTC).date()
            else:
                parsed_date = date_cls.fromisoformat(raw_selected_date)
        except (OverflowError, OSError, ValueError) as exc:
            raise BadRequestException(
                "selected_date must be in YYYY-MM-DD format or a unix timestamp"
            ) from exc

        start_of_day = datetime.combine(parsed_date, datetime.min.time(), tzinfo=UTC)
        end_of_day = start_of_day + timedelta(days=1) - timedelta(milliseconds=1)
        return str(int(start_of_day.timestamp() * 1000)), str(int(end_of_day.timestamp() * 1000))

    async def _get_rp_application_usage_context(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        action: str,
    ) -> tuple[dict[str, Any], str]:
        workspace = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_member(
            db=db,
            workspace_id=workspace["id"],
            current_user=current_user,
            action=action,
        )

        rp_application = await self._get_rp_application_by_uuid(
            db=db,
            workspace_id=workspace["id"],
            rp_application_uuid=rp_application_uuid,
        )
        ibm_sv_application_id = str(rp_application.get("ibm_sv_application_id") or "").strip()
        if not ibm_sv_application_id:
            raise BadRequestException("RP application is missing its IBM Security Verify application ID")

        return rp_application, ibm_sv_application_id

    async def get_rp_application_usage_summary(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        selected_date: str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        _, ibm_sv_application_id = await self._get_rp_application_usage_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            action="view RP application usage",
        )
        from_date, to_date = self._get_exact_day_epoch_range(selected_date)
        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        payload = await ibm_sv_admin_service.get_application_total_logins(
            ibm_sv_application_id,
            from_date,
            to_date,
        )
        return self._normalize_usage_summary_payload(
            payload if isinstance(payload, dict) else {}
        ).model_dump()

    async def get_rp_application_audit_trail(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        selected_date: str,
        current_user: dict[str, Any],
        size: int = 25,
    ) -> dict[str, Any]:
        _, ibm_sv_application_id = await self._get_rp_application_usage_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            action="view RP application audit trail",
        )
        from_date, to_date = self._get_exact_day_epoch_range(selected_date)
        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        payload = await ibm_sv_admin_service.get_application_audit_trail(
            application_id=ibm_sv_application_id,
            from_date=from_date,
            to_date=to_date,
            size=size,
            sort_by="time",
            sort_order="DESC",
        )
        normalized_payload = payload if isinstance(payload, dict) else {}
        rows = [
            RPApplicationUsageAuditEventRead.model_validate(row)
            for row in ibm_sv_admin_service.parse_audit_trail(normalized_payload)
        ]
        return RPApplicationUsageAuditTrailRead(
            events=rows,
            next=normalized_payload.get("next"),
            total=normalized_payload.get("total"),
        ).model_dump()

    async def get_rp_application_audit_trail_search_after(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        selected_date: str,
        current_user: dict[str, Any],
        search_after: str,
        size: int = 25,
    ) -> dict[str, Any]:
        _, ibm_sv_application_id = await self._get_rp_application_usage_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            action="view RP application audit trail",
        )
        from_date, to_date = self._get_exact_day_epoch_range(selected_date)
        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        payload = await ibm_sv_admin_service.get_application_audit_trail_search_after(
            application_id=ibm_sv_application_id,
            from_date=from_date,
            to_date=to_date,
            size=size,
            search_after=search_after,
        )
        normalized_payload = payload if isinstance(payload, dict) else {}
        rows = [
            RPApplicationUsageAuditEventRead.model_validate(row)
            for row in ibm_sv_admin_service.parse_audit_trail(normalized_payload)
        ]
        return RPApplicationUsageAuditTrailRead(
            events=rows,
            next=normalized_payload.get("next"),
            total=normalized_payload.get("total"),
        ).model_dump()

    async def list_rp_applications(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        ws = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_member(
            db=db,
            workspace_id=ws["id"],
            current_user=current_user,
            action="view RP applications",
        )
        result = await crud_rp_applications.get_multi(db=db, workspace_id=ws["id"], is_deleted=False)
        applications = result.get("data", []) if isinstance(result, dict) else result

        enriched_applications: list[dict[str, Any]] = []
        for application in applications:
            enriched_applications.append(
                await self._enrich_rp_application_with_ibm_settings(dict(application), workspace_uuid)
            )

        return enriched_applications

    async def list_current_user_workspaces(
        self,
        db: AsyncSession,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        memberships = await crud_workspace_members.get_multi(
            db=db,
            user_id=current_user["id"],
            is_deleted=False,
        )
        membership_rows = memberships.get("data", []) if isinstance(memberships, dict) else memberships

        workspace_ids: list[int] = []
        for membership in membership_rows:
            membership_data = self._as_dict(membership)
            if membership_data is None:
                continue
            workspace_id = membership_data.get("workspace_id")
            if isinstance(workspace_id, int) and workspace_id not in workspace_ids:
                workspace_ids.append(workspace_id)

        workspaces: list[dict[str, Any]] = []
        for workspace_id in workspace_ids:
            workspace = await crud_workspaces.get(db=db, id=workspace_id, is_deleted=False)
            if workspace is not None:
                workspaces.append(workspace)

        return workspaces

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
            workspace_uuid = workspace_data.get("uuid")
            workspace_name = workspace_data.get("name")
            workspace_id = workspace_data.get("id")
            if not isinstance(workspace_id, int):
                continue
            if not isinstance(workspace_uuid, uuid_pkg.UUID | str):
                continue

            result = await crud_rp_applications.get_multi(
                db=db,
                workspace_id=workspace_id,
                is_deleted=False,
            )
            workspace_applications = result.get("data", []) if isinstance(result, dict) else result

            for application in workspace_applications:
                application_data = self._as_dict(application)
                if application_data is None:
                    continue
                enriched_application = await self._enrich_rp_application_with_ibm_settings(
                    application_data,
                    workspace_uuid,
                )
                enriched_application["workspace_name"] = workspace_name
                enriched_application["workspace_uuid"] = workspace_uuid
                applications.append(enriched_application)
                application_id = enriched_application.get("id")
                if isinstance(application_id, int):
                    seen_application_ids.add(application_id)

        normalized_email = str(current_user.get("email") or "").strip().lower()
        if not normalized_email:
            return applications

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

            visible_application = await self._get_visible_rp_application_from_invitation(
                db=db,
                invitation=invitation_data,
            )
            if visible_application is None:
                continue

            applications.append(visible_application)
            seen_application_ids.add(rp_application_id)

        return applications

    async def get_current_user_rp_application(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        rp_application, workspace = await self._get_current_user_rp_application_context(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            require_write=False,
        )

        workspace_uuid = workspace.get("uuid")
        if not isinstance(workspace_uuid, uuid_pkg.UUID | str):
            raise NotFoundException("Workspace not found")

        enriched_application = await self._enrich_rp_application_with_ibm_settings(
            rp_application,
            workspace_uuid,
        )
        enriched_application["workspace_name"] = workspace.get("name")
        enriched_application["workspace_uuid"] = workspace_uuid
        return enriched_application

    async def update_current_user_rp_application(
        self,
        db: AsyncSession,
        rp_application_uuid: uuid_pkg.UUID | str,
        values: RPApplicationUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        existing_rp_application, workspace = await self._get_current_user_rp_application_context(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            require_write=True,
        )

        ibm_sv_application_id = existing_rp_application.get("ibm_sv_application_id")
        if not ibm_sv_application_id:
            raise BadRequestException("RP application is missing its IBM Security Verify application ID")

        update_data = values.model_dump(exclude_none=True, by_alias=False)
        if not update_data:
            return await self.get_current_user_rp_application(
                db=db,
                rp_application_uuid=rp_application_uuid,
                current_user=current_user,
            )

        department_abbreviation = await self._get_department_abbreviation(
            db=db,
            department_id=workspace.get("department_id"),
        )
        if "name" in update_data:
            update_data["name"] = self._normalize_rp_application_name(update_data["name"], department_abbreviation)

        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        previous_remote_payload = await ibm_sv_admin_service.get_application_detail(ibm_sv_application_id)
        merged_ibm_payload = await ibm_sv_admin_service.build_application_update_payload(
            ibm_sv_application_id,
            update_data,
        )
        await ibm_sv_admin_service.update_application(ibm_sv_application_id, merged_ibm_payload)

        local_update_data: dict[str, Any] = {"updated_at": datetime.now(UTC)}
        if "name" in update_data:
            local_update_data["name"] = update_data["name"]
        if "status" in update_data:
            local_update_data["status"] = update_data["status"]

        try:
            await crud_rp_applications.update(
                db=db,
                uuid=rp_application_uuid,
                workspace_id=workspace["id"],
                object=local_update_data,
            )
        except Exception:
            try:
                await ibm_sv_admin_service.update_application(ibm_sv_application_id, previous_remote_payload)
            except Exception:
                pass
            raise

        return await self.get_current_user_rp_application(
            db=db,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
        )

    async def create_workspace(
        self, db: AsyncSession, current_user: dict[str, Any], values: WorkspaceCreate
    ) -> dict[str, Any]:
        # Ensure user has department and is enabled
        if current_user.get("department_id") is None:
            raise ForbiddenException("User must have a department to create a workspace")
        if not current_user.get("enabled", False):
            raise ForbiddenException("User must be enabled to create a workspace")

        # Create workspace under user's department
        workspace_data = values.model_dump()
        # ensure slug exists (generate from name if missing)
        if not workspace_data.get("slug"):
            workspace_data["slug"] = slugify(workspace_data.get("name", ""))
        workspace_data["department_id"] = current_user["department_id"]
        # Set created_by to current user
        workspace_data["created_by"] = current_user["id"]
        # Remove timestamp fields - let DB/model handle defaults
        workspace_data.pop("created_at", None)
        workspace_data.pop("updated_at", None)

        created = await crud_workspaces.create(
            db=db,
            object=WorkspaceCreateInternal(**workspace_data),
            schema_to_select=WorkspaceRead,
        )
        if created is None:
            raise NotFoundException("Failed to create workspace")

        # Add creator as workspace_admin
        membership = await crud_workspace_members.create(
            db=db,
            object=WorkspaceMemberCreateInternal(
                workspace_id=created["id"],
                user_id=current_user["id"],
                role="workspace_admin",
                invited_by=current_user["id"],
            ),
            schema_to_select=WorkspaceMemberRead,
        )
        if membership is None:
            raise NotFoundException("Failed to add workspace admin")

        return created

    async def update_workspace(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        values: WorkspaceUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        ws = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)

        # Check caller is workspace_admin
        caller_membership = self._as_dict(
            await crud_workspace_members.get(
                db=db, workspace_id=ws["id"], user_id=current_user["id"], is_deleted=False
            )
        )
        if caller_membership is None or caller_membership.get("role") != "workspace_admin":
            raise ForbiddenException("Only workspace_admin can update workspace")

        update_data = values.model_dump()
        update_data.pop("created_at", None)
        update_data.pop("updated_at", None)

        await crud_workspaces.update(db=db, uuid=workspace_uuid, object=update_data)

        # Fetch and return updated workspace
        return await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)

    async def delete_workspace(
        self, db: AsyncSession, workspace_uuid: uuid_pkg.UUID | str, current_user: dict[str, Any]
    ) -> dict[str, str]:
        ws = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)

        # Check caller is workspace_admin
        caller_membership = self._as_dict(
            await crud_workspace_members.get(
                db=db, workspace_id=ws["id"], user_id=current_user["id"], is_deleted=False
            )
        )
        if caller_membership is None or caller_membership.get("role") != "workspace_admin":
            raise ForbiddenException("Only workspace_admin can delete workspace")

        # Soft delete workspace
        await crud_workspaces.delete(db=db, uuid=workspace_uuid)
        return {"message": "Workspace deleted"}

    async def get_workspace_by_uuid(self, db: AsyncSession, workspace_uuid: uuid_pkg.UUID | str) -> dict[str, Any]:
        ws = await crud_workspaces.get(db=db, uuid=workspace_uuid, is_deleted=False)
        if ws is None:
            raise NotFoundException("Workspace not found")
        return ws

    async def add_member(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        target_user_uuid: uuid_pkg.UUID | str,
        role: str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        ws = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)

        # check caller is admin
        caller_membership = self._as_dict(
            await crud_workspace_members.get(
                db=db, workspace_id=ws["id"], user_id=current_user["id"], is_deleted=False
            )
        )
        if caller_membership is None or caller_membership.get("role") != "workspace_admin":
            raise ForbiddenException("Only workspace_admin can add members")

        target_user = await crud_users.get(db=db, uuid=target_user_uuid, is_deleted=False)
        if target_user is None:
            raise NotFoundException("Target user not found")

        return await crud_workspace_members.create(
            db=db,
            object=WorkspaceMemberCreateInternal(
                workspace_id=ws["id"],
                user_id=target_user["id"],
                role=role,
            ),
            schema_to_select=WorkspaceMemberRead,
        )

    async def list_members(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        ws = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)

        await self._ensure_workspace_member(
            db=db,
            workspace_id=ws["id"],
            current_user=current_user,
            action="view the member list",
        )

        members = await crud_workspace_members.get_multi(
            db=db, workspace_id=ws["id"], is_deleted=False, schema_to_select=WorkspaceMemberRead
        )

        result = members.get("data", []) if isinstance(members, dict) else members
        enriched_members = []

        for member in result:
            member_data = self._as_dict(member)
            if member_data is None:
                continue
            user = self._as_dict(await crud_users.get(db=db, id=member_data["user_id"], is_deleted=False))
            if user:
                # include user's uuid so frontend can call remove_member using the user's uuid
                # use camelCase keys to match frontend expectations
                enriched_members.append({
                    **member_data,
                    "userEmail": user.get("email"),
                    "userName": user.get("name"),
                    "userUuid": user.get("uuid"),
                })

        return enriched_members

    async def remove_member(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        target_user_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> None:
        ws = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        caller_membership = await crud_workspace_members.get(
            db=db, workspace_id=ws["id"], user_id=current_user["id"], is_deleted=False
        )
        caller_membership_data = self._as_dict(caller_membership)
        if caller_membership_data is None or caller_membership_data.get("role") != "workspace_admin":
            raise ForbiddenException("Only workspace_admin can remove members")

        target_user = await crud_users.get(db=db, uuid=target_user_uuid, is_deleted=False)
        if target_user is None:
            raise NotFoundException("Target user not found")

        target_membership = await crud_workspace_members.get(
            db=db, workspace_id=ws["id"], user_id=target_user["id"], is_deleted=False
        )
        target_membership = self._as_dict(target_membership)
        if target_membership is None:
            raise NotFoundException("Membership not found")

        # if target is admin, ensure not last admin
        if target_membership.get("role") == "workspace_admin":
            admins = await crud_workspace_members.get_multi(
                db=db, workspace_id=ws["id"], role="workspace_admin", is_deleted=False
            )
            # crud get_multi may return pagination with either 'total' or 'total_count'
            total_admins: int | None = None
            if isinstance(admins, dict):
                maybe_total = admins.get("total") or admins.get("total_count")
                # ensure it's an int when present
                # coerce to int safely if possible
                if maybe_total is None:
                    total_admins = None
                else:
                    total_admins = int(maybe_total) if isinstance(maybe_total, int | str) and str(maybe_total).isdigit() else None
            # if we can determine total admins and it's <= 1, forbid removal
            if total_admins is not None and total_admins <= 1:
                raise ForbiddenException("Cannot remove last workspace admin")

        await crud_workspace_members.delete(db=db, id=target_membership["id"])

    async def create_rp_application(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        values: RPApplicationCreate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        ws = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_admin(db=db, workspace_id=ws["id"], current_user=current_user, action="create RP applications")

        department_abbreviation = await self._get_department_abbreviation(db=db, department_id=ws.get("department_id"))
        normalized_name = self._normalize_rp_application_name(values.name, department_abbreviation)

        application_info_id: int | None = None
        archived_rp_application: dict[str, Any] | None = None
        if values.application_info_uuid is not None:
            application_info = await self._get_application_info_by_uuid(
                db=db,
                workspace_id=ws["id"],
                application_info_uuid=values.application_info_uuid,
            )
            existing_rp_application = await self._get_rp_application_by_application_info_id(
                db=db,
                application_info_id=application_info["id"],
            )
            if existing_rp_application is not None:
                raise BadRequestException("Application info already has an RP application")
            application_info_id = application_info["id"]
            maybe_archived_rp_application = await self._get_any_rp_application_by_application_info_id(
                db=db,
                application_info_id=application_info_id,
            )
            if maybe_archived_rp_application is not None and maybe_archived_rp_application.get("is_deleted"):
                archived_rp_application = maybe_archived_rp_application

        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        ibm_payload_data = values.model_dump(by_alias=False)
        ibm_payload_data["name"] = normalized_name
        ibm_payload_data.pop("application_info_uuid", None)
        owners = self._build_rp_application_owners(ibm_payload_data.pop("owners", []), current_user)
        local_status = ibm_payload_data.pop("status", "draft")
        ibm_payload = ibm_sv_admin_service.build_application_creation_payload(ibm_payload_data, owners)

        try:
            remote_application = await ibm_sv_admin_service.create_application(ibm_payload)
        except Exception:
            LOGGER.exception(
                "workspace RP application create failed workspace_uuid=%s current_user_id=%s",
                workspace_uuid,
                current_user.get("id"),
            )
            raise

        ibm_sv_application_id = self._extract_ibm_application_id(remote_application)

        try:
            if archived_rp_application is not None:
                created = await crud_rp_applications.update(
                    db=db,
                    id=archived_rp_application["id"],
                    object={
                        "application_info_id": application_info_id,
                        "deleted_at": None,
                        "ibm_sv_application_id": ibm_sv_application_id,
                        "is_deleted": False,
                        "name": normalized_name,
                        "status": local_status,
                        "updated_at": datetime.now(UTC),
                    },
                )
            else:
                created = await crud_rp_applications.create(
                    db=db,
                    object=RPApplicationCreateInternal(
                        workspace_id=ws["id"],
                        application_info_id=application_info_id,
                        name=normalized_name,
                        ibm_sv_application_id=ibm_sv_application_id,
                        status=local_status,
                        created_by=current_user["id"],
                    ),
                    schema_to_select=RPApplicationRead,
                )
        except Exception:
            try:
                await ibm_sv_admin_service.delete_application(ibm_sv_application_id)
            except Exception:
                pass
            raise

        if created is None and archived_rp_application is not None:
            created = await self._get_rp_application_by_uuid(
                db=db,
                workspace_id=ws["id"],
                rp_application_uuid=archived_rp_application["uuid"],
            )

        if created is None:
            raise NotFoundException("Failed to create RP application")

        return dict(created) if not isinstance(created, dict) else created

    async def update_rp_application(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        values: RPApplicationUpdate,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        ws = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_admin(db=db, workspace_id=ws["id"], current_user=current_user, action="update RP applications")

        existing_rp_application = await self._get_rp_application_by_uuid(
            db=db,
            workspace_id=ws["id"],
            rp_application_uuid=rp_application_uuid,
        )
        ibm_sv_application_id = existing_rp_application.get("ibm_sv_application_id")
        if not ibm_sv_application_id:
            raise BadRequestException("RP application is missing its IBM Security Verify application ID")

        update_data = values.model_dump(exclude_none=True, by_alias=False)
        if not update_data:
            return existing_rp_application

        department_abbreviation = await self._get_department_abbreviation(db=db, department_id=ws.get("department_id"))
        if "name" in update_data:
            update_data["name"] = self._normalize_rp_application_name(update_data["name"], department_abbreviation)

        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        previous_remote_payload = await ibm_sv_admin_service.get_application_detail(ibm_sv_application_id)
        merged_ibm_payload = await ibm_sv_admin_service.build_application_update_payload(
            ibm_sv_application_id,
            update_data,
        )
        await ibm_sv_admin_service.update_application(ibm_sv_application_id, merged_ibm_payload)

        local_update_data: dict[str, Any] = {"updated_at": datetime.now(UTC)}
        if "name" in update_data:
            local_update_data["name"] = update_data["name"]
        if "status" in update_data:
            local_update_data["status"] = update_data["status"]

        try:
            await crud_rp_applications.update(
                db=db,
                uuid=rp_application_uuid,
                workspace_id=ws["id"],
                object=local_update_data,
            )
        except Exception:
            try:
                await ibm_sv_admin_service.update_application(ibm_sv_application_id, previous_remote_payload)
            except Exception:
                pass
            raise

        return await self._get_rp_application_by_uuid(
            db=db,
            workspace_id=ws["id"],
            rp_application_uuid=rp_application_uuid,
        )

    async def delete_rp_application(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, str]:
        ws = await self.get_workspace_by_uuid(db=db, workspace_uuid=workspace_uuid)
        await self._ensure_workspace_admin(db=db, workspace_id=ws["id"], current_user=current_user, action="delete RP applications")

        existing_rp_application = await self._get_rp_application_by_uuid(
            db=db,
            workspace_id=ws["id"],
            rp_application_uuid=rp_application_uuid,
        )
        ibm_sv_application_id = existing_rp_application.get("ibm_sv_application_id")
        if not ibm_sv_application_id:
            raise BadRequestException("RP application is missing its IBM Security Verify application ID")

        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        await ibm_sv_admin_service.delete_application(ibm_sv_application_id)
        await crud_rp_applications.delete(db=db, id=existing_rp_application["id"])
        return {"message": "RP application deleted"}

    async def get_rp_application_client_credentials(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> dict[str, Any]:
        application_detail, client_id, _ = await self._get_rp_application_client_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            action="view RP application client credentials",
        )

        client_credentials = RPApplicationClientCredentialsRead(client_id=client_id)
        if self._is_public_ibm_client(application_detail):
            return client_credentials.model_dump()

        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        secret_payload = await ibm_sv_admin_service.get_client_secret(client_id)
        normalized_secret_payload = self._extract_ibm_client_secret_payload(
            secret_payload if isinstance(secret_payload, dict) else {}
        )

        return RPApplicationClientCredentialsRead(
            client_id=client_id,
            client_secret=normalized_secret_payload.client_secret,
            client_secret_id=normalized_secret_payload.client_secret_id,
        ).model_dump()

    async def list_rp_application_rotated_client_secrets(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
    ) -> list[dict[str, Any]]:
        application_detail, client_id, _ = await self._get_rp_application_client_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            action="view RP application rotated client secrets",
        )

        if self._is_public_ibm_client(application_detail):
            return []

        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        secret_payload = await ibm_sv_admin_service.get_client_secret(client_id)
        normalized_rotated_secrets = self._extract_rotated_secret_list(
            secret_payload if isinstance(secret_payload, dict) else {}
        )
        return [rotated_secret.model_dump() for rotated_secret in normalized_rotated_secrets]

    async def create_rp_application_rotated_client_secret(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        values: RPApplicationClientRotatedSecretCreateRequest,
    ) -> list[dict[str, Any]]:
        application_detail, client_id, _ = await self._get_rp_application_client_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            action="create RP application rotated client secrets",
        )

        if self._is_public_ibm_client(application_detail):
            raise BadRequestException("RP application does not support client secrets")

        description = str(values.description or "").strip()
        rotated_secret_expired_at = int(values.rotated_secret_expired_at or 0)

        expires_at = datetime.fromtimestamp(rotated_secret_expired_at, tz=UTC)
        now = datetime.now(UTC)
        if expires_at <= now:
            raise BadRequestException("Expiry date must be in the future and within 30 days")
        if expires_at > now + timedelta(days=30):
            raise BadRequestException("Expiry date must be within 30 days")

        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        rotated_secret_payload = await ibm_sv_admin_service.update_client_secret(
            client_id,
            {
                "deleteRotatedSecrets": False,
                "description": description,
                "rotatedSecretExpiredAt": rotated_secret_expired_at,
            },
        )
        normalized_rotated_secrets = self._extract_rotated_secret_list(
            rotated_secret_payload if isinstance(rotated_secret_payload, dict) else {}
        )

        return [rotated_secret.model_dump() for rotated_secret in normalized_rotated_secrets]

    async def delete_rp_application_rotated_client_secret(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        rotated_secret_id: str,
        current_user: dict[str, Any],
    ) -> dict[str, str]:
        application_detail, client_id, _ = await self._get_rp_application_client_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            action="delete RP application rotated client secrets",
        )

        if self._is_public_ibm_client(application_detail):
            raise BadRequestException("RP application does not support client secrets")

        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        normalized_rotated_secret_value = str(rotated_secret_id or "").strip()
        if not normalized_rotated_secret_value:
            raise BadRequestException("Rotated secret value is required")

        await ibm_sv_admin_service.delete_rotated_client_secrets(client_id, [normalized_rotated_secret_value])
        return {"message": "rotated secret deleted"}

    async def rotate_rp_application_client_secret(
        self,
        db: AsyncSession,
        workspace_uuid: uuid_pkg.UUID | str,
        rp_application_uuid: uuid_pkg.UUID | str,
        current_user: dict[str, Any],
        values: RPApplicationClientSecretRotateRequest | None = None,
    ) -> dict[str, Any]:
        application_detail, client_id, _ = await self._get_rp_application_client_context(
            db=db,
            workspace_uuid=workspace_uuid,
            rp_application_uuid=rp_application_uuid,
            current_user=current_user,
            action="rotate RP application client secrets",
        )

        if self._is_public_ibm_client(application_detail):
            raise BadRequestException("RP application does not support client secrets")

        delete_rotated_secrets = False
        description = ""
        rotated_secret_expired_at = 0

        if values is not None:
            delete_rotated_secrets = bool(values.delete_rotated_secrets)
            description = str(values.description or "").strip()
            rotated_secret_expired_at = int(values.rotated_secret_expired_at or 0)

            if delete_rotated_secrets:
                if not description:
                    raise BadRequestException("Rotation name is required for named client secret rotation")
                if rotated_secret_expired_at <= 0:
                    raise BadRequestException("Expiry date is required for named client secret rotation")

                expires_at = datetime.fromtimestamp(rotated_secret_expired_at, tz=UTC)
                now = datetime.now(UTC)
                if expires_at <= now:
                    raise BadRequestException("Expiry date must be in the future and within 30 days")
                if expires_at > now + timedelta(days=30):
                    raise BadRequestException("Expiry date must be within 30 days")

        ibm_sv_admin_service = await self._get_ibm_sv_admin_service()
        rotation_payload: dict[str, Any] = {
            "deleteRotatedSecrets": delete_rotated_secrets,
            "description": description,
            "rotatedSecretExpiredAt": rotated_secret_expired_at,
        }
        rotated_secret_payload = await ibm_sv_admin_service.update_client_secret(client_id, rotation_payload)
        normalized_secret_payload = self._extract_ibm_client_secret_payload(
            rotated_secret_payload if isinstance(rotated_secret_payload, dict) else {}
        )

        return RPApplicationClientCredentialsRead(
            client_id=client_id,
            client_secret=normalized_secret_payload.client_secret,
            client_secret_id=normalized_secret_payload.client_secret_id,
        ).model_dump()
