# Design

## Context

Workspace capabilities currently span list/detail pages, application
information, RP applications, a legacy Members route, settings, application
usage/audit, and partner reporting. Their route and page-pattern decisions do
not yet form one coherent workspace information architecture. The RP
registration questionnaire also contains several conditional field groups and
consequential submission behavior on a single form page.

This package is downstream of `define-four-role-authorization-model`. It uses
the canonical authorization context, assignment/invitation APIs, secret
boundaries, and workspace report scope produced by that change. It does not
edit or duplicate that active package.

Relevant guidance:

- STD-002: Work Contexts
- STD-003: Full-Stack Application Stack
- STD-004: Frontend React and TypeScript
- STD-005: Frontend GC Design System
- STD-006: GC UI Page Layout Rules
- STD-007: UI Accessibility Basics
- STD-008: Backend FastAPI
- STD-009: REST API
- STD-010: API Response and Error Models
- STD-011: Logging and Observability
- STD-012: Testing Basics
- STD-013: Security and Privacy Basics
- STD-017: Government of Canada Standards Review
- STD-019: Government of Canada Web Application Baseline Governance
- STD-020: Database Persistence
- PAT-001: UI Page Patterns
- PAT-002: API Query and Mutation
- PAT-003: Form Page
- PAT-004: Protected Route
- PAT-005: Router, Service, Schema
- PAT-008: Audit Log
- PAT-009: OIDC Backend Session
- PAT-010: RBAC Policy Check
- PAT-012: Alembic PostgreSQL Change
- PAT-013: GC Design System React App Shell
- PAT-014: Bilingual Route and I18n
- PAT-015: Storybook UI Review Fixture
- PAT-017: Itemized Data Display
- PAT-019: Multi-Step Task Flow
- PAT-020: Status and Feedback
- PAT-021: Dashboard Overview Page
- PAT-022: Page Length and Splitting
- PAT-023: Frontend Data Table
- PAT-024: Full-Stack Feature Slice

## Goals / Non-Goals

**Goals:**

- Give each selected workspace a clear task-oriented entry page and persistent
  local navigation.
- Replace stale Members terminology and route ownership with Access.
- Make workspace-scoped partner reporting discoverable without passing through
  internal oversight.
- Preserve application-scoped audit as a focused record task.
- Split the long RP registration transaction into testable, recoverable steps.
- Use user-facing workspace names while retaining UUIDs only as route and API
  identifiers.
- Define responsive, accessible, bilingual behavior and review evidence.

**Non-Goals:**

- Change role/capability semantics, report formulas, invitation lifecycle,
  credential behavior, or questionnaire business rules.
- Add an all-workspace partner dashboard or global context switcher.
- Put forms, reports, or tables directly on the workspace task hub.
- Create a workspace-wide audit aggregate that has no current API contract.
- Store draft questionnaire content in query parameters, URLs, analytics, or
  unstructured browser history.

## Route And Page Pattern Catalog

| Area | Route | Pattern | Purpose |
|---|---|---|---|
| Workspace chooser | `/workspaces` | Focused list/chooser | Select an authorized workspace |
| Workspace overview | `/workspaces/$workspaceUuid` | PAT-001 task hub | Orient to selected workspace tasks |
| Application information | `/workspaces/$workspaceUuid/application-information` | Focused list/detail pages | Manage canonical application information |
| RP applications | `/workspaces/$workspaceUuid/applications` | Focused list/detail pages | Manage environment registrations |
| Access | `/workspaces/$workspaceUuid/access` | Focused administration page | Manage canonical assignments and invitations when authorized |
| Partner reports | `/workspaces/$workspaceUuid/reports` | Focused report page | Read aggregate metrics for the selected workspace |
| Settings | `/workspaces/$workspaceUuid/settings` | Focused form page | Manage workspace metadata when authorized |
| RP application audit | `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/audit` | Focused record audit page | Inspect bounded audit events for one application |
| Registration flow | `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/*` | PAT-019 multi-step flow | Complete and submit the OIDC questionnaire |

`/workspaces/$workspaceUuid/members` is a compatibility route only and
redirects to the canonical Access route after authorization and workspace
validation.

## Decisions

### Decision 1: Workspaces use chooser then task hub

- `/workspaces` lists only workspaces available through canonical server-owned
  scope and acts as the context chooser.
- `/workspaces/$workspaceUuid` uses PAT-001, not PAT-021. It shows the workspace
  name, concise context, optional sourced status, and authorized task links.
- It does not embed full application tables, Access management, reports,
  settings forms, or audit results.
- A user with access to several workspaces selects context explicitly through
  `/workspaces`; this change does not introduce an implicit global switcher.

### Decision 2: Workspace navigation has one recorded hierarchy

Persistent workspace navigation contains, when available:

1. Overview
2. Application information
3. RP applications
4. Access
5. Reports
6. Settings

Application-scoped audit remains reachable from the selected RP application
detail and may also be explained from a `Reports and audit` task description on
the hub. There is no synthetic workspace-audit destination.

Use translated route metadata to drive task links, `GcdsSideNav`, breadcrumbs,
active state, and return paths. Breadcrumbs are location support; the side
navigation and hub links provide primary discoverability.

### Decision 3: Access replaces Members at the UI boundary

- `/workspaces/$workspaceUuid/access` is the canonical visible destination for
  role assignments and invitation management provided by the role change.
- The visible page title and navigation label are `Access`, not `Members`.
- `/members` redirects to `/access` without broadening access or bypassing
  workspace validation.
- Backend authorization and the role-owned assignment/invitation services
  remain authoritative; route visibility is not security enforcement.

### Decision 4: Partner reporting is explicitly workspace scoped

- `/workspaces/$workspaceUuid/reports` is the partner entry route for aggregate
  reporting.
- Every request includes the selected workspace scope and is authorized by the
  backend before data is returned.
- The page does not expose internal cross-workspace filters, rows, exports, or
  oversight navigation.
- The report families, formulas, filters, safe failures, and exports remain
  those defined by the reporting capability; this design does not create new
  metrics.
- `/onboarding-oversight/reports` remains the internal cross-workspace route.
- The browser-facing workspace page uses
  `GET /api/v1/workspaces/{workspace_uuid}/reports` and
  `GET /api/v1/workspaces/{workspace_uuid}/reports/export`. These are thin BFF
  routes over the shared aggregate-report service and response/export models;
  they do not duplicate metric calculation.
- Workspace scope comes only from the authorized path resource. The workspace
  routes accept the existing metric, start-date, end-date, and grouping query
  contract but no second workspace selector. The browser never calls the
  internal oversight UI/API route and never filters a cross-workspace result.

### Decision 5: User-visible workspace context uses names

- The workspace name is the primary H1 context, side-navigation context,
  breadcrumb label, account/access context, and list link text.
- UUIDs remain route/API identifiers and may appear only where a technical
  reference is explicitly needed, never as the primary user-facing label.
- If the workspace name cannot be loaded safely, the page uses a neutral
  localized fallback rather than presenting the raw UUID as a friendly name.

### Decision 6: Registration is a route-per-step PAT-019 flow

Starting at `/workspaces/$workspaceUuid/applications/new` opens the Basics step
for a new registration without inventing an RP application UUID or placeholder
name. A successful Basics `Continue` validates the environment and bilingual
application names, creates the authorized server-backed `draft`, and redirects
to the returned application's canonical `registration/endpoints` route.
Revisiting Basics after creation uses the canonical
`registration/basics` route. Existing drafts are resumed from their detail or
Edit/Resume action; the portal does not guess which of several drafts the user
  meant from `/workspaces/$workspaceUuid/applications/new`.

The existing `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/edit`
route becomes a compatibility entry governed by this explicit matrix:

| Current RP application state | Edit-route result | Permitted persistence | Final action |
|---|---|---|---|
| `draft` | Resume the last safely completed or earliest incomplete canonical step | Authorized server-backed draft writes with version/conflict protection | A complete, valid Review submission transitions `draft` to `submitted` once |
| `submitted` | Return to detail with a localized locked-for-review explanation | None | None |
| `under_review` | Return to detail with a localized locked-for-review explanation | None | None |
| `approved` | Return to detail with a localized non-editable explanation | None | None |
| `launched` | Return to detail with a localized non-editable explanation | None | None |
| Missing, unknown, stale, or out-of-scope state | Fail closed through the safe detail, not-found, or denied behavior | None | None |

The backend rechecks state and authorization on flow entry, every draft write,
and final submission. Hiding Edit is a discoverability rule only. A future
amendment or revision workflow for non-draft registrations requires its own
state, approval, effective-value, concurrency, and audit contract; this change
does not infer one from the existing forward-only onboarding vocabulary.

Editable drafts use the following step sequence:

1. `basics`: CanadaLogin environment and English/French application names.
2. `endpoints`: application URLs, redirect URLs, post-logout URLs, and logout
   delivery configuration.
3. `client-and-access`: client type, authentication method, key-sharing detail,
   scopes, sector identifier, pairwise identifier choices, and PKCE.
4. `signing`: RP request signing and CanadaLogin signature-validation
   capability, algorithms, and conditional roadmap answers.
5. `encryption`: request encryption, CanadaLogin message decryption,
   algorithms, and conditional roadmap answers.
6. `review`: itemized summary, consequences, and Change links to completed
   steps.

`confirmation` follows successful final submission and is outside the six-step
stepper. The confirmation gives status/next steps and links to the RP
application detail and workspace hub.

Canonical paths use:

```text
/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/basics
/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/endpoints
/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/client-and-access
/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/signing
/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/encryption
/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/review
/workspaces/$workspaceUuid/applications/$rpApplicationUuid/registration/confirmation
```

### Decision 7: Draft, validation, and recovery are explicit

- Before a draft exists, Basics `Continue` validates the minimum resource
  identity and creates the draft. Invalid Basics input remains on
  `/workspaces/$workspaceUuid/applications/new`, creates no placeholder row,
  and uses the normal error
  summary and field errors.
- Before that first successful create, `Save and exit` cannot promise durable
  recovery. It validates the same minimum Basics identity and creates the draft
  before leaving, or keeps the user on the page with errors; Cancel or other
  navigation warns that unsaved input will be lost.
- Draft creation sends one opaque UUID `Idempotency-Key` for the new-flow
  attempt. Retrying the same authorized workspace/actor/key and normalized
  Basics payload returns the same created draft; reusing the key with different
  input or scope fails safely. The key contains no user or questionnaire data,
  conveys no authority, and is cleared from the browser's structured
  session-scoped flow state after the server response is reconciled.
- After a draft exists, `Continue` validates the current step, updates the
  server-backed draft, and moves forward without final submission.
- `Back` returns to the previous permitted step and preserves saved and current
  recoverable input.
- `Save and exit` may persist safe partial current-step answers to the draft,
  marks the affected step incomplete when its active rules are not satisfied,
  and returns to the RP application detail or workspace applications list with
  a clear resume path. It never presents partial persistence as step completion.
- `Cancel` leaves the flow without deleting the server-backed draft. It
  discards only unsaved current-step input, preserves the last successful save,
  warns for unsaved changes before leaving, and returns to the RP application
  detail or workspace applications list. Discarding an entire draft is a
  separate consequential action and is not introduced by this flow.
- Completed steps may be revisited. Changing an earlier answer invalidates or
  clears dependent later answers according to the existing questionnaire rules
  and identifies what requires review.
- Direct access to an unavailable future step returns the user to the earliest
  incomplete permitted step with an explanation.
- Review uses PAT-017 itemized summaries and localized Change links.
- Only the final submit action validates the complete active questionnaire and
  transitions the RP application from `draft` to `submitted`. Refreshing,
  retrying, or repeated activation must not submit twice.
- Every draft write carries the last server-returned draft version. A stale
  version returns a recoverable `409` with stable code
  `registration_draft_version_conflict` without overwriting the newer record;
  the user reloads the current draft before retrying or intentionally reapplies
  changes.
- Refresh and network failures preserve the last server-saved draft and any
  safely recoverable current input; errors identify whether retry or return is
  available.
- After session expiry, successful admission resumes the same authorized draft
  and step when safe. Revoked scope routes to the safe denied/return path.
- The header language control opens the equivalent step for the same draft and
  does not discard saved input. Unsaved input is preserved or the user receives
  an explicit warning before switching.
- Questionnaire content, public offline certificate/JWK material, and any sensitive
  values are not placed in URLs, analytics, logs, or unstructured local
  storage.
- The offline-exchange field accepts public certificate or public JWK material
  only. API validation rejects private JWK members, symmetric keys, credentials,
  `kty: oct`, JWK fields such as `d`, `p`, `q`, `dp`, `dq`, `qi`, `oth`, or
  `k`, PEM private-key blocks, and other secret key material before
  persistence. Collecting a private key would require a separate
  secret-lifecycle, storage, access, audit, and rotation decision and is not
  authorized by this package.

### Decision 8: Use GC Design System interaction patterns

- Workspace hub: `GcdsHeading`, `GcdsText`, `GcdsLink`, optional `GcdsGrid`,
  `GcdsSideNav`, and `GcdsBreadcrumbs`.
- Registration: `GcdsStepper`, `GcdsInput`, `GcdsTextarea`, `GcdsSelect`,
  `GcdsCheckboxes`, `GcdsRadios`, `GcdsDateInput`, `GcdsFieldset`,
  `GcdsHint`, `GcdsErrorSummary`, `GcdsErrorMessage`, `GcdsButton`, and
  `GcdsNotice` where they fit.
- Reports and audit tables follow PAT-023 and use a semantic/GCDS table
  implementation with responsive behavior.
- No required step, error, or primary action is hidden in `GcdsDetails`.
- No custom progress graphic, raw form control, or custom navigation pattern is
  planned.

### Decision 9: Navigation and state are accessible and bilingual

- Side navigation, breadcrumbs, stepper, Change links, errors, action buttons,
  status, and recovery links follow a predictable keyboard and reading order.
- Focus moves to the error summary after a blocked Continue/final submit and to
  the new page H1/step context after successful navigation.
- Current section and step are not communicated by colour alone.
- At mobile widths and 200 percent zoom, the H1 and first useful action remain
  understandable without horizontal page scrolling.
- English and French route labels, steps, fields, hints, validation, review,
  confirmation, statuses, and accessible names have parity.
- Workspace names and user-provided bilingual names remain data values; UI
  labels and explanatory content are localized separately.

### Decision 10: Draft API preserves the existing RP application resource

The multi-step flow extends the existing workspace RP application resource
instead of introducing a second draft aggregate or a browser-only wizard
store:

| Operation | Contract | Required behavior |
|---|---|---|
| Create draft after valid Basics | `POST /api/v1/workspaces/{workspace_uuid}/applications` with `Idempotency-Key` | Accept the minimum Basics identity plus any compatible supplied questionnaire fields, create one `draft`, initialize flow metadata, and return `201` with `WorkspaceRPApplicationRegistrationDraftRead`; a same-key/same-request retry resolves to that draft rather than creating another |
| Read or resume draft | `GET /api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/registration-draft` | Return `WorkspaceRPApplicationRegistrationDraftRead` for the authorized `draft`; never use the generic application detail response or raw JSONB as the flow contract |
| Save partial or complete a step | `PATCH /api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/registration-draft` | Accept typed partial questionnaire fields plus `stepId`, `saveMode`, and `expectedDraftVersion`; require current `draft` state; merge server-side; validate either safe supplied values or the completed active step; update atomically; return the typed draft representation with the new version |
| Final submit | `POST /api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/onboarding-state` with `targetState: submitted` | Accept `expectedDraftVersion`, recheck authorization/state, validate the complete merged questionnaire, and perform one atomic portal-local `draft` to `submitted` transition; return the typed authorized submission representation, and on a retry that observes the same already-submitted resource return that representation without another transition or audit event; do not call, provision, update, or synchronize IBM Verify |

The draft read class name and wire boundary are fixed. Local create/write class
names may follow repository conventions, but their fields and behavior are
fixed by the table:

- `WorkspaceRPApplicationRegistrationDraftRead` exposes only
  `workspaceUuid`, `rpApplicationUuid`, `onboardingState`,
  `registrationDraftVersion`, `registrationLastCompletedStep`, and typed
  `registrationAnswers` permitted for the caller. It excludes internal integer
  IDs, `createdBy`, repository/SQLAlchemy shapes, Casbin or assignment internals,
  raw `oidcRegistrationPayload`, and any secret key material. A separately
  named submission response may add submitted status/next-step fields but
  follows the same public-identifier and typed-answer boundary.

- Create requires `canadaLoginEnvironment`, `serviceNameEn`, and
  `serviceNameFr`; later questionnaire fields remain optional until their step
  is completed or final submission occurs.
- Create requires an opaque UUID `Idempotency-Key`. The backend stores the key
  on the created RP application and verifies the same actor, workspace, and
  normalized Basics payload before returning an existing result. A same-key
  request with different scope or payload fails with safe `409` code
  `registration_draft_creation_conflict` and discloses no existing record.
- Draft writes distinguish `saveMode: partial` from
  `saveMode: completeStep`. Partial persistence validates supplied field shape,
  size, and safe content but does not run completeness rules for uncompleted
  branches. Step completion validates the merged active step and prerequisites.
  Final submission uses a separate complete-questionnaire validator.
- `stepId` is one of the five data-entry steps. Review and Confirmation never
  accept questionnaire writes.
- `expectedDraftVersion` is mandatory for `PATCH` and final submission. A
  mismatch returns `409` code `registration_draft_version_conflict` through
  the existing safe handled-error model while the resource is still `draft`.
  If an ambiguous retry discovers that the same RP application is already
  `submitted`, the endpoint returns the authorized current submitted
  representation so the UI can recover to Confirmation; it does not re-run
  submission side effects.
- Generated OpenAPI for the current aliased RP application schemas uses
  camelCase. The canonical new fields are `registrationDraftVersion` and
  `registrationLastCompletedStep`, and frontend TypeScript wire types must
  match generated OpenAPI exactly. Existing snake_case RP application request,
  response, and form helpers are known client-contract drift: implementation
  must reconcile them to the generated contract or record an explicit
  coordinated API migration; it must not silently preserve both as preferred
  wire shapes. Internal snake_case service names and JSONB keys are not the
  browser contract. Persisted JSONB is an internal repository detail, not an
  API response model. No universal success envelope is introduced while
  ADR-002 remains Proposed.
- Expected handled failures declare `400`, `401`, `403`, `404`, `409`, `422`,
  and `500` as applicable using the shared OpenAPI error helper. Errors carry
  the project nested `error` object and never echo questionnaire values.

### Decision 11: Draft persistence stays on the RP application aggregate

- PostgreSQL remains authoritative. The existing `rp_application` record and
  `oidc_registration_payload` JSON own questionnaire answers.
- Add a unique nullable opaque `registration_creation_key`, a non-negative
  monotonic
  `registration_draft_version`, and a nullable
  `registration_last_completed_step` to the RP application record. The version
  increments on every successful draft write and final transition. Regressing
  or invalidating an earlier step moves the completed-step marker backward in
  the same transaction.
- Do not create a second registration-draft table, store draft state in Redis,
  or treat browser storage as persistence. API schemas remain separate from
  the SQLAlchemy model.
- A successful new draft starts at `registration_draft_version = 1` and
  `registration_last_completed_step = basics`. A same-key create retry returns
  the same row and current metadata without incrementing the version or
  resetting the marker. Every later successful draft write and the final
  transition increments the version exactly once.
- Add the columns through a reviewed Alembic expand/backfill/constraint change.
  Existing rows receive no fabricated creation key. Existing `draft` rows
  start at version `0` and a null completed-step marker; on first resume, the
  service validates stored answers in order and derives only the last
  contiguous completed step, never trusting non-contiguous later answers to
  unlock Review. Non-draft rows retain a null marker because this flow cannot
  edit them. Newly submitted records may retain their final completed-step
  marker for traceability, but it grants no editability. The database enforces
  version `>= 0`, a unique non-null creation key, and a nullable completed-step
  value limited to `basics`, `endpoints`, `client-and-access`, `signing`, or
  `encryption`. The migration is additive and does not rewrite questionnaire
  values.
- Draft retention, soft deletion, ownership, and disposition remain the
  existing RP application lifecycle. Cancel does not delete a record. A future
  discard/expiry lifecycle requires its own requirements and retention
  decision.
- Repository/service code performs a conditional update on workspace,
  application UUID, current `draft` state, and expected version. The service,
  not the route or browser, owns merge, dependency invalidation, completion,
  and final-transition rules.

### Decision 12: Preserve full-stack dependency direction

- Frontend source route files contain route metadata, guards, loaders, and
  lazy-page wiring only. Feature-owned pages, flow models, and TanStack Query
  hooks own orchestration; typed low-level clients remain in
  `frontend/src/fetch/`.
- TanStack Query owns workspace, report, access, and draft server state. A
  successful draft write updates or invalidates the exact application/detail
  and list query keys so the next read cannot show a stale draft version or
  lifecycle state. Zustand is not a draft, session, or authorization source.
- TanStack Router's generated route tree is regenerated through the supported
  command and is never edited manually. Source parents introduced for
  workspace/registration nesting render an `Outlet`, while index routes own
  hub or step content.
- FastAPI routes own HTTP contracts and dependencies; services own
  questionnaire, lifecycle, authorization-scope, report-scope, and conflict
  behavior; repositories own conditional PostgreSQL updates. The workspace
  report routes call the existing aggregate-report service rather than copying
  calculations.
- External identity, IBM Verify, notification, and reporting dependencies stay
  behind backend services/adapters. This registration package does not call
  IBM Verify or any other external system during draft creation, draft saves,
  final submission, or retry recovery. Final submission only records the
  portal-local `submitted` lifecycle state; a separate IBM-integration package
  owns any later IBM provisioning, update, or synchronization action.

### Decision 13: Server session and authorization remain authoritative

- Accepted ADR-001 applies to every workspace, Access, Reports, audit, and
  registration route. Protected route entry revalidates the BFF session; OIDC
  tokens remain server-side; stale client state fails closed.
- Accepted ADR-003 and archived `define-four-role-authorization-model` own capability
  keys, assignments, workspace scope, and CL Admin secret denial. This package
  is rebased against the resulting current contract and strict validation
  passes.
- UI visibility is discoverability only. Backend services re-evaluate current
  assignment, selected workspace, application ownership, lifecycle state, and
  secret boundary before reading, exporting, or changing data.

### Decision 14: Audit and operational logging record outcomes, not answers

- Draft creation, successful step saves, stale-version conflicts, denied
  writes, and final submission emit the project-approved audit events when the
  current audit contract classifies them as business or security significant.
- Audit metadata is limited to actor reference, workspace/application resource
  reference, step ID, save mode, changed field names, result, timestamp, and
  correlation ID. It never contains questionnaire values, public certificate/JWK
  material, invitation tokens, credentials, or unnecessary personal data.
- Diagnostic logs use structured event names and request/correlation IDs and
  follow the same redaction boundary. Safe API errors never echo a payload or
  reveal whether an out-of-scope record exists.

### Architecture decision impact

No new ADR is required because this change preserves the accepted BFF/session
boundary, existing RP application aggregate, existing REST resources, and
current service/repository dependency direction. This design is the bounded
data-ownership record required by STD-020/PAT-012. A second draft store, a new
cross-service boundary, client-held authorization, or a different lifecycle
aggregate would require a new or updated ADR before implementation.

## Sensitive Data Handling Record

| Data | Classification and purpose | Storage/transport | Access and display | Logging, export, and retention |
|---|---|---|---|---|
| Assignment and invitation user data | Personal/security data used to administer selected-workspace access | PostgreSQL through authorized BFF APIs | Minimum fields on Access for permitted actors only | No body logging or URL values; no export in this change; existing assignment/invitation retention applies |
| Workspace/application names and IDs | Internal business metadata used for context and ownership | PostgreSQL and scoped JSON API; UUID only in route/API path | Name is primary UI label; UUID is technical identifier | Safe resource reference only in audit; no raw UUID as friendly content |
| Registration questionnaire | Internal security configuration used to onboard one RP environment | PostgreSQL `oidc_registration_payload` over authenticated BFF JSON | Partner roles permitted by the canonical contract; CL Admin/redacted readers do not receive secret material | No values in URL, analytics, logs, audit metadata, screenshots, or real-data fixtures; existing RP application retention applies |
| Public offline certificate/JWK and credential-adjacent fields | Sensitive security configuration; private or symmetric key material is forbidden | Same encrypted-in-transit BFF/database boundary as the existing RP registration; no browser persistence | Render only to an authorized editor when the configuration contract permits; reject private JWK members or secret keys before persistence | Never included in report/export, logs, errors, analytics, or audit values; any future private-key intake requires a separate secret-store/lifecycle decision |
| Aggregate report/export | Internal aggregate operational data | Scoped report service response or CSV generated by the backend | Exactly one authorized workspace for partner readers; cross-workspace only on internal route | Aggregate only, no secret or record-level rows; existing report/export retention applies |
| Draft flow metadata | Internal workflow data (opaque creation key, `draftVersion`, completed step) | RP application columns plus structured session-scoped retry state for the non-authoritative creation key | Authorized editors and safe status surfaces; creation key conveys no authority | Version/step/result may be audited; creation key and answer values are not logged or exported; same retention as the RP application |

## Page Pattern Decisions

- [workspace-task-area-page-pattern-decision.yaml](workspace-task-area-page-pattern-decision.yaml)
- [workspace-access-page-pattern-decision.yaml](workspace-access-page-pattern-decision.yaml)
- [workspace-reports-page-pattern-decision.yaml](workspace-reports-page-pattern-decision.yaml)
- [rp-application-registration-flow-page-pattern-decision.yaml](rp-application-registration-flow-page-pattern-decision.yaml)

## Standards Impact

### Affected Standards

- STD-002, STD-003, STD-004, STD-005, STD-006, STD-007, STD-008,
  STD-009, STD-010, STD-011, STD-012, STD-013, STD-017, STD-019, and
  STD-020.
- PAT-001, PAT-002, PAT-003, PAT-004, PAT-005, PAT-008, PAT-009,
  PAT-010, PAT-012, PAT-013, PAT-014, PAT-015, PAT-017, PAT-019,
  PAT-020, PAT-021, PAT-022, PAT-023, and PAT-024.
- BAS-001 controls GC-WEB-001 through GC-WEB-011 all apply because this
  change affects user-facing UI, restricted access, personal/authorization
  data, persistent business records, APIs/exports, audit, and operations.

### Impact

The change is a meaningful full-stack service change. It adds a selected-
workspace API facade, additive RP application draft metadata, partial-write and
atomic-submit contracts, and user-facing route/form changes while preserving
the BFF, server authorization, PostgreSQL, service/repository, and GC Design
System boundaries.

### Exceptions

None. Proposed ADR-002 remains a compatibility constraint, and accepted
ADR-003 remains an architecture dependency. The registration record accepts
public certificate/JWK configuration only; private
or symmetric key material is explicitly rejected. Any future private-key
intake would update this design and add a secret-lifecycle/storage decision
rather than become an implicit exception.

### Verification

- Strict OpenSpec and scenario-preservation validation after the four-role
  rebase.
- Generated OpenAPI, serialized request/response/error, TypeScript client, and
  workspace-report facade contract tests.
- Alembic migration, model/constraint, conditional-update, stale-version,
  lifecycle, idempotent final-submit, and query-cache consistency tests.
- Backend allow/deny, cross-workspace, CL Admin secret-denial, report/export
  scope, audit redaction, and safe-error/log review.
- Desktop/mobile, keyboard, focus, screen-reader, 200% zoom, bilingual,
  page-shell, and GC Design System evidence for representative states.

### Follow-Up

- Continue consuming the archived four-role contract and accepted ADR-003.
- The archived role/report contract permits the proposed workspace BFF routes
  without redefining their scope or DTOs; revalidate after implementation.
- At Level 2, a standalone TPL-011 assessment is advisory during planning;
  complete it when the change enters release review or the adoption level
  increases.

```yaml
standards_impact:
  ui:
    applies: true
    decision: Use PAT-001 for the workspace task hub, focused child pages for Access and Reports, and PAT-019 for route-per-step registration.
    evidence: Page-pattern decisions, route tests, screenshots, and design-system review.
    exceptions: []
  accessibility:
    applies: true
    decision: Side navigation, breadcrumbs, stepper, validation, review, confirmation, keyboard, focus, mobile, and zoom behavior are part of the design contract.
    evidence: Automated checks plus keyboard and screen-reader review of hub and flow states.
    exceptions: []
  official_languages:
    applies: true
    decision: Workspace navigation and every registration step, validation, review, confirmation, and recovery state require English/French parity and equivalent-route language behavior.
    evidence: Locale parity tests and bilingual screenshots or review notes.
    exceptions: []
  security_privacy:
    applies: true
    decision: Backend authorization remains authoritative; workspace scope is explicit; draft writes use optimistic versioning; and internal IDs, personal data, and sensitive questionnaire values are excluded from unsafe UI, URL, storage, error, audit, export, and log surfaces.
    evidence: Cross-scope, denied-route, stale-version, URL/storage/log/audit, report-export, and secret-boundary tests.
    exceptions: []
  identity_access:
    applies: true
    decision: Access, Reports, Settings, draft steps, and audit links consume canonical capabilities from define-four-role-authorization-model.
    evidence: Representative capability-context visibility and backend enforcement tests after rebase.
    exceptions: []
  information_management:
    applies: true
    decision: Registration drafts and submissions remain one governed RP application aggregate; additive version/completion metadata, existing soft-delete/retention, redacted audit events, and explicit final transition prevent hidden or overwritten business actions.
    evidence: Migration, conditional-update, draft persistence, final-submit idempotency, audit-redaction, retention, and recovery tests.
    exceptions: []
  api_data_operations:
    applies: true
    decision: Resource-oriented workspace report and RP application contracts use thin FastAPI routes, services, repositories, explicit Pydantic models, generated OpenAPI, endpoint-specific wire casing, PostgreSQL/Alembic persistence, safe errors, and structured redacted logs.
    evidence: OpenAPI/frontend contract diff, route/service/repository tests, migration review, cache-consistency test, and safe-error/log review.
    exceptions: []
  verification:
    applies: true
    decision: Validate before implementation, revalidate after the role-change rebase, and capture hub, step, error, review, confirmation, responsive, accessibility, and bilingual evidence.
    evidence: OpenSpec validation, focused tests, screenshots, and verification notes.
    exceptions: []
  gc_web_application_baseline:
    applies: true
    decision: Treat the eventual workspace IA and registration-flow implementation as a meaningful GC web application UI change.
    evidence: Lightweight Level 2 baseline and UI review during implementation.
    exceptions: []
```

## Slice Plan

### Slice 1: Rebase and workspace route metadata

- Outcome: the package consumes the archived four-role capability contract and
  defines the workspace route hierarchy in one typed model.
- Exit: hub, side navigation, breadcrumbs, names, active states, and return
  paths are consistent.

### Slice 2: Workspace task hub and compatibility route

- Outcome: workspace detail becomes the task hub and `/members` redirects to
  `/access` without changing authorization.
- Exit: every workspace task is discoverable without a direct URL.

### Slice 3: Access and scoped Reports destinations

- Outcome: role-owned assignment/invitation behavior and existing report
  contracts have focused workspace entry pages.
- Exit: partner reporting no longer depends on the internal oversight route.

### Slice 4: Server-backed registration draft and step model

- Outcome: draft creation/update, edit-route state guards, route steps,
  incomplete-persistence versus completion rules, conflict handling, and
  recovery are available through one flow model.
- Exit: refresh, Back, Continue, Save and exit, and session recovery work before
  final submission.

### Slice 5: Review, final submission, and confirmation

- Outcome: itemized review, Change links, idempotent final submit, and
  confirmation complete the transaction.
- Exit: intermediate saves cannot be mistaken for final business submission.

### Slice 6: Verification and archive readiness

- Outcome: role/cross-scope, route, draft, validation, responsive,
  accessibility, bilingual, design-system, and OpenSpec evidence is complete.
- Exit: current specs can be updated through normal archive without stale
  Members/single-page-form behavior.

## Implementation Readiness

- The UI, requirements, API, persistence, and architecture-boundary package is
  ready for local planning.
- The four-role dependency is archived, this package is rebased against its
  current contracts, and strict validation against accepted ADR-003 passes.
- The resource paths, partial/complete/final validation split, expected-version
  contract, RP application ownership, and additive persistence shape are
  selected here. Implementation may refine local class/function names, but a
  second draft store, different resource path, different state authority, or
  different serialized contract requires an OpenSpec/design update before
  code.

## Open Questions

No product IA or application-architecture question remains open. This MVP
intentionally leaves the existing RP application retention behavior unchanged;
a future approved change will own any retention-policy or physical-disposition
work. At-rest protection for a shared environment remains a deployment and
release-readiness check, not a blocker for this local Level 2 change. Private
or symmetric key intake is out of scope.
