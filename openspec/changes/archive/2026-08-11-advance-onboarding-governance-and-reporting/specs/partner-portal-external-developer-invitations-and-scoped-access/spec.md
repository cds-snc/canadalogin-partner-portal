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

### Requirement: Partner-scoped roles can read aggregate onboarding reports inside granted scope
The portal SHALL allow accepted `RP Admin`, `RP User (Edit)`, and `Read Only` users to read aggregate onboarding reports for their granted partner scope without granting cross-workspace oversight access.

#### Scenario: All first-release partner roles can view the same report families
- **WHEN** an accepted `RP Admin`, `RP User (Edit)`, or `Read Only` user opens the aggregate onboarding reporting route
- **THEN** the portal allows that user to view onboarding throughput, invitation conversion, and secret-rotation hygiene reports for the user's granted partner scope

#### Scenario: Partner report visibility does not grant oversight workflow access
- **WHEN** an accepted partner-side user can view aggregate onboarding reports
- **THEN** that user still cannot access cross-workspace onboarding overview, queue, or internal review-note workflows that remain reserved for internal oversight users
