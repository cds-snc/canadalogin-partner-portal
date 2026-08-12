import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import UUID, CheckConstraint, DateTime, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class RPApplicationAccessGrant(Base):
    __tablename__ = "rp_application_access_grant"
    __table_args__ = (
        CheckConstraint(
            "role IN ('rp_admin', 'rp_user_edit', 'read_only')",
            name="ck_rp_access_grant_role",
        ),
        CheckConstraint(
            "status IN ('active', 'revoked')",
            name="ck_rp_access_grant_status",
        ),
        CheckConstraint(
            "(is_deleted = FALSE AND deleted_at IS NULL) OR (is_deleted = TRUE AND deleted_at IS NOT NULL)",
            name="ck_rp_access_grant_soft_delete_metadata",
        ),
        CheckConstraint(
            "(status = 'active' AND is_deleted = FALSE AND deleted_at IS NULL "
            "AND revoked_at IS NULL AND revoked_by_user_id IS NULL) OR "
            "(status = 'revoked' AND is_deleted = FALSE AND deleted_at IS NULL "
            "AND revoked_at IS NOT NULL)",
            name="ck_rp_access_grant_lifecycle",
        ),
        Index(
            "uq_rp_application_access_grant_active_workspace_user",
            "workspace_id",
            "user_id",
            unique=True,
            postgresql_where=text("is_deleted = FALSE AND status = 'active'"),
        ),
        Index(
            "uq_rp_access_grant_source_invitation",
            "source_invitation_uuid",
            unique=True,
            postgresql_where=text("source_invitation_uuid IS NOT NULL"),
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
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id"),
        index=True,
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    source_invitation_uuid: Mapped[uuid_pkg.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rp_application_developer_invitation.uuid", ondelete="RESTRICT"),
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
