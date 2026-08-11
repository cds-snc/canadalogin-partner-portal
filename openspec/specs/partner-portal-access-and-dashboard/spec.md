# partner-portal-access-and-dashboard

## Purpose
Define the current authentication, first-time onboarding, and current-user application landing experience for the partner portal.
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
The system SHALL require a signed-in user without a department assignment to complete department setup before accessing protected product routes outside the profile onboarding flow.

#### Scenario: User without department signs in
- **WHEN** a signed-in user has no department assignment and requests a protected route outside onboarding flows
- **THEN** the user is redirected to `/profile/setup` before using current-user application or administrator routes

### Requirement: Shared authenticated navigation exposes current user context
The authenticated app shell SHALL expose the signed-in user's name and, when available, department and role context in the shared user navigation group.

#### Scenario: Authenticated user opens the shared shell
- **WHEN** an authenticated user opens a protected route
- **THEN** the shared user navigation exposes the user's display name and available organization or role context without leaving the current page

### Requirement: Current-user applications landing page lists available RP applications
The portal SHALL provide a current-user landing page at `/your-applications` that lists RP applications available to the signed-in user.

#### Scenario: User opens the current-user applications landing page
- **WHEN** an authenticated user opens `/your-applications`
- **THEN** the page displays a list of available RP applications and links each application to `/your-applications/$rpApplicationUuid`

#### Scenario: User has no available RP applications
- **WHEN** an authenticated user opens `/your-applications` and no RP applications are available in current-user scope
- **THEN** the page displays an empty-state message instead of application cards

### Requirement: Dashboard provides a minimal read-only portal summary at `/your-applications`
The portal SHALL use `/your-applications` as a current-user dashboard that presents a minimal read-only summary of the signed-in user's portal context and accessible resources.

#### Scenario: Dashboard shows current user context
- **WHEN** an authenticated user opens `/your-applications`
- **THEN** the page shows the current user's name and email
- **AND** the page shows the department and current role context available to that user in the authenticated shell

#### Scenario: Dashboard lists accessible workspaces as read-only navigation
- **WHEN** an authenticated user opens `/your-applications` and one or more workspaces are available in current-user scope
- **THEN** the page lists those workspaces as read-only summary links
- **AND** the page does not embed workspace member-management or workspace settings controls

#### Scenario: Dashboard handles no accessible workspaces
- **WHEN** an authenticated user opens `/your-applications` and no workspaces are available in current-user scope
- **THEN** the page shows a workspace empty-state message instead of administrative actions

#### Scenario: Dashboard preserves current-user RP application links
- **WHEN** an authenticated user opens `/your-applications`
- **THEN** the page lists RP applications available in current-user scope and links each application to `/your-applications/$rpApplicationUuid`

#### Scenario: Dashboard includes invited RP applications when they are in current-user scope
- **WHEN** invitation-backed access is available for one or more RP applications and those applications are exposed in current-user scope
- **THEN** the dashboard includes those RP applications in the current-user application list without granting workspace membership

### Requirement: Dashboard stays separate from partner administration and CL Admin oversight
The `/your-applications` dashboard SHALL remain a read-only orientation surface and SHALL NOT combine current-user summary with embedded administration, review, or reporting workflows.

#### Scenario: Dashboard uses navigation instead of inline write flows
- **WHEN** an authenticated user opens `/your-applications`
- **THEN** the page provides links to dedicated workspace or RP-application routes for deeper tasks
- **AND** the page does not embed create, edit, invite, review, or report forms

#### Scenario: CL Admin oversight remains on dedicated routes
- **WHEN** a `CL Admin` user needs cross-workspace onboarding review or reporting
- **THEN** the dashboard does not replace those dedicated oversight routes
- **AND** the user reaches queue or reporting tasks through the separate onboarding oversight route family

