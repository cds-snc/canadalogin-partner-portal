# Delta for authenticated Home, task hubs, and grouped navigation

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
- **AND** it includes a `Partner work` group containing the authorized `Your applications` and `Workspaces` destinations
- **AND** it includes direct `Onboarding oversight` and `Administration` parent-area links only when each is available to that user
- **AND** it does not expose every child module as a separate first-level item

#### Scenario: Empty or unauthorized task areas are omitted

- **WHEN** capability filtering leaves a navigation group with no available child destination
- **THEN** the shell omits the empty group
- **AND** unavailable Administration, oversight, partner, and child-route labels are not disclosed
- **AND** backend and route authorization remain authoritative for direct requests

#### Scenario: Account and Support controls stay outside primary task navigation

- **WHEN** an authenticated user opens the shared shell
- **THEN** current-user context and sign out remain in the user navigation group
- **AND** Support is reachable from footer or utility navigation
- **AND** neither account controls nor Support are mixed into the primary task-area hierarchy

#### Scenario: Navigation identifies the current parent area

- **WHEN** an authenticated user opens a route under `/your-applications`, `/workspaces`, `/onboarding-oversight`, or an Administration child family
- **THEN** the shell identifies the corresponding Partner work, Onboarding oversight, or Administration parent area
- **AND** the current state does not rely on colour alone

#### Scenario: Grouped navigation works with keyboard and responsive layouts

- **WHEN** a user operates authenticated navigation with a keyboard, narrow viewport, or 200 percent zoom
- **THEN** every available group, link, account control, and language control remains reachable in a predictable order
- **AND** focus remains visible
- **AND** no task depends on hover-only interaction
- **AND** labels and controls reflow without clipping or inaccessible horizontal task-navigation scrolling

#### Scenario: Navigation has English and French parity

- **WHEN** a user changes language from an authenticated route
- **THEN** the header language control opens the equivalent route in the other official language while preserving safe route parameters and context
- **AND** visible labels, accessible names, active-state text, breadcrumbs, and recovery links have equivalent English and French content
- **AND** no second language control appears in page content

## ADDED Requirements

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
operational dashboard or all-in-one work page.

#### Scenario: Admitted authenticated user opens Home

- **WHEN** an admitted authenticated user opens `/`
- **THEN** the page identifies the Partner Portal purpose in one H1
- **AND** it presents short descriptions and links for only the task areas available to that user
- **AND** an available Partner work section links directly to the authorized `/your-applications` and `/workspaces` destinations because Partner work is a navigation group rather than a route
- **AND** available Onboarding oversight and Administration sections link to `/onboarding-oversight` and `/administration` respectively

#### Scenario: Home remains a task-selection surface

- **WHEN** an authenticated user opens `/`
- **THEN** the page helps the user choose a task area
- **AND** it does not embed review queues, full reports, large record lists, administration tables, or data-changing forms

#### Scenario: Unauthenticated root remains the public Home

- **WHEN** a user without an authenticated session opens `/`
- **THEN** the portal renders the public service introduction and sign-in path instead of authenticated task links or protected context

### Requirement: Current-user RP applications page provides a partner operational overview

The portal SHALL provide `/your-applications` as a dedicated operational
overview of RP applications and workspace context available to the signed-in
user. The overview SHALL support status scanning and resuming work without
acting as the generic portal Home or embedding unrelated workflows.

#### Scenario: User opens the current-user RP applications overview

- **WHEN** an authorized partner user opens `/your-applications`
- **THEN** the page lists RP applications available in current-user scope
- **AND** each application links to `/your-applications/$rpApplicationUuid`
- **AND** available lifecycle or status context and a relevant resume-task link are shown when returned by the canonical data source

#### Scenario: Invitation-backed applications appear after access is canonical

- **WHEN** invitation-backed RP applications are included in the user's canonical accessible-application scope
- **THEN** `/your-applications` presents those applications in the same overview as other accessible applications
- **AND** it does not imply broader workspace access than the authorization context provides

#### Scenario: Overview links accessible workspaces using meaningful labels

- **WHEN** one or more workspaces are available in current-user scope
- **THEN** the overview presents compact workspace navigation using workspace names rather than raw UUIDs as the primary labels
- **AND** each link routes through the Workspaces task area

#### Scenario: User has no available RP applications

- **WHEN** an authorized partner user opens `/your-applications` and no RP applications are available in current-user scope
- **THEN** the page displays an actionable application empty state instead of application cards, tables, or misleading status

#### Scenario: User has no accessible workspaces

- **WHEN** an authorized user opens `/your-applications` and no workspaces are available in current-user scope
- **THEN** the page displays a workspace empty state instead of administrative controls or internal identifiers

#### Scenario: Partner overview keeps full workflows on focused routes

- **WHEN** an authorized user opens `/your-applications`
- **THEN** the overview uses links to focused routes for configuration, credentials, invitations, reports, create or edit work, and other consequential actions
- **AND** it does not embed those forms, cross-workspace oversight, or platform administration workflows

#### Scenario: Partner overview handles asynchronous states

- **WHEN** application or workspace summary data is loading, partially unavailable, fails, or becomes unauthorized
- **THEN** the affected section shows a scoped loading, partial, error, or unauthorized state with a safe retry or return action
- **AND** an unavailable section does not replace valid content from another section with misleading data

#### Scenario: Partner overview data remains server scoped

- **WHEN** `/your-applications` requests application or workspace summaries
- **THEN** each backend request applies the current session, canonical authorization, and resource scope before returning data
- **AND** the browser does not receive a wider dataset and reduce it through client-side filtering
- **AND** safe failures do not disclose secret fields, out-of-scope identifiers, policy internals, or raw authorization payloads

### Requirement: Administration uses a dedicated task hub

The portal SHALL provide `/administration` as the authorized parent task hub
for platform governance modules. The hub SHALL expose focused destination links
and SHALL NOT contain the modules' full tables, search interfaces, forms, or
record actions.

#### Scenario: Authorized user opens the Administration hub

- **WHEN** a user whose canonical authorization context permits platform administration opens `/administration`
- **THEN** the hub presents the available Users and access, Departments, Tiers, Audit logs, and fixed Role reference tasks
- **AND** the destinations use `/users`, `/departments`, `/tiers`, `/audit-logs`, and `/roles` respectively
- **AND** `/policies` is not presented as an independent administration destination

#### Scenario: Administration children retain a parent path

- **WHEN** an authorized user opens an Administration child route
- **THEN** the page identifies Administration as its parent area
- **AND** side navigation or breadcrumbs provide a path to `/administration`
- **AND** browser history is not the only return mechanism

#### Scenario: Administration hub stays focused on task selection

- **WHEN** an authorized user opens `/administration`
- **THEN** the page uses one H1, short task descriptions, and links to focused modules
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

- **WHEN** a partner user opens `/your-applications`
- **THEN** the page presents only authorized partner operational context
- **AND** it does not expose cross-workspace internal queue, filter, report, or review controls

## REMOVED Requirements

### Requirement: Current-user applications landing page lists available RP applications

**Reason**: `/your-applications` remains the current-user RP application list,
but it no longer owns the generic authenticated landing-page responsibility.

**Migration**: Use `Current-user RP applications page provides a partner
operational overview`. The list, detail-link, empty-state, and
invitation-backed-access behaviors remain testable while Home becomes the
default admitted entry route.

### Requirement: Dashboard provides a minimal read-only portal summary at `/your-applications`

**Reason**: Cross-service orientation moves to authenticated Home, while
`/your-applications` becomes a focused partner operational overview.

**Migration**: Application links, invitation-backed applications, workspace
links, no-application and no-workspace states, and the no-inline-workflow rule
move to `Current-user RP applications page provides a partner operational
overview`. The duplicated name/email profile card is intentionally retired from
page content because safe user and active-context summary belongs in the shared
shell. Home and the workspace task area own broader orientation.

### Requirement: Dashboard stays separate from partner administration and CL Admin oversight

**Reason**: `/your-applications` is no longer the generic dashboard or signed-in
landing surface, so separation is expressed across explicit page roles.

**Migration**: Use `Operational overviews remain separate from task hubs and
focused work`, `Administration uses a dedicated task hub`, and `Current-user RP
applications page provides a partner operational overview`. The original
no-inline-write and dedicated-oversight behaviors remain testable.
