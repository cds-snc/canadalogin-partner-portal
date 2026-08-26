import os
import re
from enum import Enum
from ipaddress import ip_address
from typing import Any, Optional
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, computed_field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from .identity import normalize_partner_access_domain


class EnvironmentOption(str, Enum):
    LOCAL = "local"
    DEVELOPMENT = "dev"
    TESTING = "test"
    STAGING = "staging"
    PRODUCTION = "production"


class AuthModeOption(str, Enum):
    OIDC = "oidc"
    LOCAL_DEV = "local_dev"


LOCAL_TEST_SECRET_KEY = "local-test-only-signing-key-do-not-use-in-shared-environments-2026"
DEFAULT_CORS_ORIGINS = (
    "http://127.0.0.1:3000",
    "http://localhost:3000",
)
DEFAULT_CORS_METHODS = ("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
DEFAULT_CORS_HEADERS = (
    "Accept",
    "Content-Type",
    "Idempotency-Key",
    "X-Request-ID",
)
COOKIE_DOMAIN_LABEL = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$")


class AppSettings(BaseSettings):
    APP_NAME: str = "FastAPI app"
    APP_DESCRIPTION: str | None = None
    APP_VERSION: str | None = None
    LICENSE_NAME: str | None = None
    CONTACT_NAME: str | None = None
    CONTACT_EMAIL: str | None = None
    TERMS_VERSION: str = "v1"


class CryptSettings(BaseSettings):
    SECRET_KEY: SecretStr = SecretStr(LOCAL_TEST_SECRET_KEY)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7


class SessionSettings(BaseSettings):
    SESSION_COOKIE_NAME: str = "app_session"
    SESSION_COOKIE_SECURE: bool = False
    SESSION_COOKIE_DOMAIN: str | None = None
    SESSION_COOKIE_SAMESITE: str = "lax"
    SESSION_MAX_AGE: int = 60 * 60 * 8
    SESSION_ROLLING: bool = False


class RedisSessionSettings(BaseSettings):
    REDIS_SESSION_HOST: str = "localhost"
    REDIS_SESSION_PORT: int = 6379
    REDIS_SESSION_DB: int = 1
    REDIS_SESSION_PASSWORD: SecretStr | None = None
    REDIS_SESSION_SSL: bool = False
    REDIS_SESSION_PREFIX: str = "app.sessions."
    REDIS_SESSION_GC_TTL: int = 60 * 60 * 24 * 30

    @computed_field  # type: ignore[prop-decorator]
    @property
    def REDIS_SESSION_URL(self) -> str:
        scheme = "rediss" if self.REDIS_SESSION_SSL else "redis"
        password = ""
        if self.REDIS_SESSION_PASSWORD is not None:
            password = f":{self.REDIS_SESSION_PASSWORD.get_secret_value()}@"
        return f"{scheme}://{password}{self.REDIS_SESSION_HOST}:{self.REDIS_SESSION_PORT}/{self.REDIS_SESSION_DB}"


class OIDCSettings(BaseSettings):
    AUTH_MODE: AuthModeOption = AuthModeOption.OIDC
    ENABLE_DEV_ROLE_SELECTOR: bool = False
    DEV_SESSION_ALLOWED_ORIGINS: list[str] = Field(default_factory=lambda: list(DEFAULT_CORS_ORIGINS))
    OIDC_ENABLED: bool = False
    OIDC_PROVIDER_NAME: str = "oidc"
    OIDC_SERVER_METADATA_URL: str | None = None
    OIDC_CLIENT_ID: str | None = None
    OIDC_CLIENT_SECRET: SecretStr | None = None
    OIDC_SCOPES: str = "openid profile email"
    OIDC_REDIRECT_URI: str | None = None
    OIDC_REDIRECT_PATH: str = "/api/v1/auth/oidc/callback"
    OIDC_POST_LOGIN_REDIRECT: str = "/auth-complete"
    OIDC_POST_LOGOUT_REDIRECT_URI: str = "/"
    OIDC_ACCESS_DENIED_REDIRECT: str = "/access-denied"
    PARTNER_ACCESS_ALLOWED_EMAIL_DOMAINS: list[str] = Field(default_factory=list)

    @field_validator("ENABLE_DEV_ROLE_SELECTOR", mode="before")
    @classmethod
    def _parse_exact_dev_selector_boolean(cls, value: Any) -> bool:
        if isinstance(value, bool):
            return value
        if value == "true":
            return True
        if value == "false":
            return False
        raise ValueError("ENABLE_DEV_ROLE_SELECTOR must be exactly true or false")

    @field_validator("DEV_SESSION_ALLOWED_ORIGINS")
    @classmethod
    def _validate_dev_session_allowed_origins(cls, values: list[str]) -> list[str]:
        if not values:
            raise ValueError("DEV_SESSION_ALLOWED_ORIGINS must not be empty")
        return [normalize_local_origin(value) for value in values]

    @field_validator("PARTNER_ACCESS_ALLOWED_EMAIL_DOMAINS")
    @classmethod
    def _validate_partner_access_allowed_email_domains(cls, values: list[str]) -> list[str]:
        return list(dict.fromkeys(normalize_partner_access_domain(value) for value in values))


class InvitationSettings(BaseSettings):
    RP_APPLICATION_INVITE_URL_BASE: str = "http://localhost:3000/invitations/rp-applications"
    RP_APPLICATION_INVITATION_EXPIRE_DAYS: int = 7


class FileLoggerSettings(BaseSettings):
    FILE_LOG_ENABLED: bool = False
    FILE_LOG_MAX_BYTES: int = 10 * 1024 * 1024
    FILE_LOG_BACKUP_COUNT: int = 5
    FILE_LOG_FORMAT_JSON: bool = True
    FILE_LOG_LEVEL: str = "INFO"

    # Include request ID, path, method, client host, and status code in the file log
    FILE_LOG_INCLUDE_REQUEST_ID: bool = True
    FILE_LOG_INCLUDE_PATH: bool = True
    FILE_LOG_INCLUDE_METHOD: bool = True
    FILE_LOG_INCLUDE_CLIENT_HOST: bool = True
    FILE_LOG_INCLUDE_STATUS_CODE: bool = True


class ConsoleLoggerSettings(BaseSettings):
    CONSOLE_LOG_LEVEL: str = "INFO"
    CONSOLE_LOG_FORMAT_JSON: bool = False

    # Include request ID, path, method, client host, and status code in the console log
    CONSOLE_LOG_INCLUDE_REQUEST_ID: bool = False
    CONSOLE_LOG_INCLUDE_PATH: bool = False
    CONSOLE_LOG_INCLUDE_METHOD: bool = False
    CONSOLE_LOG_INCLUDE_CLIENT_HOST: bool = False
    CONSOLE_LOG_INCLUDE_STATUS_CODE: bool = False


class DatabaseSettings(BaseSettings):
    pass


class SQLiteSettings(DatabaseSettings):
    SQLITE_URI: str = "./sql_app.db"
    SQLITE_SYNC_PREFIX: str = "sqlite:///"
    SQLITE_ASYNC_PREFIX: str = "sqlite+aiosqlite:///"


class MySQLSettings(DatabaseSettings):
    MYSQL_USER: str = "username"
    MYSQL_PASSWORD: str = "password"
    MYSQL_SERVER: str = "localhost"
    MYSQL_PORT: int = 5432
    MYSQL_DB: str = "dbname"
    MYSQL_SYNC_PREFIX: str = "mysql://"
    MYSQL_ASYNC_PREFIX: str = "mysql+aiomysql://"
    MYSQL_URL: str | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def MYSQL_URI(self) -> str:
        credentials = f"{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
        location = f"{self.MYSQL_SERVER}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
        return f"{credentials}@{location}"


class PostgresSettings(DatabaseSettings):
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "postgres"
    POSTGRES_SYNC_PREFIX: str = "postgresql://"
    POSTGRES_ASYNC_PREFIX: str = "postgresql+asyncpg://"
    POSTGRES_URL: str | None = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def POSTGRES_URI(self) -> str:
        credentials = f"{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
        location = f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        return f"{credentials}@{location}"


class FirstUserSettings(BaseSettings):
    INITIAL_CL_ADMIN_EMAIL: str | None = None


class TestSettings(BaseSettings): ...


class RedisCacheSettings(BaseSettings):
    REDIS_CACHE_HOST: Optional[str] = None
    REDIS_CACHE_PORT: Optional[int] = None
    REDIS_CACHE_DB: Optional[int] = None
    REDIS_CACHE_PASSWORD: Optional[SecretStr] = None
    REDIS_CACHE_SSL: Optional[bool] = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def REDIS_CACHE_URL(self) -> str:
        scheme = "rediss" if self.REDIS_CACHE_SSL else "redis"
        password = ""
        if self.REDIS_CACHE_PASSWORD is not None:
            password = f":{self.REDIS_CACHE_PASSWORD.get_secret_value()}@"
        host = self.REDIS_CACHE_HOST or "localhost"
        port = self.REDIS_CACHE_PORT or 6379
        db = f"/{self.REDIS_CACHE_DB}" if self.REDIS_CACHE_DB is not None else ""
        return f"{scheme}://{password}{host}:{port}{db}"


class ClientSideCacheSettings(BaseSettings):
    CLIENT_CACHE_MAX_AGE: int = 60


class RedisQueueSettings(BaseSettings):
    REDIS_QUEUE_HOST: Optional[str] = None
    REDIS_QUEUE_PORT: Optional[int] = None
    REDIS_QUEUE_DB: Optional[int] = None
    REDIS_QUEUE_PASSWORD: Optional[SecretStr] = None
    REDIS_QUEUE_SSL: Optional[bool] = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def REDIS_QUEUE_URL(self) -> str:
        scheme = "rediss" if self.REDIS_QUEUE_SSL else "redis"
        password = ""
        if self.REDIS_QUEUE_PASSWORD is not None:
            password = f":{self.REDIS_QUEUE_PASSWORD.get_secret_value()}@"
        host = self.REDIS_QUEUE_HOST or "localhost"
        port = self.REDIS_QUEUE_PORT or 6379
        db = f"/{self.REDIS_QUEUE_DB}" if self.REDIS_QUEUE_DB is not None else ""
        return f"{scheme}://{password}{host}:{port}{db}"


class RedisRateLimiterSettings(BaseSettings):
    REDIS_RATE_LIMIT_HOST: Optional[str] = None
    REDIS_RATE_LIMIT_PORT: Optional[int] = None
    REDIS_RATE_LIMIT_DB: Optional[int] = None
    REDIS_RATE_LIMIT_PASSWORD: Optional[SecretStr] = None
    REDIS_RATE_LIMIT_SSL: Optional[bool] = None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def REDIS_RATE_LIMIT_URL(self) -> str:
        scheme = "rediss" if self.REDIS_RATE_LIMIT_SSL else "redis"
        password = ""
        if self.REDIS_RATE_LIMIT_PASSWORD is not None:
            password = f":{self.REDIS_RATE_LIMIT_PASSWORD.get_secret_value()}@"
        host = self.REDIS_RATE_LIMIT_HOST or "localhost"
        port = self.REDIS_RATE_LIMIT_PORT or 6379
        db = f"/{self.REDIS_RATE_LIMIT_DB}" if self.REDIS_RATE_LIMIT_DB is not None else ""
        return f"{scheme}://{password}{host}:{port}{db}"


class DefaultRateLimitSettings(BaseSettings):
    DEFAULT_RATE_LIMIT_LIMIT: int = 10
    DEFAULT_RATE_LIMIT_PERIOD: int = 3600


class WorkerCronSettings(BaseSettings):
    TIMEZONE: str = "America/Toronto"
    LOAD_MAU_ENABLED: bool = False
    IBM_RP_APPLICATION_SYNC_ENABLED: bool = False

    @field_validator("IBM_RP_APPLICATION_SYNC_ENABLED", mode="before")
    @classmethod
    def _parse_exact_ibm_rp_application_sync_boolean(cls, value: Any) -> bool:
        if isinstance(value, bool):
            return value
        if value == "true":
            return True
        if value == "false":
            return False
        raise ValueError("IBM_RP_APPLICATION_SYNC_ENABLED must be exactly true or false")


class IBMVerifySettings(BaseSettings):
    IBM_SV_ADMIN_BASE_URL: str | None = None
    IBM_SV_ADMIN_CLIENT_ID: SecretStr | None = None
    IBM_SV_ADMIN_CLIENT_SECRET: SecretStr | None = None


LOCAL_DEV_SESSION_GATE_STATE_KEY = "local_dev_session_gate"
LOCAL_DEV_SESSION_ALLOWED_ORIGINS_STATE_KEY = "local_dev_session_allowed_origins"
LOCAL_DEV_SESSION_FIXTURE_KEY = "local_dev_fixture_id"
LOCAL_DEV_LOOPBACK_HOSTS = frozenset({"127.0.0.1", "::1", "localhost"})
LOCAL_DEV_SESSION_ENABLED_GATE = (
    EnvironmentOption.LOCAL.value,
    AuthModeOption.LOCAL_DEV.value,
    True,
    False,
)


def normalize_http_origin(value: str) -> str:
    """Return a canonical exact HTTP(S) origin or reject it."""

    if not isinstance(value, str) or value != value.strip() or not value:
        raise ValueError("origin must be a non-empty exact string")

    parsed = urlsplit(value)
    if (
        parsed.scheme not in {"http", "https"}
        or parsed.hostname is None
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path not in {"", "/"}
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("origin must be an exact HTTP(S) origin")

    try:
        port = parsed.port
    except ValueError as exc:
        raise ValueError("origin contains an invalid port") from exc

    host = f"[{parsed.hostname}]" if ":" in parsed.hostname else parsed.hostname
    default_port = 80 if parsed.scheme == "http" else 443
    port_suffix = "" if port is None or port == default_port else f":{port}"
    return f"{parsed.scheme}://{host}{port_suffix}"


def normalize_local_origin(value: str) -> str:
    """Return a canonical loopback HTTP(S) origin or reject it."""

    origin = normalize_http_origin(value)
    if urlsplit(origin).hostname not in LOCAL_DEV_LOOPBACK_HOSTS:
        raise ValueError("local origin must be an HTTP(S) loopback origin")
    return origin


def normalize_cookie_domain(value: str) -> str:
    """Return a syntactically safe non-local cookie domain."""

    if not isinstance(value, str) or value != value.strip() or not value:
        raise ValueError("session cookie domain must be a non-empty domain name")

    leading_dot = value.startswith(".")
    domain = value.removeprefix(".").lower()
    if len(domain) > 253 or domain.endswith(".") or ".." in domain:
        raise ValueError("session cookie domain must be a valid domain name")

    try:
        ip_address(domain)
    except ValueError:
        pass
    else:
        raise ValueError("session cookie domain must not be an IP address")

    labels = domain.split(".")
    if len(labels) < 2 or any(COOKIE_DOMAIN_LABEL.fullmatch(label) is None for label in labels):
        raise ValueError("session cookie domain must be a valid non-local domain name")
    if domain in LOCAL_DEV_LOOPBACK_HOSTS:
        raise ValueError("session cookie domain must not be a loopback host")

    return f".{domain}" if leading_dot else domain


def local_dev_session_gate(config: object) -> tuple[str | None, str | None, bool, bool]:
    environment = getattr(config, "ENVIRONMENT", None)
    auth_mode = getattr(config, "AUTH_MODE", None)
    return (
        environment.value if isinstance(environment, EnvironmentOption) else environment,
        auth_mode.value if isinstance(auth_mode, AuthModeOption) else auth_mode,
        getattr(config, "ENABLE_DEV_ROLE_SELECTOR", False) is True,
        getattr(config, "OIDC_ENABLED", False) is True,
    )


def is_local_dev_session_enabled(config: object) -> bool:
    return local_dev_session_gate(config) == LOCAL_DEV_SESSION_ENABLED_GATE


def validate_local_dev_session_configuration(config: object) -> None:
    """Reject partial or conflicting opt-in to the local session adapter."""

    gate = local_dev_session_gate(config)
    local_dev_requested = gate[1] == AuthModeOption.LOCAL_DEV.value or gate[2]
    if not local_dev_requested or gate == LOCAL_DEV_SESSION_ENABLED_GATE:
        return

    if gate[1] == AuthModeOption.LOCAL_DEV.value and gate[3]:
        raise ValueError("OIDC_ENABLED and AUTH_MODE=local_dev cannot be enabled together")
    raise ValueError("Local developer sessions require ENVIRONMENT=local, AUTH_MODE=local_dev, ENABLE_DEV_ROLE_SELECTOR=true, and OIDC_ENABLED=false")


class EnvironmentSettings(BaseSettings):
    ENVIRONMENT: EnvironmentOption = EnvironmentOption.LOCAL


class CORSSettings(BaseSettings):
    CORS_ORIGINS: list[str] = Field(default_factory=lambda: list(DEFAULT_CORS_ORIGINS))
    CORS_METHODS: list[str] = Field(default_factory=lambda: list(DEFAULT_CORS_METHODS))
    CORS_HEADERS: list[str] = Field(default_factory=lambda: list(DEFAULT_CORS_HEADERS))

    @field_validator("CORS_ORIGINS")
    @classmethod
    def _validate_cors_origins(cls, values: list[str]) -> list[str]:
        if "*" in values:
            raise ValueError("Credentialed CORS does not permit a wildcard origin")
        return list(dict.fromkeys(normalize_http_origin(value) for value in values))

    @field_validator("CORS_METHODS")
    @classmethod
    def _validate_cors_methods(cls, values: list[str]) -> list[str]:
        normalized = [value.upper() for value in values]
        allowed = set(DEFAULT_CORS_METHODS)
        if not normalized or any(value not in allowed for value in normalized):
            raise ValueError("CORS_METHODS must be an explicit list of supported methods")
        return list(dict.fromkeys(normalized))

    @field_validator("CORS_HEADERS")
    @classmethod
    def _validate_cors_headers(cls, values: list[str]) -> list[str]:
        if not values or any(value == "*" or not value.strip() for value in values):
            raise ValueError("CORS_HEADERS must be an explicit non-empty list")
        return list(dict.fromkeys(value.strip() for value in values))


class S3Settings(BaseSettings):
    AWS_S3_REGION: str = "ca-central-1"
    AWS_S3_ROLE_ARN: str = ""
    AWS_S3_PROFILE: str = ""
    S3_MAU_BUCKET_NAME: str = ""
    S3_MAU_FOLDER: str = "ibm_verify/app_login_counts/"


class Settings(
    AppSettings,
    SQLiteSettings,
    PostgresSettings,
    CryptSettings,
    SessionSettings,
    RedisSessionSettings,
    OIDCSettings,
    InvitationSettings,
    IBMVerifySettings,
    FirstUserSettings,
    TestSettings,
    RedisCacheSettings,
    ClientSideCacheSettings,
    RedisQueueSettings,
    RedisRateLimiterSettings,
    DefaultRateLimitSettings,
    EnvironmentSettings,
    CORSSettings,
    S3Settings,
    FileLoggerSettings,
    ConsoleLoggerSettings,
    WorkerCronSettings,
):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.realpath(__file__)), "..", "..", "..", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator(
        "SESSION_COOKIE_DOMAIN",
        "REDIS_SESSION_PASSWORD",
        "REDIS_CACHE_HOST",
        "REDIS_CACHE_PORT",
        "REDIS_CACHE_DB",
        "REDIS_CACHE_PASSWORD",
        "REDIS_CACHE_SSL",
        "REDIS_QUEUE_HOST",
        "REDIS_QUEUE_PORT",
        "REDIS_QUEUE_DB",
        "REDIS_QUEUE_PASSWORD",
        "REDIS_QUEUE_SSL",
        "REDIS_RATE_LIMIT_HOST",
        "REDIS_RATE_LIMIT_PORT",
        "REDIS_RATE_LIMIT_DB",
        "REDIS_RATE_LIMIT_PASSWORD",
        "REDIS_RATE_LIMIT_SSL",
        mode="before",
    )
    @classmethod
    def _blank_redis_values_to_none(cls, value: Any) -> Any:
        if value == "":
            return None
        return value

    @model_validator(mode="after")
    def _apply_redis_session_defaults(self) -> "Settings":
        """Fall back to session Redis connection params for cache/queue/rate-limit when not explicitly set.

        DB number is intentionally NOT cascaded — each client keeps its own default
        (session=1, cache/queue/rate-limit=0).
        """
        if self.ENVIRONMENT in {
            EnvironmentOption.LOCAL,
            EnvironmentOption.TESTING,
        }:
            # Browsers reject a Domain cookie issued by localhost/loopback. Local
            # and test sessions are always host-only, even if a developer's
            # ambient .env contains a shared-environment cookie domain.
            self.SESSION_COOKIE_DOMAIN = None

        if not self.REDIS_CACHE_HOST:
            self.REDIS_CACHE_HOST = self.REDIS_SESSION_HOST
        if self.REDIS_CACHE_PORT is None:
            self.REDIS_CACHE_PORT = self.REDIS_SESSION_PORT
        if self.REDIS_CACHE_PASSWORD is None:
            self.REDIS_CACHE_PASSWORD = self.REDIS_SESSION_PASSWORD
        if self.REDIS_CACHE_SSL is None:
            self.REDIS_CACHE_SSL = self.REDIS_SESSION_SSL

        if not self.REDIS_QUEUE_HOST:
            self.REDIS_QUEUE_HOST = self.REDIS_SESSION_HOST
        if self.REDIS_QUEUE_PORT is None:
            self.REDIS_QUEUE_PORT = self.REDIS_SESSION_PORT
        if self.REDIS_QUEUE_PASSWORD is None:
            self.REDIS_QUEUE_PASSWORD = self.REDIS_SESSION_PASSWORD
        if self.REDIS_QUEUE_SSL is None:
            self.REDIS_QUEUE_SSL = self.REDIS_SESSION_SSL

        if not self.REDIS_RATE_LIMIT_HOST:
            self.REDIS_RATE_LIMIT_HOST = self.REDIS_SESSION_HOST
        if self.REDIS_RATE_LIMIT_PORT is None:
            self.REDIS_RATE_LIMIT_PORT = self.REDIS_SESSION_PORT
        if self.REDIS_RATE_LIMIT_PASSWORD is None:
            self.REDIS_RATE_LIMIT_PASSWORD = self.REDIS_SESSION_PASSWORD
        if self.REDIS_RATE_LIMIT_SSL is None:
            self.REDIS_RATE_LIMIT_SSL = self.REDIS_SESSION_SSL

        return self

    @model_validator(mode="after")
    def _validate_auth_mode(self) -> "Settings":
        validate_local_dev_session_configuration(self)
        return self

    @model_validator(mode="after")
    def _validate_ibm_rp_application_sync(self) -> "Settings":
        if self.IBM_RP_APPLICATION_SYNC_ENABLED and self.ENVIRONMENT not in {
            EnvironmentOption.LOCAL,
            EnvironmentOption.TESTING,
        }:
            raise ValueError("IBM_RP_APPLICATION_SYNC_ENABLED may be enabled only in local or test")
        return self

    @model_validator(mode="after")
    def _validate_security_configuration(self) -> "Settings":
        secret_key = self.SECRET_KEY.get_secret_value()
        if len(secret_key.encode("utf-8")) < 32:
            raise ValueError("SECRET_KEY must contain at least 256 bits (32 bytes)")

        local_environments = {
            EnvironmentOption.LOCAL,
            EnvironmentOption.TESTING,
        }
        if self.ENVIRONMENT in local_environments and not self.PARTNER_ACCESS_ALLOWED_EMAIL_DOMAINS:
            self.PARTNER_ACCESS_ALLOWED_EMAIL_DOMAINS = [
                "example.gc.ca",
                "local.example",
            ]
        if self.ENVIRONMENT not in local_environments:
            if secret_key == LOCAL_TEST_SECRET_KEY:
                raise ValueError("SECRET_KEY must be explicitly configured outside local and test")
            if any(urlsplit(origin).hostname in LOCAL_DEV_LOOPBACK_HOSTS for origin in self.CORS_ORIGINS):
                raise ValueError("CORS_ORIGINS must be explicitly configured outside local and test")
            if self.SESSION_COOKIE_DOMAIN is None:
                raise ValueError("SESSION_COOKIE_DOMAIN must be explicitly configured outside local and test")
            self.SESSION_COOKIE_DOMAIN = normalize_cookie_domain(self.SESSION_COOKIE_DOMAIN)
            if not self.PARTNER_ACCESS_ALLOWED_EMAIL_DOMAINS:
                raise ValueError("PARTNER_ACCESS_ALLOWED_EMAIL_DOMAINS must be explicitly configured outside local and test")

        return self


settings = Settings()
