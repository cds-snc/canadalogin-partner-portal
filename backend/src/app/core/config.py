import os
from enum import Enum
from typing import Optional

from pydantic import SecretStr, computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    APP_NAME: str = "FastAPI app"
    APP_DESCRIPTION: str | None = None
    APP_VERSION: str | None = None
    LICENSE_NAME: str | None = None
    CONTACT_NAME: str | None = None
    CONTACT_EMAIL: str | None = None
    TERMS_VERSION: str = "v1"


class CryptSettings(BaseSettings):
    SECRET_KEY: SecretStr = SecretStr("secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7


class SessionSettings(BaseSettings):
    SESSION_COOKIE_NAME: str = "app_session"
    SESSION_COOKIE_SECURE: bool = False
    SESSION_COOKIE_DOMAIN: str = ".canada.ca"
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
    OIDC_GROUP_CLAIM_KEY: str = "groupIds"
    OIDC_ADMIN_GROUP_NAME: str = "admin"
    OIDC_APPLICATION_OWNERS_GROUP_NAME: str = "application owners"
    CLPP_ADMIN_ROLE_NAME: str = "admin"
    CLPP_APPLICATION_OWNERS_ROLE_NAME: str = "application owners"


class GCNotifySettings(BaseSettings):
    GC_NOTIFY_BASE_URL: str = "https://api.notification.canada.ca"
    GC_NOTIFY_API_KEY: SecretStr | None = None
    GC_NOTIFY_RP_APPLICATION_INVITE_TEMPLATE_ID: str | None = None
    GC_NOTIFY_EMAIL_REPLY_TO_ID: str | None = None
    RP_APPLICATION_INVITE_URL_BASE: str = "http://localhost:3000/invitations/rp-applications"
    RP_APPLICATION_INVITATION_EXPIRE_DAYS: int = 7


class FileLoggerSettings(BaseSettings):
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
    SUPERUSER: str | None = None


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
    START_ARQ_ON_STARTUP: bool = True


class IBMVerifySettings(BaseSettings):
    IBM_SV_ADMIN_BASE_URL: str | None = None
    IBM_SV_ADMIN_CLIENT_ID: SecretStr | None = None
    IBM_SV_ADMIN_CLIENT_SECRET: SecretStr | None = None


class EnvironmentOption(str, Enum):
    LOCAL = "local"
    DEVELOPMENT = "dev"
    TESTING = "test"
    STAGING = "staging"
    PRODUCTION = "production"


class EnvironmentSettings(BaseSettings):
    ENVIRONMENT: EnvironmentOption = EnvironmentOption.LOCAL


class CORSSettings(BaseSettings):
    CORS_ORIGINS: list[str] = ["*"]
    CORS_METHODS: list[str] = ["*"]
    CORS_HEADERS: list[str] = ["*"]


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
    GCNotifySettings,
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

    @model_validator(mode="after")
    def _apply_redis_session_defaults(self) -> "Settings":
        """Fall back to session Redis connection params for cache/queue/rate-limit when not explicitly set.

        DB number is intentionally NOT cascaded — each client keeps its own default
        (session=1, cache/queue/rate-limit=0).
        """
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


settings = Settings()
