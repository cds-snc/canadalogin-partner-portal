import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class RPApplication(Base):
    __tablename__ = "rp_application"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspace.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("user.id"), nullable=True)
    application_info_id: Mapped[int | None] = mapped_column(
        ForeignKey("application_info.id"),
        index=True,
        nullable=True,
        unique=True,
        default=None,
    )
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)
    ibm_sv_application_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True, default=None)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
