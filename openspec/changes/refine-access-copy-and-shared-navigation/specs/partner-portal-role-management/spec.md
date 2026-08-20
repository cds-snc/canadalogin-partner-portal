# Delta for partner portal role management

## MODIFIED Requirements

### Requirement: Canonical roles have fixed scope and permission boundaries

CL Admin SHALL be a global internal role. RP Admin, RP User (Edit), and Read
Only SHALL each be scoped to one Partner workspace and SHALL apply to every
Application and RP configuration in that workspace. A user MAY hold partner
roles in more than one workspace but SHALL hold at most one active partner role
in each workspace. A CL Admin account SHALL NOT concurrently hold an active
partner role.

The portal SHALL enforce this permission matrix:

| Role | Allowed capability families | Explicitly denied |
|---|---|---|
| CL Admin | Platform governance; partner bootstrap; initial RP Admin assignment; cross-workspace Application metadata, oversight, internal review, Production-review outcomes, and aggregate reporting | RP secret values; client credentials; secret lifecycle; partner-side Application or RP-configuration editing or copying |
| RP Admin | Workspace metadata; Applications and contacts; RP configuration create/edit/copy; partner-owned Production-review request metadata; partner secrets; MAU, aggregate reporting, and bounded partner audit events; invite RP User (Edit) and Read Only | Assign RP Admin; platform governance; cross-workspace oversight; Production-review approve/reject |
| RP User (Edit) | Read/edit Applications and contacts; read/edit/copy RP configurations; partner-owned Production-review request metadata; secret workflows; CATS-related fields; MAU, aggregate reporting, and bounded partner audit events | Invitations; role assignment; platform governance; cross-workspace oversight; Production-review approve/reject |
| Read Only | Partner and Application metadata; contacts; RP configuration and permitted copy lineage; Production-review status; MAU; aggregate reporting; bounded partner audit events with sensitive fields redacted | Mutations; copy; review request submission; invitations; role assignment; secret values; secret lifecycle; platform governance; internal review notes or internal audit events |

Every child-resource decision SHALL validate its Partner workspace,
Application, and RP-configuration ancestry as applicable. A child UUID or a
client-provided parent identifier SHALL NOT widen the workspace role. Copying
a configuration and requesting Production review SHALL remain separate
capabilities and neither one SHALL grant a review-only outcome transition.

#### Scenario: CL Admin performs global administration without secret access

- **WHEN** a CL Admin uses platform governance, partner bootstrap, oversight, review, or aggregate reporting
- **THEN** the portal permits the applicable global operation
- **AND** the same CL Admin cannot retrieve an RP secret value, perform an RP secret lifecycle action, or edit/copy partner-owned configuration answers

#### Scenario: RP Admin manages one partner workspace

- **WHEN** an RP Admin performs a partner administration, Application, contact, RP-configuration create/edit/copy, Production-review request, secret, reporting, or permitted staff-invitation action in the assigned workspace
- **THEN** the portal permits the action within that workspace after validating complete resource ancestry
- **AND** the RP Admin cannot assign RP Admin, use platform or cross-workspace oversight operations, or record a Production-review outcome

#### Scenario: RP User Edit changes partner configuration without invitation authority

- **WHEN** an RP User (Edit) changes or copies a permitted Application or RP configuration, updates permitted contact or Production-review request metadata, or changes a permitted secret or CATS-related field in the assigned workspace
- **THEN** the portal permits the action after validating complete resource ancestry
- **AND** the user cannot manage invitations, roles, or Production-review outcomes

#### Scenario: Read Only sees permitted data without mutation or secrets

- **WHEN** a Read Only user opens permitted partner metadata, Application details, contacts, RP configuration, copy lineage, Production-review status, MAU, or aggregate reports in the assigned workspace
- **THEN** the portal returns the permitted read-only information
- **AND** the user cannot mutate or copy the workspace or its children, request Production review, retrieve or change an RP secret, or read internal review notes

#### Scenario: Partner role applies across its assigned workspace

- **WHEN** a partner user requests a permitted operation for any Application or RP configuration in the assigned workspace
- **THEN** the portal evaluates the request using that workspace-scoped partner role and complete resource ancestry
- **AND** no separate Application- or RP-configuration-specific role assignment is required

#### Scenario: Partner role does not cross workspace scope

- **WHEN** a partner user requests a protected resource in a workspace without an active partner assignment
- **THEN** the portal denies the operation through the applicable safe unavailable response
- **AND** the portal does not reveal protected workspace, Application, or RP-configuration details from the other workspace

#### Scenario: One user has different roles in different workspaces

- **WHEN** a user holds RP User (Edit) in one workspace and Read Only in another
- **THEN** the portal applies the matching role independently in each workspace
- **AND** permissions from one workspace do not expand the other workspace role

#### Scenario: CL Admin and partner assignments cannot be combined

- **WHEN** an assignment operation would leave one user with both CL Admin and an active partner role
- **THEN** the portal rejects the conflicting assignment
- **AND** the existing valid assignments remain unchanged until an authorized actor resolves the conflict explicitly
