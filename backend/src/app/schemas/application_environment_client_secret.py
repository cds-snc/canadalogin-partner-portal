from datetime import UTC, datetime, timedelta

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


def _seven_days_from_now() -> int:
    return int((datetime.now(UTC) + timedelta(days=7)).timestamp())


class ApplicationEnvironmentClientSecretCredentialsRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    client_id: str
    client_secret: str | None = None
    client_secret_id: str | None = None


class ApplicationEnvironmentRotatedClientSecretRead(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    description: str | None = None
    expired_at: int | None = Field(None, alias="expiredAt")
    rotated_at: int | None = Field(None, alias="rotatedAt")
    value: str | None = Field(None, alias="value")
    secret_id: str | None = Field(None, alias="secretId")


class ApplicationEnvironmentClientSecretCreateRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    description: str = Field(..., min_length=1)
    rotated_secret_expired_at: int = Field(
        default_factory=_seven_days_from_now,
        alias="rotatedSecretExpiredAt",
        ge=1,
    )


class ApplicationEnvironmentClientSecretRotateRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    delete_rotated_secrets: bool = Field(False, alias="deleteRotatedSecrets")
    description: str = ""
    rotated_secret_expired_at: int = Field(
        default_factory=_seven_days_from_now,
        alias="rotatedSecretExpiredAt",
    )
