# Design: Simplify task-area navigation

## Technical approach

Keep the existing global route catalog, workspace route catalog, task hubs,
shared `GcdsTopNav`, and `GcdsBreadcrumbs`. Stop using `sideNavigation` as a
rendered route surface and remove the two-column `GcdsSideNav` wrappers from
Administration and selected-workspace pages.

Render authenticated task choices as responsive groups of `GcdsCard`
components. Each card has one linked title, a concise description, and one
focused destination. Group headings describe related functions. Cards do not
contain forms, tables, metrics, nested links, or multiple competing actions.

Focused child pages use the normal shared page container. Each first-level
child exposes a translated `GcdsLink` to its known parent task hub. Nested
detail, form, and multi-step routes continue to use their more specific stable
return destinations. A generic click-history handler is not introduced.

Breadcrumb generation represents the route hierarchy rather than arrival
history. It links to parent pages and omits the current page, consistent with
the current Canada.ca breadcrumb pattern. Breadcrumbs support location; the
task hubs and shared header remain the discovery mechanisms.

## Research basis

- GC Design System describes side navigation as optional for local trees and
  broad or deep category sets. The current Administration and workspace
  hierarchies are shallow and already have task hubs and shared navigation.
- Canada.ca's services-and-information pattern supports linked headings and
  descriptions on landing pages whose primary purpose is task choice. That is
  the role already assigned to the Administration and workspace hubs.
- GC Design System cards support small, related previews with a path to more
  detail. They are not mandatory, and Canada.ca cautions against substituting
  cards for doormats on applicable public landing templates. This authenticated
  application uses cards to preserve, not replace, the linked-heading and
  description task-choice model.
- GC Design System distinguishes navigation links from action buttons. A known
  parent destination therefore uses a link, not a history-dependent button.
- WCAG focus-order, consistent-navigation, and reflow considerations require a
  logical keyboard sequence and usable narrow/zoomed layout; removing a
  redundant rail may help, but the result still requires verification.

## Navigation model

### Administration

```text
Home -> Administration -> focused child
                         -> Back to Administration
```

- `/administration` remains the authorized task hub.
- Administration tasks are grouped as Access management, Partner
  configuration, and Monitoring and reference; empty groups are omitted.
- The shared header keeps the Administration destination.
- Child pages use hierarchy breadcrumbs and a destination-specific return link.
- No persistent Administration left rail is rendered.

### Selected workspace

```text
Home -> Partner work -> Workspaces -> selected workspace hub -> focused child
                                                     child -> Back to <workspace>
```

- `/workspaces` remains the workspace chooser.
- `/workspaces/$workspaceUuid` remains the selected-workspace overview and task
  hub.
- The global Partner work menu continues to expose Workspaces.
- The workspace hub exposes only authorized child tasks.
- Workspace tasks are grouped as Setup and applications, Access, Insights, and
  Workspace management; empty groups are omitted.
- Child pages use parent breadcrumbs and a destination-specific workspace
  return link; no persistent workspace left rail is rendered.

## Breadcrumb behavior

- Administration child: `Home` then `Administration`; current child omitted.
- Workspace chooser: `Home`; current Workspaces page omitted.
- Workspace hub: `Home` then `Workspaces`; current workspace page omitted.
- Workspace child: `Home`, `Workspaces`, then the selected workspace; current
  child omitted.
- Labels come from route metadata and translated workspace context. Raw UUIDs
  are never friendly labels.

## Impacted artifacts

- OpenSpec deltas and current specs after archive.
- Existing Administration and workspace page-pattern decisions.
- Authenticated Home grouped-task rendering.
- `frontend/src/components/layout/AppShell.tsx`.
- `frontend/src/components/ui/Header.tsx` and breadcrumb generation.
- Administration and workspace section layouts.
- Global and workspace route catalogs and return-path helpers.
- English and French navigation content.
- Unit, route, accessibility, and responsive tests.
- Desktop, mobile, and 200-percent zoom evidence after implementation.

## Standards and patterns impact

- Applicable standards: `STD-002`, `STD-004`, `STD-005`, `STD-006`,
  `STD-007`, `STD-012`, `STD-017`, and `STD-018`.
- Selected patterns: `PAT-001`, `PAT-013`, `PAT-014`, and `PAT-022`.
- Active baseline: `BAS-001`.
- Affected controls: `GC-WEB-002`, `GC-WEB-003`, `GC-WEB-004`, and
  `GC-WEB-005`.
- Template: `TPL-007: Page Pattern Decision Template`.
- Custom UI or CSS exceptions: none planned.
- At Level 2, baseline controls are identified for implementation and
  verification; a formal baseline assessment is deferred unless release
  readiness is requested.

## Accessibility and bilingual design

- Removing the rail is not treated as accessibility evidence by itself.
- Keyboard order must proceed through the shared header and skip link to the
  focused content without a repeated side-navigation block.
- Return links must have visible, unique destination text and use `GcdsLink`.
- Card groups require logical heading levels, one accessible destination per
  card, and source order matching visual and keyboard order.
- Focus must not be moved automatically when the layout changes.
- Child content must reflow without horizontal scrolling at mobile widths and
  at 200-percent zoom.
- English and French route labels, breadcrumbs, workspace fallback labels, and
  parent return links remain equivalent.
- Authorization-hidden links remain absent from every discovery surface, but
  backend and route authorization remain authoritative.

## Slice plan

### Slice 1: Strengthen authenticated task hubs

Replace the authenticated Home, Administration, and selected-workspace plain
task lists with responsive grouped `GcdsCard` destinations while preserving
authorization filtering, concise descriptions, and focused routes.

### Slice 2: Remove Administration rail

Remove the Administration side navigation and reserved column, add/confirm the
stable Administration parent return link, align breadcrumbs, and update tests.

### Slice 3: Remove selected-workspace rail

Remove the workspace side navigation and reserved column, keep the workspace
hub as the authorized child-task entry page, add/confirm stable workspace
return links, align breadcrumbs, and update tests.

### Slice 4: Accessibility, bilingual, and archive verification

Verify desktop, mobile, zoom, keyboard, focus order, route reachability,
translation parity, page shell, and strict OpenSpec validation before archive.

## Resolved questions

| Question | Answer | Source | Classification | Confidence |
|---|---|---|---|---|
| Which navigation remains primary? | The authenticated Home, Administration and workspace task hubs, and the shared header menu remain primary. | Current route catalog; `STD-006`; `PAT-001` | fact | high |
| What replaces active side-nav state? | Page H1, hierarchy breadcrumbs, top-nav parent state, and a stable parent return link provide orientation and recovery. | `PAT-013`; Canada.ca breadcrumb guidance | safe_assumption | high |
| Should the link say only Back? | No. Use destination-specific translated text for these branching admin/workspace areas. | Complex route structure and accessibility clarity | safe_assumption | high |

## Human decisions required

- None before local implementation. Usability testing may refine the exact
  English and French return-link wording, but it does not block the structural
  change.
