# Delta for partner-portal-access-and-dashboard

## MODIFIED Requirements

### Requirement: Authenticated Home provides a task-oriented service entry page at `/`

The portal SHALL use `/` as the authenticated service Home for admitted users
and SHALL present the available parent task areas without becoming an
operational dashboard or all-in-one work page. Available destinations SHALL be
organized under translated task-area headings and presented as responsive
single-destination GC Design System cards with concise descriptions.

#### Scenario: Admitted authenticated user opens Home

- **WHEN** an admitted authenticated user opens `/`
- **THEN** the page identifies the Partner Portal purpose in one H1
- **AND** it presents short descriptions and cards for only the task areas and destinations available to that user
- **AND** each card has one linked task title, one concise description, and one focused destination
- **AND** an available Partner work section links directly to the authorized `/your-applications` and `/workspaces` destinations because Partner work is a navigation group rather than a route
- **AND** available Onboarding oversight and Administration sections link to `/onboarding-oversight` and `/administration` respectively

#### Scenario: Home card groups remain accessible and responsive

- **WHEN** authenticated Home is used with keyboard navigation, assistive technology, a small screen, or a zoomed viewport
- **THEN** task groups have a logical heading hierarchy and source order
- **AND** cards reflow to a single column without clipped content or horizontal scrolling
- **AND** no card contains nested interactive controls, multiple destinations, forms, tables, or decorative metrics

#### Scenario: Home remains a task-selection surface

- **WHEN** an authenticated user opens `/`
- **THEN** the page helps the user choose a task area
- **AND** it does not embed review queues, full reports, large record lists, administration tables, or data-changing forms

#### Scenario: Unauthenticated root remains the public Home

- **WHEN** a user without an authenticated session opens `/`
- **THEN** the portal renders the public service introduction and sign-in path instead of authenticated task cards or protected context

### Requirement: Administration uses a dedicated task hub

The portal SHALL provide `/administration` as the authorized parent task hub
for platform governance modules. The hub SHALL expose focused destination links
and SHALL NOT contain the modules' full tables, search interfaces, forms, or
record actions. Administration children SHALL use the normal focused page
layout without a persistent left-side navigation rail and SHALL provide a
stable, translated link back to the Administration hub.

#### Scenario: Authorized user opens the Administration hub

- **WHEN** a user whose canonical authorization context permits platform administration opens `/administration`
- **THEN** the hub groups available Users and access, Departments, Tiers, Audit logs, and fixed Role reference tasks under clear translated functional headings
- **AND** each task is one responsive GC Design System card with one linked title, one concise description, and one focused destination
- **AND** the destinations use `/users`, `/departments`, `/tiers`, `/audit-logs`, and `/roles` respectively
- **AND** `/policies` is not presented as an independent administration destination

#### Scenario: Administration children retain a parent path

- **WHEN** an authorized user opens an Administration child route
- **THEN** the page identifies Administration as its parent area
- **AND** hierarchy breadcrumbs link to `/administration` when the page type uses breadcrumbs
- **AND** a visible translated parent link returns to `/administration` without relying on browser history
- **AND** the page does not render a persistent Administration side-navigation rail

#### Scenario: Administration children use a focused responsive layout

- **WHEN** an authorized user opens an Administration child route on desktop, mobile, or a zoomed viewport
- **THEN** the focused child content uses the normal page container without a reserved left-navigation column
- **AND** the page preserves logical keyboard order, visible focus, and reflow without clipped content or horizontal scrolling

#### Scenario: Administration hub stays focused on task selection

- **WHEN** an authorized user opens `/administration`
- **THEN** the page uses one H1, short task descriptions, and links to focused modules
- **AND** empty functional groups are omitted, and cards follow a logical source and keyboard order
- **AND** it does not embed user tables, department or tier forms, audit results, or role-assignment controls

#### Scenario: Unavailable Administration remains undiscoverable

- **WHEN** the current authorization context does not permit any Administration destination
- **THEN** Home and the shared header omit the Administration link
- **AND** direct route requests continue through the canonical authorization boundary
