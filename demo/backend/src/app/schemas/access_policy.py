import uuid as uuid_pkg

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class AccessPolicyCreate(BaseModel):
    subject: str = Field(..., max_length=64)
    resource: str = Field(..., max_length=128)
    action: str = Field(..., max_length=32)


class AccessPolicyUpdate(BaseModel):
    subject: str | None = Field(None, max_length=64)
    resource: str | None = Field(None, max_length=128)
    action: str | None = Field(None, max_length=32)


class AccessPolicyOut(BaseModel):
    uuid: uuid_pkg.UUID
    subject: str
    resource: str
    action: str

    model_config = ConfigDict(from_attributes=True, validate_by_name=True, validate_by_alias=True, alias_generator=to_camel, populate_by_name=True)
