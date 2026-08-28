# Design: Add CL Admin RP Registration Adoption

## Technical Approach

The adoption aggregate is the existing local `rp_application` record. No new
copy is created. A candidate is active, not deleted, has `workspace_id IS
NULL`, and has a non-empty stable IBM application ID.

The backend exposes a CL Admin-only candidate list, one-candidate IBM metadata
preview, and an idempotent workspace-link write. Routes remain thin; the RP
application service owns validation, the safe projection allowlist,
precedence, transaction locking, persistence, and audit. A separate
IBM-interactions package owns credentials, SDK/network orchestration, raw
provider parsing, and retry policy behind the injected projection contract.

### Data Precedence

1. Stable local RP UUID, IBM application ID, existing portal audit history,
   and secret-lifecycle audit links are immutable during adoption.
2. CL Admin explicitly selects one active, non-deleted workspace.
3. Workspace department becomes the RP application's department.
4. Non-empty local values remain authoritative.
5. An allowlisted IBM projection may fill only empty local fields.
6. Conflicting non-empty IBM values are returned as safe comparison metadata
   and are never silently persisted.
7. IBM owners, credentials, current or rotated secrets, raw provider payloads,
   and IBM audit history are discarded at the adapter/service boundary.

The initial safe IBM fill allowlist is RP display name, provider application
state, application URL, redirect URIs, logout URI, logout redirect URIs, PKCE
setting, and non-secret client type/authentication-method metadata already
represented by the portal registration schema. CanadaLogin environment and an
optional application-information link remain explicit portal inputs when they
cannot be established safely from existing local data.

## API Contract

Canonical JSON uses the repository's camelCase aliases.

### List candidates

- Method/path: `GET /api/v1/rp-applications/workspace-adoption-candidates`
- Authorization: active CL Admin / partner-bootstrap capability.
- Response: `RPApplicationAdoptionCandidateListRead` object with `items`.
- Data source: local database only; no IBM call.
- Candidate fields: public local RP UUID, name, IBM application ID, safe local
  metadata completeness, and update timestamp. No internal IDs or owners.

### Preview one candidate

- Method/path:
  `GET /api/v1/rp-applications/workspace-adoption-candidates/{rpApplicationUuid}`
- Authorization: active CL Admin / partner-bootstrap capability.
- Behavior: recheck local candidate state, request one already-reduced safe
  metadata projection by stable application ID through the injected provider
  contract, validate it against the adoption allowlist, and return local
  values, fillable values, and conflicts.
- Errors: safe `404` for a missing/non-candidate record; `503` for provider
  unavailability; no raw upstream body.

### Create the workspace link

- Method/path:
  `PUT /api/v1/rp-applications/{rpApplicationUuid}/workspace-link`
- Request: `RPApplicationWorkspaceLinkWrite` with `workspaceUuid`, optional
  `applicationInformationUuid`, and optional `canadaLoginEnvironment`.
- Authorization: active CL Admin / partner-bootstrap capability.
- Behavior: lock the RP row, verify it is still a candidate, lock and validate
  the active destination workspace, refresh safe IBM detail, fill missing
  allowlisted values, derive the department, link the workspace, and emit the
  audit record in one business transaction.
- Idempotence: a retry for the already linked same workspace returns the
  current adopted representation without another linkage side effect. A
  different workspace returns `409 rp_application_already_linked`.
- Response: `RPApplicationWorkspaceAdoptionRead` with public UUIDs, filled
  field names, preserved-local field names, safe conflicts, and no provider
  secrets or owners.

No schema migration is required for the local implementation: the existing
nullable workspace, department, application-information, environment, status,
IBM ID, and registration-payload fields support the workflow. Database and
model constraints are re-evaluated if implementation discovers that atomic
same-workspace idempotence cannot be enforced safely without a schema change.

## Authorization And Audit

- Backend authorization is authoritative; the frontend guard is only a user-
  experience boundary.
- CL Admin uses the existing partner-bootstrap authorization family. Partner
  roles and unauthenticated users are denied before candidate or IBM data is
  retrieved.
- The audit event records actor UUID, local RP UUID, destination workspace
  UUID, stable event name, outcome, correlation ID, and safe changed-field
  names. It excludes application owners, provider payloads, URLs where not
  needed, secrets, credentials, tokens, and personal information.
- Before a permitted link action begins, the adoption service persists a
  minimized authorization-decision record in an independent transaction. It
  retries that write once and fails closed if an allowed decision cannot be
  audited. A denied decision remains denied if both audit attempts fail and
  raises a critical operational alert. After business rollback, failed
  outcomes use the same bounded retry and alert posture while preserving the
  original safe error. The successful adoption outcome commits atomically with
  the local workspace link.

## IBM Verify Boundary

The target dependency is IBM Verify, but all real IBM interactions belong to a
separately governed package. This adoption package defines and consumes a flat
typed projection containing only the allowlisted non-secret registration
fields. It does not own credentials, SDK clients, HTTP calls, raw provider
payload parsing, or provider retry policy.

Local implementation uses an injected fake projection provider for important
success, unavailable, not-found, malformed, and secret-bearing-response cases.
The default provider is explicitly unavailable until the IBM-interactions
package supplies its adapter; missing real configuration never activates the
fake implicitly and no production substitute is introduced. This package can
complete and archive its local portal contract independently, but the adoption
workflow is not ready for shared or production use until that separate package
connects an authorized adapter.

The adoption business service does not automatically retry the projection
read: the selected candidate remains unchanged and CL Admin receives a safe
retry path. The write does not retry provider reads or database mutation
automatically; same-workspace request idempotence makes an explicit client
retry safe after an ambiguous response.

## UI Page Pattern

The recorded decision is
`rp-registration-adoption-page-pattern-decision.yaml`.

- Parent task area: Workspaces.
- Candidate list route: `/workspaces/rp-registration-adoption`.
- Candidate form route:
  `/workspaces/rp-registration-adoption/$rpApplicationUuid`.
- Pattern: GC Design System Basic page shell with a focused operational table,
  followed by a separate PAT-003 adoption form and confirmation feedback.
- Navigation: Home -> Workspaces -> Adopt existing RP registrations -> one
  candidate. The nested flow is not a new top-level menu group.

## Standards Impact

```yaml
standards_impact:
  ui:
    applies: true
    decision: Use the recorded Basic-page list and focused-form pattern with GC Design System React components.
    evidence: Desktop/mobile states, design-system checklist, page-shell check, and route reachability tests.
    exceptions: []
  accessibility:
    applies: true
    decision: Cover headings, table semantics, form labels/errors, confirmation, focus, keyboard order, zoom, and status announcements.
    evidence: Focused tests and accessibility review.
    exceptions: []
  official_languages:
    applies: true
    decision: Maintain English/French parity for routes, table labels, metadata states, warnings, errors, and confirmation.
    evidence: Locale parity and bilingual route/state tests.
    exceptions: []
  security_privacy:
    applies: true
    decision: CL Admin-only server authorization, safe provider allowlist, no secret/owner import, and minimized logs/errors.
    evidence: Authorization, provider-mapping, secret-exclusion, and safe-error tests.
    exceptions: []
  identity_access:
    applies: true
    decision: Use canonical CL Admin partner-bootstrap capability; no IBM owner-derived access.
    evidence: Allowed/denied role matrix and bypass tests.
    exceptions: []
  information_management:
    applies: true
    decision: Preserve the local RP record and audit history and add a minimized adoption audit event without changing retention.
    evidence: Persistence, idempotence, audit, and record-preservation tests.
    exceptions: []
  verification:
    applies: true
    decision: Use fake IBM adapter coverage locally and record real-integration checks as deferred until an authorized non-local target exists.
    evidence: Backend/frontend/OpenAPI/router checks plus skipped real-IBM reason.
    exceptions: []
  gc_web_application_baseline:
    applies: true
    decision: Assess affected BAS-001 controls for this meaningful administrative workflow before archive/release readiness.
    evidence: Level-2 developer-readiness summary and affected-control review.
    exceptions: []
```

Applicable guidance: STD-002, STD-004 through STD-014 as relevant, STD-017
through STD-020, PAT-001 through PAT-005, PAT-008, PAT-010, PAT-013 through
PAT-015, PAT-017, PAT-020, PAT-023 through PAT-026, BAS-001, GC-WEB-001
through GC-WEB-011, TPL-003, TPL-007 through TPL-009, and TPL-011.

## Slice Plan

### Slice 1: Local backend adoption contract

- Add typed candidate, preview, link request, and adopted response schemas.
- Add CL Admin-only routes and service behavior using the injected safe
  projection provider; the real adapter remains owned by the IBM-interactions
  package.
- Preserve records, apply missing-only allowlist mapping, lock writes, provide
  idempotence/conflicts, and audit the decision.
- Verify with fake/test-only data and no network calls.

### Slice 2: CL Admin candidate list

- Add the protected Workspaces child route, typed API helper/query, candidate
  table, and loading/empty/error/unauthorized states.
- Link each candidate to the focused adoption form.

### Slice 3: Review, link, and confirmation

- Show safe local/IBM metadata comparison.
- Collect workspace plus any still-required portal fields.
- Confirm the consequence, submit the idempotent link, invalidate affected
  candidate/workspace/application queries, and show next steps.

### Slice 4: Verification and archive

- Regenerate OpenAPI/router artifacts.
- Run backend, frontend, authorization, bilingual, accessibility, GC Design
  System, and holistic review.
- Record real IBM integration as unverified locally and archive only after the
  current workspace/navigation deltas are rebased.

## Open Questions That Block Non-Local Work

- Exact shared/production IBM target, credential source, API rate limits,
  timeout settings, and operational owner.
- The reviewed real candidate inventory and per-record CL Admin decisions.
- Deployment, rollback, monitoring, and support ownership.

These do not block local fake-adapter implementation.
