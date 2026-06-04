from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class LogoutOidcResponse(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    end_session_endpoint: str
    id_token_hint: str | None = None
    post_logout_redirect_uri: str | None = None


class LogoutResponse(BaseModel):
    model_config = ConfigDict(
        validate_by_name=True,
        validate_by_alias=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )

    message: str
    oidc_logout: LogoutOidcResponse | None = None
