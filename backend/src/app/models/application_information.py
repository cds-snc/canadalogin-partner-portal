import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import UUID, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class ApplicationInformation(Base):
    __tablename__ = "application_information"

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
    service_name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    service_name_fr: Mapped[str] = mapped_column(String(255), nullable=False)
    overview: Mapped[str] = mapped_column(Text, nullable=False)
    technology_and_protocol: Mapped[str] = mapped_column(Text, nullable=False)
    security_and_privacy: Mapped[str] = mapped_column(Text, nullable=False)
    usage: Mapped[str] = mapped_column(Text, nullable=False)
    migration_or_transition_plan: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("user.id"),
        nullable=True,
        default=None,
    )
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(
        UUID(as_uuid=True),
        default_factory=uuid7,
        unique=True,
    )
    onboarding_state: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        default=None,
        index=True,
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=None,
    )
    under_review_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=None,
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        default=None,
    )
    launched_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
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
