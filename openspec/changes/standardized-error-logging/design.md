## Context

The backend already had a complete, consistent error response envelope (`ErrorResponse` / `ErrorDetail`) returned by six exception handlers registered in `handlers.py`. However, no structured log entry was emitted when those handlers fired — the only logging in place was `logger.exception(...)` inside the catch-all handler for unhandled 500s (stdlib logging with no structured context).

A `StandardizedLogger` class existed in `standardized_logger.py` but was broken: it imported `get_user_info` from `app.auth.services.auth_user_session` (a path that does not exist in this project) and `OAuthError` from `authlib`. It had never been instantiated or called anywhere.

The project uses `starsessions` for session management. Authenticated user identity is stored as `user_uuid` in the session during the OIDC callback. There is no lightweight way to retrieve user identity from a plain `Request` object without a database call.

## Goals / Non-Goals

**Goals:**
- Emit a structured JSON log entry for every 4xx and 5xx error response.
- Include hashed user identity (session UUID), hashed sensitive query parameters, endpoint metadata, request method/path, and request ID.
- Ensure the logger can never crash an exception handler (degrade gracefully to `None` context).
- Maintain cross-log correlation via `request_id`.

**Non-Goals:**
- Logging 2xx/3xx responses (handled by `LoggerMiddleware` / structlog).
- Storing logs to a database or external audit table.
- Decoding JWT tokens from session to extract `amr`/`sub` claims.
- Replacing or duplicating `LoggerMiddleware` request tracing.

## Decisions

### D1 — User identity source: session UUID, not dependency injection

**Decision:** Read `request.session.get("user_uuid")` directly. Hash it with SHA-256 before logging.

**Rationale:** Exception handlers receive only a `Request` — there is no dependency injection available. `get_current_user` requires a DB session and raises `UnauthorizedException` on unauthenticated requests. Session UUID is always available for authenticated users and requires no I/O. SHA-256 hashing provides a pseudonymized, non-reversible identifier consistent with the original logger's intent.

**Alternative considered:** Decode the ID token JWT stored at `request.session["tokens"]` to get `sub` and `amr`. Rejected — adds JWT parsing complexity to a logging path; `amr` has marginal value in error logs.

### D2 — `amr` field dropped

**Decision:** Remove `auth_methods` from the user context block.

**Rationale:** Not accessible without JWT decode (see D1). Marginal diagnostic value in an error log. Can be added later if the session shape exposes it directly.

### D3 — Singleton instantiation at module level

**Decision:** `standardized_logger = StandardizedLogger()` at module level in `handlers.py`.

**Rationale:** `StandardizedLogger` has no per-request state. Creating a new instance per request is wasteful with no benefit. Module-level singleton is standard Python practice for stateless service objects.

### D4 — `_build_user` catches all `Exception`

**Decision:** Widen the `except OAuthError` to `except Exception`.

**Rationale:** The logger runs inside exception handlers. Any uncaught exception in `log()` would prevent the error response from being returned to the client and swallow the original exception. Logging failures must degrade silently.

### D5 — `request_id` added to request context

**Decision:** Extract `request_id` from `request.state.request_id` (set by `LoggerMiddleware`) falling back to `X-Request-ID` header. Include in the `request` context block when present.

**Rationale:** Every structlog entry from `LoggerMiddleware` already carries `request_id`. Including it in the structured error log makes the two log streams correlatable without a separate trace system.

### D6 — `log()` is synchronous

**Decision:** Make `log()` a plain synchronous method (not `async def`).

**Rationale:** All internals (`_build_user`, `_build_request`, `_build_context`) perform no I/O. Making it async adds coroutine overhead with no benefit. Async handlers can call sync functions without issue.

### D7 — All six handlers log

**Decision:** Call `standardized_logger.log(request, response)` in every handler, not a subset.

**Rationale:** The logger's internal early-return guard (`if response.status_code < 400: return response`) makes it safe to call unconditionally. 422 validation errors are useful signal for observing bad client behaviour. No handler is excluded.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Session middleware not loaded for some request paths, causing `request.session` to raise | `_build_user` catches `Exception` broadly; user context degrades to `None` |
| High 4xx volume (e.g. bot scanning) produces excessive WARNING logs | Accepted trade-off — volume is itself a useful signal; rate-limit or log-level filtering can be applied at the logging pipeline layer |
| `datetime.now()` in log timestamp is local time, not UTC | Low severity for current use; upgrading to `datetime.utcnow()` or `datetime.now(UTC)` is a simple follow-up if required |

## Migration Plan

No migration required. The change is purely additive:
1. Fix `standardized_logger.py`.
2. Wire singleton into `handlers.py`.
3. Deploy — logging activates immediately for all error responses.
4. Rollback: remove the three `standardized_logger.log(...)` lines and the import/singleton; no state is modified.

## Open Questions

_(none — all design decisions resolved in the grill-me session)_
