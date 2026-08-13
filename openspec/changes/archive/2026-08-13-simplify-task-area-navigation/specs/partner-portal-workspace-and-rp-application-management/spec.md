# Delta for partner-portal-workspace-and-rp-application-management

## MODIFIED Requirements

### Requirement: Workspace entry pages provide a scoped task hierarchy

The portal SHALL use `/workspaces` as the authorized workspace chooser and
`/workspaces/$workspaceUuid` as a task-oriented overview and entry page for the
selected workspace. The selected workspace page SHALL link to focused child
routes and SHALL NOT embed the child areas' full tables, forms, reports, or
access controls. Workspace children SHALL use the normal focused page layout
without a persistent left-side navigation rail and SHALL provide stable,
translated parent return links.

#### Scenario: User selects an authorized workspace

- **WHEN** an authenticated user opens `/workspaces`
- **THEN** the page lists only workspaces available through the canonical authorization context
- **AND** each workspace link uses the workspace name as its primary label
- **AND** selecting a workspace opens `/workspaces/$workspaceUuid`

#### Scenario: User opens the workspace task hub

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid`
- **THEN** the page identifies the selected workspace by name in one H1 or equivalent page-heading context
- **AND** it identifies itself as the selected-workspace overview and groups only the available Application information, RP applications, Access, Reports, and Settings child-task destinations under clear translated functional headings
- **AND** each available destination is one responsive GC Design System card with one linked title, one concise description, and one focused child route

#### Scenario: Workspace hub stays focused on task selection

- **WHEN** an authorized user opens `/workspaces/$workspaceUuid`
- **THEN** the page may show concise sourced workspace status or context
- **AND** empty functional groups are omitted, and cards follow a logical source and keyboard order
- **AND** it does not embed full application tables, Access management, reports, settings forms, or audit results

#### Scenario: Workspace children preserve parent navigation

- **WHEN** an authorized user opens a first-level workspace child route
- **THEN** breadcrumbs identify Home, Workspaces, and the selected workspace as the stable parent hierarchy when breadcrumbs apply
- **AND** the breadcrumb trail omits the current child page
- **AND** a visible translated parent link returns to `/workspaces/$workspaceUuid` without relying on browser history
- **AND** the page does not render a persistent workspace side-navigation rail

#### Scenario: Workspace children use a focused responsive layout

- **WHEN** an authorized user opens a workspace child route on desktop, mobile, or a zoomed viewport
- **THEN** the focused child content uses the normal page container without a reserved left-navigation column
- **AND** the page preserves logical keyboard order, visible focus, and reflow without clipped content or horizontal scrolling

#### Scenario: Raw workspace identifiers are not primary UI labels

- **WHEN** workspace context appears in a heading, breadcrumb, account context, link, status summary, return link, or confirmation
- **THEN** the portal uses the authorized workspace name or a neutral localized fallback as the primary label
- **AND** it does not present the raw workspace UUID as a friendly workspace name

#### Scenario: Workspace task visibility does not replace authorization

- **WHEN** the canonical context does not expose a workspace task to the user
- **THEN** the workspace hub and other discovery surfaces omit that task label
- **AND** direct requests continue through route and backend authorization for the selected workspace and object

#### Scenario: Workspace pages use server-scoped resources

- **WHEN** the chooser, hub, or a workspace child requests workspace data
- **THEN** the backend applies the current session, canonical capability, selected workspace, and object scope before returning the resource
- **AND** the browser does not receive a wider cross-workspace dataset and reduce it through client-side filtering
- **AND** stale browser session or authorization state does not grant route or API access
