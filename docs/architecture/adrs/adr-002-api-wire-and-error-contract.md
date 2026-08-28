# ADR-002: API Wire and Error Contract

Type: Architecture Decision Record
Status: Proposed

## Date

2026-07-28

## Context

The backend uses Python snake_case internally, while many Pydantic schemas
serialize camelCase aliases for the browser. The original agent instructions
described camelCase as universal, but the implementation is mixed:

- many user, department, RP application, and shared schemas use a `to_camel`
  alias generator;
- MAU response schemas and their TypeScript clients use snake_case; and
- some list and legacy frontend contracts also expose snake_case fields.

Handled errors are more consistent. The backend serializes a nested `error`
object containing `code`, `message`, `details`, and camelCase `requestId`.
Frontend request handling understands this shape and temporarily accepts some
legacy `detail` errors.

Successful endpoints generally return their explicit resource or list response
model rather than a universal top-level `data` envelope. Delorean's
`STD-009: REST API` requires one explicit serialized field convention.
`STD-010: API Response and Error Models` provides a default success and error
envelope from which this project currently varies.

## Baseline And Control Impact

- Applicable baseline: `BAS-001: Government of Canada Web Application Baseline`
  when Delorean architecture guidance is materialized.
- Affected controls: `GC-WEB-010: APIs, Interoperability, And Data Exchange`
  and `GC-WEB-011: Logging, Monitoring, Analytics, And Operational Readiness`.
- Baseline status impact: applies.
- Evidence needed before release: generated OpenAPI review and representative
  backend/frontend serialization contract tests.

## Standard, Pattern, Control, Or Baseline Decision

- Applicable guidance: `STD-009: REST API` and `STD-010: API Response and Error
  Models`.
- Decision type: follows STD-009; varies from the default STD-010 success and
  error envelopes.
- Reason: camelCase matches the TypeScript-facing browser contract, while the
  existing error envelope and explicit success models are already integrated
  across the codebase.
- Risk or trade-off: existing snake_case endpoints need controlled migration,
  and varying from a shared default requires clear local documentation.
- Mitigation: inventory the OpenAPI surface, migrate backend and frontend
  together, and add contract tests before accepting this ADR.
- Owner: Partner Portal API maintainers.
- Review trigger: generated-client adoption, public API use, API versioning, or
  a change to the shared response/error standard.
- Related schema contract: generated OpenAPI plus frontend TypeScript wire
  types.
- Related waiver or evidence record: this ADR is the local documented variant
  allowed by STD-010; no separate waiver has been identified.

## Reference Architecture Impact

- Reference architecture: none selected.
- Relationship: not applicable.
- Variation summary: the proposal keeps explicit success response models and
  the existing nested project error envelope.
- Follow-up needed in the reference architecture: none.

## Decision

The following direction is proposed and is not binding until this ADR becomes
Accepted:

- Canonical JSON request and response field names for the browser-facing API
  are camelCase.
- Python model and service names remain snake_case internally.
- Pydantic API schemas use explicit alias configuration and serialize response
  data by alias.
- Frontend TypeScript wire types use the exact serialized JSON names.
- Query and path parameter names are outside this JSON-body decision and remain
  explicit endpoint contracts.
- Successful responses use explicit Pydantic resource or list models. The
  service does not add a universal top-level success envelope solely to match a
  shared default.
- Handled errors use:

  ```json
  {
    "error": {
      "code": "machine_readable_code",
      "message": "Safe user-facing message",
      "details": {},
      "requestId": "optional-request-id"
    }
  }
  ```

- Project exceptions and central handlers produce the error contract.
  Route-level OpenAPI documentation uses the shared `error_responses(...)`
  helper.
- Frontend support for legacy `{ "detail": ... }` responses is transitional
  compatibility, not a second preferred error contract.
- Existing snake_case endpoints keep their current wire contract until an
  explicit backend, frontend, OpenAPI, and test migration is approved.
- Changing a serialized field name or casing is treated as an API contract
  change.

Before acceptance, the project will:

1. inventory request, response, list, and error shapes from generated OpenAPI;
2. choose migration or compatibility handling for every snake_case response;
3. reconcile TypeScript clients that do not match aliased backend models;
4. add representative request, response, list, validation, and error contract
   tests; and
5. decide whether a version boundary is required for any externally consumed
   contract.

## Options Considered

### Option 1: Snake Case Everywhere On The Wire

- Benefits: direct alignment with Python and existing snake_case endpoints.
- Costs: TypeScript clients use a convention that differs from normal frontend
  naming.
- Risks: migrating existing camelCase responses is a breaking change.

### Option 2: Camel Case Everywhere On The Wire

- Benefits: one browser-facing convention and natural TypeScript types.
- Costs: drifted endpoints require coordinated migration.
- Risks: casing changes can break existing clients without compatibility
  handling.

### Option 3: Preserve Endpoint-Specific Casing Indefinitely

- Benefits: no immediate migrations.
- Costs: every client must remember endpoint-specific rules.
- Risks: continued OpenAPI, schema, and frontend type drift.

Option 2 is the proposed direction.

For response envelopes, the project also considered adopting the default
Delorean success/error envelope. The proposal instead preserves explicit
success models and the current nested error object to avoid a broad,
non-functional contract rewrite.

## Consequences

- The ADR remains Proposed while current contracts are mixed.
- New work cannot assume the desired convention is already universal.
- Backend and frontend changes for a contract migrate together.
- The existing error envelope remains the compatibility target during the
  decision period.
- OpenAPI and contract tests become evidence for accepting the decision.

## Baseline Gate Impact

Release evidence for a contract migration needs to identify changed serialized
keys, affected clients, compatibility handling, OpenAPI changes, and test
coverage. Unmigrated endpoints remain documented drift rather than silently
being declared compliant.

## Review Triggers

- The casing inventory and migration are complete.
- A public or third-party client consumes the API.
- Generated TypeScript clients replace handwritten wire types.
- API versioning is introduced.
- The project adopts or rejects the default STD-010 response envelope.

## Links

- [Codebase architecture](../codebase.md)
- [Development conventions](../../repo-guidance/development-conventions.md)
- [Backend shared error schemas](../../../backend/src/app/core/schemas.py)
- [Backend exception handlers](../../../backend/src/app/core/exceptions/handlers.py)
- [Frontend request handling](../../../frontend/src/fetch/request-json.ts)
- [MAU backend schemas](../../../backend/src/app/schemas/mau.py)
- [MAU frontend contract](../../../frontend/src/fetch/mau-report.ts)
