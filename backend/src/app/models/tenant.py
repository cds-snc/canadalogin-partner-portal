import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import UUID, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class Tenant(Base):
    __tablename__ = "tenant"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    display_order: Mapped[int] = mapped_column(nullable=False, index=True)
    is_deprecated: Mapped[bool] = mapped_column(default=False, index=True)
    label_en: Mapped[str | None] = mapped_column(String(64), default=None, nullable=True)
    label_fr: Mapped[str | None] = mapped_column(String(64), default=None, nullable=True)
    tenant_url: Mapped[str | None] = mapped_column(String(512), default=None, nullable=True)
    authorize_endpoint_context_salt: Mapped[str | None] = mapped_column(String(128), default=None, nullable=True)
    default_identity_source_id: Mapped[str | None] = mapped_column(String(256), default=None, nullable=True)
    default_template_id: Mapped[str | None] = mapped_column(String(256), default=None, nullable=True)
    default_auth_policy_id: Mapped[str | None] = mapped_column(String(256), default=None, nullable=True)
    default_theme_id: Mapped[str | None] = mapped_column(String(128), default=None, nullable=True)
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
