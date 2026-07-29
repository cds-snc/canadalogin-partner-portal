# STD-010: API Response and Error Models

Type: Standard
Status: Active

## Read This When

Use this for API success responses, validation errors, expected client errors, unexpected server errors, and OpenAPI examples.

Set a simple baseline for consistent API response and error shapes in REST and FastAPI work.

## Rules

- Use typed response models.
- Return JSON objects.
- Use the API or service's explicit canonical serialized JSON field-naming
  convention for success, list, validation, and error responses.
- Backend serializers, generated OpenAPI, frontend types, and API clients MUST
  use the same wire field names. Backend-language names MAY differ internally
  when explicit serialization or alias mapping preserves the wire contract.
- Use a stable top-level response envelope for backend API responses unless an
  endpoint has a documented protocol reason not to.
- Keep context-specific success payload fields inside `data`.
- Keep context-specific list, pagination, or processing metadata inside
  `metadata` or inside `data.metadata`; choose one convention for the service
  and use it consistently.
- Do not leak internal fields, secrets, stack traces, or sensitive personal information.
- Do not return inconsistent shapes for the same endpoint.
- For list responses, prefer an object with `items` and metadata instead of a top-level array.
- For errors, use a consistent safe shape.
- Include semantic fields for a correlation identifier, success status, and
  message in backend error responses. Under the default `snake_case` wire
  convention shown here, those fields are `correlation_id`, `success`, and
  `message`.
- Keep machine-readable error codes stable when clients need branching behavior.
- Validation errors may include safe field-level details.
- Contract tests must inspect actual serialized keys for representative
  success, list, validation, and error responses and compare them with OpenAPI
  and frontend expectations.

## Object Shapes

### Serialized JSON Field Contract

The examples in this standard use `snake_case` as the default wire convention.
A service may use another explicit convention, such as `camelCase`, when it
applies that convention consistently across backend serialization, generated
OpenAPI, frontend types, and API clients.

Record the decision in the endpoint or service contract:

```yaml
json_serialization:
  field_naming: snake_case
  backend_internal_naming: snake_case
  openapi_uses_wire_names: true
  frontend_uses_wire_names: true
```

The stable requirement is the semantic response contract and one canonical set
of wire names. For example, a service that explicitly selects `camelCase` would
serialize the correlation identifier as `correlationId` everywhere rather than
mixing it with `correlation_id`.

### Success Response

Use this as the default success envelope. The values below are illustrative;
the default wire names for the stable semantic fields are `success`, `message`,
`data`, and optional `metadata`.

```json
{
  "success": true,
  "message": "Resource updated.",
  "data": {
    "id": "example-id"
  },
  "metadata": {
    "correlation_id": "optional-correlation-id"
  }
}
```

`data` is the context-specific response object. It may be `null` when there is
no body data. Avoid adding domain-specific fields beside `success`, `message`,
`data`, and `metadata`.

`metadata` is optional. Use it for non-domain response information such as
pagination, warnings, processing status, or correlation identifiers when the
service exposes them on success responses.

### List Response

Use an object wrapper for list payloads. The example below uses offset-style
pagination; cursor pagination or another documented pagination model may be
used when the service chooses that convention consistently.

```json
{
  "success": true,
  "message": "Resources retrieved.",
  "data": {
    "items": [
      {
        "id": "example-id"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 1
    }
  }
}
```

If the service uses cursor pagination, replace `offset` and `total` with
cursor-specific fields such as `next_cursor` and `has_more`.

### Error Response

Use this as the default error envelope. The values below are illustrative; the
default `snake_case` wire names for the stable semantic fields are `success`,
`message`, `correlation_id`, and optional `error`.

```json
{
  "success": false,
  "message": "The request could not be completed.",
  "correlation_id": "5b5a0b4d-8ad4-42e1-9ff7-7312bb0f5902",
  "error": {
    "code": "RESOURCE_UPDATE_FAILED",
    "details": {}
  }
}
```

The correlation identifier is required on backend error responses so
client-facing errors can be connected to logs. Its serialized name follows the
service's canonical field-naming contract.

`error` is optional when the service has not defined stable client-facing error
codes. When present, `error.code` is the stable machine-readable value.
`error.details` is for safe context-specific details only.

### Validation Error Response

Validation errors may include safe field-level details. The field names and
messages below are examples only.

```json
{
  "success": false,
  "message": "The provided data is not valid.",
  "correlation_id": "5b5a0b4d-8ad4-42e1-9ff7-7312bb0f5902",
  "error": {
    "code": "VALIDATION_ERROR",
    "fields": [
      {
        "field": "display_name",
        "message": "Enter a display name."
      }
    ]
  }
}
```

Field names and messages must be safe for clients and must not reveal secret
values, hidden authorization rules, or sensitive upstream details.

### Accepted Variants

The response envelope is the default for JSON API responses. Other shapes are
valid when the endpoint contract records the reason:

- `204 No Content`: successful operation with no response body.
- File, stream, or binary response: use the correct media type and document the
  filename, disposition, and error behavior.
- `202 Accepted`: return an accepted, job, operation, or status-resource
  response when processing continues asynchronously.
- Redirect response: use only when the endpoint is intentionally part of a
  browser or identity flow.
- External protocol compatibility: follow the protocol contract and document
  why the standard envelope does not apply.

## Examples

- Use `backend/app/models/common.py` for shared response models.
- Use `backend/app/utils/global_error_handlers.py` for default error handling.
- Use FastAPI `HTTPException` for expected client errors.
- Use custom exception handlers when a consistent error response is needed.
- Log unexpected server errors with a correlation ID.
- Keep shared Pydantic models for `ApiResponse`, `ApiErrorResponse`,
  `ValidationFieldError`, and list wrappers when the backend has more than one
  route group.

## Checks

- [ ] Routes use explicit response models where practical.
- [ ] Success responses use documented JSON object shapes.
- [ ] One canonical serialized JSON field-naming convention is documented for
      success, list, validation, and error models.
- [ ] Backend serialization, generated OpenAPI, frontend types, and API clients
      use the same wire field names.
- [ ] Domain-specific success fields are inside `data`.
- [ ] List responses use `items` and pagination or cursor metadata instead of a
      top-level array.
- [ ] Error responses include the required correlation identifier, success,
      and message fields under the canonical wire names.
- [ ] Client-branching errors use stable error codes.
- [ ] Error messages are safe for clients.
- [ ] Validation details do not expose secrets or sensitive personal information.
- [ ] Tests cover expected client errors and important failure paths.
- [ ] Contract tests inspect representative serialized success, list,
      validation, and error keys.
- [ ] OpenAPI, tests, and verification are updated when response behavior changes.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-010-API-RESPONSE-ERROR-MODELS](../schemas/standards/std-010-api-response-and-error-models.schema.yaml)
- Used for: helping agents and reviewers check typed response models, typed error
  models, serialized field naming, cross-stack contract alignment, safe
  validation errors, sensitive-data protection, examples, tests, and OpenAPI
  evidence.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
