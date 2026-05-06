import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class ApplicationInfo(Base):
    __tablename__ = "application_info"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspace.id"), index=True, nullable=False)
    application_name: Mapped[str] = mapped_column(String(255), nullable=False)
    about_application: Mapped[str] = mapped_column(Text, nullable=False)
    program_line_of_business: Mapped[str] = mapped_column(String(255), nullable=False)
    application_url: Mapped[str] = mapped_column(String(500), nullable=False)
    application_description: Mapped[str] = mapped_column(Text, nullable=False)
    technology: Mapped[str] = mapped_column(String(255), nullable=False)
    authentication_protocol: Mapped[str] = mapped_column(String(100), nullable=False)
    tech_stack: Mapped[str] = mapped_column(Text, nullable=False)
    rollback_strategy: Mapped[str] = mapped_column(Text, nullable=False)
    credential_assurance_level: Mapped[str] = mapped_column(String(100), nullable=False)
    identity_assurance_level: Mapped[str] = mapped_column(String(100), nullable=False)
    identity_proofing_method: Mapped[str] = mapped_column(String(255), nullable=False)
    authority_to_collect_personal_information: Mapped[str] = mapped_column(Text, nullable=False)
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)
    portal_name: Mapped[str | None] = mapped_column(String(255), default=None, nullable=True)
    planned_oidc_implementation_date: Mapped[str | None] = mapped_column(String(100), default=None, nullable=True)
    requests_profile_data_pushes: Mapped[bool] = mapped_column(Boolean, default=False)
    has_access_management_layer: Mapped[bool] = mapped_column(Boolean, default=False)
    identity_proofing_method_other: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)
    is_cbas: Mapped[bool] = mapped_column(Boolean, default=False)
    has_account_recovery: Mapped[bool] = mapped_column(Boolean, default=False)
    has_privacy_notice: Mapped[bool] = mapped_column(Boolean, default=False)
    user_types: Mapped[list[str]] = mapped_column(JSON, default_factory=list)
    user_type_other: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)
    monthly_active_users: Mapped[int | None] = mapped_column(Integer, default=None, nullable=True)
    peak_usage_periods: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)
    personal_information_collected: Mapped[list[str]] = mapped_column(JSON, default_factory=list)
    personal_information_other: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)
    current_sign_in_options: Mapped[list[str]] = mapped_column(JSON, default_factory=list)
    current_sign_in_options_other: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)
    consolidator_used: Mapped[str | None] = mapped_column(String(255), default=None, nullable=True)
    current_mfa_options: Mapped[str | None] = mapped_column(String(255), default=None, nullable=True)
    uses_canadalogin_migration: Mapped[bool] = mapped_column(Boolean, default=False)
    migration_rationale: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)
    schedule_blackout_periods: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)
    transition_risks: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)
    transition_mitigations: Mapped[str | None] = mapped_column(Text, default=None, nullable=True)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("user.id"), default=None, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
