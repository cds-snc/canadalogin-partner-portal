import uuid as uuid_pkg
from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApplicationEnvironmentApplicationRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    uuid: uuid_pkg.UUID
    name_en: str
    name_fr: str | None = None


class ApplicationEnvironmentRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    uuid: uuid_pkg.UUID
    partner_label: str
    tenant_code: str
    status_code: str
    created_at: datetime
    updated_at: datetime | None = None


class ApplicationEnvironmentListRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    application: ApplicationEnvironmentApplicationRead
    data: list[ApplicationEnvironmentRead]
    total_count: int
    has_more: bool
    page: int
    items_per_page: int
