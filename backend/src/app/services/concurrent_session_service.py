import hashlib
import json
import time
import uuid
from typing import Any

from starsessions.stores.base import SessionStore

from ..core.config import settings


class ConcurrentSessionService:
    KEY_PREFIX = "app.concurrent-sessions"
    _RELEASE_LOCK_SCRIPT = """
    if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
    end
    return 0
    """

    def __init__(
        self,
        redis_client: Any | None = None,
        session_store: SessionStore | None = None,
        limit: int | None = None,
    ) -> None:
        if redis_client is None or session_store is None:
            from ..core.setup import get_redis_session_client, get_redis_session_store

            redis_client = redis_client or get_redis_session_client()
            session_store = session_store or get_redis_session_store()

        self.redis_client = redis_client
        self.session_store = session_store
        self.limit = limit or settings.CONCURRENT_SESSION_LIMIT_PRIVILEGED

    async def reserve(self, user_uuid: str, session_id: str, oidc_sid: str | None) -> bool:
        lock_key = self._lock_key(user_uuid)
        lock_token = str(uuid.uuid4())
        acquired = await self.redis_client.set(
            lock_key,
            lock_token,
            ex=settings.CONCURRENT_SESSION_LOCK_TTL,
            nx=True,
        )
        if not acquired:
            return False

        try:
            user_key = self._user_key(user_uuid)
            await self._remove_stale_sessions(user_key)
            active_sessions = await self.redis_client.zrange(user_key, 0, -1)
            if len(active_sessions) >= self.limit:
                return False

            session_key = self._session_key(session_id)
            session_data = json.dumps(
                {
                    "user_uuid": user_uuid,
                    "oidc_sid_hash": self._hash_oidc_sid(oidc_sid) if oidc_sid else None,
                }
            )
            now = time.time()
            await self.redis_client.set(session_key, session_data, ex=settings.SESSION_MAX_AGE)
            await self.redis_client.zadd(user_key, {session_id: now})
            await self.redis_client.expire(user_key, settings.SESSION_MAX_AGE)

            if oidc_sid:
                oidc_key = self._oidc_key(oidc_sid)
                await self.redis_client.sadd(oidc_key, session_id)
                await self.redis_client.expire(oidc_key, settings.SESSION_MAX_AGE)
            return True
        finally:
            await self.redis_client.eval(self._RELEASE_LOCK_SCRIPT, 1, lock_key, lock_token)

    async def is_active(self, user_uuid: str, session_id: str) -> bool:
        raw_session_data = await self.redis_client.get(self._session_key(session_id))
        if raw_session_data is None:
            return False

        session_data = json.loads(self._decode(raw_session_data))
        if session_data.get("user_uuid") != user_uuid:
            return False
        return await self.redis_client.zscore(self._user_key(user_uuid), session_id) is not None

    async def remove_session(self, session_id: str) -> None:
        session_key = self._session_key(session_id)
        raw_session_data = await self.redis_client.get(session_key)
        if raw_session_data is None:
            return

        session_data = json.loads(self._decode(raw_session_data))
        user_uuid = session_data["user_uuid"]
        user_key = self._user_key(user_uuid)
        await self.redis_client.zrem(user_key, session_id)
        if await self.redis_client.zcard(user_key) == 0:
            await self.redis_client.delete(user_key)

        oidc_sid_hash = session_data.get("oidc_sid_hash")
        if oidc_sid_hash:
            oidc_key = self._oidc_key_from_hash(oidc_sid_hash)
            await self.redis_client.srem(oidc_key, session_id)
            if await self.redis_client.scard(oidc_key) == 0:
                await self.redis_client.delete(oidc_key)

        await self.redis_client.delete(session_key)

    async def remove_oidc_sessions(self, oidc_sid: str) -> None:
        oidc_key = self._oidc_key(oidc_sid)
        session_ids = await self.redis_client.smembers(oidc_key)
        for raw_session_id in session_ids:
            session_id = self._decode(raw_session_id)
            await self.session_store.remove(session_id)
            await self.remove_session(session_id)
        await self.redis_client.delete(oidc_key)

    async def _remove_stale_sessions(self, user_key: str) -> None:
        session_ids = await self.redis_client.zrange(user_key, 0, -1)
        for raw_session_id in session_ids:
            session_id = self._decode(raw_session_id)
            if not await self.session_store.read(session_id, settings.SESSION_MAX_AGE):
                await self.remove_session(session_id)

    def _user_key(self, user_uuid: str) -> str:
        return f"{self.KEY_PREFIX}:user:{user_uuid}"

    def _session_key(self, session_id: str) -> str:
        return f"{self.KEY_PREFIX}:session:{session_id}"

    def _lock_key(self, user_uuid: str) -> str:
        return f"{self.KEY_PREFIX}:lock:{user_uuid}"

    def _oidc_key(self, oidc_sid: str) -> str:
        return self._oidc_key_from_hash(self._hash_oidc_sid(oidc_sid))

    def _oidc_key_from_hash(self, oidc_sid_hash: str) -> str:
        return f"{self.KEY_PREFIX}:oidc:{oidc_sid_hash}"

    @staticmethod
    def _hash_oidc_sid(oidc_sid: str) -> str:
        return hashlib.sha256(oidc_sid.encode()).hexdigest()

    @staticmethod
    def _decode(value: str | bytes) -> str:
        return value.decode() if isinstance(value, bytes) else value
