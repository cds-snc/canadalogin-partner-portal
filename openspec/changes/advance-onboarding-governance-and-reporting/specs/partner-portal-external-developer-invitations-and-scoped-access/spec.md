## ADDED Requirements

### Requirement: Role-boundary guidance explains collaboration models
The portal SHALL provide user-facing guidance that explains the difference between workspace membership, workspace-admin responsibilities, workspace-member visibility, and invited-developer RP-application scope.

#### Scenario: Workspace admin reviews collaboration guidance
- **WHEN** a workspace admin prepares to invite an external developer or add a workspace member
- **THEN** the portal provides guidance that explains which actions require workspace membership and which remain limited to app-scoped invited-developer access

#### Scenario: Invited developer reviews scope guidance
- **WHEN** an invited developer accesses current-user RP application screens
- **THEN** the portal provides guidance confirming that invitation access is limited to the invited RP application and does not grant workspace membership