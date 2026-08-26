# Delta for partner portal access and dashboard

## MODIFIED Requirements

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
