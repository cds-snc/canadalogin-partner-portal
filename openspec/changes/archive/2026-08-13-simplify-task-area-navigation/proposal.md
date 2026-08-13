# Proposal: Simplify task-area navigation

## Why

Remove the persistent left-side navigation from Administration and selected
workspace pages. Strengthen the authenticated Home, Administration, and
selected-workspace task hubs with responsive groups of single-destination GC
Design System cards, while keeping the global header menu, hierarchical
breadcrumbs, and explicit destination-specific links back to the parent task
hub.

### Problem or opportunity

Administration and selected workspaces already provide task-oriented landing
pages, shared header navigation, and breadcrumbs. Their additional persistent
left rails repeat the same destinations, reserve 14 to 18 rem of desktop width,
and add a block of links before the focused page content. This is more
navigation than the current shallow information architecture needs.

The current task hubs render linked headings and descriptions, but the product
direction is to make each destination easier to scan as a consistent visual
unit. `GcdsCard` fits this authenticated application context when each card is
about one task and links to one focused destination. Cards are not used as
decorative dashboard widgets or as containers for forms, tables, or nested
actions.

The GC Design System side-navigation component is not inherently inaccessible;
it is optional and intended for persistent local navigation trees. In this
portal, the task hubs and shared menu already own discovery, so removing the
redundant rail is a usability and reflow simplification rather than a rejection
of the component.

## Work context

- Local developer / localhost with fake, seeded, or test-only data.
- Repo-scoped OpenSpec, frontend, tests, and local verification only.
- No shared environment, production data, deployment, real secret, or external
  system mutation is in scope.

## Resolved questions

| Question | Answer | Source | Classification | Confidence |
|---|---|---|---|---|
| Is side navigation required for these task areas? | No. GC Design System describes side navigation as optional for persistent local trees. The portal's task hubs, top navigation, and breadcrumbs already provide a shallower route model. | `STD-006: GC UI Page Layout Rules`; `PAT-001: UI Page Patterns`; GC Design System Side navigation guidance | fact | high |
| Should the replacement be a browser-history Back button? | No. Navigation to a known parent is a link, and the destination must remain stable when a page is opened directly or after a redirect. | `STD-005: Frontend GC Design System`; `STD-006: GC UI Page Layout Rules`; GC Design System Button guidance | fact | high |
| How should people return to a parent task hub? | Use a translated destination-specific `GcdsLink`, such as `Back to Administration` or `Back to <workspace>`, while retaining hierarchy breadcrumbs where the page type needs them. | Existing route metadata and return paths; `PAT-013: GC Design System React App Shell`; Canada.ca Breadcrumb trail guidance | safe_assumption | high |
| Do the patterns require cards on these task hubs? | No. Cards are an approved component for a single topic and actionable preview, but they are not mandatory, and Canada.ca landing pages should not replace required doormats with cards. For this authenticated product task hub, grouped single-destination cards are a recorded product choice that preserves the same linked-heading and description semantics. | `STD-005: Frontend GC Design System`; GC Design System Card guidance; Canada.ca Services and information guidance | fact | high |
| Does removing the rail remove authorization? | No. Visibility remains derived from canonical authorization, and route/backend enforcement remains authoritative. | Current route catalogs, protected routes, and OpenSpec authorization requirements | fact | high |

## What Changes

- Remove the persistent Administration and selected-workspace side navigation.
- Let focused child pages use the normal page content width without a reserved
  left navigation column.
- Present available task-hub destinations as responsive, semantically grouped
  `GcdsCard` previews with one destination per card.
- Apply the grouped-card treatment to authenticated Home, Administration, and
  selected-workspace task hubs without turning them into operational
  dashboards.
- Keep `/administration` and `/workspaces/$workspaceUuid` as the task-oriented
  entry pages for their child routes.
- Keep shared header navigation and authorization-filtered task links.
- Use stable, translated parent return links that do not depend on browser
  history.
- Align breadcrumbs to the stable information hierarchy and omit the current
  page from the breadcrumb trail.
- Update route metadata, English/French content, tests, page-pattern decisions,
  and responsive/accessibility evidence.

## Capabilities

### Modified Capabilities

- `partner-portal-access-and-dashboard`: Administration task hub and child
  navigation.
- `partner-portal-workspace-and-rp-application-management`: selected workspace
  task hierarchy and child return paths.

## Impact

- Active deltas and, after archive, current specs for authenticated Home,
  Administration, and selected-workspace task navigation.
- Shared route metadata, breadcrumbs, deterministic parent links, task-hub
  cards, and the Administration and workspace section layouts.
- Removal of persistent side-navigation surfaces and their reserved layout
  columns without changing route or backend authorization boundaries.
- English/French content, focused route and component tests, responsive and
  accessibility checks, and page-pattern evidence for the affected task areas.

## Out of scope

- Changing role permissions, route authorization, backend APIs, or data scope.
- Removing the global header menu, breadcrumbs, or task hubs.
- Redesigning multi-step form Back, Save and exit, review, or confirmation
  behavior.
- Adding custom navigation controls or custom CSS that duplicates GC Design
  System behavior.
- Putting forms, full tables, metrics, multiple actions, or nested interactive
  controls inside task cards.
- Shared-environment or production work.

## Risks

- Removing a familiar local navigation surface can reduce discoverability if
  task hubs or the header menu are incomplete. Route-reachability and
  authorization-visibility tests must cover every primary task.
- Breadcrumbs alone are not a sufficient primary navigation mechanism. Each
  child page needs a deterministic parent return link in addition to task-hub
  discovery.
- Repeated return links must have clear destination-specific bilingual text and
  a predictable focus order.

## Links

- `STD-002: Work Contexts`
- `STD-005: Frontend GC Design System`
- `STD-006: GC UI Page Layout Rules`
- `STD-007: UI Accessibility Basics`
- `STD-017: Government of Canada Standards Review`
- `STD-018: Frontend CSS and Design-System Boundary`
- `PAT-001: UI Page Patterns`
- `PAT-013: GC Design System React App Shell`
- `PAT-014: Bilingual Route and I18n`
- [GC Design System: Side navigation](https://design-system.canada.ca/en/components/side-navigation/)
- [GC Design System: Button](https://design-system.canada.ca/en/components/button/)
- [GC Design System: Card](https://design-system.canada.ca/en/components/card/)
- [Canada.ca: Breadcrumb trail](https://design.canada.ca/common-design-patterns/breadcrumb-trail.html)
- [Canada.ca: Services and information](https://design.canada.ca/common-design-patterns/services-information.html)
