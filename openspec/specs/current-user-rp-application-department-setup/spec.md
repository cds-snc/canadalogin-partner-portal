# current-user-rp-application-department-setup

## Purpose
Define workspace-inherited Department behavior for Applications and RP
configurations, including the retained current-user department-setup
compatibility flow and workspace-role-aware access.
## Requirements
### Requirement: Workspace Department is authoritative for RP configuration context

Every partner-visible Application and RP configuration SHALL derive its
effective Department from its owning Partner workspace. The portal SHALL NOT
require a user to assign a second Department to one RP configuration or use a
child-level Department value to change workspace, Application, authorization,
reporting, or review scope.

Existing RP Department data MAY remain as a compatibility shadow during
migration. It SHALL be reconciled to the workspace value before the legacy
field or adapter is retired.

#### Scenario: New RP configuration derives Department from its workspace

- **WHEN** an authorized editor creates an RP configuration under an Application
- **THEN** its effective Department is the Department of the owning workspace
- **AND** configuration Basics does not present a Department picker or create a separate Department assignment

#### Scenario: Existing configuration reads inherited Department

- **WHEN** an authorized user opens Configuration, Usage, credentials, or another scoped child for a migrated RP configuration
- **THEN** the backend resolves Department through the owning workspace after authorization
- **AND** a compatibility response may project that value without making the child field authoritative

#### Scenario: Conflicting legacy Department fails reconciliation

- **WHEN** migration finds an RP Department value different from its owning workspace Department
- **THEN** the reconciliation reports the mismatch and does not silently change workspace scope
- **AND** canonical cutover does not use the conflicting child value for authorization or disclosure

#### Scenario: Provider candidate has no partner Department before adoption

- **WHEN** a retained provider candidate has no Partner workspace or Application
- **THEN** it remains outside partner configuration routes and has no effective Partner workspace Department
- **AND** adoption derives Department only after CL Admin selects the authorized workspace and Application

### Requirement: Legacy RP Department setup retires through authorized compatibility

The portal SHALL remove the forced
`/your-applications/$rpApplicationUuid/department-setup` product flow after
workspace Department inheritance and caller migration are complete. A saved
legacy setup path SHALL verify current workspace, Application, configuration,
and role scope before redirecting to the canonical RP-configuration hub or the
original intended nested destination.

Existing accessible Department preflight and assignment APIs SHALL remain
deprecated compatibility adapters in this change. The GET SHALL project the
authorized workspace Department. The PATCH SHALL return an idempotent success
only when its requested Department matches the workspace Department and SHALL
return a stable conflict otherwise. Neither SHALL override the workspace
Department, grant access, call IBM Verify, or reveal a missing versus out-of-
scope RP record. Their later removal requires separately recorded caller and
compatibility evidence.

#### Scenario: Legacy setup link resolves without an assignment form

- **WHEN** an RP Admin or RP User (Edit) follows a saved legacy Department-setup link for an in-scope migrated RP configuration
- **THEN** the portal resolves the owning workspace and Application through current server authorization
- **AND** it redirects to the canonical configuration hub or safely preserved intended child
- **AND** it does not show a forced picker, write a child Department, or display a success toast for assignment

#### Scenario: Read Only is not offered Department mutation

- **WHEN** a Read Only user opens an in-scope migrated RP configuration or a legacy setup link
- **THEN** the configuration uses inherited workspace Department context where permitted
- **AND** no Department-assignment form, mutation control, or write endpoint is offered

#### Scenario: Missing or out-of-scope legacy setup link fails safely

- **WHEN** a user follows a legacy setup path for a missing, revoked, mismatched, or out-of-scope RP configuration
- **THEN** the portal returns the standard safe unavailable result
- **AND** it does not reveal the resource, its owning workspace, Application, Department, or role

#### Scenario: Protected child no longer depends on child Department assignment

- **WHEN** an authorized user opens portal-owned Configuration or scoped Usage after workspace Department cutover
- **THEN** the backend authorizes the complete workspace/Application/configuration hierarchy and uses the workspace Department
- **AND** null legacy `rp_application.department_id` does not redirect to a current-user setup page or block an otherwise valid request

#### Scenario: Compatibility adapter cannot change workspace ownership

- **WHEN** a remaining legacy assignment caller supplies a Department different from the owning workspace Department
- **THEN** the backend rejects the request without changing the RP configuration or workspace
- **AND** the response and audit behavior remain safe and contain no broader Department data
