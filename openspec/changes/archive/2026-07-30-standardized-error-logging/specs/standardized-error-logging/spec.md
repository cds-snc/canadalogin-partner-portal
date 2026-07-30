## ADDED Requirements

### Requirement: Error responses emit structured log entries

The system SHALL emit a structured JSON log entry for every HTTP 4xx and 5xx error response produced by the global exception handlers.

Log entries SHALL NOT be emitted for 2xx or 3xx responses.

4xx responses SHALL be logged at `WARNING` level. 5xx responses SHALL be logged at `ERROR` level.

#### Scenario: 4xx error produces a WARNING log entry

- **WHEN** an exception handler returns a response with status code in the range 400–499
- **THEN** a `WARNING`-level log entry is emitted to the application logger

#### Scenario: 5xx error produces an ERROR log entry

- **WHEN** an exception handler returns a response with status code 500 or higher
- **THEN** an `ERROR`-level log entry is emitted to the application logger

#### Scenario: Successful response produces no log entry

- **WHEN** a route returns a 200 response
- **THEN** no log entry is emitted by the standardized logger

---

### Requirement: Log entries use a structured JSON format

Each log entry SHALL be a JSON-serialized object with the following top-level fields:

| Field | Type | Description |
|---|---|---|
| `code` | string | Dot-separated identifier: `CanadaLogin.PartnerPortal.<LEVEL>.<STATUS>` |
| `level` | string | `"WARNING"` or `"ERROR"` |
| `context` | object | Contextual data (see below) |
| `timestamp` | string | Local datetime formatted as `YYYY-MM-DD HH:MM:SS` |

The `context` object SHALL contain only truthy-valued keys from: `user`, `request`, `response`, `endpoint`.

#### Scenario: Log code reflects level and status code

- **WHEN** a 403 error is handled
- **THEN** the log entry's `code` field is `"CanadaLogin.PartnerPortal.WARNING.403"`

#### Scenario: Log code reflects 5xx status

- **WHEN** a 500 error is handled
- **THEN** the log entry's `code` field is `"CanadaLogin.PartnerPortal.ERROR.500"`

---

### Requirement: Log entries include a request context block

The `request` context block SHALL include:

| Field | Type | Condition |
|---|---|---|
| `method` | string | Always present |
| `path` | string | Always present |
| `query_string` | string | Always present (empty string if no params) |
| `request_id` | string | Present only when a request ID is available |

The `request_id` SHALL be sourced first from `request.state.request_id`, falling back to the `X-Request-ID` request header. If neither is present, the field SHALL be omitted.

#### Scenario: Request ID from state is included in log

- **WHEN** `request.state.request_id` is set (e.g., by `LoggerMiddleware`)
- **THEN** the `request` context block contains `"request_id"` matching that value

#### Scenario: Request ID falls back to header

- **WHEN** `request.state.request_id` is absent and `X-Request-ID` header is present
- **THEN** the `request` context block contains `"request_id"` matching the header value

#### Scenario: Request ID omitted when absent

- **WHEN** neither `request.state.request_id` nor `X-Request-ID` header is present
- **THEN** the `request` context block does not contain a `"request_id"` field

---

### Requirement: Sensitive query parameters are hashed before logging

Query parameters whose keys match the blacklist SHALL have their values replaced with a SHA-256 hex digest before being included in `query_string`.

Blacklisted keys: `secret`, `token`, `access_token`, `id_token`, `code`, `claims`.

Non-blacklisted parameters SHALL be included with their original values.

#### Scenario: Blacklisted param value is hashed

- **WHEN** a request has a query parameter `token=my-secret-token`
- **THEN** the logged `query_string` contains `token=<sha256_of_my-secret-token>` and not the plaintext value

#### Scenario: Safe param value is preserved

- **WHEN** a request has a query parameter `page=2`
- **THEN** the logged `query_string` contains `page=2`

---

### Requirement: Log entries include a pseudonymized user context block

When an authenticated session is present, the `user` context block SHALL be included with a single `id` field containing the SHA-256 hex digest of `user_uuid` from the session.

When no authenticated session exists, the `user` key SHALL be omitted from the context.

The logger SHALL NOT log plaintext user identifiers.

#### Scenario: Authenticated user context is pseudonymized

- **WHEN** `request.session["user_uuid"]` contains a UUID
- **THEN** the `user` block contains `"id"` equal to `sha256(user_uuid)`

#### Scenario: Unauthenticated request omits user context

- **WHEN** no `user_uuid` is present in the session
- **THEN** the `user` key is omitted from the log context

#### Scenario: Session access failure does not break logging

- **WHEN** accessing the session raises any exception
- **THEN** the `user` key is omitted from the log context and the log entry is still emitted

---

### Requirement: Logging failures never prevent error response delivery

The standardized logger SHALL be exception-safe. Any failure during log context construction SHALL result in graceful degradation (missing fields) rather than propagation that would prevent the error response from being returned to the client.

#### Scenario: Logger internal error does not crash handler

- **WHEN** an exception is raised inside `_build_user` during log construction
- **THEN** the exception is caught, `user` context is omitted, and the original error response is still returned to the client

---

### Requirement: All six global exception handlers emit structured logs

The standardized logger SHALL be called in all handlers registered by `register_exception_handlers`:

- `RequestValidationError` handler (422)
- `RPApplicationDepartmentRequiredException` handler (409)
- `IBMVerifyException` handler (4xx/5xx)
- Cache exception handler (`CacheIdentificationInferenceError`, `InvalidRequestError`, `MissingClientError`)
- `StarletteHTTPException` handler (any status)
- Catch-all `Exception` handler (500)

#### Scenario: Validation error triggers logging

- **WHEN** a `RequestValidationError` is raised
- **THEN** the standardized logger is called with the resulting 422 response

#### Scenario: Unhandled exception triggers logging

- **WHEN** an unhandled `Exception` propagates to the catch-all handler
- **THEN** the standardized logger is called with the resulting 500 response
