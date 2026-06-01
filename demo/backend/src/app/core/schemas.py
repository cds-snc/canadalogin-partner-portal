import uuid as uuid_pkg
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_serializer
from pydantic.alias_generators import to_camel
from uuid6 import uuid7


class ErrorDetail(BaseModel):
	model_config = ConfigDict(
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	code: str
	message: str
	details: Any | None = None
	request_id: str | None = None


class ErrorResponse(BaseModel):
	error: ErrorDetail


class UUIDSchema(BaseModel):
	uuid: uuid_pkg.UUID = Field(default_factory=uuid7)


class TimestampSchema(BaseModel):
	model_config = ConfigDict(
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	created_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
	updated_at: datetime | None = Field(default=None)

	@field_serializer("created_at")
	def serialize_created_at(self, value: datetime | None, _info: Any) -> str | None:
		return value.isoformat() if value is not None else None

	@field_serializer("updated_at")
	def serialize_updated_at(self, value: datetime | None, _info: Any) -> str | None:
		return value.isoformat() if value is not None else None


class PersistentDeletion(BaseModel):
	model_config = ConfigDict(
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	deleted_at: datetime | None = Field(default=None)
	is_deleted: bool = Field(default=False)

	@field_serializer("deleted_at")
	def serialize_deleted_at(self, value: datetime | None, _info: Any) -> str | None:
		return value.isoformat() if value is not None else None