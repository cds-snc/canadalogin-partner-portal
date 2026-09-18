import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import UUID, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class ApplicationConfiguration(Base):
    __tablename__ = "application_configuration"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)
    application_id: Mapped[int] = mapped_column(ForeignKey("application.id"), index=True, nullable=False)
    application_configuration_status_id: Mapped[int] = mapped_column(ForeignKey("application_configuration_status.id"), index=True, nullable=False)
    application_configuration_client_type_id: Mapped[int] = mapped_column(
        ForeignKey("application_configuration_client_type.id"), index=True, nullable=False
    )
    authentication_protocol_id: Mapped[int] = mapped_column(ForeignKey("authentication_protocol.id"), index=True, nullable=False)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenant.id"), index=True, nullable=False)

    partner_label: Mapped[str] = mapped_column(String(512), nullable=False)
    application_url_en: Mapped[str] = mapped_column(String(512), nullable=False)
    application_url_fr: Mapped[str] = mapped_column(String(512), nullable=False)
    config: Mapped[dict[str, object] | None] = mapped_column(JSONB, default=None, nullable=True)
    config_version: Mapped[str | None] = mapped_column(String(32), default=None, nullable=True)
    ibm_application_id: Mapped[str | None] = mapped_column(String(128), default=None, nullable=True)
    ibm_client_id: Mapped[str | None] = mapped_column(String(128), default=None, nullable=True)
    dnr_application_name: Mapped[str | None] = mapped_column(String(128), default=None, nullable=True)

    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
