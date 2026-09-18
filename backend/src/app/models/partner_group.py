import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import UUID, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class PartnerGroup(Base):
    __tablename__ = "partner_group"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("department.id"), index=True, nullable=False)
    name_en: Mapped[str] = mapped_column(String(256), nullable=False)
    name_fr: Mapped[str | None] = mapped_column(String(256), default=None, nullable=True)
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
