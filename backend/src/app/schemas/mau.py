import json
from datetime import date
from typing import Any

from pydantic import BaseModel, Field


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


class MAUReportResponse(BaseModel):
    application_name: str
    start_date: date
    end_date: date
    department_name: str | None = None
    records: list[MAUReportItem]
