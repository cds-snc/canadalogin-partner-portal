import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"
    __table_args__ = (
        Index("ix_audit_log_created_at", "created_at"),
        Index("ix_audit_log_target_uuid_created_at", "target_uuid", "created_at"),
        Index(
            "ix_audit_log_target_operation_created_at",
            "target",
            "operation",
            "created_at",
        ),
    )

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)
    user: Mapped[str] = mapped_column(String(255))
    target: Mapped[str] = mapped_column(String(128))
    operation: Mapped[str] = mapped_column(String(16))
    description: Mapped[str] = mapped_column(Text)
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)
    user_uuid: Mapped[uuid_pkg.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("user.uuid"), nullable=True, default=None)
    target_uuid: Mapped[uuid_pkg.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
