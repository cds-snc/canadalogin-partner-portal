## Why

The application had no structured error logging. All HTTP errors returned a consistent JSON envelope to clients but left no audit trail in the log pipeline — making it impossible to correlate errors, detect abuse patterns, or observe error rates by status code. A `StandardizedLogger` class was copied from a sibling application but was wired to a non-existent auth helper and had never been activated.

## What Changes

- Fix and adapt `StandardizedLogger` to work in this project's auth model (session-based UUID lookup replacing the non-existent `get_user_info` call).
- Wire `StandardizedLogger` as a module-level singleton into all six exception handlers in `handlers.py` so every 4xx/5xx error response emits a structured log entry.
- Add `request_id` to the request context block in each log entry for cross-log correlation.
- Harden `_build_user` to catch all exceptions, not only `OAuthError`, so a logging failure can never break an error response.
- Set correct project identity constants (`CanadaLogin` / `PartnerPortal`).
- Add unit tests for `StandardizedLogger` and integration tests verifying the logger fires from handlers.

## Capabilities

### New Capabilities

- `standardized-error-logging`: Structured, context-rich log entries emitted on every 4xx/5xx error response, with hashed user identity, hashed sensitive query parameters, endpoint metadata, and request ID for correlation.

### Modified Capabilities

_(none — no existing spec-level behavior changes)_

## Impact

- **Backend:** `backend/src/app/core/exceptions/standardized_logger.py` — fixed and activated. `backend/src/app/core/exceptions/handlers.py` — singleton wired into all six handlers.
- **Tests:** New `backend/tests/test_standardized_logger.py` (13 unit tests). Two integration tests added to `backend/tests/test_exception_handlers.py`.
- **Dependencies:** No new package dependencies. Removes unused `authlib` import from logger.
- **Logging pipeline:** All 4xx responses emit `WARNING`-level JSON log; all 5xx responses emit `ERROR`-level JSON log. Log code format: `CanadaLogin.PartnerPortal.<LEVEL>.<STATUS>`.
