import pytest
from pydantic import ValidationError
from src.app.core.config import LOCAL_TEST_SECRET_KEY, Settings


class TestRedisSettings:
    def test_blank_optional_redis_overrides_fall_back_to_session_settings(self, monkeypatch) -> None:
        monkeypatch.setenv("REDIS_SESSION_HOST", "redis.internal")
        monkeypatch.setenv("REDIS_SESSION_PORT", "6380")
        monkeypatch.setenv("REDIS_SESSION_DB", "1")
        monkeypatch.setenv("REDIS_SESSION_PASSWORD", "test-password")
        monkeypatch.setenv("REDIS_SESSION_SSL", "false")

        monkeypatch.setenv("REDIS_CACHE_HOST", "")
        monkeypatch.setenv("REDIS_CACHE_PORT", "")
        monkeypatch.setenv("REDIS_CACHE_DB", "")
        monkeypatch.setenv("REDIS_CACHE_PASSWORD", "")
        monkeypatch.setenv("REDIS_CACHE_SSL", "")

        monkeypatch.setenv("REDIS_QUEUE_HOST", "")
        monkeypatch.setenv("REDIS_QUEUE_PORT", "")
        monkeypatch.setenv("REDIS_QUEUE_DB", "")
        monkeypatch.setenv("REDIS_QUEUE_PASSWORD", "")
        monkeypatch.setenv("REDIS_QUEUE_SSL", "")

        monkeypatch.setenv("REDIS_RATE_LIMIT_HOST", "")
        monkeypatch.setenv("REDIS_RATE_LIMIT_PORT", "")
        monkeypatch.setenv("REDIS_RATE_LIMIT_DB", "")
        monkeypatch.setenv("REDIS_RATE_LIMIT_PASSWORD", "")
        monkeypatch.setenv("REDIS_RATE_LIMIT_SSL", "")

        settings = Settings(_env_file=None)

        assert settings.REDIS_CACHE_HOST == "redis.internal"
        assert settings.REDIS_CACHE_PORT == 6380
        assert settings.REDIS_CACHE_DB is None
        assert settings.REDIS_CACHE_PASSWORD is not None
        assert settings.REDIS_CACHE_PASSWORD.get_secret_value() == "test-password"
        assert settings.REDIS_CACHE_SSL is False
        assert settings.REDIS_CACHE_URL == "redis://:test-password@redis.internal:6380"

        assert settings.REDIS_QUEUE_HOST == "redis.internal"
        assert settings.REDIS_QUEUE_PORT == 6380
        assert settings.REDIS_QUEUE_DB is None
        assert settings.REDIS_QUEUE_PASSWORD is not None
        assert settings.REDIS_QUEUE_PASSWORD.get_secret_value() == "test-password"
        assert settings.REDIS_QUEUE_SSL is False
        assert settings.REDIS_QUEUE_URL == "redis://:test-password@redis.internal:6380"

        assert settings.REDIS_RATE_LIMIT_HOST == "redis.internal"
        assert settings.REDIS_RATE_LIMIT_PORT == 6380
        assert settings.REDIS_RATE_LIMIT_DB is None
        assert settings.REDIS_RATE_LIMIT_PASSWORD is not None
        assert settings.REDIS_RATE_LIMIT_PASSWORD.get_secret_value() == "test-password"
        assert settings.REDIS_RATE_LIMIT_SSL is False
        assert settings.REDIS_RATE_LIMIT_URL == "redis://:test-password@redis.internal:6380"

    def test_blank_session_password_is_treated_as_unset(self, monkeypatch) -> None:
        monkeypatch.setenv("REDIS_SESSION_HOST", "redis.internal")
        monkeypatch.setenv("REDIS_SESSION_PORT", "6380")
        monkeypatch.setenv("REDIS_SESSION_DB", "1")
        monkeypatch.setenv("REDIS_SESSION_PASSWORD", "")

        settings = Settings(_env_file=None)

        assert settings.REDIS_SESSION_PASSWORD is None
        assert settings.REDIS_SESSION_URL == "redis://redis.internal:6380/1"


class TestSecuritySettings:
    def test_local_default_uses_a_nontrivial_test_only_key(self) -> None:
        config = Settings(_env_file=None)

        assert config.SECRET_KEY.get_secret_value() == LOCAL_TEST_SECRET_KEY
        assert len(config.SECRET_KEY.get_secret_value().encode("utf-8")) >= 32
        assert config.FILE_LOG_ENABLED is False
        assert config.IBM_RP_APPLICATION_SYNC_ENABLED is False
        assert config.SESSION_COOKIE_DOMAIN is None
        assert config.PARTNER_ACCESS_ALLOWED_EMAIL_DOMAINS == [
            "example.gc.ca",
            "local.example",
        ]

    @pytest.mark.parametrize("environment", ["local", "test"])
    def test_local_and_test_may_explicitly_enable_ibm_rp_application_sync(
        self,
        environment: str,
    ) -> None:
        config = Settings(
            _env_file=None,
            ENVIRONMENT=environment,
            IBM_RP_APPLICATION_SYNC_ENABLED=True,
        )

        assert config.IBM_RP_APPLICATION_SYNC_ENABLED is True

    @pytest.mark.parametrize("environment", ["dev", "staging", "production"])
    def test_shared_environments_reject_ibm_rp_application_sync_enablement(
        self,
        environment: str,
    ) -> None:
        with pytest.raises(
            ValidationError,
            match="IBM_RP_APPLICATION_SYNC_ENABLED may be enabled only in local or test",
        ):
            Settings(
                _env_file=None,
                ENVIRONMENT=environment,
                IBM_RP_APPLICATION_SYNC_ENABLED=True,
                SECRET_KEY="a" * 32,
                CORS_ORIGINS=["https://portal.example.ca"],
                SESSION_COOKIE_DOMAIN=".example.ca",
            )

    @pytest.mark.parametrize("environment", ["local", "test"])
    @pytest.mark.parametrize("ambient_domain", [".canada.ca", "canada.ca", "localhost"])
    def test_local_and_test_sessions_ignore_ambient_cookie_domains(
        self,
        environment: str,
        ambient_domain: str,
    ) -> None:
        config = Settings(
            _env_file=None,
            ENVIRONMENT=environment,
            SESSION_COOKIE_DOMAIN=ambient_domain,
        )

        assert config.SESSION_COOKIE_DOMAIN is None

    @pytest.mark.parametrize("environment", ["local", "test", "production"])
    def test_secret_key_shorter_than_256_bits_is_rejected(
        self,
        environment: str,
    ) -> None:
        with pytest.raises(ValidationError, match="at least 256 bits"):
            Settings(
                _env_file=None,
                ENVIRONMENT=environment,
                SECRET_KEY="secret-key",
                CORS_ORIGINS=["https://portal.example.ca"],
            )

    @pytest.mark.parametrize("environment", ["dev", "staging", "production"])
    def test_shared_environments_require_an_explicit_secret_key(
        self,
        environment: str,
    ) -> None:
        with pytest.raises(ValidationError, match="explicitly configured"):
            Settings(
                _env_file=None,
                ENVIRONMENT=environment,
                CORS_ORIGINS=["https://portal.example.ca"],
                SESSION_COOKIE_DOMAIN=".example.ca",
            )

    def test_production_accepts_explicit_secret_and_https_origin(self) -> None:
        config = Settings(
            _env_file=None,
            ENVIRONMENT="production",
            SECRET_KEY="a" * 32,
            CORS_ORIGINS=["https://portal.example.ca"],
            SESSION_COOKIE_DOMAIN=".example.ca",
            PARTNER_ACCESS_ALLOWED_EMAIL_DOMAINS=["Example.GC.CA"],
        )

        assert config.CORS_ORIGINS == ["https://portal.example.ca"]
        assert config.SESSION_COOKIE_DOMAIN == ".example.ca"
        assert config.PARTNER_ACCESS_ALLOWED_EMAIL_DOMAINS == ["example.gc.ca"]

    def test_shared_environments_require_partner_access_email_domains(self) -> None:
        with pytest.raises(
            ValidationError,
            match="PARTNER_ACCESS_ALLOWED_EMAIL_DOMAINS must be explicitly configured",
        ):
            Settings(
                _env_file=None,
                ENVIRONMENT="production",
                SECRET_KEY="a" * 32,
                CORS_ORIGINS=["https://portal.example.ca"],
                SESSION_COOKIE_DOMAIN=".example.ca",
            )

    @pytest.mark.parametrize(
        "domain",
        [
            "*.example.gc.ca",
            "https://example.gc.ca",
            "example.gc.ca/path",
            "example..gc.ca",
            "-example.gc.ca",
            "example-.gc.ca",
            f"{'a' * 64}.gc.ca",
            f"{'a' * 250}.gc.ca",
        ],
    )
    def test_partner_access_email_domains_must_be_exact(self, domain: str) -> None:
        with pytest.raises(ValidationError, match="exact domain names"):
            Settings(
                _env_file=None,
                PARTNER_ACCESS_ALLOWED_EMAIL_DOMAINS=[domain],
            )

    def test_default_cors_headers_allow_idempotent_registration_creation(self) -> None:
        config = Settings(_env_file=None)

        assert "Idempotency-Key" in config.CORS_HEADERS

    def test_shared_environments_require_an_explicit_cookie_domain(self) -> None:
        with pytest.raises(
            ValidationError,
            match="SESSION_COOKIE_DOMAIN must be explicitly configured",
        ):
            Settings(
                _env_file=None,
                ENVIRONMENT="production",
                SECRET_KEY="a" * 32,
                CORS_ORIGINS=["https://portal.example.ca"],
            )

    @pytest.mark.parametrize(
        "domain",
        ["localhost", "127.0.0.1", "https://portal.example.ca", "*.example.ca"],
    )
    def test_shared_environments_reject_unsafe_cookie_domains(self, domain: str) -> None:
        with pytest.raises(ValidationError, match="session cookie domain"):
            Settings(
                _env_file=None,
                ENVIRONMENT="production",
                SECRET_KEY="a" * 32,
                CORS_ORIGINS=["https://portal.example.ca"],
                SESSION_COOKIE_DOMAIN=domain,
            )

    @pytest.mark.parametrize(
        "override",
        [
            {"CORS_ORIGINS": ["*"]},
            {"CORS_METHODS": ["*"]},
            {"CORS_HEADERS": ["*"]},
        ],
    )
    def test_credentialed_cors_rejects_wildcards(
        self,
        override: dict[str, list[str]],
    ) -> None:
        with pytest.raises(ValidationError):
            Settings(_env_file=None, **override)

    def test_shared_environments_reject_loopback_cors_defaults(self) -> None:
        with pytest.raises(
            ValidationError,
            match="CORS_ORIGINS must be explicitly configured",
        ):
            Settings(
                _env_file=None,
                ENVIRONMENT="production",
                SECRET_KEY="b" * 32,
                SESSION_COOKIE_DOMAIN=".example.ca",
            )
