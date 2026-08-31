import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class RPApplication(Base):
    __tablename__ = "rp_application"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("department.id"), index=True, nullable=True)
    dnr_app_name: Mapped[str] = mapped_column(String(128), nullable=False)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("user.id"), nullable=True)
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)
    ibm_sv_application_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True, default=None)
    application_owner: Mapped[dict[str, object] | None] = mapped_column(JSON, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
