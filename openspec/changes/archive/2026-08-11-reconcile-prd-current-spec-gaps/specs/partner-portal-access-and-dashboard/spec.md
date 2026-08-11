# Partner Portal Access And Dashboard

## ADDED Requirements

### Requirement: Dashboard summarizes the current user's portal context
The dashboard SHALL display the signed-in user's profile context and the resources the user can currently access.

#### Scenario: Dashboard displays current user details
- **WHEN** an authenticated user opens the dashboard
- **THEN** the page displays the current user's basic profile details, department, and assigned roles

#### Scenario: Dashboard lists accessible workspaces and RP applications
- **WHEN** an authenticated user opens the dashboard
- **THEN** the page lists the workspaces and RP applications available to that user, including RP applications made available through invited-developer access
