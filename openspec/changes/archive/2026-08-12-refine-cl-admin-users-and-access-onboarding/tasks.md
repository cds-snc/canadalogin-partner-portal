# Tasks

## 0. Specification And Design

- [x] 0.1 Record the local-only work context, dependency modes, identity
  provenance boundary, and IBM/Notify exclusions.
- [x] 0.2 Add OpenSpec deltas for centralized CL Admin access management,
  workspace-owned invitation onboarding, and role-scoped workspace Access.
- [x] 0.3 Record the Users and access page-pattern, route, component,
  accessibility, bilingual, privacy, IAM, IM, and BAS-001 decisions.
- [x] 0.4 Validate the active change strictly and run scenario-preservation
  checks.
  Progress note (2026-08-12): `make validate-openspec-change
  CHANGE_ID=refine-cl-admin-users-and-access-onboarding` passes strict OpenSpec
  validation and scenario preservation.

## 1. Concise Accessible Table Actions

- [x] 1.1 Replace the undefined visually-hidden action-label class in the
  shared DataTable with the project-supported accessible utility or wrapper.
- [x] 1.2 Use concise visible row-action verbs in affected administration
  tables while preserving record-specific accessible names.
- [x] 1.3 Add focused DataTable and page regressions for visible text,
  accessible name, keyboard focus, and bilingual action labels.
- [x] 1.4 Run focused frontend unit, type, lint, and format checks for the
  shared action fix before continuing.
  Progress note (2026-08-12): DataTable and the two other undefined
  `gcds-sr-only` live-region uses now use the supported `sr-only` utility;
  department and tier row actions use concise English/French `Manage` labels
  with record-specific accessible context. Focused Vitest passes 21 tests;
  TypeScript, affected-source ESLint, and Prettier checks pass.

## 2. Workspace-Owned Invitation Persistence And API

- [x] 2.1 Add the `0025_workspace_invitations` Alembic revision making
  `rp_application_id` nullable without altering existing rows, workspace
  ownership, lifecycle constraints, token hashing, or pending uniqueness.
- [x] 2.2 Update the SQLAlchemy model, internal/public schemas, repository, and
  service to treat the RP application as optional source provenance.
- [x] 2.3 Add canonical workspace invitation list/create/revoke/reissue routes
  and keep RP-application routes as adapters over the same service.
- [x] 2.4 Update acceptance so a workspace-only invitation creates exactly one
  canonical assignment and returns a workspace-safe next destination.
- [x] 2.5 Preserve the existing CL Admin/RP Admin delegation matrix, explicit
  conflict behavior, transaction boundaries, idempotency, and safe audit
  metadata.
- [x] 2.6 Add migration, model, service, API, authorization, concurrency, safe
  error, token-surface, and no-RP-application tests.
  Progress note (2026-08-12): revision 0025 preserves every invitation while
  making RP-application provenance optional and refusing an unsafe downgrade.
  Canonical workspace routes and compatibility adapters share one service,
  including reissue and a workspace-safe acceptance destination. The focused
  backend set passes 138 tests; five explicitly gated PostgreSQL concurrency
  tests are skipped because their local opt-in configuration is absent.

## 3. CL Admin User Access Reads And Existing-Identity Management

- [x] 3.1 Add a CL Admin-only user access-detail response with public identity,
  global assignment, workspace assignment summaries, and manageable pending
  invitation summaries.
- [x] 3.2 Add safe normalized-email resolution for the invite flow so an
  existing eligible identity is directed to explicit access management and no
  duplicate user/invitation is created.
- [x] 3.3 Reuse canonical assignment APIs/services for add, replace, and revoke
  operations from the centralized surface; do not add a second access model.
- [x] 3.4 Add query plans/index review as needed to avoid per-row access-summary
  queries in the paginated directory.
- [x] 3.5 Add CL Admin-only, denied-role, missing/disabled/deleted identity,
  mixed-access, same-workspace conflict, cross-workspace, and safe-projection
  tests.
  Progress note (2026-08-12): directory and detail projections use bounded
  aggregate reads rather than per-row access lookups. The invitation-target
  resolution endpoint fails closed for unsafe identity state and returns only
  the public UUID for an existing manageable identity. Projection regressions
  also assert explicit SQL column labels.

## 4. Users And Access Frontend

- [x] 4.1 Convert `/users` to the access-oriented directory with user identity,
  account status, global access, workspace access summary, `Invite user`, and
  concise `Manage` actions; remove Auth provider from the main table.
- [x] 4.2 Add thin `/users/invite` and `/users/$userUuid` source routes with
  Administration parent metadata, authorization guards, breadcrumbs, and
  generated route-tree refresh.
- [x] 4.3 Build the focused Invite user form using GC Design System components,
  selecting email, workspace, partner role, and expiry, with existing-identity
  redirection and safe confirmation/recovery states.
- [x] 4.4 Build the focused existing-user access page with profile summary,
  global access, workspace assignments, pending invitations, and permitted
  add/replace/revoke actions.
- [x] 4.5 Keep low-level API calls in typed fetch clients, orchestration in
  feature hooks, and invalidate directory, user access, workspace Access,
  invitation, and session query keys after writes.
- [x] 4.6 Add complete English/French parity for routes, headings, table
  headers, roles, hints, errors, confirmations, statuses, and accessible names.
- [x] 4.7 Add loading, empty, partial, error, conflict, unauthorized, success,
  and return-path states without exposing provider or policy internals.
  Progress note (2026-08-12): the directory now shows account and canonical
  access state, not provider implementation detail. Invite and manage-access
  child routes use focused pages and correct Administration breadcrumbs. The
  shared GCDS table wrapper now receives the active language so built-in sort,
  filter, pagination, and row-count controls remain bilingual.

## 5. Workspace Access Alignment

- [x] 5.1 Replace per-application invitation aggregation with the canonical
  workspace invitation resource while preserving lifecycle history.
- [x] 5.2 Let CL Admin invite RP Admin or lower partner roles in selected
  workspace context and let RP Admin invite only RP User (Edit) or Read Only in
  the assigned workspace.
- [x] 5.3 Support the first RP Admin invitation before any RP application exists
  and redirect accepted workspace-only invitations to the workspace hub.
- [x] 5.4 Keep assignment and invitation actions hidden when unavailable and
  denied server-side when called directly or with stale authorization.
- [x] 5.5 Add focused workspace Access tests for CL Admin, RP Admin, lower
  roles, no-RP-application bootstrap, cross-workspace denial, and lifecycle
  states.
  Progress note (2026-08-12): Workspace Access now uses the workspace-owned
  invitation resource and supports create, revoke, and confirmed reissue.
  Live local-persona review confirmed CL Admin can offer RP Admin while an RP
  Admin sees only Edit and Read Only, exact-email search, its own workspace,
  and no CL Admin directory route.

## 6. Generated Contracts And Verification

- [x] 6.1 Regenerate OpenAPI and the TanStack Router tree through supported
  commands and align camelCase frontend wire types and clients.
- [x] 6.2 Run focused backend tests for invitation, authorization, users, API,
  migration, audit, and concurrency behavior.
- [x] 6.3 Run focused frontend tests plus typecheck, lint, format, build,
  translation parity, page-shell, and design-system checks.
- [x] 6.4 Run local fake-data browser verification of invite-new, manage-existing,
  first-RP-Admin, RP-Admin lower-role, conflict, revoke, and acceptance paths.
- [x] 6.5 Capture desktop/mobile, keyboard, visible-focus, 200 percent zoom,
  screen-reader-semantic, bilingual, and sensitive-surface results.
- [x] 6.6 Complete the BAS-001 affected-control assessment, listing skipped
  checks and the remaining real CanadaLogin/Notify/shared-environment gaps.
- [x] 6.7 Re-run strict OpenSpec validation and scenario preservation, confirm
  all tasks/evidence are current, archive without `--skip-specs`, and verify all
  three current capability specs receive the implemented deltas.
  Progress note (2026-08-12): OpenAPI is current; 138 focused backend tests
  pass with five opt-in PostgreSQL tests skipped; all 474 frontend unit tests,
  TypeScript, ESLint, scoped format, production build, GC Design System, and
  page-shell checks pass. Browser review covered desktop, 390-pixel reflow,
  English/French, concise accessible actions, invite-new, manage-existing,
  first-RP-Admin creation/revoke/reissue, and both role boundaries. A complete
  browser acceptance using a fresh matching identity, persisted screenshots,
  assistive-technology review, and 200 percent zoom were not available in the
  local persona/browser boundary; automated service/API tests cover acceptance
  and the remaining release evidence is recorded in the Evidence Bundle. The
  full backend Ruff command also remains red on unrelated pre-existing
  department-test tab indentation and IBM-test formatting; all files in this
  slice pass scoped Ruff lint and format checks.
  Archive note (2026-08-12): archived without `--skip-specs` as
  `2026-08-12-refine-cl-admin-users-and-access-onboarding`. OpenSpec promoted
  three added and four modified requirements with zero removals. Each of the
  three affected current capability specs passes strict validation. The
  unrelated pre-existing `standardized-error-logging` current spec still lacks
  the OpenSpec Purpose/Requirements wrapper, so repository-wide strict
  validation remains red outside this change.
