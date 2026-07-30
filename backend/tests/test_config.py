from src.app.core.config import Settings


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