# Design

## Context

The current frontend already has a public route at `/`, but authenticated users are redirected from that route to `/your-applications` before any signed-in home content can render. The authenticated header also assembles navigation as one flat list:

- partner-facing task links such as `/your-applications` and `/workspaces`
- platform-admin governance links such as `/users`, `/departments`, and `/roles`
- oversight links such as `/onboarding-oversight`
- support links

That shape no longer matches the portal's information architecture. The portal now has multiple user goals and role-specific areas, and the current dashboard route at `/your-applications` is already doing double duty as both the signed-in landing page and a concrete task page.

Relevant standards and patterns for planning:

- UI and route design: STD-005, STD-006, STD-017.
- Shared shell and navigation: PAT-013.
- Page pattern selection: PAT-001.
- Existing read-only current-user summary on `/your-applications`: current `partner-portal-access-and-dashboard` spec remains the shipped baseline until this change is implemented.

## Goals / Non-Goals

**Goals:**

- Make `/` the signed-in service home for authenticated users.
- Keep the signed-in home page focused on orientation and task selection rather than record triage or administration forms.
- Preserve `/your-applications` as a dedicated partner task destination for reviewing accessible RP applications.
- Group authenticated navigation by task area so the shared menu scales as routes increase.
- Keep primary routes reachable from `Home` and define the expected return paths.

**Non-Goals:**

- No new backend API or persisted summary aggregate is required by the spec change itself.
- No requirement to expose every child route directly in the header.
- No requirement to merge CL Admin oversight into the service home.
- No requirement to pick one exact visual grouping component during spec work if several GC Design System-compatible implementations would satisfy the outcome.

## Decisions

### Decision 1: Use `/` as the authenticated service home

- Choice: after authentication, the portal should land users on `/` instead of redirecting them immediately to `/your-applications`.
- Rationale: PAT-001 and STD-006 expect a functional service home when the service branches to multiple task areas.
- Trade-off: `/your-applications` stops being the all-purpose signed-in landing route and becomes one task page among several.

### Decision 2: Keep `/your-applications` as a dedicated task page

- Choice: retain `/your-applications` as the current-user RP application page, but remove its responsibility to serve as the generic signed-in entry point.
- Rationale: the route already anchors RP application detail navigation and remains a primary partner task.
- Trade-off: some high-level summary content currently shown there may move or be reduced if it belongs on Home instead.

### Decision 3: Make the signed-in home page a task-oriented service home

- Choice: the authenticated home page should use the PAT-001 service home or task hub pattern rather than PAT-021 dashboard behavior.
- Rationale: the user need described here is task selection and orientation, not monitoring or triage across records.
- Recorded page-pattern decision: [authenticated-home-page-pattern-decision.yaml](authenticated-home-page-pattern-decision.yaml).

### Decision 4: Group authenticated navigation by function

- Choice: the shared authenticated navigation should present parent task areas or grouped menus instead of one flat list of all top-level links.
- Expected groups:
  - `Home`
  - partner tasks, including `Your applications` and `Workspaces`
  - platform administration for governance routes such as users, departments, roles, tiers, policies, and audit logs when those routes are visible
  - onboarding oversight when that role-specific area is visible
  - support
- Rationale: grouped IA scales better and matches STD-006 guidance to expose primary task areas from Home and the shared menu.
- Trade-off: the implementation may choose submenus, nav groups, or another shared-shell grouping structure, but the grouped outcome is mandatory.

### Decision 5: Keep role-specific discoverability explicit

- Choice: Home and the shared navigation should show only the task areas available to the current user, and should not leak hidden route labels for unavailable administrative areas.
- Rationale: grouped navigation must still respect the current role and authorization boundary.

### Decision 6: Keep the signed-in home page high level

- Choice: the Home page should link to the main task areas with short descriptions and optional high-level status or context summaries, but it should not embed the full RP application list, administration tables, or review backlog tables.
- Rationale: a service home should help users choose where to go next without turning into an overloaded mixed-purpose screen.

## Standards impact

```yaml
standards_impact:
  ui:
    applies: true
    decision: Use PAT-001 service-home behavior for the authenticated Home route and PAT-013 shared-shell navigation grouping. Keep Home reachable from the shared menu.
    evidence: Page-pattern decision file and route or navigation implementation tasks in this change.
    exceptions: []
  accessibility:
    applies: true
    decision: Grouped navigation and Home task links must remain keyboard reachable, announce clear labels, preserve one H1, and keep a stable main-content target.
    evidence: Focused frontend tests plus accessibility review during implementation.
    exceptions: []
  official_languages:
    applies: true
    decision: Home task-area labels, summaries, and grouped navigation labels must ship in English and French with parity.
    evidence: Locale updates and parity checks during implementation.
    exceptions: []
  security_privacy:
    applies: true
    decision: Home and grouped navigation must expose only routes or task areas already authorized for the current user.
    evidence: Route and navigation tests for role-aware visibility.
    exceptions: []
  identity_access:
    applies: true
    decision: Post-login redirect and authenticated-shell navigation behavior must continue to respect the existing session and role model.
    evidence: Route guard and authenticated-shell implementation checks.
    exceptions: []
  information_management:
    applies: false
    decision: No new persisted record type is required.
    evidence: Design scope only.
    exceptions: []
  verification:
    applies: true
    decision: Validate this change package and add focused frontend route and navigation tests during implementation.
    evidence: OpenSpec validation plus test tasks in this change.
    exceptions: []
  gc_web_application_baseline:
    applies: true
    decision: Treat the eventual signed-in Home and shared navigation update as a meaningful GC web application UI change.
    evidence: Baseline applicability captured when implementation starts.
    exceptions: []
```

## Slice Plan

### Slice 1: Service-home route contract

- Outcome: authenticated entry behavior and the distinction between Home and `/your-applications` are explicit.
- Impacted areas: route guard behavior, signed-in entry route, home-page content contract.
- Exit condition: implementation can change post-login routing without ambiguity.

### Slice 2: Grouped navigation information architecture

- Outcome: the shared authenticated menu defines the required task-area groups, role-aware visibility rules, and return paths.
- Impacted areas: header navigation model, route labels, grouped parent links, role-aware rendering.
- Exit condition: implementation can update the header without inventing new IA.

### Slice 3: Signed-in home page content and task links

- Outcome: Home content is defined as task selection and orientation rather than a duplicate dashboard or admin console.
- Impacted areas: home-page sections, link destinations, summary copy, localization.
- Exit condition: implementation has a bounded content contract for Home.

### Slice 4: Verification and handoff

- Outcome: focused validation and archive-readiness expectations are explicit.
- Impacted areas: OpenSpec validation, frontend tests, UI review evidence.
- Exit condition: the change is ready for implementation planning.

## Implementation readiness

- Ready after: route ownership, grouped navigation labels, and Home task destinations are accepted as the working baseline for implementation.
- Recommended implementation order:
  1. update authenticated redirect behavior so signed-in users land on `/`
  2. implement the signed-in Home task links and summary copy
  3. refactor shared authenticated navigation into grouped task areas
  4. adjust `/your-applications` content if any summary sections belong only on Home
  5. add focused route and navigation tests
- Current blocker:
  - none for local planning; a human decision is only needed later if product wants a different group taxonomy or wants `/your-applications` to remain the landing route despite the service-home standard

## Open Questions

- Human decision required only if stakeholders want a different first-level grouping vocabulary than the default task-area split defined in this change.
