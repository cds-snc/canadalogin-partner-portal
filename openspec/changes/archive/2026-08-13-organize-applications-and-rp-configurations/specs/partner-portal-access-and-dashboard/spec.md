# Delta for partner-portal-access-and-dashboard

## ADDED Requirements

### Requirement: Retired Your applications entry does not create a duplicate product experience

The portal SHALL remove `Your applications` from authenticated Home and shared
primary navigation. During the recorded compatibility period,
`/your-applications` SHALL redirect to `/workspaces` after normal admission
checks and SHALL NOT load or render the retired cross-workspace RP list.

Saved record-specific paths MAY remain as server-authorized redirects only as
defined by the RP-configuration compatibility requirement. The root redirect
SHALL NOT grant workspace access, reveal a broader application set, or keep a
second list or dashboard alive.

#### Scenario: User follows the retired overview link

- **WHEN** an admitted authenticated user requests `/your-applications`
- **THEN** the portal replace-redirects to `/workspaces`
- **AND** it does not load or render the retired current-user RP application overview
- **AND** the Workspaces page applies current server-owned authorization before listing Partner workspaces

#### Scenario: Retired overview is no longer discoverable

- **WHEN** an admitted user opens authenticated Home or the shared primary navigation
- **THEN** neither surface presents `Your applications`
- **AND** the available Partner work destination is `Partner workspaces` at `/workspaces`

#### Scenario: Redirect does not preserve revoked authority

- **WHEN** a user's former workspace grant has been revoked and the user follows `/your-applications`
- **THEN** the destination lists only independently authorized current workspaces
- **AND** the redirect does not expose former Application or RP-configuration labels, identifiers, or status

## MODIFIED Requirements

### Requirement: Shared authenticated navigation exposes current user context

The authenticated app shell SHALL expose the signed-in user's name and, when
available, safe organization and active role or access context in the shared
user navigation group. The shell SHALL organize primary destinations into the
recorded task-area hierarchy, SHALL derive visibility from the canonical
server-owned authorization context, and SHALL keep account/session controls
separate from task navigation.

#### Scenario: Authenticated user opens the shared shell

- **WHEN** an authenticated user opens a protected route
- **THEN** the shared user navigation exposes the user's display name and available organization or role context without leaving the current page

#### Scenario: Protected shell uses fresh server-owned session and authorization context

- **WHEN** a user enters a protected route or the portal must resolve protected navigation
- **THEN** the frontend revalidates the current user through the FastAPI backend-for-frontend before rendering protected content
- **AND** a stale query cache, Zustand projection, hidden link, or client-authored role value does not grant route or API access
- **AND** the backend independently enforces current capability and resource scope for every protected request

#### Scenario: Authenticated user sees the recorded primary hierarchy

- **WHEN** an admitted authenticated user opens a protected route
- **THEN** the primary navigation includes a direct `Home` link to `/`
- **AND** it includes a `Partner work` group containing only the authorized `Partner workspaces` destination at `/workspaces`
- **AND** it includes direct `Reports`, `Onboarding oversight`, and `Administration` parent-area links only when each is available to that user
- **AND** it does not expose `Your applications`, individual Applications, RP configurations, or every child module as separate first-level items

#### Scenario: Empty or unauthorized task areas are omitted

- **WHEN** capability filtering leaves a navigation group with no available child destination
- **THEN** the shell omits the empty group
- **AND** unavailable Administration, oversight, Reports, Partner work, and child-route labels are not disclosed
- **AND** backend and route authorization remain authoritative for direct requests

#### Scenario: Account and Support controls stay outside primary task navigation

- **WHEN** an authenticated user opens the shared shell
- **THEN** current-user context and sign out remain in the user navigation group
- **AND** Support is reachable from footer or utility navigation
- **AND** neither account controls nor Support are mixed into the primary task-area hierarchy

#### Scenario: Navigation identifies the current parent area

- **WHEN** an authenticated user opens a route under `/workspaces`, `/reports`, `/onboarding-oversight`, or an Administration child family
- **THEN** the shell identifies the corresponding Partner work, Reports, Onboarding oversight, or Administration parent area
- **AND** the current state does not rely on colour alone

#### Scenario: Grouped navigation works with keyboard and responsive layouts

- **WHEN** a user operates authenticated navigation with a keyboard, narrow viewport, or 200 percent zoom
- **THEN** every available group, link, account control, and language control remains reachable in a predictable order
- **AND** focus remains visible
- **AND** no task depends on hover-only interaction
- **AND** labels and controls reflow without clipping or inaccessible horizontal task-navigation scrolling

#### Scenario: Navigation disclosure follows user activation

- **WHEN** a user activates an available navigation group with pointer, keyboard, or assistive technology
- **THEN** the first activation opens the disclosure and a subsequent activation closes it
- **AND** application rerendering or the active child route does not force a disclosure open again after the user closes it
- **AND** the GC Design System component retains its supported focus, keyboard, and accessible-state behavior

#### Scenario: Navigation has English and French parity

- **WHEN** a user changes language from an authenticated route
- **THEN** the header language control opens the equivalent route in the other official language while preserving safe route parameters and context
- **AND** visible labels, accessible names, active-state text, breadcrumbs, and recovery links have equivalent English and French content
- **AND** no second language control appears in page content

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
- **AND** an available Partner work section links to `/workspaces` and does not link to `/your-applications`
- **AND** available Reports, Onboarding oversight, and Administration sections link to `/reports`, `/onboarding-oversight`, and `/administration` respectively

#### Scenario: Home card groups remain accessible and responsive

- **WHEN** authenticated Home is used with keyboard navigation, assistive technology, a small screen, or a zoomed viewport
- **THEN** task groups have a logical heading hierarchy and source order
- **AND** cards reflow to a single column without clipped content or horizontal scrolling
- **AND** no card contains nested interactive controls, multiple destinations, forms, tables, or decorative metrics

#### Scenario: Home remains a task-selection surface

- **WHEN** an authenticated user opens `/`
- **THEN** the page helps the user choose a task area
- **AND** it does not embed review queues, full reports, large record lists, administration tables, or data-changing forms
- **AND** it does not expose a global or context-free RP-configuration creation wizard; creation begins only after a workspace and Application are selected

#### Scenario: Unauthenticated root remains the public Home

- **WHEN** a user without an authenticated session opens `/`
- **THEN** the portal renders the public service introduction and sign-in path instead of authenticated task cards or protected context

### Requirement: Operational overviews remain separate from task hubs and focused work

The portal SHALL use dashboards only for authenticated operational monitoring
or resume-work needs and SHALL keep task selection, queues, reports, forms, and
administration work on the page types and routes that own them.

#### Scenario: Onboarding oversight remains the cross-workspace dashboard

- **WHEN** an authorized internal user needs to monitor or triage onboarding across workspaces
- **THEN** `/onboarding-oversight` remains the PAT-021 operational dashboard
- **AND** full queue and cross-workspace reporting work remains on focused child routes

#### Scenario: Home and Administration remain task hubs

- **WHEN** an admitted user opens `/` or an authorized user opens `/administration`
- **THEN** the page provides orientation and task branching rather than operational dashboard widgets or embedded child workflows

#### Scenario: Partner overview remains separate from internal oversight

- **WHEN** a partner user opens a selected workspace, Application, or RP-configuration overview
- **THEN** the page presents only authorized context and task destinations for that workspace-owned resource
- **AND** it does not expose cross-workspace internal queue, filter, report, or review-note controls

## REMOVED Requirements

### Requirement: Current-user RP applications page provides a partner operational overview

**Reason**: `/your-applications` duplicates the same workspace-owned records
and status semantics that now belong under Partner workspace, Application, and
RP-configuration pages. It does not own a separate entity or authorization
model.

**Migration**: Remove the page from Home and shared navigation, redirect its
root to `/workspaces`, retain bounded authorized record-specific redirects,
and keep the accessible summary API only while Reports or compatibility
callers still need it.
