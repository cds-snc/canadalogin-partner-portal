# Partner Portal External Developer Invitations And Scoped Access Guidance

## ADDED Requirements

### Requirement: Role-boundary guidance explains collaboration models
The portal SHALL provide user-facing guidance that explains the difference between workspace membership, workspace-admin responsibilities, workspace-member visibility, and invited-developer RP-application scope.

#### Scenario: Collaboration guidance distinguishes workspace membership from platform-admin invitation access
- **WHEN** a platform-admin user prepares invited-developer access or a workspace admin adds a workspace member
- **THEN** the portal provides guidance that explains which actions require workspace membership, which bootstrap invited-developer access remains managed by `CL Admin` users, and which ongoing staff invitations an `RP Admin` user may handle without being allowed to assign another `RP Admin`

#### Scenario: Invited developer reviews scope guidance
- **WHEN** an invited developer accesses current-user RP application screens
- **THEN** the portal provides guidance confirming that invitation access is limited to the invited RP application and does not grant workspace membership
