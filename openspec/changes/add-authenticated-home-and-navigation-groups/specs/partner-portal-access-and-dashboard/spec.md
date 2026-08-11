# Delta for authenticated home and grouped navigation

## MODIFIED Requirements

### Requirement: Shared authenticated navigation exposes current user context
The authenticated app shell SHALL expose the signed-in user's name and, when available, department and role context in the shared user navigation group, and SHALL organize primary authenticated destinations into clear task-area groups instead of one flat list of all available links.

#### Scenario: Authenticated user opens the shared shell
- **WHEN** an authenticated user opens a protected route
- **THEN** the shared user navigation exposes the user's display name and available organization or role context without leaving the current page

#### Scenario: Authenticated user sees grouped primary navigation
- **WHEN** an authenticated user opens a protected route
- **THEN** the shared navigation includes `Home`
- **AND** the shared navigation groups primary destinations by function, such as partner tasks, oversight, platform administration, and support, based on what that user is authorized to access
- **AND** the shared navigation does not present every authorized top-level route as one undifferentiated list

#### Scenario: Unauthorized task areas stay hidden from grouped navigation
- **WHEN** an authenticated user lacks authorization for an administrative or oversight route family
- **THEN** the shared navigation omits that task area and its route labels for that user

### Requirement: Current-user RP applications page lists available RP applications
The portal SHALL provide a current-user RP applications page at `/your-applications` that lists RP applications available to the signed-in user as a dedicated task destination reachable from authenticated Home and shared navigation.

#### Scenario: User opens the current-user RP applications page
- **WHEN** an authenticated user opens `/your-applications`
- **THEN** the page displays a list of available RP applications and links each application to `/your-applications/$rpApplicationUuid`

#### Scenario: User has no available RP applications
- **WHEN** an authenticated user opens `/your-applications` and no RP applications are available in current-user scope
- **THEN** the page displays an empty-state message instead of application cards

### Requirement: Authenticated Home provides a task-oriented service entry page at `/`
The portal SHALL use `/` as the authenticated service home after sign-in and SHALL present high-level links to the main content areas available to the signed-in user.

#### Scenario: Authenticated user lands on Home after sign-in
- **WHEN** a user completes sign-in successfully
- **THEN** the portal resumes the user in an authenticated session and routes the user to `/` as the signed-in Home page

#### Scenario: Home links the user to available primary task areas
- **WHEN** an authenticated user opens `/`
- **THEN** the page identifies the portal purpose in one H1
- **AND** the page presents short descriptions and links for the main task areas available to that user
- **AND** those links include `/your-applications` and other authorized task areas such as `/workspaces`, `/onboarding-oversight`, platform administration routes, or `/support` when available to that user

#### Scenario: Home stays an orientation surface
- **WHEN** an authenticated user opens `/`
- **THEN** the page helps the user choose a task area
- **AND** the page does not embed full administration tables, review backlogs, or large record lists that belong on dedicated destination routes

### Requirement: Dashboard summary remains on dedicated task pages instead of replacing Home
The portal SHALL keep task-specific summary content on the routes that own those tasks and SHALL NOT require `/your-applications` to continue acting as the generic authenticated landing page.

#### Scenario: RP application page remains reachable from Home
- **WHEN** an authenticated user needs to review accessible RP applications
- **THEN** the user can reach `/your-applications` from Home or shared navigation without relying on a forced post-login redirect

#### Scenario: Dedicated oversight routes remain separate from Home
- **WHEN** a `CL Admin` user needs cross-workspace onboarding review or reporting
- **THEN** the user reaches those tasks through the dedicated onboarding oversight route family rather than through embedded Home content
