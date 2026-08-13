# Proposal: Add a Reports task hub

## Why

Add a role-aware `/reports` task hub, a primary Reports menu item, and an
authenticated Home destination. Group the report families under clear headings
with one single-destination GC Design System card per available report family.

### Problem or opportunity

Reporting currently exists in three contexts:

- cross-workspace onboarding reports under Onboarding oversight;
- aggregate reports under each selected workspace; and
- monthly active user reports under each accessible RP application.

Those routes are correctly scoped, but there is no single place where a user
can discover which kinds of reports are available to them. People must already
know whether to start from Onboarding oversight, Workspaces, or Your
applications.

A separate Reports entry point makes reporting discoverable without moving or
combining the underlying report data. The first version is a task hub, not a
dashboard: it helps people choose a report family and scope, but does not add
summary metrics, charts, filters, or duplicated report results.

## Work context

- Local developer / localhost with fake, seeded, or test-only report data.
- Repo-scoped OpenSpec, frontend, tests, and local verification only.
- No shared environment, production data, deployment, real secret, or external
  system mutation is in scope.

## Resolved questions

| Question | Answer | Source | Classification | Confidence |
|---|---|---|---|---|
| Should Reports be a dashboard? | Not initially. A page containing links to report tasks is a task hub. `PAT-021` reserves dashboards for operational monitoring, triage, comparison, or resume-work data with owned freshness and states. | `PAT-001: UI Page Patterns`; `PAT-021: Dashboard Overview Page` | fact | high |
| Should Reports be a primary menu item? | Yes. It is a cross-cutting primary destination with multiple focused report families, so `/reports` belongs in the shared menu and authenticated Home when the user can access at least one report. | `STD-005`; `STD-006`; current report routes | safe_assumption | high |
| Should existing report routes move under `/reports`? | No. Existing URLs keep their canonical workspace, application, and oversight scope. The Reports hub and focused chooser pages are authorized discovery surfaces that link to them. | Current specs and route ownership | fact | high |
| Are cards required? | No, but `GcdsCard` is appropriate here as an actionable preview of one report family. Cards remain grouped, single-destination, and free of embedded metrics or controls. | GC Design System Card guidance; `STD-005` | fact | high |

## What Changes

- Add an authorized `/reports` task hub.
- Add Reports to the shared top navigation and authenticated Home for users
  with at least one reporting capability.
- Group cards under Platform reporting and Partner reporting, omitting empty
  groups.
- Link the cross-workspace onboarding report card directly to
  `/onboarding-oversight/reports` when authorized.
- Add focused workspace-report and application-usage report chooser routes that
  list only authorized scopes and link to the existing report pages.
- Preserve existing contextual report links from Onboarding oversight,
  selected workspaces, and accessible RP applications.
- Add independent loading, empty, partial, error, and authorization states for
  dynamic report-scope lists.
- Add English/French content, route metadata, tests, and page-pattern evidence.

## Capabilities

### Modified Capabilities

- `partner-portal-access-and-dashboard`: authenticated Home and shared-menu
  discovery of the Reports task hub.
- `partner-portal-onboarding-oversight-and-reporting`: role-aware discovery of
  existing cross-workspace, selected-workspace, and application usage reports.

## Impact

- Active deltas and, after archive, current specs for authenticated access,
  dashboard navigation, onboarding oversight, and reporting discovery.
- Global route metadata, shared navigation, authenticated Home, authorization
  entry checks, and generated TanStack route artifacts.
- New Reports task-hub and authorized workspace/application chooser routes that
  reuse existing scoped report destinations and server-owned access boundaries.
- English/French content, focused frontend tests, accessibility and responsive
  checks, and page-pattern evidence for the new discovery surfaces.

## Out of scope

- Moving, renaming, or changing the existing report endpoints or result pages.
- Combining workspace, application, and cross-workspace results.
- New metrics, report families, charts, exports, filters, or backend data
  contracts.
- Dashboard summary widgets, report previews, or live operational status on
  `/reports`.
- Client-side filtering of data wider than the current user's authorized
  report scopes.
- Shared-environment or production work.

## Risks

- A cross-cutting Reports hub can blur scope. Every card and chooser item must
  identify whether the destination is platform-wide, workspace-scoped, or
  application-scoped.
- Duplicating report data on the hub would create stale and inaccessible
  pseudo-dashboard widgets. The hub contains navigation and concise
  descriptions only.
- Dynamic chooser lists can become long. They remain focused pages and must use
  the existing authorized list/query patterns, pagination when already
  available, and clear empty/error states.
- Navigation visibility is not authorization. Every destination retains its
  current route and backend checks.

## Links

- `STD-002: Work Contexts`
- `STD-005: Frontend GC Design System`
- `STD-006: GC UI Page Layout Rules`
- `STD-007: UI Accessibility Basics`
- `STD-017: Government of Canada Standards Review`
- `PAT-001: UI Page Patterns`
- `PAT-013: GC Design System React App Shell`
- `PAT-014: Bilingual Route and I18n`
- `PAT-021: Dashboard Overview Page`
- `PAT-022: Page Length and Splitting`
- [GC Design System: Card](https://design-system.canada.ca/en/components/card/)
- [Canada.ca: Services and information](https://design.canada.ca/common-design-patterns/services-information.html)
