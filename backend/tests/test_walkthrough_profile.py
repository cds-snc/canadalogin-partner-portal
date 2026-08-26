from pathlib import Path


def test_walkthrough_profile_pins_all_persistence_to_loopback() -> None:
    makefile = (Path(__file__).resolve().parents[2] / "Makefile").read_text()
    start = makefile.index("WALKTHROUGH_PERSONA_ENV := \\")
    end = makefile.index("\nPOSTGRES_USER ?=", start)
    assignments: dict[str, str] = {}

    for line in makefile[start:end].splitlines()[1:]:
        assignment = line.strip().removesuffix("\\").strip()
        name, value = assignment.split("=", maxsplit=1)
        assignments[name] = value

    assert assignments == {
        "POSTGRES_USER": "postgres",
        "POSTGRES_PASSWORD": "postgres",
        "POSTGRES_SERVER": "127.0.0.1",
        "POSTGRES_PORT": "5432",
        "POSTGRES_DB": "$(WALKTHROUGH_POSTGRES_DB)",
        "POSTGRES_SYNC_PREFIX": "postgresql://",
        "POSTGRES_ASYNC_PREFIX": "postgresql+asyncpg://",
        "POSTGRES_URL": "",
        "REDIS_CACHE_HOST": "127.0.0.1",
        "REDIS_CACHE_PORT": "6379",
        "REDIS_CACHE_DB": "12",
        "REDIS_CACHE_PASSWORD": "",
        "REDIS_CACHE_SSL": "false",
        "REDIS_SESSION_HOST": "127.0.0.1",
        "REDIS_SESSION_PORT": "6379",
        "REDIS_SESSION_DB": "13",
        "REDIS_SESSION_PASSWORD": "",
        "REDIS_SESSION_SSL": "false",
        "REDIS_QUEUE_HOST": "127.0.0.1",
        "REDIS_QUEUE_PORT": "6379",
        "REDIS_QUEUE_DB": "14",
        "REDIS_QUEUE_PASSWORD": "",
        "REDIS_QUEUE_SSL": "false",
        "REDIS_RATE_LIMIT_HOST": "127.0.0.1",
        "REDIS_RATE_LIMIT_PORT": "6379",
        "REDIS_RATE_LIMIT_DB": "15",
        "REDIS_RATE_LIMIT_PASSWORD": "",
        "REDIS_RATE_LIMIT_SSL": "false",
    }

    assert "start-walkthrough-personas: prepare-walkthrough-personas" in makefile
    assert ("env $(WALKTHROUGH_PERSONA_ENV) docker compose -f $(DATABASE_COMPOSE_FILE) up -d db redis") in makefile
    assert ("env $(WALKTHROUGH_PERSONA_ENV) $(MAKE) --no-print-directory seed-local-personas") in makefile
    assert ("env $(LOCAL_PERSONA_ENV) $(WALKTHROUGH_PERSONA_ENV) $(MAKE) --no-print-directory start-dev") in makefile
