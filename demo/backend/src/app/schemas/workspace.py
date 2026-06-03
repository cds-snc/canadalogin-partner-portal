import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class WorkspaceCreate(BaseModel):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	name: str
	slug: str | None = None
	description: str | None = None


class WorkspaceRead(BaseModel):
	model_config = ConfigDict(
		from_attributes=True,
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	id: int
	uuid: uuid_pkg.UUID
	name: str
	slug: str
	description: str | None = None
	department_id: int
	created_by: int


class WorkspaceUpdate(BaseModel):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	name: str | None = None
	slug: str | None = None
	description: str | None = None


class WorkspaceMemberCreate(BaseModel):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	user_uuid: uuid_pkg.UUID
	role: str


class RPApplicationCurrentUserRead(BaseModel):
	model_config = ConfigDict(
		from_attributes=True,
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	id: int
	uuid: uuid_pkg.UUID
	name: str
	status: str
	workspace_name: str
	workspace_uuid: uuid_pkg.UUID


class RPApplicationUpdate(BaseModel):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	name: str | None = None
	description: str | None = None
	application_url: str | None = None
	redirect_uris: list[str] | None = None
	client_type: str | None = None
	client_auth_method: str | None = None
	pkce_enabled: bool | None = None
	application_info_uuid: uuid_pkg.UUID | None = None


class RPApplicationCreate(BaseModel):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	name: str
	description: str | None = None
	application_url: str
	redirect_uris: list[str]
	client_type: str
	client_auth_method: str
	pkce_enabled: bool
	application_info_uuid: uuid_pkg.UUID


class RPApplicationDeveloperInvitationAccept(BaseModel):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	token: str
	
class RPApplicationDeveloperInvitationCreate(BaseModel):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	email: str


class RPApplicationDeveloperInvitationRead(BaseModel):
	model_config = ConfigDict(
		from_attributes=True,
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	id: int
	uuid: uuid_pkg.UUID
	workspace_id: int
	rp_application_id: int
	invited_email: str
	invited_by: int
	role: str
	status: str


class ApplicationInfoRead(BaseModel):
	model_config = ConfigDict(
		from_attributes=True,
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	id: int
	uuid: uuid_pkg.UUID
	workspace_id: int
	created_by: int
	application_name: str
	program_line_of_business: str
	current_sign_in_options: list[str]
	rp_application_uuid: uuid_pkg.UUID


class ApplicationInfoCreate(BaseModel):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	application_name: str


class ApplicationInfoUpdate(BaseModel):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	application_name: str | None = None


class RPApplicationClientCredentialsRead(BaseModel):
	model_config = ConfigDict(
		from_attributes=True,
		validate_by_name=True,
		populate_by_name=True,
	)

	client_id: str
	client_secret: str
	client_secret_id: str


class RPApplicationRotatedClientSecretRead(BaseModel):
	model_config = ConfigDict(from_attributes=True, validate_by_name=True, populate_by_name=True)

	description: str | None = None
	expired_at: int
	rotated_at: int
	value: str
	secret_id: str


class RPApplicationRotatedClientSecretCreate(BaseModel):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	delete_rotated_secrets: bool | None = None
	description: str | None = None
	rotated_secret_expired_at: int | None = None


class RPApplicationAuditTrailEventRead(BaseModel):
	model_config = ConfigDict(
		from_attributes=True,
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	country: str | None = None
	ip_version: int | None = None
	origin: str | None = None
	origin_display: str | None = None
	result: str | None = None
	time_seconds: int | None = None
	username: str | None = None
	username_display: str | None = None
	username_known: bool | None = None


class RPApplicationAuditTrailRead(BaseModel):
	model_config = ConfigDict(
		from_attributes=True,
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	events: list[RPApplicationAuditTrailEventRead]
	next: str | None = None
	total: int


class ApplicationContactBase(BaseModel):
	model_config = ConfigDict(
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	first_name: str
	last_name: str
	title_role: str
	email: str
	phone_number: str
	alternate_phone_number: str | None = None
	contact_type: str | None = None
	action: str | None = None
	contact_roles: list[str] = Field(default_factory=list)


class ApplicationContactCreate(ApplicationContactBase):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)


class ApplicationContactUpdate(BaseModel):
	model_config = ConfigDict(
		extra="forbid",
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	first_name: str | None = None
	last_name: str | None = None
	title_role: str | None = None
	email: str | None = None
	phone_number: str | None = None
	alternate_phone_number: str | None = None
	contact_type: str | None = None
	action: str | None = None
	contact_roles: list[str] | None = None


class ApplicationContactRead(ApplicationContactBase):
	model_config = ConfigDict(
		from_attributes=True,
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	id: int
	uuid: uuid_pkg.UUID
	application_info_id: int
	created_at: datetime | None = None