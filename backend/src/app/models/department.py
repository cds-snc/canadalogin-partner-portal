import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import UUID, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class Department(Base):
    __tablename__ = "department"

    id: Mapped[int] = mapped_column("id", autoincrement=True, nullable=False, unique=True, primary_key=True, init=False)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    gc_org_id: Mapped[int | None] = mapped_column(nullable=True, unique=True, index=True)
    name_fr: Mapped[str | None] = mapped_column(String(128), nullable=True, default=None)
    abbreviation: Mapped[str | None] = mapped_column(String(16), nullable=True, default=None)
    abbreviation_fr: Mapped[str | None] = mapped_column(String(16), nullable=True, default=None)
    lead_department_name: Mapped[str | None] = mapped_column(String(64), nullable=True, default=None)
    lead_department_name_fr: Mapped[str | None] = mapped_column(String(192), nullable=True, default=None)
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
