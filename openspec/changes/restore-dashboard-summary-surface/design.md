# Design

## Context

The shipped dashboard route today is effectively the current-user applications page at `/your-applications`. It shows a heading, summary text, and a list of accessible RP applications, but it does not yet present the broader current-user portal context described in the PRD.

At the same time, the repository already has most of the raw surfaces needed for a small dashboard expansion:

- the authenticated session already exposes the current user's name, email, department UUID or abbreviation, and assigned role UUIDs
- the shared user navigation already resolves friendly role names and department context from existing fetches
- `/api/v1/workspaces/mine` already lists workspaces visible in current-user scope
- `/your-applications` already lists RP applications visible in current-user scope

This change defines the smallest useful MVP dashboard that builds on those surfaces without turning the landing page into a mixed administration console.

Relevant standards and patterns for planning:

- UI and route design: STD-005, STD-006, STD-007, STD-017.
- Authenticated dashboard and summary patterns: PAT-021 and PAT-017.
- No table-heavy admin surface is required for the first dashboard slice; PAT-023 stays available only if the implementation later proves a table is necessary.

## Goals / Non-Goals

**Goals:**

- Keep `/your-applications` as the partner-facing dashboard entry route.
- Add a minimal read-only summary of the signed-in user's portal context.
- Add a read-only summary of accessible workspaces alongside the existing RP application list.
- Keep the dashboard navigation-oriented so users can move into dedicated workspace or RP application routes for deeper tasks.

**Non-Goals:**

- No new top-level dashboard route for this MVP slice.
- No CL Admin oversight, review queue, or reporting widgets on the partner dashboard.
- No inline workspace administration, invitation management, or RP-configuration forms on the dashboard.
- No dedicated persisted dashboard aggregate or analytics backend by default.

## Decisions

### Decision 1: Split the MVP dashboard into its own active change

- Choice: move the concrete dashboard-summary work out of the generic PRD-gap package and into this dedicated change.
- Rationale: the user direction is now specific enough to plan a small implementation-ready dashboard surface.

### Decision 2: Keep `/your-applications` as the MVP dashboard route

- Choice: preserve `/your-applications` as the authenticated partner landing page and expand it into the MVP dashboard instead of creating a new top-level route.
- Rationale: the route is already the post-login landing destination and already anchors current-user RP application navigation.

### Decision 3: Use a read-only service-home pattern

- Choice: use PAT-021 for the authenticated overview page and PAT-017-style summary sections inside the shared app shell.
- Rationale: the page needs to orient repeat users quickly without becoming an admin workbench.
- Recorded page-pattern decision: [dashboard-page-pattern-decision.yaml](dashboard-page-pattern-decision.yaml).

### Decision 4: Keep the dashboard navigation-oriented and read-only

- Choice: the MVP dashboard shows summary blocks and navigation links only.
- Rationale: the user explicitly wants a super-basic MVP, and deeper tasks already have dedicated routes.
- Trade-off: the dashboard will not surface inline create, edit, invite, queue, or reporting actions in this slice.

### Decision 5: Reuse existing current-user data sources by default

- Choice: compose the dashboard from the existing current-user session, roles catalog or department lookup already used by the shared shell, `/workspaces/mine`, and current-user RP application fetches before considering any new backend summary endpoint.
- Rationale: the current repo already has the minimal read surfaces needed for an MVP summary page.
- Trade-off: if implementation discovers an avoidable client-side join or missing field, the preferred fix is a small dedicated dashboard API or DTO expansion rather than overloading unrelated endpoints with dashboard-only responsibilities.

### Decision 6: Keep the workspace section informative, not administrative

- Choice: the dashboard lists accessible workspaces as read-only summary links and empty-state text, but does not embed member management, settings, or creation controls.
- Rationale: workspace administration belongs on dedicated `/workspaces` routes.

### Decision 7: Preserve the RP application list as the main task launcher

- Choice: the dashboard keeps the current-user RP application list and links, and later invitation-backed applications appear in the same list when current-user scope includes them.
- Rationale: opening an RP application remains the main post-login task for many partner users.
- Trade-off: explicit per-application access-source labels, richer status summaries, and next-action cues can remain a follow-on if the MVP contract stays too thin.

### Decision 8: Keep CL Admin oversight separate

- Choice: CL Admin queue, review, and reporting work remain on the dedicated onboarding oversight route family being planned in [openspec/changes/advance-onboarding-governance-and-reporting](../advance-onboarding-governance-and-reporting/proposal.md).
- Rationale: mixing that workload into `/your-applications` would turn a simple partner dashboard into a multi-purpose operations screen.

## Standards impact

```yaml
standards_impact:
	ui:
		applies: true
		decision: Use the shared authenticated shell plus GC Design System wrappers, PAT-021 for the overall dashboard page, and PAT-017-style summary sections. Avoid PAT-023 admin-table complexity in the MVP slice.
		evidence: Page-pattern decision file and frontend dashboard tasks in this change.
		exceptions: []
	accessibility:
		applies: true
		decision: The dashboard must present a clear H1, ordered summary sections, keyboard-reachable links, and accessible loading, empty, and error notices per section.
		evidence: Frontend tests or review fixtures for loading, empty, error, and populated states.
		exceptions: []
	official_languages:
		applies: true
		decision: Dashboard headings, summary text, empty states, and notices must ship in English and French.
		evidence: Locale updates and parity checks in implementation.
		exceptions: []
	security_privacy:
		applies: true
		decision: The dashboard must show only workspaces and RP applications already available in current-user scope and must not leak unauthorized workspace or RP-application metadata.
		evidence: Authorization-aware frontend and backend tests when implementation starts.
		exceptions: []
	identity_access:
		applies: true
		decision: The MVP dashboard relies on the existing authenticated session, current-user scope, and RBAC behavior rather than a separate dashboard-only access model.
		evidence: Design decision 5 and follow-on implementation checks.
		exceptions: []
	information_management:
		applies: true
		decision: No new persisted dashboard aggregate or cache record is required in the MVP slice.
		evidence: Design decision 5.
		exceptions: []
	verification:
		applies: true
		decision: Validate this change package and add focused frontend tests; add backend tests only if implementation changes an API contract.
		evidence: OpenSpec validation plus implementation test tasks.
		exceptions: []
	gc_web_application_baseline:
		applies: true
		decision: Treat the eventual dashboard implementation as a meaningful GC web application change.
		evidence: Baseline applicability captured when implementation starts.
		exceptions: []
```

## Slice Plan

### Slice 1: Route and page-pattern definition

- Outcome: the MVP dashboard route, page pattern, navigation paths, and non-goals are explicit.
- Impacted areas: route plan, page-pattern decision, shared-shell navigation expectations.
- Exit condition: the dashboard is clearly defined as a read-only service home under `/your-applications`.

### Slice 2: Minimal summary composition

- Outcome: the MVP dashboard content is defined as profile summary, accessible workspace summary, and RP application summary sections.
- Impacted areas: session or role context, workspace summary fetch, RP application list reuse, empty or error states.
- Exit condition: each section has a testable success, empty, and failure shape.

### Slice 3: Verification and coordination

- Outcome: the change is ready for implementation handoff and the broader PRD-gap package references this dedicated dashboard package.
- Impacted areas: OpenSpec validation, frontend test planning, follow-on coordination.
- Exit condition: implementation tasks and validation command are explicit.

## Implementation readiness

- Ready after: the team confirms whether the MVP page can be built purely from existing fetch contracts or whether a small dedicated dashboard API or DTO expansion is the cleaner implementation path.
- Recommended implementation order:
	1. confirm the page composition contract
	2. implement the read-only summary blocks on `/your-applications`
	3. add frontend tests for loading, empty, error, and populated states
- Current blocker:
	- implementation has not yet confirmed whether the existing session, roles catalog, workspace list, and RP application list are sufficient without a small dedicated dashboard contract change

## Open Questions

- Human decision required only if the team wants richer per-application status or access-source labeling in the MVP dashboard instead of keeping those as follow-on enhancements.
