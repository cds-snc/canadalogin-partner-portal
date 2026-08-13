# Tasks: Add a Reports task hub

## 0. OpenSpec and design readiness

- [x] 0.1 Confirm Level 2 and the local developer / localhost work context.
- [x] 0.2 Inventory cross-workspace, selected-workspace, and application usage
  report routes, capabilities, return paths, current specs, and page decisions.
- [x] 0.3 Research task-hub, dashboard, card, services-and-information, shared
  menu, accessibility, and responsive guidance.
- [x] 0.4 Select a role-aware task hub with grouped single-destination
  `GcdsCard` report families; explicitly defer dashboard widgets.
- [x] 0.5 Validate this active OpenSpec change strictly.

## 1. Reports route and shared discovery

- [x] 1.1 Add `/reports` to the route catalog with visibility when at least one
  reporting capability is present.
- [x] 1.2 Add the translated Reports item to the shared top navigation and
  authenticated Home from the same route metadata.
- [x] 1.3 Add safe route-entry denial for users without reporting capability.
- [x] 1.4 Update generated TanStack route artifacts and route/navigation tests.

## 2. Grouped Reports task hub

- [x] 2.1 Add one Reports H1, short scope introduction, and translated Platform
  reporting and Partner reporting H2 groups.
- [x] 2.2 Add the authorized cross-workspace onboarding report card linking to
  `/onboarding-oversight/reports`.
- [x] 2.3 Add the authorized Workspace reports card linking to
  `/reports/workspaces`.
- [x] 2.4 Add the authorized Application usage reports card linking to
  `/reports/applications`.
- [x] 2.5 Keep each card to one linked title, one concise description, and one
  destination; omit empty groups and embedded metrics or controls.
- [x] 2.6 Cover representative CL Admin, RP Admin, RP User (Edit), Read Only,
  mixed-access, and no-report-capability states.

## 3. Focused report chooser pages

- [x] 3.1 Add `/reports/workspaces` using the authorized workspace list/query
  boundary and link only `aggregate_report_read` scopes to existing workspace
  report pages.
- [x] 3.2 Add `/reports/applications` using the accessible RP application
  list/query boundary and link only `mau_report_read` scopes to canonical
  workspace-scoped Usage pages.
- [x] 3.3 Use safe workspace/application labels, stable Back to Reports links,
  and `Home` then `Reports` parent breadcrumbs with the current chooser page
  omitted.
- [x] 3.4 Add independent loading, populated, empty, partial, error, stale-scope,
  and unauthorized states without replacing valid sibling content.
- [x] 3.5 Stop and refine the API contract separately if existing queries cannot
  safely supply scoped report destinations without broader browser data.

## 4. Accessibility, bilingual, security, and responsive verification

- [x] 4.1 Verify card and chooser accessible names, heading hierarchy, source
  order, keyboard order, visible focus, landmarks, and stable return paths.
  - Live local browser verification confirmed one H1, ordered H2/H3 task
    groups, semantic chooser lists, unique report and scope links, the shared
    skip/main landmarks, and stable `Back to Reports` and named-workspace
    return paths. Focused tests cover role filtering and direct-route states.
- [x] 4.2 Verify one-column mobile and 200-percent zoom reflow without clipped
  cards, long French labels, or horizontal scrolling.
  - English and French Reports hubs were checked at 390 pixels, and the CL
    Admin hub was checked at a 640-pixel effective 200-percent reflow width;
    cards remained single-column and document scroll width equalled client
    width.
- [x] 4.3 Verify English/French menu, Home, card, chooser, empty/error, and
  accessibility text parity.
- [x] 4.4 Verify authorization filtering and direct-route enforcement for every
  report family and representative resource scope.
- [x] 4.5 Run frontend standards and page-shell checks and capture desktop,
  mobile, and bilingual screenshots.
  - Both checks passed. Desktop RP User and CL Admin role states, 390-pixel
    English/French mobile views, workspace/application choosers, and the
    640-pixel reflow view were captured with fake local data in the in-app
    browser on 2026-08-12.

## 5. Archive readiness

- [x] 5.1 Run focused frontend tests, lint, typecheck, and relevant browser
  checks.
- [x] 5.2 Run holistic local QA and record skipped checks and remaining risk.
  - Scoped frontend lint, tests, build, GC Design System checks, and page-shell
    checks passed. The repository-wide loop remains red on pre-existing
    generated/cache and starter-document formatting/Markdown findings, plus a
    backend test-environment failure caused by wildcard CORS method/header
    values. ShellCheck, backend lint/format tools, optional secret scanning,
    and optional container checks were unavailable or disabled locally.
- [x] 5.3 Validate OpenSpec strictly and archive without `--skip-specs` after
  implementation and verification.
  - `make validate-openspec-change CHANGE_ID=add-reports-task-hub` passed
    official validation and scenario preservation immediately before
    `openspec archive add-reports-task-hub --yes`.
- [x] 5.4 Confirm both current capability specs reflect the implemented Reports
  task hub after archive.
  - The archive added the Reports task-hub requirement to
    `partner-portal-access-and-dashboard` and the six-scenario canonical report
    discovery requirement to
    `partner-portal-onboarding-oversight-and-reporting`; the archived package
    is `2026-08-13-add-reports-task-hub`.
