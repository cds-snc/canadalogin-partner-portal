# Delta for partner portal RP application experience

## MODIFIED Requirements

### Requirement: Existing RP configuration responsibilities remain on focused owners

Replacing old workspace RP detail and current-user pages SHALL NOT silently
remove a permitted task. Registration view/edit/resume and lifecycle actions
SHALL move to Configuration or its focused flows; Usage and credentials SHALL
use canonical child routes; workspace role access and invitations SHALL remain
under Workspace Access; Application details, contacts, readiness, and review
SHALL remain under the Application; and bounded RP audit SHALL use a focused
audit/report route rather than another primary card.

`Copy configuration` SHALL be a secondary lifecycle action for one selected
RP configuration. It SHALL open a focused copy form, SHALL NOT execute from a
task-hub card or table row without review of its explicit target fields, and
SHALL NOT be labelled or presented as Promote, Progress, deployment, approval,
or movement to a derived next environment. Requesting Production review SHALL
remain a separate focused action for the selected Production configuration.

#### Scenario: Existing detail actions are inventoried before removal

- **WHEN** implementation replaces an existing RP detail page
- **THEN** every visible action and authorized deep link is mapped to its focused owner and covered by route/authorization tests
- **AND** an action without a completed safe destination retains a recorded compatibility path instead of disappearing

#### Scenario: Workspace access is not embedded in the RP configuration task hub

- **WHEN** an RP Admin needs to manage workspace roles or invitations
- **THEN** the hub links or returns to Workspace Access when context is useful
- **AND** it does not embed invitation or role-management controls as an RP-configuration feature

#### Scenario: Consequential actions remain focused and confirmed

- **WHEN** an authorized partner editor chooses to copy or delete an RP configuration
- **THEN** the action opens its focused Configuration lifecycle flow with current authorization, ancestry, dependency, input-review, and safe failure protections
- **AND** deletion retains explicit confirmation before mutation
- **AND** copy requires explicit target configuration name, Partner environment, and CanadaLogin environment before creating a new draft
- **AND** neither action executes from a task-hub card or summary link

#### Scenario: Copy configuration remains discoverable without becoming a primary task

- **WHEN** an authorized editor opens one selected RP-configuration hub
- **THEN** a quiet Configuration management section provides `Copy configuration` when the source is eligible
- **AND** the action opens the canonical focused `/copy` route
- **AND** Copy does not appear as a peer destination card beside Configuration, Usage, or Manage credentials

#### Scenario: Copy and Production review remain distinct

- **WHEN** an authorized editor copies a configuration to a Production target
- **THEN** the resulting draft is not presented as promoted, submitted for review, approved, launched, or deployed
- **AND** any later `Request Production review` action identifies that selected target and follows its own readiness and authorization contract

#### Scenario: Legacy progression link resolves without mutation

- **WHEN** an authorized user follows a saved progression browser link for one in-scope configuration during the compatibility period
- **THEN** the portal redirects to the equivalent focused Copy configuration form
- **AND** the redirect creates no target or review request
- **AND** a missing, revoked, parent-mismatched, or out-of-scope source uses the same safe unavailable result

#### Scenario: Partner-visible configuration cannot be orphaned

- **WHEN** a caller attempts to unlink an RP configuration from its Application without an atomic authorized reparent, archive, or delete operation defined by a future contract
- **THEN** the portal rejects the operation and preserves the current hierarchy
- **AND** no partner-visible configuration is left without its workspace-owned Application parent
