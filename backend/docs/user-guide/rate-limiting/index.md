# Rate Limiting

The backend includes a small Redis-backed fixed-window limiter for selected
operations. It uses one configured default limit for every protected endpoint;
there is no product tier, subscription, rate-limit catalog, or catalog CRUD
API.

## Behaviour

When `rate_limiter_dependency` protects a route, the backend:

1. waits for application startup to finish;
2. identifies an authenticated actor by internal user ID, or an anonymous
   actor by client address;
3. hashes that actor value before constructing the Redis key;
4. sanitizes the request path;
5. increments the actor/path counter for the current fixed window; and
6. raises `429 Too Many Requests` after the configured count is exceeded.

The Redis key is scoped to the actor hash, sanitized path, and fixed-window
start time. The key expires after the configured period. Raw actor identifiers
are not written into rate-limit keys or logs.

Rate limiting is an abuse-control boundary, not authorization. Canonical roles,
capabilities, and workspace scope are evaluated separately.

## Configuration

```env
# Host, port, password, and TLS can inherit the session Redis connection.
# A blank database keeps the rate limiter's Redis DB 0 default.
REDIS_RATE_LIMIT_HOST="localhost"
REDIS_RATE_LIMIT_PORT=6379
REDIS_RATE_LIMIT_DB=2
REDIS_RATE_LIMIT_PASSWORD=
REDIS_RATE_LIMIT_SSL=false

# One default fixed-window policy for protected operations.
DEFAULT_RATE_LIMIT_LIMIT=10
DEFAULT_RATE_LIMIT_PERIOD=3600
```

`DEFAULT_RATE_LIMIT_LIMIT` is the number of allowed requests in a window.
`DEFAULT_RATE_LIMIT_PERIOD` is the window size in seconds.

For local development, the rate limiter can share the session Redis server.
Use a separate Redis database or service where operational isolation is
required. Shared environments should use TLS and secret-managed credentials.

## Protecting an endpoint

Apply the existing dependency to an endpoint that needs the default policy:

```python
from fastapi import APIRouter, Depends

from ...api.dependencies import rate_limiter_dependency

router = APIRouter()


@router.post(
    "/task",
    dependencies=[Depends(rate_limiter_dependency)],
)
async def create_task(...):
    ...
```

Do not add a tier or path-rule lookup when protecting another endpoint. If a
future product requirement needs a distinct policy, define and review that
explicit contract rather than reviving the retired mutable catalog.

## Failure handling

Redis failures are logged with a hashed actor and sanitized path, then
propagated. They are not silently treated as an authorization decision. Monitor
Redis connectivity and application error rates so an unavailable limiter is
visible to operators.

## Verification

Tests for protected endpoints should cover:

- requests through the configured limit are accepted;
- the next request receives `429`;
- actor and path keys are isolated;
- the counter expires with the configured period; and
- logs and keys do not contain raw user identifiers or secret values.

Use fake actors and a local/test Redis instance for verification. Do not use
production identifiers or shared-environment data in local tests.
