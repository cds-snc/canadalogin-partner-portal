import json
import uuid as uuid_pkg
from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class MAUCsvRow(BaseModel):
    application_name: str = Field(..., min_length=1)
    total_logins: int = Field(..., ge=0)
    unique_users: int = Field(..., ge=0)
    failed_logins: int = Field(..., ge=0)
    successful_logins: int = Field(..., ge=0)
    mtd_unique_users: int = Field(..., ge=0)
    date: date

    def to_cache_json(self) -> str:
        return json.dumps(self.model_dump(mode="json"), default=str)

    @staticmethod
    def from_cache_json(value: str) -> "MAUCsvRow":
        data: dict[str, Any] = json.loads(value)
        return MAUCsvRow(**data)


class MAUApplicationRecord(BaseModel):
    date: date
    application_name: str
    total_logins: int
    unique_users: int
    failed_logins: int
    successful_logins: int
    mtd_unique_users: int


class MAUDateApplications(BaseModel):
    date: date
    applications: dict[str, MAUApplicationRecord]


class MAUReportItem(BaseModel):
    date: date
    application_name: str
    total_logins: int
    unique_users: int
    failed_logins: int
    successful_logins: int
    mtd_unique_users: int


class MAUReportDestinationRead(BaseModel):
    """Minimum secret-free navigation context for one scoped usage report."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )

    uuid: uuid_pkg.UUID
    workspace_uuid: uuid_pkg.UUID
    workspace_name: str
    application_information_uuid: uuid_pkg.UUID
    application_name_en: str
    application_name_fr: str
    configuration_name: str
    partner_environment: str | None = None
    canada_login_environment: str | None = None


class MAUReportResponse(BaseModel):
    application_name: str
    workspace_uuid: uuid_pkg.UUID
    workspace_name: str
    application_information_uuid: uuid_pkg.UUID
    application_name_en: str
    application_name_fr: str
    rp_configuration_uuid: uuid_pkg.UUID
    configuration_name: str
    canada_login_environment: str | None = None
    start_date: date
    end_date: date
    department_name: str | None = None
    department_name_fr: str | None = None
    partner_environment: str | None = None
    records: list[MAUReportItem]
