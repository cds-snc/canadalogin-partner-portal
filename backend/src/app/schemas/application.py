import uuid as uuid_pkg

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApplicationRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    uuid: uuid_pkg.UUID
    name_en: str
    name_fr: str | None = None
    environment_count: int
