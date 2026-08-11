# Partner Portal Access And Dashboard

## ADDED Requirements

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
