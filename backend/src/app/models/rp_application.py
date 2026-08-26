import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import JSON, CheckConstraint, DateTime, ForeignKey, Index, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class RPApplication(Base):
    __tablename__ = "rp_application"
    __table_args__ = (
        CheckConstraint(
            "registration_draft_version >= 0",
            name="ck_rp_application_registration_draft_version",
        ),
        CheckConstraint(
            "registration_last_completed_step IS NULL OR "
            "registration_last_completed_step IN "
            "('basics', 'endpoints', 'client-and-access', 'signing', 'encryption')",
            name="ck_rp_application_registration_last_completed_step",
        ),
        CheckConstraint(
            "(workspace_id IS NULL AND application_information_id IS NULL) OR (workspace_id IS NOT NULL AND application_information_id IS NOT NULL)",
            name="ck_rp_application_hierarchy_pair",
        ),
        CheckConstraint(
            "length(trim(configuration_name)) > 0",
            name="ck_rp_application_configuration_name_nonblank",
        ),
        CheckConstraint(
            "partner_environment IS NULL OR length(trim(partner_environment)) > 0",
            name="ck_rp_application_partner_environment_nonblank",
        ),
        CheckConstraint(
            "workspace_id IS NULL OR is_deleted OR deleted_at IS NOT NULL OR "
            "(department_id IS NOT NULL AND canada_login_environment IS NOT NULL AND "
            "canada_login_environment IN "
            "('test', 'staging', 'production') AND "
            "length(trim(configuration_name)) > 0)",
            name="ck_rp_application_partner_required_fields",
        ),
        Index(
            "uq_rp_application_registration_creation_key",
            "registration_creation_key",
            unique=True,
            postgresql_where=text("registration_creation_key IS NOT NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)
    workspace_id: Mapped[int | None] = mapped_column(
        ForeignKey("workspace.id"),
        index=True,
        nullable=True,
    )
    department_id: Mapped[int | None] = mapped_column(ForeignKey("department.id"), index=True, nullable=True)
    application_information_id: Mapped[int | None] = mapped_column(
        ForeignKey("application_information.id"),
        index=True,
        nullable=True,
    )
    dnr_app_name: Mapped[str] = mapped_column(String(128), nullable=False)
    configuration_name: Mapped[str] = mapped_column(String(128), nullable=False)
    partner_environment: Mapped[str | None] = mapped_column(String(128), nullable=True, default=None)
    source_rp_configuration_id: Mapped[int | None] = mapped_column(
        ForeignKey("rp_application.id"),
        index=True,
        nullable=True,
        default=None,
    )
    canada_login_environment: Mapped[str | None] = mapped_column(String(32), nullable=True, default=None)
    status: Mapped[str | None] = mapped_column(String(64), nullable=True, default=None)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("user.id"), nullable=True, default=None)
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)
    ibm_sv_application_id: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True, default=None)
    application_owner: Mapped[dict[str, object] | None] = mapped_column(JSON, nullable=True, default=None)
    oidc_registration_payload: Mapped[dict[str, object] | None] = mapped_column(
        JSON,
        nullable=True,
        default=None,
    )
    registration_creation_key: Mapped[uuid_pkg.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        default=None,
    )
    registration_draft_version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    registration_last_completed_step: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        default=None,
    )
    registration_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    # Retained for historical compatibility. Product code derives registration
    # state from registration_completed_at and does not write this lifecycle.
    onboarding_state: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        default=None,
        index=True,
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    under_review_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    launched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
