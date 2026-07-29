# STD-009: REST API

Type: Standard
Status: Active

## Read This When

Use this for REST endpoints, OpenAPI contracts, API behavior changes, and API review.

Set a simple baseline for REST API design in a project.

## Rules

- Describe meaningful API behavior before implementation.
- Use nouns for resource URLs.
- Avoid verbs in URLs.
- Use nested routes only when the relationship is clear.
- Keep request and response examples small and realistic.
- Use `GET` to read, `POST` to create or start an action, `PUT` to replace, `PATCH` to partially update, and `DELETE` to remove where supported.
- Use JSON request and response bodies by default.
- Prefer response objects over top-level arrays.
- Avoid dynamic object keys.
- Document meaningful endpoints with the endpoint contract shape before or
  during implementation.
- Define one canonical serialized JSON field-naming convention for the API or
  service, such as `snake_case` or `camelCase`, and record it in endpoint or API
  contract guidance.
- Backend request and response serializers, generated OpenAPI, frontend types,
  and API clients MUST expose and consume the same canonical JSON field names.
  Backend-language field names MAY differ internally when explicit
  serialization or alias mapping preserves the wire contract.
- Add contract tests for representative request and response serialization so
  field casing, aliases, and generated client expectations cannot drift
  silently.
- Do not expose internal implementation details.
- Make breaking changes explicit and traceable. Changing an existing serialized
  JSON field name or casing is a breaking API change unless a compatible
  transition is provided.

## Structure

### Endpoint Contract

Use this shape for meaningful REST endpoints, endpoint groups, or OpenAPI
review notes:

The values below are illustrative for a single-resource `GET`. Keep the field
names stable, but adapt the method, path, models, status codes, errors,
pagination, and audit expectations to the endpoint. Other common method shapes
are listed after the contract.

```yaml
method: GET
path: /v1/resources/{resource_id}
summary: Retrieve a resource.
auth:
  required: true
  roles: []
  scopes: []
request:
  content_type: null
  body_model: null
response:
  status: 200
  body_model: ApiResponse[Resource]
json_serialization:
  field_naming: snake_case
  openapi_uses_wire_names: true
status_codes:
  - code: 200
    meaning: Resource retrieved.
  - code: 401
    meaning: User is not authenticated.
  - code: 404
    meaning: Resource was not found.
  - code: 500
    meaning: Unexpected server error.
errors:
  - code: RESOURCE_NOT_FOUND
    message: The resource was not found.
pagination: null
filtering: []
sorting: []
audit_logging:
  required: false
  event: null
```

Fields that do not apply should be `null` or an empty list, not omitted, when
the contract is used for review.

### Serialized JSON Contract

The endpoint or service contract must identify the canonical wire-field naming
convention. The example above uses `snake_case`; a project may use another
explicit convention such as `camelCase`.

Whatever convention is selected:

- backend serializers emit the canonical names and request parsing accepts the
  documented request names
- generated OpenAPI describes those wire names, not unrelated internal
  backend-language names
- frontend types and API helpers use the OpenAPI and wire names
- contract tests inspect actual serialized request and response keys

List endpoints should fill `pagination`, `filtering`, and `sorting` explicitly:

The example below shows cursor pagination. Offset pagination, page-number
pagination, or no pagination may be valid when recorded intentionally.

```yaml
pagination:
  style: cursor
  limit_default: 50
  limit_max: 100
filtering:
  - status
sorting:
  - created_at
```

### Common Method Shapes

Use these examples as starting points and adapt names, models, status codes, and
authorization to the resource.

| Method | URL shape | Use for | Typical success | Request body | Response body |
|---|---|---|---|---|---|
| `GET` | `/v1/resources/{resource_id}` | Read one resource. | `200` | None. | Resource response envelope. |
| `GET` | `/v1/resources` | List resources. | `200` | None. Use query parameters for pagination, filtering, and sorting. | List response envelope with `items`. |
| `POST` | `/v1/resources` | Create a resource. | `201` | Create request model. | Created resource response envelope. |
| `POST` | `/v1/resources/{resource_id}/actions/{action_name}` | Start an action that is not simple CRUD. | `200` or `202` | Action request model, or none when no input is needed. | Result, job, or accepted response envelope. |
| `PUT` | `/v1/resources/{resource_id}` | Replace a resource. | `200` or `204` | Full replacement request model. | Updated resource response envelope, or no body with `204`. |
| `PATCH` | `/v1/resources/{resource_id}` | Partially update a resource. | `200` | Partial update request model. | Updated resource response envelope. |
| `DELETE` | `/v1/resources/{resource_id}` | Delete, deactivate, revoke, or remove a resource. | `204` or `200` | Usually none. | No body with `204`, or result envelope when the user needs a message. |

Use `POST` for action endpoints only when the operation is not naturally
represented by create, replace, partial update, or delete semantics. Keep the
action name nested under the resource and document why it is an action.

Use `202` when the request is accepted but processing continues asynchronously.
The response should include a job, operation, or status resource link when the
client needs to check progress.

## Examples

- Use `200` for successful reads or updates.
- Use `201` for successful creation.
- Use `202` for accepted async work.
- Use `204` for successful no-content responses.
- Use `400`, `401`, `403`, `404`, `409`, and `500` for the usual failure cases.
- Use `422` only when the project intentionally uses FastAPI validation semantics.
- Give list endpoints a pagination, filtering, and sorting plan.
- Represent public or service-facing endpoints in `openapi/` when relevant.
- Trace endpoint behavior back to requirements and scenarios when meaningful.
- Treat a change from `resource_id` to `resourceId`, or the reverse, as an API
  contract change even when the backend attribute name does not change.

## Checks

- [ ] URLs are resource-based and avoid verbs.
- [ ] HTTP methods match the intended operation.
- [ ] JSON shapes are consistent.
- [ ] The canonical serialized JSON field-naming convention is explicit.
- [ ] Backend serialization, OpenAPI, frontend types, and API clients use the
      same wire field names.
- [ ] Contract tests cover representative serialized request and response
      keys.
- [ ] Status codes match expected success and failure cases.
- [ ] Meaningful endpoints have an endpoint contract shape or equivalent
      OpenAPI detail.
- [ ] Inputs, authentication, and authorization expectations are understood.
- [ ] List endpoints have pagination, filtering, and sorting guidance when needed.
- [ ] OpenAPI, tests, and verification are updated when behavior changes.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-009-API-REST](../schemas/standards/std-009-api-rest.schema.yaml)
- Used for: helping agents and reviewers check endpoint behavior, resource URL
  naming, HTTP methods, JSON bodies, serialized field naming, cross-stack
  contract alignment, response object preference, examples, breaking changes,
  and OpenAPI contract evidence.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
