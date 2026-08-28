import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import UUID, CheckConstraint, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class Role(Base):
    __tablename__ = "role"
    __table_args__ = (
        CheckConstraint(
            "code IS NULL OR code = 'cl_admin'",
            name="ck_role_canonical_code",
        ),
    )

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    # Nullable while preserved uncoded legacy rows remain in dormant storage.
    # Those rows are never authoritative; a future approved cleanup may retire
    # them and add NOT NULL after its disposition requirements are settled.
    code: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, default=None, nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), default=None, nullable=True)
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
