# Tasks: Consolidate workspace RP application experience

## 0. OpenSpec and design readiness

- [x] 0.1 Confirm adoption Level 2 and local developer / localhost scope.
- [x] 0.2 Inventory workspace, application-information, RP application,
  current-user projection, registration, usage, credential, and IBM-backed
  OAuth setup requirements and implementation surfaces.
- [x] 0.3 Resolve the canonical ownership model and identify the MVP1 OAuth
  detail page as the stale competing experience.
- [x] 0.4 Select a PAT-001 role-aware RP application task hub with focused
  Configuration, Usage, and Manage credentials routes.
- [x] 0.5 Record the reported Step 2 `422` as an actionable validation and
  contract-regression requirement without assuming its unobserved cause.
- [x] 0.6 Validate the complete active change strictly after all deltas and
  active-change route references are aligned.

## 1. Reproduce and repair registration Step 2

- [x] 1.1 Reproduce the Endpoints `PATCH` locally with fake/test data and
  capture the standardized `422` response body, request ID, safe field names,
  and server validation path without logging answer values.
- [x] 1.2 Add a backend test proving a representative valid Endpoints payload
  completes the step, increments the draft version, and returns the saved
  draft.
- [x] 1.3 Add a cross-stack contract test that sends the actual
  frontend-serialized `completeStep` request through the generated/backend
  schema, including camelCase aliases, URL lists, logout mode, prerequisite
  answers, and `expectedDraftVersion`.
- [x] 1.4 Identify whether the observed `422` is correct field validation,
  conditional/prerequisite validation, enum/list drift, or request alias drift;
  update this design if the fix changes a public contract.
- [x] 1.5 Render correctable `422` responses as a focused localized error
  summary with field-level links while preserving entered values and the last
  server-saved draft/version on Endpoints.
- [x] 1.6 Keep load, conflict, validation, network, and unexpected persistence
  failures distinct and verify retry/reload behavior for each.
- [x] 1.7 Verify focus movement, error-summary announcement, field
  associations, keyboard recovery, English/French parity, and no sensitive
  values in logs or browser evidence.

## 2. Shared RP application summary and ownership contract

- [x] 2.1 Define one strict secret-free RP application summary schema with RP
  UUID, workspace UUID, localized RP and workspace names, environment,
  onboarding state, optional promotion state, and permitted resume task.
- [x] 2.2 Make workspace and current-user list endpoints derive summaries from
  the same mapping while applying session, canonical grant, and resource scope
  before serialization.
- [x] 2.3 Exclude client IDs, credentials, secrets, provider identifiers, raw
  provider status/payload, internal policy, and out-of-scope identifiers.
- [x] 2.4 Reuse a shared semantic list/card presentation for localized names,
  statuses, ordering, links, loading, empty, partial, error, and revoked-scope
  states on both application surfaces.
- [x] 2.5 Add contract and presentation tests proving that the same RP
  application has the same summary meaning in workspace and My Applications
  contexts.

## 3. Canonical routes and compatibility

- [x] 3.1 Make both application lists link to
  `/workspaces/$workspaceUuid/applications/$rpApplicationUuid`.
- [x] 3.2 Add safe legacy redirects from current-user detail, MAU report, and
  credential paths after server-scoped RP resolution and active-grant checks.
- [x] 3.3 Deny missing, revoked, out-of-scope, and workspace/RP mismatch cases
  without disclosing resource existence or invoking IBM Verify.
- [x] 3.4 Update route metadata, generated TanStack route artifacts,
  breadcrumbs, explicit return paths, English/French labels, and saved-link
  tests.
- [x] 3.5 Reconcile `add-reports-task-hub` implementation and tests so its
  application chooser links to the canonical workspace-scoped Usage route.
- [x] 3.6 Reuse the shared shell/navigation result from the concurrent
  sidebar-removal work; do not introduce an RP-specific sidebar.

## 4. Role-aware RP application overview

- [x] 4.1 Replace the overloaded workspace detail and MVP1 OAuth landing with
  one localized RP application H1, concise portal-owned environment/lifecycle
  context, and responsive single-destination `GcdsCard` tasks.
- [x] 4.2 Show Configuration, Usage, and Manage credentials to RP Admin and RP
  User (Edit) using canonical capabilities.
- [x] 4.3 Show Configuration and Usage to Read Only without edit or secret
  controls.
- [x] 4.4 Show CL Admin only permitted RP metadata/status plus a localized
  no-partner-actions state; never show configuration, usage, credential, or
  secret destinations that its capabilities deny.
- [x] 4.5 Enforce the same permissions on direct child routes and backend
  operations; hidden cards are not authorization.
- [x] 4.6 Verify card accessible names, H1 and heading order, source/keyboard
  order, visible focus, one-column reflow, 200-percent zoom, long French
  content, and independent loading/error states.

## 5. Portal-owned Configuration

- [x] 5.1 Add or adapt a workspace-scoped secret-free Configuration DTO and
  query from portal registration/draft/submission persistence without an IBM
  Verify dependency.
- [x] 5.2 Present safely displayable application, endpoint, client, scope,
  sector, PKCE, signing, validation, encryption, decryption, roadmap, and
  lifecycle values under semantic translated headings.
- [x] 5.3 Exclude private/symmetric key material, credentials, secrets, tokens,
  raw provider payloads, internal policy, and unnecessary personal data; show
  only a safe presence/exchange summary for public key material when needed.
- [x] 5.4 Provide role- and lifecycle-appropriate Edit or Resume registration
  actions for RP Admin and RP User (Edit), and a read-only view for Read Only.
- [x] 5.5 Assign application-information link/unlink and confirmed RP deletion
  to focused Configuration flows without embedding them on the overview.
- [x] 5.6 Add authorization, secret-absence, IBM-outage, incomplete-draft,
  conditional-field, bilingual, accessibility, responsive, and safe-error
  tests.

## 6. Usage, credentials, and overloaded-detail action migration

- [x] 6.1 Make workspace-scoped Usage the canonical application usage page and
  preserve the existing `mau_report_read` scope, default rolling date range,
  filtering, CSV export, and safe unavailable behavior.
- [x] 6.2 Move Manage credentials to the workspace-scoped UI route while
  retaining mask/reveal, rotation, audit, and grant-derived backend safeguards.
- [x] 6.3 Verify Read Only and CL Admin cannot discover or directly enter the
  credential route and authorization fails before provider secret retrieval.
- [x] 6.4 Move workspace invitations and role access to Workspace Access,
  application-information navigation to its existing routes, and RP audit to a
  focused audit/report route or a secondary Usage link.
- [x] 6.5 Inventory every action on the old workspace detail and MVP1 OAuth
  page; retain a temporary compatibility path for any action not yet safely
  rehomed instead of silently dropping it.
- [x] 6.6 Remove the embedded IBM-backed OAuth landing request only after all
  internal callers and tests have migrated; deprecate or remove the endpoint
  through a compatible API slice.

## 7. Verification and archive readiness

- [x] 7.1 Run focused backend service/API/schema tests and frontend unit,
  route, query, typecheck, lint, and browser tests.
- [x] 7.2 Verify representative RP Admin, RP User (Edit), Read Only, CL Admin,
  mixed-workspace, revoked-grant, not-found, provider-outage, and direct-route
  states.
- [x] 7.3 Run accessibility, bilingual, GC Design System/page-shell, security,
  privacy, mobile, zoom, and no-horizontal-scroll reviews and record skipped
  checks and residual risk.
- [x] 7.4 Capture local fake-data evidence for both application lists, each
  task-hub role variant, Configuration, legacy redirects, and Step 2 valid and
  invalid recovery.
- [x] 7.5 Run holistic local verification and strict OpenSpec validation.
- [x] 7.6 Archive only after implementation and verification, without
  `--skip-specs`, so current specs retire MVP1 OAuth setup and reflect the
  canonical workspace-owned RP application experience.
