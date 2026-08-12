from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from ..core.db.database import Base


class RPApplicationPromotionRequest(Base):
    __tablename__ = "rp_application_promotion_request"
    __table_args__ = (
        UniqueConstraint(
            "rp_application_id",
            "target_environment",
            name="uq_rp_application_promotion_request_target_environment",
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
    rp_application_id: Mapped[int] = mapped_column(
        ForeignKey("rp_application.id"),
        index=True,
        nullable=False,
    )
    target_environment: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(32), index=True, nullable=False, default="review_tracked")
    external_reference: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    reviewed_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("user.id"),
        index=True,
        nullable=True,
        default=None,
    )
    reviewed_by_team: Mapped[str | None] = mapped_column(String(128), nullable=True, default=None)
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    decided_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
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
