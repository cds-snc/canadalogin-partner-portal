# Design

## Context

The current frontend redirects authenticated users from `/` to role-specific
destinations and builds authenticated navigation as one flat array. That
structure mixes partner tasks, platform governance, onboarding oversight,
support, and account actions at the same level. It also makes
`/your-applications` serve as both a generic landing page and a concrete
operational task page.

This package is downstream of `define-four-role-authorization-model`. That
change owns canonical role and workspace-scope semantics plus the server-owned
`authorizationContext`. Home, hubs, and navigation consume that context; they
do not create a parallel role model or authorize requests in the browser.

Relevant guidance:

- STD-002: Work Contexts
- STD-003: Full-Stack Application Stack
- STD-004: Frontend React and TypeScript
- STD-005: Frontend GC Design System
- STD-006: GC UI Page Layout Rules
- STD-007: UI Accessibility Basics
- STD-009: REST API
- STD-010: API Response and Error Models
- STD-011: Logging and Observability
- STD-013: Security and Privacy Basics
- STD-017: Government of Canada Standards Review
- STD-019: Government of Canada Web Application Baseline Governance
- PAT-001: UI Page Patterns
- PAT-002: API Query and Mutation
- PAT-004: Protected Route
- PAT-009: OIDC Backend Session
- PAT-010: RBAC Policy Check
- PAT-013: GC Design System React App Shell
- PAT-014: Bilingual Route and I18n
- PAT-015: Storybook UI Review Fixture
- PAT-020: Status and Feedback
- PAT-021: Dashboard Overview Page
- PAT-022: Page Length and Splitting

## Goals / Non-Goals

**Goals:**

- Give authenticated users a stable service Home at `/`.
- Define prerequisite and access routing before Home becomes the default.
- Reduce the header to a small, explicit hierarchy of parent task areas.
- Give platform administration a discoverable parent hub.
- Preserve `/your-applications` as a useful partner operational overview.
- Keep dashboards, task hubs, reports, forms, and help on the page types that
  fit their user goals.
- Define responsive, accessible, bilingual navigation behavior before
  implementation.

**Non-Goals:**

- Define or duplicate roles, capabilities, assignment rules, invitations,
  reporting scope, or secret access.
- Expose every authorized child route directly in the header.
- Move existing administration child routes to new nested URLs.
- Implement workspace Access, workspace Reports, or the RP registration flow;
  those are specified by `refine-workspace-task-hub-and-registration-flow`.
- Add custom header interaction when GC Design System components fit.

## Route And Page Pattern Catalog

| Area | Entry | Page pattern | Primary destinations |
|---|---|---|---|
| Home | `/` | PAT-001 service home | Authorized parent task areas |
| Partner work | Header group | PAT-013 grouped navigation | `/your-applications`, `/workspaces` |
| Partner overview | `/your-applications` | PAT-021 operational overview | Accessible applications, workspaces, status, and resume links |
| Onboarding oversight | `/onboarding-oversight` | Existing PAT-021 operational dashboard | Queue and cross-workspace reports |
| Administration | `/administration` | PAT-001 task hub | `/users`, `/departments`, `/tiers`, `/audit-logs`, `/roles` |
| Support | `/support` | Basic help page | Footer or utility navigation |
| Account | Shared user group | PAT-013 authenticated user summary | Safe user/context summary and sign out |

The workspace list and workspace detail family remain below `Workspaces` in
this change. Their task-hub, Access, Reports, and registration-flow contracts
are recorded in the dependent workspace-journey package.

## Decisions

### Decision 1: Home is the authenticated service entry point

- `/` uses PAT-001 and the GC Design System Basic page shell.
- Home has one H1, a short service description, and semantic task sections with
  short descriptions and links to authorized parent areas.
- Home does not embed review queues, full reports, large record lists,
  administration tables, or data-changing forms.
- The unauthenticated `/` experience remains the public Home and sign-in entry
  surface.

### Decision 2: Admission routing precedes the default Home route

Authenticated routing applies this order:

1. Establish authentication and preserve only a sanitized in-app intended
   destination.
2. Require acceptance of the current terms.
3. Resume a valid, identity-matched tokenized invitation route before profile
   setup when the current invitation requirements allow it.
4. Require profile or department setup only when the canonical access
   requirements say it applies.
5. Revalidate the preserved destination against the canonical authorization
   context.
6. Resume that safe authorized destination when one remains.
7. Otherwise use `/` for a user with at least one product task area, or
   `/access-denied` for a user with no usable product access.

The portal does not automatically select one pending invitation when the user
did not arrive through a valid invitation route. Multiple invitations may
exist, and selection behavior is not invented by this UI change.

### Decision 3: Use an explicit shared-header hierarchy

The authenticated header uses:

1. `Home` as a direct link to `/`.
2. `Partner work` as a `GcdsNavGroup`, containing whichever of
   `/your-applications` and `/workspaces` the user can access.
3. `Onboarding oversight` as a direct parent-area link when available.
4. `Administration` as a direct parent-area link when available.
5. Account context and sign out in the separate user navigation group.

An empty group is omitted. Support is available from footer or utility
navigation, not the primary task menu. No custom mega-menu or hover-only
dropdown is planned.

### Decision 4: Administration uses a parent task hub

- `/administration` is a PAT-001 task hub, not PAT-021.
- It links to Users and access (`/users`), Departments (`/departments`), Tiers
  (`/tiers`), Audit logs (`/audit-logs`), and the fixed Role reference
  (`/roles`) when each destination is available.
- `/policies` is excluded because authorization-policy CRUD is retired and the
  current route is not an independent destination.
- The hub contains orientation and task links only. Forms, tables, search,
  filters, and record actions remain on focused child pages.
- Existing child URLs stay flat for this change. Route metadata associates
  them with the Administration parent, and child pages provide breadcrumbs and
  persistent section navigation back to the hub.

### Decision 5: `/your-applications` is a partner operational overview

- `/your-applications` uses PAT-021 for authenticated repeat users who need to
  inspect current application/workspace status and resume work.
- It is not the generic portal Home and does not repeat the account/profile
  card already available in the shell.
- It may show compact accessible-application and workspace summaries, current
  lifecycle/status values, and resume-task links from canonical authorized
  data sources.
- It does not embed creation, editing, invitations, credentials, reports,
  cross-workspace oversight, or administration workflows.
- Loading, empty, partial, error, and unauthorized states have explicit
  recovery behavior under PAT-020.

### Decision 6: Keep dashboard use selective

- `/onboarding-oversight` remains the true cross-workspace operational
  dashboard, with focused queue and report children.
- `/your-applications` remains a partner operational overview.
- `/` and `/administration` are task hubs because their job is orientation and
  branching, not monitoring or triage.
- Full reports, large tables, and data-changing work stay on dedicated routes.

### Decision 7: Route metadata is the discoverability source

One typed route/navigation catalog owns:

- route ID and localized label key
- parent task area
- path and active-path family
- canonical capability or visibility predicate supplied by the role contract
- primary-menu, Home, side-navigation, and breadcrumb visibility
- return route and hidden-route reason

Active path families are:

- Partner work for `/your-applications*` and `/workspaces*`
- Onboarding oversight for `/onboarding-oversight*`
- Administration for `/administration` and the existing child route families

The catalog controls labels and discoverability only. Frontend route guards and
backend authorization remain authoritative.

### Decision 8: Navigation is accessible, responsive, and bilingual

- Use `GcdsTopNav`, `GcdsNavGroup`, `GcdsNavLink`, `GcdsSideNav`, and
  `GcdsBreadcrumbs` where their recorded page decisions call for them.
- Keyboard users can reach, open, traverse, and leave each group in predictable
  order without pointer or hover interaction.
- Focus remains visible, and focus after navigation moves through the normal
  page sequence beginning with the skip link/main content contract.
- Current route and expanded state are not communicated by colour alone.
- Mobile, narrow viewport, and 200% zoom layouts reflow without clipped labels,
  horizontal task-navigation scrolling, or inaccessible hidden controls.
- English and French labels, accessible names, breadcrumbs, status messages,
  and task descriptions have parity.
- The header language control reaches the equivalent route and preserves safe
  route parameters and selected context. There is no second body toggle.
- Language state has one application source of truth; header behavior does not
  bypass the shared preference/i18n abstraction.

### Decision 9: User-visible context uses meaningful names

The shared shell and partner overview show a workspace or organization name
when context is needed. Raw UUIDs remain route identifiers and are not the
primary visible account, task, breadcrumb, or overview label. A global
workspace switcher is not introduced here; users return through `/workspaces`
unless a separately specified context-switching flow is added.

## Page Pattern Decisions

- [authenticated-home-page-pattern-decision.yaml](authenticated-home-page-pattern-decision.yaml)
- [administration-task-hub-page-pattern-decision.yaml](administration-task-hub-page-pattern-decision.yaml)
- [partner-applications-overview-page-pattern-decision.yaml](partner-applications-overview-page-pattern-decision.yaml)
- Existing archived onboarding-oversight decision remains the PAT-021 source
  for `/onboarding-oversight`.

## Architecture Alignment

### Browser, BFF, and session boundary

- This change follows accepted ADR-001. Protected route entry revalidates the
  current user against the FastAPI BFF before protected content or navigation
  is rendered. A Zustand or TanStack Query projection may improve rendering,
  but stale browser state cannot authorize route entry or an API operation.
- OIDC tokens, session internals, raw claims, and policy data remain in the
  backend/Redis boundary. The browser receives only the opaque session cookie
  and user-safe response models.
- Admission and intended-destination handling stores only the minimum
  sanitized in-app route state needed for recovery. It does not copy tokens,
  personal information, authorization context, or arbitrary external URLs into
  local storage, analytics, or diagnostic logs. Existing tokenized invitation
  routes remain governed by their own acceptance contract and are not
  generalized into navigation state.

### Authorization and route discoverability

- Accepted ADR-003 and archived `define-four-role-authorization-model` own role keys,
  capability evaluation, workspace assignments, object scope, and the
  `authorizationContext` response. The dependency is archived, this package is
  rebased against the resulting current contract, and strict validation passes.
- The route/navigation catalog is presentation metadata. It consumes stable
  server-owned role/capability keys to decide what to advertise, but every
  protected route and API call still fails closed through backend capability
  and resource-scope checks.
- No display label, raw role ID, `isSuperuser`, browser store value, or hidden
  menu item becomes a policy subject or authority signal.

### Frontend dependency direction

- Source route files remain thin and own path, guard, loader, metadata, and
  lazy-page wiring. Feature pages and hooks own Home, overview, Administration,
  and navigation composition. Low-level HTTP behavior stays in
  `frontend/src/fetch/`.
- TanStack Query owns current-user and overview server state. Query invalidation
  or refresh behavior is explicit; Zustand remains a non-authoritative UI
  projection only.
- The typed route/navigation catalog is source code near the source routes or a
  focused navigation feature module. TanStack Router's generated route tree is
  regenerated by the supported command and is never edited by hand. Any source
  route that becomes a parent layout renders an `Outlet`; index routes own the
  parent page content.
- Reviewable loading, empty, error, partial, unauthorized, and representative
  role-context states use local fixtures or Storybook/MSW-style substitutes;
  they never call real services.

### API and error contract

- This change does not introduce a universal success envelope or casing
  migration. Current-user, accessible-application, and workspace-summary
  clients preserve each endpoint's implemented serialized contract while
  ADR-002 remains Proposed.
- If a later authorization-contract change alters a current-user or summary response, backend
  Pydantic response models, generated OpenAPI, frontend TypeScript wire types,
  and contract tests change together. Handled failures retain the project
  `error.code`, safe `error.message`, `error.details`, and `error.requestId`
  structure.
- The browser never fetches external identity, policy, or integration systems
  directly. Those boundaries remain behind the BFF.

### Persistence and operational data

- The navigation catalog is code-owned configuration and this package creates
  no new database record, migration, queue, cache, or external adapter.
- Current-user display name, organization/workspace name, and authorization
  context are minimal session/page projections. They are not added to URLs,
  analytics, fixtures based on real people, or ordinary diagnostic logs.
- Structured failures carry a request/correlation identifier where the shared
  platform provides one. Logs record safe route or outcome metadata, not
  current-user response bodies, invitation tokens, or authorization payloads.

### Architecture decision impact

No new ADR is required. The change follows accepted ADR-001, preserves the
endpoint-specific compatibility posture in proposed ADR-002, and follows the
authorization decision in accepted ADR-003. A different session authority,
client-side authorization model, route-generation strategy, or API envelope
would require this design and the applicable ADR to be updated before
implementation.

## Sensitive Data Handling Record

| Data | Classification and purpose | Allowed surface | Prohibited surface | Lifecycle |
|---|---|---|---|---|
| Display name and organization/workspace name | Personal or internal context used to orient the signed-in user | Minimal BFF response, in-memory page/query state, shared shell | URL, analytics, diagnostic body logs, real-data fixtures | Existing session and source-record lifecycle; no new copy |
| Authorization context | Security metadata used for discoverability and route entry | Server-owned current-user response and ephemeral UI projection | Client-authored permission list, durable browser storage, query parameters, logs | Recomputed by the backend; revoked access must take effect through the canonical contract |
| Intended destination | Sanitized relative route used to resume an interrupted task | Existing admission/session mechanism | External URL, executable scheme, personal data, copied invitation token, role/capability payload | Cleared after use or invalidation under the existing admission flow |
| Overview summaries | Authorized application/workspace metadata used to resume work | Scoped BFF response and TanStack Query cache | Wider client-side dataset filtered in the browser, secret fields, out-of-scope identifiers | Existing API/cache lifecycle; refresh or clear on session/access change |

## Standards Impact

### Affected Standards

- STD-002, STD-003, STD-004, STD-005, STD-006, STD-007, STD-009,
  STD-010, STD-011, STD-013, STD-017, and STD-019.
- PAT-001, PAT-002, PAT-004, PAT-009, PAT-010, PAT-013, PAT-014,
  PAT-015, PAT-020, PAT-021, and PAT-022.
- BAS-001 controls GC-WEB-001 through GC-WEB-008 and GC-WEB-010 through
  GC-WEB-011 apply. GC-WEB-009 is not applicable because this package creates
  no new business, audit, export, or persistence record.

### Impact

The change adds a meaningful partner-facing UI and admission-path change while
preserving the existing BFF, session, authorization, API, and persistence
boundaries. The page-pattern decisions, architecture alignment above, and
requirement scenarios are the Level 2 planning evidence.

### Exceptions

None. Proposed ADR-002 remains a compatibility constraint, and accepted
ADR-003 remains an architecture dependency rather than an exception granted by
this package.

### Verification

- OpenSpec strict validation and scenario-preservation check.
- Protected-route freshness, fail-closed admission, backend denial, and
  capability-context visibility tests.
- OpenAPI/frontend serialization checks if a consumed response changes.
- Desktop/mobile, keyboard, focus, screen-reader, bilingual, page-shell, and
  design-system review with local fake data.
- Sensitive-surface inspection for URL, storage, analytics, logs, and fixtures.

### Follow-Up

- Continue consuming the archived four-role contract and accepted ADR-003;
  rerun architecture, OpenSpec, route, API-contract, and UI checks after
  implementation and before archive.
- At Level 2, a standalone TPL-011 release gate is advisory; prepare one only
  when this meaningful UI change enters release review or the adoption level
  increases.

```yaml
standards_impact:
  ui:
    applies: true
    decision: Use PAT-001 for Home and Administration, PAT-021 for the partner and oversight operational overviews, and PAT-013 for one shared shell and grouped navigation model.
    evidence: Page-pattern decisions, route-catalog tests, and implementation screenshots.
    exceptions: []
  accessibility:
    applies: true
    decision: Navigation must be keyboard operable, focus visible, responsive at narrow widths and zoom, and understandable without colour or hover.
    evidence: Keyboard, focus, mobile, zoom, and screen-reader review.
    exceptions: []
  official_languages:
    applies: true
    decision: English and French route labels, task descriptions, breadcrumbs, accessible names, status states, and equivalent-route language behavior must have parity.
    evidence: Locale parity tests and bilingual screenshots or review notes.
    exceptions: []
  security_privacy:
    applies: true
    decision: Navigation reveals only authorized task areas, exposes minimal meaningful context instead of internal identifiers, stores no OIDC token or authority in the browser, and remains presentation rather than an authorization control.
    evidence: Capability-context visibility, protected-route freshness, denied-route, and sensitive-surface tests.
    exceptions: []
  identity_access:
    applies: true
    decision: Admission routing and discoverability consume the canonical server-owned authorization context from define-four-role-authorization-model.
    evidence: Admission-order, preserved-destination, no-access, and route-visibility tests after the role change is archived.
    exceptions: []
  information_management:
    applies: false
    decision: No new persisted business record is introduced by this change.
    evidence: Design scope.
    exceptions: []
  api_and_operations:
    applies: true
    decision: Consumed API contracts preserve endpoint-specific serialization under ADR-002, use typed fetch clients, and retain safe structured errors and request identifiers.
    evidence: OpenAPI/frontend contract tests when a response changes plus safe-error and log-content review.
    exceptions: []
  verification:
    applies: true
    decision: Validate before implementation, revalidate after the role-change rebase, and collect route, accessibility, responsive, bilingual, and design-system evidence.
    evidence: OpenSpec validation, focused tests, screenshots, and review notes.
    exceptions: []
  gc_web_application_baseline:
    applies: true
    decision: Treat the eventual Home, navigation, Administration, and overview implementation as a meaningful GC web application UI change.
    evidence: Lightweight Level 2 baseline and UI review during implementation.
    exceptions: []
```

## Slice Plan

### Slice 1: Rebase and canonical route catalog

- Outcome: the package consumes the archived four-role context and defines one
  typed navigation model.
- Exit: route parents, labels, capabilities, active families, breadcrumbs, and
  return paths have one source.

### Slice 2: Admission routing and Home

- Outcome: prerequisite routing, safe destination resumption, no-access, and
  the authenticated Home behave deterministically.
- Exit: all admission scenarios have focused tests.

### Slice 3: Grouped app shell

- Outcome: the flat header becomes the recorded hierarchy, Support moves to
  utility/footer navigation, and account controls remain separate.
- Exit: per-context, keyboard, focus, mobile, zoom, and bilingual checks pass.

### Slice 4: Administration task hub

- Outcome: `/administration` orients authorized users to focused child modules
  with side navigation and breadcrumbs.
- Exit: no administration child remains dependent on a direct URL or the flat
  global menu.

### Slice 5: Partner operational overview

- Outcome: `/your-applications` presents useful current status and resume links
  without acting as Home or embedding unrelated work.
- Exit: populated, empty, invitation-backed, loading, partial, error, and
  unauthorized states are covered.

### Slice 6: Verification and archive readiness

- Outcome: OpenSpec, focused UI tests, GC Design System checks, bilingual and
  accessibility review, and responsive evidence are complete.
- Exit: the functional change can archive without losing current scenarios or
  leaving the current spec Purpose stale.

## Implementation Readiness

- Spec, IA, and architecture-boundary refinement are complete for local
  planning.
- The four-role dependency is archived, the package is rebased against the
  current spec and route-capability contract, and strict validation passes.
- The workspace task hub, Access, Reports, and multi-step registration flow can
  proceed from their separate active change after the same role dependency is
  satisfied.

## Open Questions

No IA decision remains open. Product review is required only if the approved
first-level labels or the decision to move Support out of primary navigation
changes.
