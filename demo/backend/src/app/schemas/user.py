import uuid as uuid_pkg

from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel


class UserReadInternal(BaseModel):
	model_config = ConfigDict(
		validate_by_name=True,
		validate_by_alias=True,
		alias_generator=to_camel,
		populate_by_name=True,
	)

	id: int
	uuid: uuid_pkg.UUID
	username: EmailStr
	name: str | None = None
	email: EmailStr | None = None