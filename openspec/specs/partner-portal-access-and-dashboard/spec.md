# partner-portal-access-and-dashboard

## Purpose
Define authenticated admission, first-time onboarding, the service Home,
server-owned authorization context, grouped global navigation, and dedicated
operational and task pages that lead users into authorized Partner workspaces,
Applications, and RP configurations.
## Requirements
### Requirement: Authenticated session is required for protected portal routes
The system SHALL authenticate users through OIDC and maintain a server-backed session for protected portal routes and APIs.

#### Scenario: Unauthenticated user requests a protected route
- **WHEN** a user without an authenticated session requests a protected portal route
- **THEN** the portal redirects the user into the login flow instead of rendering protected content

#### Scenario: Authenticated session unlocks protected content
- **WHEN** a user completes sign-in successfully
- **THEN** the portal resumes the user in an authenticated session and allows access to authorized protected routes

### Requirement: Terms acceptance is required before authenticated portal use
The system SHALL require a signed-in user who has not accepted the current terms to complete the terms flow before using authenticated product routes outside onboarding flows.

#### Scenario: User without accepted terms opens an authenticated route
- **WHEN** a signed-in user with no `acceptedTermsAt` value opens an authenticated product route outside onboarding flows
- **THEN** the portal redirects the user to `/accept-terms` and preserves the intended authenticated destination

### Requirement: First-time users complete department setup before normal portal use

The system SHALL require a signed-in user without a department assignment and
without an active canonical partner assignment or matching pending invitation
to complete department setup before accessing protected product routes outside
the profile onboarding flow.

A matching pending invitation SHALL take precedence over department setup only
for the invitation acceptance route. After acceptance, the canonical partner
workspace assignment SHALL provide the partner context and the user SHALL NOT
be redirected to self-service department setup. Terms acceptance and normal
authentication requirements remain applicable.

#### Scenario: User without department signs in

- **WHEN** a signed-in user has no department assignment, active canonical partner assignment, or matching pending invitation and requests a protected route outside onboarding flows
- **THEN** the user is redirected to /profile/setup before using current-user application or administrator routes

#### Scenario: Matching pending invitation precedes department setup

- **WHEN** a signed-in user without a department assignment matches a currently pending invitation
- **THEN** the portal permits only the invitation acceptance path before department setup
- **AND** other protected product routes remain unavailable until acceptance succeeds

#### Scenario: Canonical partner access does not require personal department setup

- **WHEN** a signed-in user without a personal department assignment has an active canonical partner workspace assignment
- **THEN** the portal uses the assigned workspace as partner context
- **AND** it does not redirect the user to /profile/setup

### Requirement: Shared authenticated navigation exposes current user context

The authenticated app shell SHALL expose the signed-in user's display name and
compact active workspace or role context when that context changes the
available tasks. It SHALL provide `Account` at `/account` as a focused
authenticated destination for permitted safe identity, organization, and
canonical access summaries. The account disclosure SHALL contain only
supported navigation or session items and SHALL NOT use raw mixed content that
breaks the top-navigation keyboard model.

The shell SHALL organize primary destinations into the recorded task-area
hierarchy, SHALL use a direct link for a standalone destination, SHALL use a
navigation group only for a coherent second level of at least two available
destinations, SHALL derive visibility from canonical server-owned
authorization context, and SHALL keep account/session controls separate from
task navigation.

Any disclosure SHALL keep one stable visible trigger label, expose its state
programmatically, and dismiss predictably without leaving a stale panel or
Close control. The standard mobile root Menu/Close trigger remains distinct
from a nested disclosure.

#### Scenario: Authenticated user opens the shared shell

- **WHEN** an authenticated user opens a protected route
- **THEN** the shared user navigation exposes the user's display name and applicable compact active workspace or role context without leaving the current page
- **AND** `Account` links to `/account` for the permitted detailed organization or canonical access summary
- **AND** detailed context is not inserted as unsupported raw mixed content inside a top-navigation group

#### Scenario: Authenticated user opens the focused Account route

- **WHEN** an authenticated user follows `Account` or directly requests `/account`
- **THEN** the page revalidates the current server-owned session and shows only permitted safe identity, organization, and canonical access summaries
- **AND** it provides bilingual route metadata, one H1, `Home` as the parent path, and the equivalent official-language destination
- **AND** it does not expose provider subjects, raw claims, policy subjects, internal identifiers, permission dumps, or secrets

#### Scenario: Unauthenticated user requests Account

- **WHEN** an unauthenticated user directly requests `/account`
- **THEN** the portal applies the normal protected-route admission and intended-destination behavior
- **AND** it does not render account context before authentication succeeds

#### Scenario: Protected shell uses fresh server-owned session and authorization context

- **WHEN** a user enters a protected route or the portal must resolve protected navigation
- **THEN** the frontend revalidates the current user through the FastAPI backend-for-frontend before rendering protected content
- **AND** a stale query cache, Zustand projection, hidden link, or client-authored role value does not grant route or API access
- **AND** the backend independently enforces current capability and resource scope for every protected request

#### Scenario: Authenticated user sees the recorded primary hierarchy

- **WHEN** an admitted authenticated user opens a protected route
- **THEN** the primary navigation includes a direct `Home` link to `/`
- **AND** it includes a direct authorized `Partner workspaces` link to `/workspaces` while that is the only Partner work destination
- **AND** it includes direct `Reports`, `Onboarding oversight`, and `Administration` parent-area links only when each is available to that user
- **AND** it does not expose `Your applications`, individual Applications, RP configurations, or every child module as separate first-level items

#### Scenario: Direct navigation destinations remain links

- **WHEN** an authenticated primary-navigation item has exactly one destination
- **THEN** the item is a real link with that destination rather than a disclosure trigger
- **AND** activating it once navigates without requiring a second choice
- **AND** normal link behavior remains available and the item does not open or toggle a neighbouring disclosure

#### Scenario: A navigation group represents a real second level

- **WHEN** the information hierarchy provides fewer than two authorized coherent child destinations for a proposed group
- **THEN** the shell uses a direct link for the remaining destination or omits the empty task area
- **AND** it does not retain a group only to decorate or categorize one link

#### Scenario: Empty or unauthorized task areas are omitted

- **WHEN** capability filtering leaves a navigation group with no available child destination
- **THEN** the shell omits the empty group
- **AND** unavailable Administration, oversight, Reports, Partner work, and child-route labels are not disclosed
- **AND** backend and route authorization remain authoritative for direct requests

#### Scenario: Account and Support controls stay outside primary task navigation

- **WHEN** an authenticated user opens the shared shell
- **THEN** the stable account trigger provides the current-user entry and sign out remains a supported account/session item
- **AND** Support is reachable from footer or utility navigation
- **AND** neither account controls nor Support are mixed into the primary task-area hierarchy

#### Scenario: Navigation identifies the current parent area

- **WHEN** an authenticated user opens a route under `/workspaces`, `/reports`, `/onboarding-oversight`, or an Administration child family
- **THEN** the shell identifies the corresponding Partner workspaces, Reports, Onboarding oversight, or Administration parent area
- **AND** the current state does not rely on colour alone

#### Scenario: Grouped navigation works with keyboard and responsive layouts

- **WHEN** a user operates authenticated navigation with a keyboard, narrow viewport, intermediate viewport, or 200 percent zoom
- **THEN** every available group, link, account control, and language control remains reachable in a predictable order
- **AND** focus remains visible
- **AND** no task depends on hover-only interaction or delayed pointer behavior
- **AND** labels and controls reflow without clipping or inaccessible horizontal task-navigation scrolling

#### Scenario: Navigation disclosure follows user activation

- **WHEN** a user activates an available navigation disclosure with pointer, keyboard, or assistive technology
- **THEN** the first activation opens it and a subsequent activation closes it
- **AND** opening another disclosure closes the first
- **AND** the visible trigger label remains stable while the chevron and programmatic expanded state reflect the current state
- **AND** application rerendering or the active child route does not force a disclosure open again after the user closes it
- **AND** the GC Design System component retains its supported focus, keyboard, role, accessible-name, and state behavior

#### Scenario: Escape dismisses a navigation disclosure

- **WHEN** focus is within an open navigation disclosure and the user presses Escape
- **THEN** the disclosure closes immediately
- **AND** focus returns to the disclosure trigger
- **AND** no stale delayed-close operation reopens or retoggles it

#### Scenario: Navigation and outside activation dismiss open state

- **WHEN** a user selects a destination, completes a route or language transition, signs out, activates outside navigation, or changes responsive presentation
- **THEN** the corresponding open disclosure or root navigation closes as part of that interaction
- **AND** its prior expanded state does not remain visible or block content or focus on the destination

#### Scenario: Responsive menu state does not leave a stale close control

- **WHEN** the mobile root navigation or a nested disclosure changes between open and closed states at a narrow, intermediate, desktop, or 200-percent-zoom layout
- **THEN** `Close` is visible only while the corresponding root panel is actually open
- **AND** a nested group does not replace its stable label with a verbose application-authored Close sentence
- **AND** dismissal or a responsive-mode change removes stale panel, overlay, expanded, and Close state without a timing-dependent lingering control

#### Scenario: Navigation has English and French parity

- **WHEN** a user changes language from an authenticated route
- **THEN** the header language control opens the equivalent route in the other official language while preserving safe route parameters and context
- **AND** visible labels, accessible names, active-state text, menu state text, breadcrumbs, and recovery links have equivalent English and French content
- **AND** no second language control appears in page content

### Requirement: Post-authentication navigation applies mandatory routing precedence

The portal SHALL choose the default authenticated destination only after
applying authentication, terms acceptance, eligible tokenized invitation
acceptance, applicable profile or department setup, and canonical
authorization requirements. A sanitized intended in-app destination that
remains authorized SHALL take precedence over the default Home route.

#### Scenario: Terms acceptance precedes other authenticated destinations

- **WHEN** a signed-in user has not accepted the current terms
- **THEN** the portal routes the user to `/accept-terms` before invitation acceptance, profile setup, an intended product route, Home, or access denial
- **AND** it preserves only a safe in-app intended destination for reevaluation after terms acceptance

#### Scenario: Valid invitation route precedes applicable profile setup

- **WHEN** a signed-in user arrives through a valid tokenized invitation route that matches the authenticated identity
- **AND** current invitation requirements allow acceptance
- **THEN** the portal permits that invitation-acceptance route before applicable profile or department setup
- **AND** it reevaluates canonical access after acceptance succeeds

#### Scenario: Pending invitations are not selected implicitly

- **WHEN** an authenticated user did not arrive through a valid tokenized invitation route
- **THEN** the portal does not automatically select one pending invitation as the post-login destination
- **AND** it continues through the applicable profile, authorization, intended-destination, Home, or no-access rules

#### Scenario: Applicable profile setup precedes normal product routing

- **WHEN** terms and any eligible invitation route are complete
- **AND** the canonical access requirements require profile or department setup
- **THEN** the portal routes the user to `/profile/setup` before a normal product destination or Home
- **AND** it reevaluates authenticated routing after setup succeeds

#### Scenario: Safe authorized intended destination is resumed

- **WHEN** all applicable prerequisite flows are complete
- **AND** a sanitized intended in-app destination remains authorized under the current server-owned context
- **THEN** the portal resumes that destination instead of forcing the user to Home

#### Scenario: Intended destination carries no authority or unsafe target

- **WHEN** the portal preserves or reevaluates an intended destination
- **THEN** it accepts only an allowlisted relative in-app route and the safe parameters required by that route
- **AND** it rejects external URLs, executable schemes, stale or unauthorized resource targets, and client-supplied role or capability context
- **AND** it does not copy OIDC tokens, authorization payloads, personal information, or invitation tokens into generic browser storage, analytics, or diagnostic logs

#### Scenario: Home is the default after admission

- **WHEN** all applicable prerequisite flows are complete
- **AND** the user has at least one authorized product task area
- **AND** no safe authorized intended destination remains
- **THEN** the portal routes the user to `/`

#### Scenario: User without usable product access is denied safely

- **WHEN** all applicable prerequisite flows are complete
- **AND** the canonical authorization context exposes no usable product task area
- **THEN** the portal routes the user to `/access-denied` instead of rendering an empty authenticated Home or guessing a destination

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

### Requirement: Reports uses a dedicated role-aware task hub

The portal SHALL provide `/reports` as the authenticated task hub for
discovering report families available through the current canonical
authorization context. Reports SHALL appear in the shared primary navigation
and authenticated Home only when the user can access at least one report
family. The hub SHALL group report-family destinations as responsive
single-destination GC Design System cards and SHALL NOT act as an operational
dashboard or embed report results.

#### Scenario: Authorized reporting user discovers Reports

- **WHEN** the current canonical authorization context permits at least one cross-workspace, workspace, or application usage report
- **THEN** authenticated Home and the shared top navigation expose a translated Reports destination
- **AND** selecting that destination opens `/reports`

#### Scenario: Reports hub groups available report families

- **WHEN** an authorized reporting user opens `/reports`
- **THEN** the page uses one Reports H1 and groups only available report families under clear translated Platform reporting or Partner reporting headings
- **AND** each family uses one GC Design System card with one linked title, one concise scope description, and one focused destination
- **AND** empty groups and unavailable report families are omitted

#### Scenario: Reports remains a task-selection surface

- **WHEN** an authorized user opens `/reports`
- **THEN** the hub helps the user choose a report family and scope-selection path
- **AND** it does not embed report filters, result tables, exports, charts, summary metrics, review queues, or data-changing controls

#### Scenario: Reports card groups remain accessible and responsive

- **WHEN** the Reports hub is used with keyboard navigation, assistive technology, a small screen, or a zoomed viewport
- **THEN** task groups have a logical heading hierarchy and source order
- **AND** cards reflow to a single column without clipped content or horizontal scrolling
- **AND** each card exposes one clear accessible destination and contains no nested interactive controls

#### Scenario: User without report access cannot discover or open Reports

- **WHEN** the canonical authorization context permits no report family
- **THEN** authenticated Home and the shared menu omit Reports
- **AND** a direct request to `/reports` fails through the standard safe authorization behavior
- **AND** the response does not reveal report types, workspaces, applications, or scope identifiers

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
