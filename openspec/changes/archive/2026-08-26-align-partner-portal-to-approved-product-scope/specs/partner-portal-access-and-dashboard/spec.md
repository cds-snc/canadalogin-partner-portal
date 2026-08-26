# Delta for partner portal access and dashboard

## MODIFIED Requirements

### Requirement: Administration uses a dedicated task hub

The portal SHALL provide `/administration` as the authorized parent task hub
for canonical identity and access administration. The hub SHALL expose focused
destinations for `Users and access`, `Invitations`, and the immutable canonical
`Role reference` when those tasks are authorized. It SHALL NOT expose
Department or tier catalog CRUD, policy management, generic Audit logs, or
broad identity-provider administration.

The hub SHALL NOT contain the child modules' full tables, search interfaces,
forms, or record actions. Administration children SHALL use the normal focused
page layout without a persistent left-side navigation rail and SHALL provide a
stable translated link back to the Administration hub.

#### Scenario: Authorized user opens the Administration hub

- **WHEN** a CL Admin opens `/administration`
- **THEN** the hub exposes translated `Users and access`, `Invitations`, and fixed `Role reference` tasks
- **AND** Users and access links to `/users`, invitation creation links to `/users/invite`, and the role reference links to `/roles`
- **AND** pending invitation records remain available through `/users` and their canonical workspace Access destinations
- **AND** each task is one responsive GC Design System card with one linked title, one concise description, and one focused destination
- **AND** the hub does not expose `/departments`, `/tiers`, `/policies`, `/audit-logs`, or generic provider-administration destinations

#### Scenario: Administration children retain a parent path

- **WHEN** an authorized user opens a retained Administration child route
- **THEN** the page identifies Administration as its parent area
- **AND** hierarchy breadcrumbs link to `/administration` when the page type uses breadcrumbs
- **AND** a visible translated parent link returns to `/administration` without relying on browser history
- **AND** the page does not render a persistent Administration side-navigation rail

#### Scenario: Administration children use a focused responsive layout

- **WHEN** an authorized user opens a retained Administration child route on desktop, mobile, or a zoomed viewport
- **THEN** the focused child content uses the normal page container without a reserved left-navigation column
- **AND** the page preserves logical keyboard order, visible focus, and reflow without clipped content or horizontal scrolling

#### Scenario: Administration hub stays focused on task selection

- **WHEN** a CL Admin opens `/administration`
- **THEN** the page uses one H1, short task descriptions, and links to focused access, invitation, and role-reference modules
- **AND** empty functional groups are omitted and cards follow a logical source and keyboard order
- **AND** it does not embed user tables, invitation lists or forms, role-assignment controls, catalog forms, audit results, or provider payloads

#### Scenario: Unavailable Administration remains undiscoverable

- **WHEN** the current authorization context does not permit any retained Administration destination
- **THEN** Home and the shared header omit the Administration link
- **AND** direct route requests continue through the canonical authorization boundary
- **AND** the response does not disclose a retired or unauthorized module

### Requirement: Operational overviews remain separate from task hubs and focused work

The portal SHALL keep authorized operational dashboard routes as stable
navigation anchors while keeping task selection, forms, record mutation, and
detailed results on the focused pages that own them. A retained dashboard MAY
be sparse or empty, but it SHALL describe its current scope honestly and SHALL
NOT render unsupported metrics, generic onboarding lifecycle widgets, internal
review notes, or dead destinations.

#### Scenario: Onboarding oversight remains the cross-workspace dashboard

- **WHEN** a CL Admin opens `/onboarding-oversight`
- **THEN** the route remains the role-aware cross-workspace dashboard anchor
- **AND** it may link to Workspaces, Users and access, Invitations, and explicit Production-review work that the user is authorized to open
- **AND** it presents a localized useful empty state when no Production-review work exists
- **AND** it does not imply that generic onboarding analytics, lifecycle queues, internal notes, or aggregate reports are available

#### Scenario: Home and Administration remain task hubs

- **WHEN** an admitted user opens `/` or a CL Admin opens `/administration`
- **THEN** the page provides orientation and authorized task branching rather than embedded operational metrics or child workflows
- **AND** a sparse authorized task area remains a valid anchor when its retained destinations are accurately represented

#### Scenario: Partner overview remains separate from internal oversight

- **WHEN** a partner user opens a selected workspace, Application, or RP-configuration overview
- **THEN** the page presents only authorized context and task destinations for that workspace-owned resource
- **AND** it does not expose cross-workspace identity data, invitation records, Production-review outcome controls, or retired internal review and aggregate-report content

### Requirement: Reports uses a dedicated role-aware task hub

The portal SHALL provide `/reports` as the authenticated task hub for
discovering authorized Application and RP-configuration MAU/usage reports.
Reports SHALL appear in the shared primary navigation and authenticated Home
only when the user has the canonical MAU-report capability. The hub SHALL use
responsive single-destination GC Design System cards and SHALL NOT act as an
operational dashboard or embed report results.

The retained shell is an anchor for future separately approved report
families, but it SHALL advertise only MAU/usage behavior that currently exists.

#### Scenario: Authorized reporting user discovers Reports

- **WHEN** the current canonical authorization context permits MAU/usage reporting
- **THEN** authenticated Home and the shared top navigation expose a translated Reports destination
- **AND** selecting that destination opens `/reports`
- **AND** the route remains available with an honest empty state when the user has report capability but no currently accessible RP configuration

#### Scenario: Reports hub groups available report families

- **WHEN** an authorized reporting user opens `/reports`
- **THEN** the page uses one Reports H1 and exposes only the Application usage report family and its authorized chooser
- **AND** the task uses one GC Design System card with one linked title, one concise scope description, and one focused destination
- **AND** onboarding, invitation-conversion, secret-hygiene, selected-workspace aggregate, cross-workspace aggregate, and other unapproved report families are absent

#### Scenario: Reports remains a task-selection surface

- **WHEN** an authorized user opens `/reports`
- **THEN** the hub helps the user choose an Application/RP-configuration usage destination
- **AND** it does not embed report filters, result tables, exports, charts, summary metrics, review queues, or data-changing controls
- **AND** the focused MAU page continues to own its permitted filters, metrics, chart, and scoped export

#### Scenario: Reports card groups remain accessible and responsive

- **WHEN** the Reports hub is used with keyboard navigation, assistive technology, a small screen, or a zoomed viewport
- **THEN** task content has a logical heading hierarchy and source order
- **AND** cards and empty states reflow without clipped content or horizontal scrolling
- **AND** each card exposes one clear accessible destination and contains no nested interactive controls

#### Scenario: User without report access cannot discover or open Reports

- **WHEN** the canonical authorization context does not permit MAU/usage reporting
- **THEN** authenticated Home and the shared menu omit Reports
- **AND** a direct request to `/reports` fails through the standard safe authorization behavior
- **AND** the response does not reveal report types, workspaces, Applications, RP configurations, or scope identifiers

