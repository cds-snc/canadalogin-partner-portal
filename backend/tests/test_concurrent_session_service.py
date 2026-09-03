from collections import defaultdict

import pytest

from src.app.services.concurrent_session_service import ConcurrentSessionService


class FakeRedis:
    def __init__(self):
        self.values: dict[str, str] = {}
        self.sorted_sets: dict[str, dict[str, float]] = defaultdict(dict)
        self.sets: dict[str, set[str]] = defaultdict(set)

    async def set(self, key, value, *, ex=None, nx=False):
        if nx and key in self.values:
            return False
        self.values[key] = value
        return True

    async def get(self, key):
        return self.values.get(key)

    async def delete(self, *keys):
        for key in keys:
            self.values.pop(key, None)
            self.sorted_sets.pop(key, None)
            self.sets.pop(key, None)
        return len(keys)

    async def eval(self, script, numkeys, key, value):
        if self.values.get(key) == value:
            self.values.pop(key, None)
            return 1
        return 0

    async def zadd(self, key, values):
        self.sorted_sets[key].update(values)

    async def zrange(self, key, start, end):
        values = sorted(self.sorted_sets[key], key=self.sorted_sets[key].get)
        return values[start:] if end == -1 else values[start : end + 1]

    async def zrem(self, key, *values):
        for value in values:
            self.sorted_sets[key].pop(value, None)

    async def zscore(self, key, value):
        return self.sorted_sets[key].get(value)

    async def zcard(self, key):
        return len(self.sorted_sets[key])

    async def expire(self, key, seconds):
        return True

    async def sadd(self, key, *values):
        self.sets[key].update(values)

    async def smembers(self, key):
        return self.sets[key]

    async def srem(self, key, *values):
        self.sets[key].difference_update(values)

    async def scard(self, key):
        return len(self.sets[key])


class FakeSessionStore:
    async def read(self, session_id, lifetime):
        return b"active"


@pytest.mark.asyncio
async def test_reserve_denies_fourth_session_and_allows_login_after_logout():
    service = ConcurrentSessionService(redis_client=FakeRedis(), session_store=FakeSessionStore(), limit=3)

    for session_id in ("session-1", "session-2", "session-3"):
        assert await service.reserve("user-1", session_id, "idp-session-1")

    assert not await service.reserve("user-1", "session-4", "idp-session-1")

    await service.remove_session("session-1")

    assert await service.reserve("user-1", "session-4", "idp-session-1")


@pytest.mark.asyncio
async def test_remove_session_deletes_empty_user_and_oidc_indexes():
    redis_client = FakeRedis()
    service = ConcurrentSessionService(redis_client=redis_client, session_store=FakeSessionStore(), limit=3)

    assert await service.reserve("user-1", "session-1", "idp-session-1")

    await service.remove_session("session-1")

    assert service._session_key("session-1") not in redis_client.values
    assert service._user_key("user-1") not in redis_client.sorted_sets
    assert service._oidc_key("idp-session-1") not in redis_client.sets
