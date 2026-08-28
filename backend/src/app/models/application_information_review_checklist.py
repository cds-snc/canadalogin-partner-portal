import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import UUID, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class ApplicationInformationReviewChecklist(Base):
    __tablename__ = "application_information_review_checklist"
    __table_args__ = (
        UniqueConstraint(
            "application_information_id",
            name="uq_application_information_review_checklist_application_information_id",
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
    application_information_id: Mapped[int] = mapped_column(
        ForeignKey("application_information.id"),
        index=True,
        nullable=False,
    )
    review_disposition: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    application_information_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )
    contacts_status: Mapped[str] = mapped_column(String(32), nullable=False)
    environment_registration_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )
    promotion_metadata_status: Mapped[str] = mapped_column(String(32), nullable=False)
    evidence_reference_status: Mapped[str] = mapped_column(String(32), nullable=False)
    process_links_status: Mapped[str] = mapped_column(String(32), nullable=False)
    reviewed_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("user.id"),
        index=True,
        nullable=True,
        default=None,
    )
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True, default=None)
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
