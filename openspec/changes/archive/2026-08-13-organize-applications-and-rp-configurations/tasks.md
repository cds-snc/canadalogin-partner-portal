# Tasks: Organize Applications and RP configurations

## 0. OpenSpec, architecture, and dependency readiness

- [x] 0.1 Confirm Delorean Level 2 and local developer / localhost scope.
- [x] 0.2 Inventory current workspace, Application-information, contact, RP,
  registration, Usage, credentials, adoption, readiness, review, Reports,
  navigation, and compatibility behavior.
- [x] 0.3 Resolve the product hierarchy, many-configurations-per-environment
  rule, configuration-name semantics, contact identity, page split, and
  retirement of `Your applications` from repo context and user decisions.
- [x] 0.4 Record `ADR-004`, the page-pattern decision, standards impact, route
  collision, data migration, and control-boundary decisions.
- [x] 0.5 Validate the initial active package strictly and run the repository
  scenario-preservation and scoped Markdown checks.
- [x] 0.6 Finish/archive or explicitly rebase
  `simplify-task-area-navigation` before this change replaces its full Home and
  workspace task-hub requirements.
  - Archived as `2026-08-13-simplify-task-area-navigation`; current specs were
    inspected and this package passed strict validation and scenario
    preservation against the promoted requirements.
- [x] 0.7 Finish/archive `add-reports-task-hub`; immediately rebase this
  package so its exact `Report discovery preserves canonical report scope`
  requirement is fully MODIFIED with all six scenarios and the nested RP-
  configuration Usage destination before route work or archive proceeds.
  - Archived as `2026-08-13-add-reports-task-hub`; the hierarchy delta now
    fully replaces the promoted requirement, preserves all six scenarios, and
    adds Application/RP-configuration labels, the nested Usage destination,
    same-environment disambiguation, server-scoped compatibility, and legacy
    redirect coverage.
- [x] 0.8 Re-run strict OpenSpec validation after each upstream archive and
  confirm no scenario restores `/your-applications` or peer Application-
  information/RP-application navigation.
  - Strict validation and scenario preservation passed after both archives.
    `/your-applications` remains only a compatibility redirect surface, and
    Applications replaces the peer workspace destinations.

## 1. Expand the data model and typed contracts

- [x] 1.1 Add the nullable RP configuration-name backbone through an Alembic
  expand migration and compatible read contracts without activating required
  writes or inferred backfill.
  - Added optional `configurationName` to the model, secret-free summaries,
    compatible detail/configuration reads, frontend types, and OpenAPI.
    Focused migration/serialization tests passed, and an opt-in disposable
    PostgreSQL test verified upgrade, downgrade, full revision storage, and
    re-upgrade to the single head.
- [x] 1.2 Add explicit clone-source metadata through an Alembic expand
  migration and compatible internal contracts, keeping the integer self-
  reference out of public reads until services resolve it to a public UUID.
- [x] 1.3 Add nullable contact first name, last name, alternate phone,
  `identity_confirmed_at`, and `identity_confirmed_by` while retaining current
  responsibility fields and making legacy bilingual name fields nullable for
  dual read.
- [x] 1.4 Update the remaining SQLAlchemy models, Pydantic aliases,
  repository/service DTOs, frontend contract types, fixtures, and OpenAPI
  without exposing new internal integer IDs or provider payloads. Public
  confirmation-actor UUID resolution remains with the focused contact API in
  section 3; the new internal actor and clone-source IDs are not serialized.
- [x] 1.5 Trim Unicode whitespace, normalize configuration names to NFC,
  reject blank results, and enforce at most 128 post-normalization characters
  at the shared domain and internal service-contract boundaries. Public
  Application-scoped request models will reuse this normalizer when their
  focused endpoints are introduced.
- [x] 1.6 Add migration upgrade/downgrade and contract tests for clone-source
  and contact expansion before enabling
  new writes. Focused unit and serialization tests pass, the OpenAPI artifact
  is current, the frontend build and 491-test suite pass, and a disposable
  localhost PostgreSQL database verified the full upgrade, two-stage
  downgrade, and re-upgrade path.

## 2. Backfill, parent ownership, and constraints

- [x] 2.1 Backfill every RP row with a deterministic safe label
  based on existing non-secret metadata and stable UUID; update provider sync
  to label future retained candidates.
- [x] 2.2 Backfill RP Department context from its workspace and fail the
  migration report on contradictory values instead of silently choosing one.
- [x] 2.3 Inventory every active workspace-linked RP row without an Application
  parent and support an explicit local migration mapping; do not infer a parent
  from names, environment, or provider metadata.
- [x] 2.4 Inventory active workspace-linked RP rows without a CanadaLogin
  environment and require explicit mapping or fail contract activation.
- [x] 2.5 Preflight all existing and concurrent RP/Application links for same-
  workspace ancestry, including deleted-state predicates; reject or report
  cross-workspace and workspace-less-parent combinations without guessing.
- [x] 2.6 Require an active Application in the selected workspace for every new
  partner configuration and every adopted retained provider candidate.
- [x] 2.7 After backfill checks pass, enforce the candidate null-pair and active
  partner-visible workspace, parent, configuration-name, and CanadaLogin-
  environment invariants with database constraints where possible and locked
  service checks for same-workspace ancestry.
- [x] 2.8 Verify row counts, orphan and null-environment counts, required names,
  cross-workspace ancestry, FK integrity, soft-delete behavior, downgrade
  behavior, and transactional/concurrent failure recovery.
  - The frozen UUID-only reconciliation snapshot and reviewed-manifest path
    cover row/finding counts, ancestry, Department, environment, lifecycle,
    and name failures under table locks. Runtime create, resume, update, and
    adoption contracts now require and revalidate the public Application UUID
    while keeping internal IDs private. Revision 0030 repeats the locked
    preflight and activates required/nonblank names, hierarchy pairing, and
    partner fields. Focused service/schema tests, the 491-test frontend suite,
    production build, OpenAPI export, and disposable PostgreSQL clean,
    populated, failed-activation, downgrade/repair, and retry paths pass.
  - Deterministic local-persona fixtures now create one Application per
    workspace before their named RP configurations, retain the reviewed
    configuration labels used by the legacy backfill, and verify the parent
    linkage and safe cleanup path.

## 3. Contact contract and focused management

- [x] 3.1 Dual-read legacy contact values without parsing or translating them,
  show the locale-specific retained full name as fallback, preserve divergent
  English/French responsibility values, and mark each legacy contact as
  requiring partner confirmation.
- [x] 3.2 Make new writes accept first name, last name, bilingual
  responsibility/title, email, and optional phone numbers.
- [x] 3.3 Stop counting an unconfirmed legacy contact as readiness-complete.
- [x] 3.4 Add an Application Contacts list plus focused create and edit routes;
  keep deletion confirmed and capability-protected.
- [x] 3.5 Add API, service, form, validation, authorization, bilingual-label,
  fallback, divergent-value, audit, retention/downgrade, empty/error, and
  migration tests.
- [x] 3.6 Allow RP Admin and RP User (Edit) to confirm first/last identity with
  minimized actor/time audit metadata and no overwrite of responsibility.
  - The compatibility read keeps each retained localized full name separate,
    marks unconfirmed records explicitly, and resolves the confirmation actor
    to a public user UUID without serializing the internal ID. New create and
    edit writes use first/last identity while preserving bilingual
    responsibilities and optional phone numbers. Readiness now rejects every
    unconfirmed legacy record. Focused backend schema/service/API and frontend
    form/API/readiness/detail tests pass, and OpenAPI is current.
  - The Application page now links to a dedicated semantic contact-card list,
    with separate create and edit/confirmation routes. Actions stay inside the
    affected card, read-only users receive no mutation controls, deletion
    remains confirmed, and empty/error states are explicit. The production
    frontend build, lint, all 499 frontend tests, 11 focused backend tests, and
    focused Ruff checks pass.
- [x] 3.7 Retain legacy bilingual person-name fields in this change and record
  their contraction as a separate evidence-gated follow-up only after data and
  caller checks prove every active contact is confirmed; continue retaining
  bilingual responsibility fields.
  - The expand/confirm implementation preserves both retained locale-specific
    names without guessing, while canonical writes use one first/last identity.
    No shared-target active-contact or caller-zero evidence exists in this local
    boundary, so contraction is intentionally outside this change rather than
    an incomplete migration slice.

## 4. Build Application collection and task hub behind the cutover gate

- [x] 4.1 Build the server-scoped Application list and route set behind an
  inactive local hierarchy feature gate; do not change discovery yet.
- [x] 4.2 Render Applications as semantic item summaries with localized names,
  concise status/readiness context, contained links, responsive wrapping, and
  GCDS-token spacing.
  - The server-scoped Application collection is now the canonical
    `/workspaces/:workspaceUuid/applications` destination. Its semantic list
    summaries keep localized names, status/readiness context, and contained
    actions; legacy `application-information` browser paths are redirect-only.
  - Superseded for the final collection UI by 7A.5, which retains the existing
    compact table and adds the selected-Application create action.
- [x] 4.3 Replace the long Application-information detail body with a concise
  Application H1, short overview, textual readiness status, safe counts, and
  authorized single-destination task cards.
- [x] 4.4 Add focused Details/read-only, Details/edit, Readiness, Contacts, and
  CL-Admin-only Internal review routes plus Application settings/delete with
  stable parent links and breadcrumbs.
- [x] 4.5 Keep `GcdsDetails` limited to optional supporting content; do not hide
  required status, errors, fields, or actions.
- [x] 4.6 Inventory and relocate every current edit, delete, readiness,
  checklist, review-note, and contact action before removing it from the
  monolith.
  - The compact hub links to focused Details, Readiness, Contacts, Internal
    review, and Settings owners. Details preserves lifecycle timestamps and
    edit; Internal review preserves every checklist status, disposition,
    rationale, reviewer, timestamp, and review-note action; Settings owns the
    confirmed delete. Every focused page includes an explicit parent link.
    Frontend lint, focused unit tests, the production build, signed-in desktop
    checks, and a 390-by-844 no-horizontal-overflow check pass.
  - Superseded for final user-facing ownership by 7A.7 and 7A.8: Application
    Settings is retired in favour of focused delete confirmation, and
    Readiness receives the approved compact presentation.

## 5. Build nested RP configurations and registration behind the cutover gate

- [x] 5.1 Add the Application-scoped RP configurations list and use
  `configurationName` as each primary label with an explicit `CanadaLogin
  environment` value.
- [x] 5.2 Put Resume and detail navigation inside the configuration item it
  affects and preserve semantic list structure, spacing, empty/loading/error,
  and responsive states.
  - Added a non-colliding, secret-free v1 read endpoint below the existing
    Application-information parent. It revalidates workspace capability and
    active same-workspace Application ancestry, filters RP records by that
    parent, and sources bilingual Application identity from the parent rather
    than legacy child payload values. The existing workspace RP collection
    keeps its current meaning.
  - The focused collection uses configuration name as its primary link,
    explicitly labels CanadaLogin environment and parent Application, keeps
    Resume and detail links within each semantic bordered list item, and
    exposes loading, empty, scoped error, parent-return, and responsive states.
    The Application hub now shows a server-scoped configuration count and one
    destination card. Focused backend/API and frontend tests pass; frontend
    lint/build, OpenAPI export, Ruff, diff checks, and signed-in desktop
    no-horizontal-overflow checks pass.
  - Superseded for the final collection UI by 7A.6, which replaces the
    repeated-item summaries with the approved GCDS comparison table.
- [x] 5.3 Add nested RP-configuration overview, Configuration, registration,
  Usage, Manage credentials, audit, and lifecycle/delete destinations with workspace,
  Application, and configuration ancestry checks.
  - Added a secret-free RP-configuration task hub plus focused Configuration,
    registration, Usage, Manage credentials, audit, and Settings/delete routes.
    Every route retains Workspace, Application, and RP-configuration identifiers;
    task availability remains capability-driven, and the draft-only registration
    destination resumes at the earliest incomplete step.
  - Added nested Configuration, registration-draft, submission, usage, audit,
    and delete APIs that revalidate active same-workspace Application ancestry.
    Existing accessible MAU and credential compatibility APIs now accept an
    optional `applicationInformationUuid` constraint and fail closed when that
    parent does not own the selected configuration. Existing workspace-scoped
    v1 routes and response meanings remain available.
  - Resume links on Application-scoped list items are rewritten to the nested
    registration route. Consequential deletion lives on a focused Settings page
    with explicit parent context and confirmation; no destructive browser action
    was exercised during verification.
  - Full verification passes: 849 backend tests with 16 intentional skips, 510
    frontend tests, frontend production build and lint, focused Ruff checks,
    OpenAPI export, and signed-in desktop checks of the hub, Configuration,
    registration, and Settings pages with no horizontal overflow or browser
    console errors.
- [x] 5.4 Change registration Basics to collect configuration name and
  CanadaLogin environment while inheriting bilingual public names from the
  Application parent.
- [x] 5.5 Preserve all current questionnaire constraints, save-and-return,
  idempotency, optimistic concurrency, Review, submit-once, confirmation,
  provider-isolation, and safe logging behavior.
- [x] 5.6 Update summaries, oversight rows, adoption DTOs, audit descriptions,
  translated content, fixtures, and tests to use configuration identity.
- [x] 5.7 For exact duplicate displayed configuration name/environment pairs,
  show a localized short public reference using UUID prefixes extended from
  eight characters in four-character increments only as needed; test that the
  raw UUID is not the primary label and target selection remains unambiguous.
  - Registration Basics now requires a normalized configuration name and
    explicit CanadaLogin environment while reading bilingual service identity
    from the selected Application. Existing draft, optimistic-concurrency,
    idempotency, review, submission, confirmation, and provider-isolation
    behavior remains covered by the full backend and frontend suites.
  - Secret-free summaries, oversight, adoption, fixtures, audit labels, and
    localized UI copy use configuration identity. Configuration collections
    and report selection add the shortest collision-free public UUID prefix
    only when an exact displayed name/environment pair is duplicated; the
    UUID is never the primary label.
  - Superseded for the final identity contract by 7A.2-7A.4 and 7A.9, which
    add Partner environment without changing the completed registration-flow
    behavior recorded here.

## 6. Progression, adoption, Reports, and Department inheritance

- [x] 6.1 Make progression select exactly one source configuration and create a
  distinct named target draft with explicit source identity and allowlisted
  copied answers.
- [x] 6.2 Permit several independent configurations and promotion families in
  one Application and CanadaLogin environment; never infer or overwrite a
  unique successor.
- [x] 6.3 Attach production review to the chosen production target and preserve
  existing review traceability and authorization.
- [x] 6.4 Make CL Admin adoption select an active Application in the chosen
  workspace, set configuration identity, preserve the retained RP UUID and
  audit history, and fail closed under concurrency.
- [x] 6.5 Update the Reports usage chooser to show workspace, localized
  Application name, configuration name, and CanadaLogin environment and to
  link to the nested Usage route.
- [x] 6.6 Derive effective Department from the workspace, migrate current
  callers, and remove the per-RP forced Department-assignment page without
  weakening authorization; retain the existing GET/PATCH as deprecated
  projection/idempotent-or-reject compatibility adapters until later removal.
  - Progression creates a distinct named target, records the exact source, and
    copies only allowlisted answers. Independent configurations and promotion
    families may coexist in the same Application/environment, and production
    review remains attached to the selected target.
  - Adoption requires an active same-workspace Application, preserves the
    retained public RP UUID and history, and revalidates under concurrency.
    Reports retain configuration identity through selection and link to nested
    Usage. Workspace Department is authoritative; the forced setup page is
    removed while deprecated GET/PATCH compatibility behavior projects or
    validates the inherited value.

## 7. Compatibility, single activation, and navigation cutover

- [x] 7.1 Preserve the existing user-controlled header disclosure behavior:
  first activation opens, subsequent activation closes, keyboard and focus
  remain usable, and rerendering does not force the group open.
- [x] 7.2 Migrate every generated workspace RP link to the nested Application/
  RP-configuration route and add authorized redirects for saved legacy detail,
  edit, Usage, credential, and setup paths.
- [x] 7.3 Run the cross-table UUID collision preflight and stop activation on
  any collision; remediate only through an explicit migration mapping.
  - Reconciliation and revision 0031 detect collisions and stop migration;
    symmetric transaction-advisory-lock triggers prevent new cross-table UUID
    collisions. The named local-only database is at revision 0031 with zero
    same-workspace cross-namespace collisions and both guards installed, so no
    mapping was required. No shared target was inspected or changed.
- [x] 7.4 Prevent new Application/RP UUID collisions transactionally while
  legacy resolution remains and add recurring drift detection.
- [x] 7.5 Add the safe compatibility resolver without provider, Usage,
  credential, or secret retrieval; test missing, revoked, mismatched-parent,
  stale, and direct-entry paths.
- [x] 7.6 Keep the accessible RP summary API and current versioned RP routes
  while Reports, redirect, or legacy callers use them; implement and test the
  endpoint/method/payload compatibility matrix rather than repurposing v1.
- [x] 7.7 Activate the Application and nested RP route set only after 7.2-7.6
  and all dark-route tests pass; then switch selected-workspace discovery to
  one `Applications` destination.
  - Selected-workspace discovery now exposes one canonical Applications
    destination at `/applications`. The dynamic parent resolves an in-scope
    Application first and otherwise uses the resource-specific authorized RP
    compatibility endpoint to redirect saved links to nested configurations.
    The old browser `application-information` route is redirect-only, while v1
    API paths retain their documented non-colliding meaning.
- [x] 7.8 Remove `Your applications` from Home, route metadata, shared primary
  navigation, generic error recovery, and new documentation only after its
  redirects are live; redirect `/your-applications` to `/workspaces`.
- [x] 7.9 Create a compatibility record naming owner, introduction version,
  root-versus-deep-link inventory, caller-zero evidence, observation period,
  and separate human approval before any shared-environment removal.
- [x] 7.10 Update English/French route labels, headings, breadcrumbs, parent
  links, status text, form labels, hints, errors, and accessible names.
  - The header disclosure is uncontrolled and remains user-toggleable across
    rerenders. Generated product links use the nested hierarchy, while the
    server-scoped compatibility resolver handles saved routes without loading
    provider, Usage, credential, contact, or secret data and fails closed for
    unavailable or mismatched records.
  - `/your-applications` is redirect-only, its duplicate list and Department
    setup pages are removed, and Home/navigation/error recovery no longer
    advertise it. Deprecated v1 RP APIs retain their original collection
    meaning, and `compatibility-record.md` records the owner, route/API
    inventory, caller-zero state, observation gate, and separate human removal
    approval. English/French contract tests pass.

## 7A. Apply approved RP discovery and focused-page refinement

- [x] 7A.0 Record the approved decisions in the proposal, capability deltas,
  design, page-pattern decision, standards impact, compatibility record, and
  ADR-004; run strict OpenSpec and scenario-preservation validation before
  implementation resumes.
  - Recorded the contextual creation paths, RP comparison table, Partner-
    environment contract and non-lossy compatibility state, focused
    Application deletion, and compact Readiness presentation. Strict OpenSpec,
    scenario-preservation, scoped Markdown, and diff checks pass.
- [x] 7A.1 Add a new post-`0031` Alembic expand revision for nullable top-level
  `rp_application.partner_environment` as a 128-character string with a
  nonblank-when-present constraint. Do not rewrite an applied revision or add
  an index without a demonstrated query need; test upgrade, downgrade, row
  preservation, and constraint behavior.
  - Added revision `0032_partner_environment`, updated the migration head
    documentation and test expectation, and performed no data inference or
    backfill. Focused unit tests plus disposable local PostgreSQL clean-upgrade,
    constraint, row-preservation, downgrade, and re-upgrade checks pass.
- [x] 7A.2 Add nullable `partnerEnvironment` to compatible summary, detail,
  registration-draft, progression, adoption, and Reports reads; normalize new
  values with Unicode trim plus NFC, reject blank or over-128 values, and
  update Pydantic, OpenAPI, frontend types, fixtures, and serialization tests.
  - Added the nullable top-level model and compatible camel-case contracts
    without placing the value in OIDC questionnaire JSON. Summary, detail,
    draft, progression, adoption, and Reports-backed summary projections now
    preserve both explicit values and `NULL`; Unicode trim/NFC and bounded
    validation are shared across write contracts. OpenAPI is current, frontend
    types and fixtures compile, 152 focused backend tests and 16 focused
    frontend tests pass.
- [x] 7A.3 Require Partner environment for new canonical draft creation,
  final submission, legacy create adapters after cutover, and every progression
  target as internal `target_partner_environment` / wire
  `targetPartnerEnvironment`. Include it in idempotency replay matching; compose the top-level
  value with Application/configuration identity and questionnaire answers for
  final validation instead of duplicating it in OIDC registration JSON.
  - Canonical and compatibility draft-create contracts plus progression targets
    now require normalized Partner environment values, and the Basics/progression
    UI collects them bilingually. Creation and progression idempotency compare
    the top-level value. Final submission composes top-level identity and
    environment metadata with questionnaire answers, rejects a missing value,
    and keeps it out of registration JSON. Focused backend (105) and frontend
    (43) tests pass, including mismatched-replay and missing-final-value cases.
- [x] 7A.4 Preserve `NULL` as the explicit legacy/provider-candidate unknown
  state, render localized `Not provided`, and do not infer from names, URLs,
  provider data, CanadaLogin target, source, or siblings. Add the focused
  nested Partner-environment edit route/API for RP Admin and RP User (Edit) in
  any lifecycle state; revalidate ancestry, update only top-level metadata,
  keep registration/lifecycle unchanged, deny Read Only, and audit only the
  safe field name/result rather than the label value. Populate local fake
  fixtures explicitly and gate any future non-null contract on retained-row
  completeness evidence.
  - Added one ancestry-scoped `PATCH` contract and capability-gated nested edit
    page that update only top-level Partner-environment metadata in every
    lifecycle state. Read Only is denied, the persisted audit event contains
    resource identifiers plus only the safe field name/result, and registration
    answers and lifecycle state are not part of the update. Legacy `NULL` remains
    uninferred and renders bilingually as `Not provided`; deterministic local
    fixtures now set explicit fake values. OpenAPI is current, 98 focused backend
    tests and 27 focused frontend tests pass, and TypeScript plus the production
    frontend build pass.
- [x] 7A.5 Add contextual create discovery without a global wizard: an
  authorized `Add RP configuration` action in each workspace Applications
  table row, `Create first RP configuration` on an empty Application hub, and
  the primary create action above and inside the empty state of the selected
  Application's RP-configuration collection. Preserve workspace/Application
  context and do not present either chooser again.
  - Authorized users now get a direct `Add RP configuration` row action for
    every workspace Application, a `Create first RP configuration` destination
    on an empty Application hub, and a primary contextual create action both
    above and inside the empty RP-configuration collection state. Every action
    carries the existing workspace/Application ancestry into the focused Basics
    page; no chooser was introduced. TypeScript and seven focused page tests
    pass in English-keyed route coverage.
- [x] 7A.6 Replace the RP repeated-item summaries with a compact GCDS table
  whose columns are Name, Partner environment, CanadaLogin environment,
  Status, and Action. Make Name the row header, place a short reference beneath
  exact duplicate displayed triples, provide exactly one `Resume setup` or
  `View configuration` action per row, disable sort/filter/pagination/bulk and
  inline-edit controls for the expected small collection, and extend or bypass
  the shared table wrapper as needed to preserve those semantics. At responsive
  widths, stack rather than drop the identity, both environments, status, or
  action.
  - Replaced the bordered summary list with `GcdsTable` through the shared Table
    wrapper. The five fixed columns include a true row-header Name cell,
    localized real text for unknown values, exact displayed-triple short
    references, and one accessible `Resume setup` or `View configuration`
    destination per row. Filter, sort, pagination, bulk, and inline-edit controls
    remain off; the GCDS component's mobile treatment stacks every labelled cell.
    TypeScript, seven focused table/page tests, and the production frontend build
    pass.
- [x] 7A.7 Remove `Application settings` from user-facing task cards, labels,
  breadcrumbs, and new links. Add a quiet capability-gated `Delete
  application` link under `Application management`, use the dedicated
  `/delete` confirmation route with current retained-child and authorization
  safeguards, and make the introduced `/settings` route a safe replace-
  redirect or bounded compatibility path.
  - Removed the settings card and its user-facing EN/FR labels. Authorized
    editors now receive one quiet `Delete application` link under `Application
    management`, leading to the focused `/delete` confirmation page. The route
    retains the existing capability guard and backend retained-child conflict;
    `/settings` applies the same guard and replace-redirects to `/delete`.
    Focused page, guard, compatibility-route, hub, TypeScript, and production
    build checks pass.
- [x] 7A.8 Refine the focused Readiness page to one compact textual overall
  status/count plus semantic area/status/direct-next-step rows. Link editable
  gaps to Details edit, Contacts, or the focused owner; reserve Notices for
  loading, error, or consequential feedback and `GcdsDetails` for optional
  production guidance without hiding required facts or actions.
  - Readiness now leads with a localized status plus completed-area count and
    renders six semantic area/status/action rows without status Notices or
    card-like containers. Incomplete metadata links to Details edit for an
    editor and the permitted Details view for Read Only; contact gaps link to
    Contacts. Optional external-production guidance moved into `GcdsDetails`,
    after all required facts and links. Seven helper/page/hub tests and the
    production frontend build pass.
- [x] 7A.9 Propagate Partner environment and localized `Not provided` through
  RP overview/Configuration, Usage, Reports chooser, progression, adoption,
  summaries, exact-duplicate disambiguation, bilingual content, and safe audit
  descriptions. CL Admin must not be required to invent a partner-side label
  during adoption.
  - Partner environment now appears on overview and secret-free Configuration,
    in the Usage response/page and Reports chooser, in progression source
    context, and throughout adoption candidate/review/success states. Retained
    null values use the shared localized `Not provided`; adoption never adds a
    Partner-environment input or validation requirement. Summary duplicate
    references remain limited to an exact configuration-name, Partner-
    environment, and CanadaLogin-environment match. Adoption and focused-edit
    audit assertions confirm that the entered partner-side label is excluded.
    Focused backend (49), frontend page (27), and translation-parity (3) tests,
    TypeScript, Ruff lint, and Ruff format checks pass.
- [x] 7A.10 Add migration/model/service/API/idempotency/progression/adoption/
  final-submit tests plus frontend table, contextual-create, delete-route,
  Readiness, authorization, empty/loading/error, responsive, and translation-
  parity tests. Verify GCDS row-header/caption semantics, keyboard and screen-
  reader behavior, long French, mobile/narrow, and 200-percent zoom.
  - The focused backend lifecycle suite passes 175 tests and the complete
    frontend unit suite passes 508 tests. A local real-GCDS Chromium harness
    now verifies the five columns, caption-derived accessible name, row-header
    scope, one contextual action, native Tab focus, long French content, and
    320-pixel reflow as the 200-percent-zoom equivalent. That browser check
    exposed GCDS 1.3.1's caption not naming its inner table in Chromium; the
    shared wrapper now retains the visible GCDS caption and mirrors it to the
    rendered table's accessible name. Both real-browser checks pass.
- [x] 7A.11 Re-run OpenAPI export, frontend lint/build/tests, focused backend
  checks, strict OpenSpec validation, scenario preservation, scoped Markdown,
  structure/state checks, and `git diff --check`; refresh local-only evidence
  and the final action/compatibility inventory before archive.
  - OpenAPI is current; 878 backend tests pass with 16 intentional skips; 508
    frontend tests, lint, TypeScript, production build, and two real-GCDS
    Chromium checks pass. Ruff, full backend mypy across 156 source files,
    strict OpenSpec validation, scenario preservation, scoped Markdown,
    Delorean structure/state, and diff checks pass. Local evidence and the 7A
    canonical-action/compatibility inventory now reflect the implemented
    routes, table semantics, Partner-environment handling, and remaining manual
    review boundaries.

## 7B. Refine registration navigation, errors, and task language

- [x] 7B.0 Record the approved completed-step navigation, unsaved-input,
  GCDS validation-feedback, and Configuration-versus-registration decisions in
  the proposal, design, page-pattern decision, standards impact, capability
  deltas, and this task plan; run strict OpenSpec, scenario-preservation,
  scoped Markdown, and diff checks before implementation resumes.
  - Recorded without changing implementation. Strict OpenSpec validation,
    scenario preservation, scoped Markdown, and diff checks pass after the
    coordinated 7A refinement settled.
- [x] 7B.1 Add `GcdsStepper` as the non-interactive six-step progress indicator
  and a separate `Registration steps` navigation once a server-backed draft
  exists. Derive availability from server-validated contiguous progress, link
  available completed steps other than the current step, mark the current
  non-link with `aria-current="step"`, keep blocked future steps labelled
  non-links, and keep Confirmation outside the six-step model.
  - Implement the recorded narrow design-system exception as one localized
    semantic `<nav>` and ordered list using `GcdsLink` for available routes and
    non-interactive current/blocked text. Use no custom keyboard model and keep
    structure/styling within the GC Design System token/CSS boundary.
  - The saved-draft flow now renders the six labels in a semantic ordered
    navigation beside the progress-only stepper. Server-contiguous completed
    steps are links, the current step is a non-link with `aria-current="step"`,
    blocked or pending steps are understandable text, and Confirmation remains
    outside the model. The custom structure uses native navigation/list/link
    behavior and GCDS spacing, typography, and colour utilities only.
- [x] 7B.2 Make completed-step selection a navigation-only action that neither
  saves nor completes the current step. Preserve current input or warn before
  Back, completed-step links, Cancel, parent/breadcrumb/header navigation, or
  language switching can discard input; keep route/input when the user cancels,
  retain safe direct-future-step recovery, and immediately relock dependent
  steps and Review after a saved earlier answer invalidates them.
  - Completed-step links never save. TanStack route blocking plus native
    before-unload and the language-toggle guard protect Back, step links,
    Cancel, parent/breadcrumb/header exits, and language switching; cancellation
    retains the route and input. Successful saves receive one scoped navigation
    allowance. Direct future URLs still recover to the earliest permitted step,
    and backend coverage confirms that saving an earlier changed step relocks
    dependent steps and Review.
- [x] 7B.3 Normalize client and server validation across Basics, Endpoints,
  Client and access, Signing, Encryption, and final Review validation. Render
  and focus one top-of-form `GcdsErrorSummary`; order and link entries to every
  affected control or group; repeat the same specific localized message after
  label/legend and hint and before the response control; maintain accessible
  association; and clear only resolved errors while preserving unrelated
  errors. When Review finds errors across multiple routes, open the earliest
  invalid step, render only that step's linked question errors, and keep later
  invalid steps visibly pending. Keep network, authorization, ancestry,
  concurrency, and persistence failures distinct.
  - Every data step now builds one form-owned ordered summary from the same
    specific localized strings passed inline to GCDS controls. Real component
    focus targets the summary's shadow alert and summary links focus inputs or
    choice-group fieldsets. Structured `422` fields map across all five data
    routes; unrelated field errors persist, fieldless and operational failures
    remain Notices, and Review stores only message keys, routes to the earliest
    invalid step, and never creates cross-route control links.
- [x] 7B.4 Remove `Registration questionnaire` as a peer RP-configuration hub
  card or artifact. Keep `Configuration` as the secret-free saved-answer view,
  use `Resume setup` for authorized editable drafts and `View configuration`
  otherwise, preserve a contextual resume action on Configuration when useful,
  and give Read Only no registration mutation path.
  - The peer questionnaire card and translations are removed. Configuration is
    described as the secret-free saved-answer view, editable drafts expose one
    contextual `Resume setup` action, and Read Only receives only `View
    configuration` with no registration mutation destination.
- [x] 7B.5 Add unit, route, and real-GCDS integration coverage for all six step
  labels; completed/current/blocked states; `aria-current`; dirty-input
  confirmation across every exit path; direct-route gating; dependent-step
  relocking; summary focus, order, links, group targets, message parity, inline
  placement and association; selective error clearing; Review recovery without
  unrendered-control links; server field mapping on every step; non-field
  failure separation; lifecycle/capability task labels; and English/French
  parity.
  - The complete frontend suite now passes 526 tests, including state, route
    gating, every exit guard, dependency relocking, all-step server mapping,
    Review recovery, selective error persistence, task language, Read Only, and
    bilingual contracts. Three real-GCDS registration checks cover all six
    labels, navigation/current/pending semantics, summary focus and links,
    inline placement and associations, choice groups, native Tab focus, and
    narrow long-French reflow.
- [x] 7B.6 Verify the implemented flow with keyboard-only use, focused screen-
  reader checks, mobile/narrow reflow, long French content, and 200-percent
  zoom. Confirm visible focus, understandable unavailable-step text, summary-
  to-question movement, error announcement, choice-group behavior, and no
  horizontal task scrolling; record any skipped assistive-technology check and
  remaining risk.
  - The Chromium harness uses actual GCDS 1.3.1 shadow DOM at 320 pixels to
    verify native keyboard focus, no horizontal overflow, focused summary and
    group movement, `aria-invalid`, and error description relationships. A
    formal human screen-reader session is unavailable locally and remains a
    recorded pre-release check; the browser accessibility semantics are
    automated, but synthesized-speech wording remains the residual risk.
- [x] 7B.7 Re-run frontend lint/build/tests, focused backend contract tests,
  strict OpenSpec validation, scenario preservation, scoped Markdown,
  structure/state checks, and `git diff --check`; refresh local-only evidence
  and the final action inventory before archive.
  - Final verification passes: 526 frontend tests, lint, TypeScript/production
    build, 36 focused registration backend tests, the complete 879-test backend
    suite with 16 intentional skips, backend mypy across 156 source files,
    change-scoped Ruff lint/format, current OpenAPI, and five real-GCDS Chromium
    checks. Strict OpenSpec and scenario preservation, scoped Markdown, GC
    Design System/page-shell, structure/state, and diff checks also pass. The
    local-only evidence and final action/compatibility inventory are current.

## 8. Verification and review

- [x] 8.1 Run focused backend model, migration, repository, service, API,
  authorization, progression, adoption, audit, and OpenAPI tests.
- [x] 8.2 Run focused frontend unit, route, query, form, navigation disclosure,
  list semantics, compatibility redirect, and translation-parity tests.
- [x] 8.3 Run frontend lint, typecheck/build, page-shell checks, GCDS checks,
  backend lint/format/type checks, and the applicable local verification loop.
  - Pre-refinement baseline verification passes: 866 backend tests with 16 intentional
    skips, 499 frontend tests, frontend lint and production build, changed-file
    Ruff format/lint, full backend mypy across 156 source files, OpenAPI export,
    strict OpenSpec validation, scenario preservation, Delorean structure and
    state checks, and `git diff --check`.
  - Repository-wide format and Markdown wrapper checks still report unrelated
    pre-existing formatting/line-length debt outside this change. No active
    change artifact or changed implementation file is among those findings.
- [x] 8.4 Verify desktop, mobile, narrow viewport, long French content, and
  200-percent zoom; capture representative Application and configuration
  screenshots.
  - Signed-in desktop checks cover the canonical Application hub, focused
    Contacts and RP-configuration collections, long French content, zero
    horizontal overflow, and authorized saved-link redirects. Representative
    local-only Application and configuration screenshots are in `evidence/`.
    The real-GCDS Chromium fixtures provide the missing mobile/narrow proof at
    320 pixels (the 200-percent-zoom reflow equivalent) for the highest-risk
    compact table and registration navigation/error content without dropping
    identity, environment, status, action, question, or recovery information.
- [x] 8.5 Verify keyboard order, visible focus, skip target, disclosure
  open/close, headings, landmarks, list/description-list semantics, errors,
  direct-entry recovery, and destructive confirmations.
  - Page-shell and component tests cover the skip target, headings, landmarks,
    header disclosure state, semantic lists/description lists, and dedicated
    confirmation flows. Route tests cover safe direct-entry recovery and dirty
    navigation cancellation; real-GCDS Chromium checks cover visible native Tab
    focus plus error-summary movement to an input and a choice-group fieldset.
- [x] 8.6 Review accessibility, bilingual behavior, security/privacy, IAM,
  information management, contact retention, audit minimization, and safe
  logging; record skipped checks and remaining risk.
  - Code-pattern and signed-in local reviews found no unresolved critical
    issue. They resulted in hashed operational identifiers, deletion blocking
    for every retained child configuration, server-validated ancestry, and a
    resource-specific compatibility projection. Formal assistive-technology,
    human translation, shared-target, and release reviews remain outside this
    local Level 2 boundary and are recorded in `evidence/README.md`.
- [x] 8.7 Run strict OpenSpec validation and scenario-preservation checks after
  upstream changes are archived.

## 9. Archive readiness

- [x] 9.1 Confirm every visible action and compatibility caller has a focused
  owner, a redirect, or a recorded deferred-removal reason.
  - The action-owner inventory, generated-link scan, redirect route tree, and
    `compatibility-record.md` account for every retained task and old route.
    Remaining `/your-applications` and browser `application-information`
    references are bounded redirect modules, login admission allowlisting,
    route generation, tests, or the recorded compatibility contract.
  - Reopened after the approved 7A refinement; recheck the new contextual
    create, Partner-environment confirmation, Application-delete, completed-
    step navigation, and state-appropriate configuration/setup paths.
  - Final source and route scans confirm that contextual create, metadata
    confirmation, focused delete, completed-step navigation, and the one
    state-appropriate Configuration/setup destination each have an owner.
    Remaining legacy path text is limited to bounded redirect/admission/API
    compatibility code and its tests, all accounted for in
    `compatibility-record.md`; the removed questionnaire and Settings labels
    have no translation or generated-product-link caller.
- [x] 9.2 Confirm current specs will preserve every retained scenario and no
  stale peer hierarchy, `/your-applications` destination, or one-per-
  environment assumption remains.
  - Strict validation and scenario preservation pass. Remaining old terms in
    REMOVED requirement bodies identify the exact current requirements being
    retired; replacement requirements establish one Applications destination,
    nested named configurations, and many configurations per CanadaLogin
    environment.
  - Reopened until Slices 7A and 7B are implemented and the final scenario-
    preservation audit includes Partner environment, the GCDS table, compact
    Readiness, Settings retirement, completed-step navigation, linked form
    errors, and configuration/setup task language.
  - The final strict delta validation and scenario-preservation check pass with
    all named refinement scenarios present. Searches find no generated legacy
    destination or one-configuration-per-CanadaLogin-environment invariant;
    retained old terminology appears only in explicit removal or compatibility
    requirements.
- [x] 9.3 Archive without `--skip-specs` only after implementation and local
  verification are complete.
  - Archived with spec promotion as
    `2026-08-13-organize-applications-and-rp-configurations`; all eight delta
    capabilities were merged into current specs without `--skip-specs`.
- [x] 9.4 Confirm all affected current capability specs and ADR-004 reflect the
  implemented behavior after archive.
  - Strict validation passes for all 11 current capabilities, and every one of
    the 272 promoted scenario headings is present in its matching current spec.
    ADR-004 reflects the final hierarchy, Partner-environment behavior,
    contact dual-read boundary, focused page model, and archived change path.
- [x] 9.5 Update affected current capability `Purpose` text during archive so
  it describes Applications, RP configurations, inherited Department, and
  workspace collaborators rather than retired RP-application concepts.
  - Replaced the stale or generic Purpose text in all eight affected current
    capabilities, including the previously unresolved RP-application-
    experience placeholder.
