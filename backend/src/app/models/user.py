import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)

    name: Mapped[str] = mapped_column(String(30))
    username: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String, default=None, nullable=True)
    auth_provider: Mapped[str | None] = mapped_column(String(50), default=None, nullable=True)
    auth_subject: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, default=None, nullable=True)

    profile_image_url: Mapped[str] = mapped_column(String, default="https://profileimageurl.com")
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
    is_superuser: Mapped[bool] = mapped_column(default=False)
    # Account enabled flag - false until user completes profile onboarding (department set)
    enabled: Mapped[bool] = mapped_column(default=False, index=True)

    department_id: Mapped[int | None] = mapped_column(ForeignKey("department.id"), index=True, default=None, init=False)
    tier_id: Mapped[int | None] = mapped_column(ForeignKey("tier.id"), index=True, default=None, init=False)
    role_ids: Mapped[list[int] | None] = mapped_column(JSON, default=None, nullable=True)
