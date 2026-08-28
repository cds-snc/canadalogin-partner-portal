# STD-011: Logging and Observability

Type: Standard
Status: Active

## Read This When

Use this for backend services, frontend error reporting, scheduled jobs, workflows, API errors, and operational guides.

Set a simple baseline for useful logs and operational verification.

## Rules

- Use structured or consistent logs where practical.
- Include `correlation_id`, `request_id`, or `trace_id` when available.
- Use a stable log event envelope and put context-specific details inside a
  nested `context` object.
- Keep log `code` values stable enough for filtering, alerts, and dashboards.
- Do not log secrets, tokens, credentials, or unnecessary personal information.
- Hash or mask sensitive query parameters.
- Do not copy startup logging that exposes private config.
- Log enough context to support debugging.
- Log unexpected exceptions once, near the boundary where they are handled.
- Connect client-facing errors to logs with a correlation ID where possible.

## Object Shapes

### Log Event

Use this as the default structured log event shape. The values below are
illustrative; the stable top-level fields are `code`, `level`, `timestamp`,
optional `message`, and `context`.

```json
{
  "code": "PROJECT.APPLICATION.WARNING.404",
  "level": "WARNING",
  "timestamp": "2026-05-12T14:25:43Z",
  "message": "Request failed.",
  "context": {
    "correlation_id": "5b5a0b4d-8ad4-42e1-9ff7-7312bb0f5902",
    "request": {
      "method": "GET",
      "path": "/v1/resources/{resource_id}",
      "query_string": "resource_id=hashed-value"
    },
    "response": {
      "status_code": 404
    },
    "user": {
      "id": "hashed-user-id",
      "auth_methods": ["method_a", "method_b"]
    },
    "endpoint": {
      "module_name": "app.resources.router",
      "function_name": "get_resource"
    }
  }
}
```

`code`, `level`, `timestamp`, and `context` are the stable envelope fields.
`message` is recommended when the log event is not self-explanatory from its
code.

`context` is the extension point. Add operation-specific values there, not as
new top-level fields.

### Context Objects

Use these nested objects when the data is available and safe:

- `correlation_id`, `request_id`, `trace_id`, `attempt_id`: identifiers used to
  connect related events.
- `request`: method, path, route template, safe query string, client type, and
  accepted language when useful.
- `response`: status code and safe response classification.
- `user`: hashed user identifier and non-sensitive auth method or role
  indicators.
- `endpoint`: module and function name. Include file and line only when this is
  useful and acceptable for the runtime environment.
- `operation`: business operation name, resource type, resource ID hash, result,
  and safe reason code.

Do not include secret values, raw tokens, raw subject identifiers, full request
or response bodies, raw email addresses, raw phone numbers, or unnecessary
personal information.

### Log Code

Use a predictable code shape:

```text
<project>.<application>.<level>.<event-or-status>
```

Examples:

- `PROJECT.APPLICATION.INFO.RESOURCE_UPDATED`
- `PROJECT.APPLICATION.WARNING.422`
- `PROJECT.APPLICATION.ERROR.UPSTREAM_TIMEOUT`

Use status-code suffixes for generic HTTP boundary logs. Use named event codes
for business or operational events.

Other valid code shapes may include an environment, domain, or service segment
when the logging platform depends on it. Keep whichever shape the project
chooses stable and documented.

## Examples

- Use `backend/app/utils/standardized_logging.py` as the default logging pattern.
- Use `debug` for local detail.
- Use `info` for meaningful business or system events.
- Use `warning` for recoverable problems.
- Use `error` for failed operations requiring attention.
- Add metrics and traces later when the project needs them.
- Hash stable sensitive identifiers only when correlation across logs is needed.
  Redact them otherwise.
- Keep raw request and response bodies out of logs unless a security and privacy
  review explicitly approves a narrowed debug path.

## Checks

- [ ] Logs help diagnose important failures.
- [ ] Structured log events use the stable log envelope.
- [ ] Context-specific data is nested under `context`.
- [ ] Log codes are stable and filterable.
- [ ] Logs include a correlation, request, or trace ID when available.
- [ ] Sensitive query parameters are masked or hashed.
- [ ] Logs do not expose secrets, tokens, credentials, or unnecessary personal information.
- [ ] Startup logs do not print private config values.
- [ ] Runbooks, tests, or verification are updated for operationally meaningful changes.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-011-LOGGING-OBSERVABILITY](../schemas/standards/std-011-logging-and-observability.schema.yaml)
- Used for: helping agents and reviewers check log identifiers, structured
  event shape, diagnostic context, sensitive value masking, operational
  diagnostics, and logging review evidence.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
