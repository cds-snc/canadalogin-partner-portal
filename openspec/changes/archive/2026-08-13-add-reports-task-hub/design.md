# Design: Add a Reports task hub

## Technical approach

Add `reports` to the global route catalog as an authenticated, capability-aware
primary route. Reports is visible when canonical authorization grants at least
one of `onboarding_oversight_read`, `aggregate_report_read`, or
`mau_report_read`. The shared header and authenticated Home use the same route
metadata and visibility helper.

The `/reports` page is a PAT-001 task hub. It renders translated functional
group headings and one `GcdsCard` per available report family:

- Platform reporting
  - Onboarding and invitation reports -> `/onboarding-oversight/reports`
- Partner reporting
  - Workspace reports -> `/reports/workspaces`
  - Application usage reports -> `/reports/applications`

Empty groups and unavailable cards are omitted. Each card contains one linked
title, one concise scope description, and one destination. It does not contain
metrics, filters, tables, exports, multiple links, or nested controls.

The two chooser routes are focused selection pages rather than dashboards:

- `/reports/workspaces` lists only authorized workspaces with
  `aggregate_report_read` and links each name to the existing
  `/workspaces/$workspaceUuid/reports` page.
- `/reports/applications` lists only accessible RP applications with
  `mau_report_read` and links each meaningful application label to the canonical
  `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage` page.

The chooser pages reuse existing server-scoped list contracts and canonical
authorization context. They do not fetch a wider dataset and filter it only in
the browser. When an existing list contract is insufficient to make the scoped
report destinations available safely, implementation must stop and refine the
API contract through a separate compatible slice rather than expose broader
data.

## Why this is a task hub, not a dashboard

`PAT-021: Dashboard Overview Page` applies when authenticated repeat users need
to monitor, triage, compare, or resume work from sourced operational summaries.
The requested first version owns no new summary data or freshness contract.
Its purpose is report discovery and scope selection, so the approved pattern is
the Basic page shell plus a task hub. A future dashboard requires a separate
requirement and page-pattern decision for the decisions, metrics, freshness,
loading, error, authorization, and accessible equivalent-data behavior it
would introduce.

## Navigation model

```text
Authenticated Home or shared Reports menu
  -> /reports
     -> /onboarding-oversight/reports
     -> /reports/workspaces
        -> /workspaces/$workspaceUuid/reports
     -> /reports/applications
        -> /workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage
```

- Existing contextual links remain available from Onboarding oversight,
  selected workspace, and selected RP application pages.
- Existing report pages keep their canonical workspace, application, or
  oversight breadcrumb hierarchy and stable return path.
- The Reports menu item provides a predictable way to return to cross-cutting
  report discovery without making breadcrumb hierarchy depend on arrival
  history.
- The focused chooser pages use `Home` then `Reports` as their breadcrumb
  parents, omit the current page, and include a translated link back to
  `/reports`.

## Route and authorization behavior

- `Reports` is discoverable only when at least one report capability is
  available.
- `/reports` denies users with no report capability through the standard safe
  route behavior.
- Each family card is independently capability-filtered.
- Workspace and application chooser items are independently resource-scoped.
- Direct report routes retain their current frontend and backend enforcement.
- Hidden cards, groups, or chooser items never grant or replace authorization.

## UI grouping and card behavior

- One H1: Reports.
- Short introduction describing that availability depends on access.
- H2 group headings: Platform reporting and Partner reporting.
- One `GcdsCard` per report family, in logical source order.
- Desktop may use a responsive multi-column `GcdsGrid`; mobile and zoomed views
  use one column.
- Card titles name the report family; descriptions name the scope and outcome.
- Decorative imagery and icons are omitted.
- The card's linked destination is the only interactive element in the card.

## Impacted artifacts

- OpenSpec deltas and current specs after archive.
- Global route and task-area catalogs, route visibility helpers, and generated
  TanStack route tree.
- Authenticated Home and shared header menu.
- New Reports task-hub and two report-scope chooser pages/routes.
- Existing workspace and accessible-application query boundaries.
- English and French translations.
- Unit, route, authorization, accessibility, and responsive tests.
- Desktop, mobile, bilingual, and role-state evidence after implementation.

## Standards and patterns impact

- Applicable standards: `STD-002`, `STD-004`, `STD-005`, `STD-006`,
  `STD-007`, `STD-012`, `STD-013`, `STD-017`, and `STD-018`.
- Selected patterns: `PAT-001`, `PAT-002`, `PAT-004`, `PAT-010`, `PAT-013`,
  `PAT-014`, `PAT-017`, `PAT-020`, and `PAT-022`.
- Pattern not selected: `PAT-021` for the first slice because `/reports` owns
  task selection, not operational summary data.
- Active baseline: `BAS-001`.
- Affected controls: `GC-WEB-002`, `GC-WEB-003`, `GC-WEB-004`,
  `GC-WEB-005`, `GC-WEB-007`, and `GC-WEB-008`.
- Template: `TPL-007: Page Pattern Decision Template`.
- Custom UI or CSS exceptions: none planned.
- At Level 2, baseline controls are identified for implementation and
  verification; a formal baseline assessment is deferred unless release
  readiness is requested.

## Accessibility, bilingual, security, and privacy notes

- Group headings, cards, and chooser lists must have a logical semantic and
  keyboard order that matches their visual order.
- Each card and chooser link needs a unique accessible name that identifies the
  report family and, where applicable, the workspace or application scope.
- Dynamic sections preserve independently valid content when another section
  is loading, empty, unavailable, or failed.
- Mobile and 200-percent zoom views must not clip card content or introduce
  horizontal scrolling.
- English and French route labels, headings, card titles, descriptions, empty
  states, errors, and accessible names remain equivalent.
- The hub and choosers display safe user-facing names, not raw UUIDs or
  authorization payloads.
- No report data, export content, secret material, or personal information is
  added to the discovery pages.

## Slice plan

### Slice 1: Reports route, shared menu, and Home discovery

Add capability-aware route metadata for `/reports`, the shared Reports menu
item, the authenticated Home card, bilingual labels, and authorization tests.

### Slice 2: Grouped Reports task hub

Build the role-aware Platform reporting and Partner reporting card groups with
loading-safe capability behavior and responsive/accessibility tests.

### Slice 3: Scoped report chooser pages

Add workspace-report and application-usage chooser routes using existing safe
list/query boundaries, stable return links, and direct links to existing report
pages.

### Slice 4: Verification and archive

Run focused and broad checks, accessibility and bilingual review, page shell
and design-system checks, strict OpenSpec validation, and archive follow-through.

## Human decisions required

- None before local implementation. Adding live report summaries or converting
  `/reports` into a dashboard is a future product decision requiring its own
  sourced metrics and page-pattern review.
