import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class ApplicationContact(Base):
    __tablename__ = "application_contact"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)
    application_info_id: Mapped[int] = mapped_column(ForeignKey("application_info.id"), index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    title_role: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(50), nullable=False)
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)
    alternate_phone_number: Mapped[str | None] = mapped_column(String(50), default=None, nullable=True)
    contact_type: Mapped[str | None] = mapped_column(String(100), default=None, nullable=True)
    action: Mapped[str | None] = mapped_column(String(100), default=None, nullable=True)
    contact_roles: Mapped[list[str]] = mapped_column(JSON, default_factory=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
