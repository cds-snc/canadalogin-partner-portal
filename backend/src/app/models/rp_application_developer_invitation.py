import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import UUID, CheckConstraint, DateTime, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class RPApplicationDeveloperInvitation(Base):
    __tablename__ = "rp_application_developer_invitation"
    __table_args__ = (
        CheckConstraint(
            "role IN ('rp_admin', 'rp_user_edit', 'read_only')",
            name="ck_rp_invitation_role",
        ),
        CheckConstraint(
            "status IN ('pending', 'accepted', 'expired', 'revoked')",
            name="ck_rp_invitation_status",
        ),
        CheckConstraint(
            "(is_deleted = FALSE AND deleted_at IS NULL) OR (is_deleted = TRUE AND deleted_at IS NOT NULL)",
            name="ck_rp_invitation_soft_delete_metadata",
        ),
        CheckConstraint(
            "(status = 'pending' AND is_deleted = FALSE AND accepted_at IS NULL "
            "AND revoked_at IS NULL) OR "
            "(status = 'accepted' AND is_deleted = FALSE AND accepted_at IS NOT NULL "
            "AND revoked_at IS NULL) OR "
            "(status = 'expired' AND is_deleted = FALSE AND accepted_at IS NULL "
            "AND revoked_at IS NULL) OR "
            "(status = 'revoked' AND is_deleted = FALSE AND accepted_at IS NULL "
            "AND revoked_at IS NOT NULL)",
            name="ck_rp_invitation_lifecycle",
        ),
        CheckConstraint(
            "replaced_by_invitation_uuid IS NULL OR (status = 'revoked' AND revocation_reason IS NOT NULL)",
            name="ck_rp_invitation_replacement",
        ),
        CheckConstraint(
            "(status <> 'revoked' AND revoked_by_user_id IS NULL "
            "AND revocation_actor_source IS NULL) OR "
            "(status = 'revoked' AND ((revocation_actor_source = 'user' "
            "AND revoked_by_user_id IS NOT NULL) OR "
            "(revocation_actor_source = 'legacy_unknown' "
            "AND revoked_by_user_id IS NULL)))",
            name="ck_rp_invitation_revocation_actor",
        ),
        Index(
            "uq_rp_developer_invitation_pending_email_workspace",
            "workspace_id",
            text("lower(btrim(invited_email))"),
            unique=True,
            postgresql_where=text("status = 'pending' AND is_deleted = FALSE"),
        ),
    )

    id: Mapped[int] = mapped_column(
        "id",
        autoincrement=True,
        nullable=False,
        unique=True,
        primary_key=True,
        init=False,
    )
    workspace_id: Mapped[int] = mapped_column(
        ForeignKey("workspace.id"),
        index=True,
        nullable=False,
    )
    rp_application_id: Mapped[int | None] = mapped_column(
        ForeignKey("rp_application.id"),
        index=True,
        nullable=True,
    )
    invited_email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    invite_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    invited_by: Mapped[int | None] = mapped_column(
        ForeignKey("user.id"),
        nullable=True,
        default=None,
    )
    status: Mapped[str] = mapped_column(String(32), index=True, nullable=False, default="pending")
    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    revoked_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
        default=None,
    )
    revocation_actor_source: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        default=None,
    )
    gc_notify_notification_id: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        default=None,
    )
    delegated_by_grant_uuid: Mapped[uuid_pkg.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rp_application_access_grant.uuid", ondelete="RESTRICT"),
        index=True,
        nullable=True,
        default=None,
    )
    revocation_reason: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        default=None,
    )
    replaced_by_invitation_uuid: Mapped[uuid_pkg.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rp_application_developer_invitation.uuid", ondelete="RESTRICT"),
        index=True,
        nullable=True,
        default=None,
    )
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(
        UUID(as_uuid=True),
        default_factory=uuid7,
        unique=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default_factory=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=None,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=None,
    )
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
