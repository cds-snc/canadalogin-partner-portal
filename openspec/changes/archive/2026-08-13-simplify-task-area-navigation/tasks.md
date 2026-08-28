# Tasks: Simplify task-area navigation

## 0. OpenSpec and design readiness

- [x] 0.1 Confirm Level 2 and the local developer / localhost work context.
- [x] 0.2 Inspect the Home, shared header, Administration hub, workspace hub,
  side-navigation layouts, route metadata, current specs, and archived page
  decisions.
- [x] 0.3 Research current GC Design System side-navigation, button, Canada.ca
  breadcrumb, and WCAG navigation/reflow guidance.
- [x] 0.4 Research GC Design System card and Canada.ca services-and-information
  guidance, including the distinction between internal task cards and required
  Canada.ca landing-page doormats.
- [x] 0.5 Select grouped single-destination `GcdsCard` task hubs plus focused
  child pages with breadcrumbs and stable parent links; record no custom UI
  exception.
- [x] 0.6 Validate this active OpenSpec change strictly.

## 1. Grouped task-hub cards

- [x] 1.1 Render authenticated Home task areas as translated H2 groups with
  one authorized `GcdsCard` per focused destination.
- [x] 1.2 Render Administration task groups for Access management, Partner
  configuration, and Monitoring and reference, omitting empty groups.
- [x] 1.3 Render selected-workspace task groups for Setup and applications,
  Access, Insights, and Workspace management, omitting empty groups.
- [x] 1.4 Keep each card to one linked title, one concise description, and one
  destination; do not nest controls, metrics, forms, or tables.
- [x] 1.5 Verify responsive one-column mobile layout, logical source order,
  heading hierarchy, bilingual descriptions, and authorization filtering.

## 2. Administration navigation slice

- [x] 2.1 Remove the persistent Administration `GcdsSideNav` and the reserved
  two-column layout while preserving the `/administration` task hub.
- [x] 2.2 Add or confirm a translated `Back to Administration` parent link on
  first-level child pages without using browser history.
- [x] 2.3 Make Administration breadcrumbs represent parent hierarchy and omit
  the current page.
- [x] 2.4 Remove obsolete `sideNavigation` route-surface behavior and update
  focused unit and route tests.

## 3. Selected-workspace navigation slice

- [x] 3.1 Remove the persistent workspace `GcdsSideNav` and reserved two-column
  layout while preserving the selected-workspace task hub.
- [x] 3.2 Add or confirm a translated `Back to <workspace>` parent link for
  first-level workspace children and retain more specific stable return paths
  for nested detail, form, and multi-step routes.
- [x] 3.3 Make workspace breadcrumbs represent parent hierarchy, use the
  authorized workspace name or neutral fallback, and omit the current page.
- [x] 3.4 Keep authorization-filtered task links on the workspace hub and
  preserve route/backend authorization for direct requests.
- [x] 3.5 Remove obsolete workspace `sideNavigation` route-surface behavior and
  update focused unit and route tests.

## 4. Accessibility, bilingual, and design-system verification

- [x] 4.1 Verify keyboard order, visible focus, skip-to-content, unique parent
  link names, headings, landmarks, and direct-entry recovery.
  - Live local browser verification confirmed the skip link, semantic heading
    and landmark order, direct entry to Administration and workspace hubs,
    visible focus on shared-menu controls, deterministic breadcrumbs, and the
    translated `Back to Administration` and named-workspace return links.
    Focused component and route tests cover source order and stable parent
    destinations.
- [x] 4.2 Verify desktop, mobile, narrow viewport, and 200-percent zoom reflow
  without clipped content or horizontal scrolling.
- [x] 4.3 Verify English/French menu, breadcrumb, workspace fallback, and return
  link parity.
- [x] 4.4 Run the frontend standards and page-shell checks and record any
  skipped check with its reason.
- [x] 4.5 Capture representative Administration and workspace screenshots after
  implementation.
  - Post-change Administration and selected-workspace screenshots were
    captured with fake local CL Admin data in the in-app browser on 2026-08-12,
    including a 640-pixel reflow view with no document-level horizontal
    overflow.

## 5. Archive readiness

- [x] 5.1 Run focused frontend tests, lint, typecheck, and relevant browser
  checks.
- [x] 5.2 Run holistic local QA and resolve or record findings.
  - Scoped frontend lint, tests, build, GC Design System checks, and page-shell
    checks passed. The repository-wide loop remains red on pre-existing
    generated/cache and starter-document formatting/Markdown findings, plus a
    backend test-environment failure caused by wildcard CORS method/header
    values. ShellCheck, backend lint/format tools, optional secret scanning,
    and optional container checks were unavailable or disabled locally.
- [x] 5.3 Validate the OpenSpec change, confirm modified requirements preserve
  all intended scenarios, and archive without `--skip-specs`.
  - `make validate-openspec-change CHANGE_ID=simplify-task-area-navigation`
    passed official validation and scenario preservation immediately before
    `openspec archive simplify-task-area-navigation --yes`.
- [x] 5.4 Confirm both current capability specs reflect the implemented
  navigation after archive.
  - The archive updated `partner-portal-access-and-dashboard` and
    `partner-portal-workspace-and-rp-application-management`; the archived
    package is `2026-08-13-simplify-task-area-navigation`.
