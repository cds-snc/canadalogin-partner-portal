import uuid as uuid_pkg
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from ..core.db.database import Base


class WorkspaceMember(Base):
    __tablename__ = "workspace_member"

    id: Mapped[int] = mapped_column(autoincrement=True, primary_key=True, init=False)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspace.id"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), index=True, nullable=False)
    invited_by: Mapped[int | None] = mapped_column(ForeignKey("user.id"), nullable=True)
    uuid: Mapped[uuid_pkg.UUID] = mapped_column(UUID(as_uuid=True), default_factory=uuid7, unique=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="workspace_member")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default_factory=lambda: datetime.now(UTC))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True)
