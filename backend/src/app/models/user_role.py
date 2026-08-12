import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import UUID, CheckConstraint, DateTime, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class UserRole(Base):
    """Auditable global-role assignment.

    The table is intentionally additive while ``user.role_ids`` and
    ``user.is_superuser`` remain available for rollback during the cutover.
    Only active assignments to immutable role definitions authorize access.
    """

    __tablename__ = "user_role"
    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'revoked')",
            name="ck_user_role_status",
        ),
        CheckConstraint(
            "assignment_source IN ('migration', 'bootstrap', 'admin', 'local_fixture')",
            name="ck_user_role_assignment_source",
        ),
        CheckConstraint(
            "assignment_source <> 'admin' OR assigned_by_user_id IS NOT NULL",
            name="ck_user_role_admin_actor",
        ),
        CheckConstraint(
            "(status = 'active' AND revoked_at IS NULL AND revoked_by_user_id IS NULL) OR (status = 'revoked' AND revoked_at IS NOT NULL)",
            name="ck_user_role_lifecycle",
        ),
        Index(
            "uq_user_role_active_user_role",
            "user_id",
            "role_id",
            unique=True,
            postgresql_where=text("status = 'active'"),
        ),
    )

    id: Mapped[int] = mapped_column(
        autoincrement=True,
        nullable=False,
        unique=True,
        primary_key=True,
        init=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    role_id: Mapped[int] = mapped_column(
        ForeignKey("role.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    assignment_source: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default_factory=lambda: datetime.now(UTC),
    )
    assigned_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("user.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
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
        nullable=False,
        default_factory=uuid7,
        unique=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default_factory=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
