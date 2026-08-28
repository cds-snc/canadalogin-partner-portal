# Delta for partner-portal-role-management

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
| CL Admin | Platform governance; partner bootstrap; initial RP Admin assignment; cross-workspace Application metadata, oversight, internal review, and aggregate reporting | RP secret values; client credentials; secret lifecycle; partner-side Application or RP-configuration editing |
| RP Admin | Workspace metadata; Applications and contacts; RP configurations; partner secrets; MAU, aggregate reporting, and bounded partner audit events; invite RP User (Edit) and Read Only | Assign RP Admin; platform governance; cross-workspace oversight; production approve/reject |
| RP User (Edit) | Read/edit Applications, contacts, RP configurations, and promotion-request metadata; secret workflows; CATS-related fields; MAU, aggregate reporting, and bounded partner audit events | Invitations; role assignment; platform governance; cross-workspace oversight; production approve/reject |
| Read Only | Partner and Application metadata; contacts; RP configuration; MAU; aggregate reporting; bounded partner audit events with sensitive fields redacted | Mutations; invitations; role assignment; secret values; secret lifecycle; platform governance; internal review notes or internal audit events |

Every child-resource decision SHALL validate its Partner workspace,
Application, and RP-configuration ancestry as applicable. A child UUID or a
client-provided parent identifier SHALL NOT widen the workspace role.

#### Scenario: CL Admin performs global administration without secret access

- **WHEN** a CL Admin uses platform governance, partner bootstrap, oversight, review, or aggregate reporting
- **THEN** the portal permits the applicable global operation
- **AND** the same CL Admin cannot retrieve an RP secret value or perform an RP secret lifecycle action

#### Scenario: RP Admin manages one partner workspace

- **WHEN** an RP Admin performs a partner administration, Application, contact, RP-configuration, secret, reporting, or permitted staff-invitation action in the assigned workspace
- **THEN** the portal permits the action within that workspace after validating complete resource ancestry
- **AND** the RP Admin cannot assign RP Admin or use platform or cross-workspace oversight operations

#### Scenario: RP User Edit changes partner configuration without invitation authority

- **WHEN** an RP User (Edit) changes a permitted Application, contact, RP configuration, promotion-request metadata, secret, or CATS-related field in the assigned workspace
- **THEN** the portal permits the action after validating complete resource ancestry
- **AND** the user cannot manage invitations, roles, or production review outcomes

#### Scenario: Read Only sees permitted data without mutation or secrets

- **WHEN** a Read Only user opens permitted partner metadata, Application details, contacts, RP configuration, MAU, or aggregate reports in the assigned workspace
- **THEN** the portal returns the permitted read-only information
- **AND** the user cannot mutate the workspace or its children, retrieve or change an RP secret, or read internal review notes

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

### Requirement: Authenticated clients receive a safe scope-aware authorization context

The backend SHALL return a scope-aware authorization context for the
authenticated user and grant-accessible Partner workspace resources. The
context SHALL use canonical machine keys and public workspace identifiers and
SHALL contain enough information for role-appropriate route, navigation,
label, and action rendering. Resource responses MAY include public Application
and RP-configuration UUIDs needed for an already authorized nested route, but
SHALL NOT turn them into independent client-held grants.

The response SHALL NOT expose internal integer IDs, raw role IDs, Casbin policy
subjects, raw OIDC claims, `isSuperuser`, authorization rules, or a broader
cross-workspace resource set for client-side filtering. Client rendering SHALL
NOT replace backend authorization.

#### Scenario: CL Admin receives global authorization context

- **WHEN** an authenticated CL Admin requests the current-user session
- **THEN** the backend returns `cl_admin` as the active global role
- **AND** the response contains no partner grant or superuser label

#### Scenario: Partner user receives role and workspace scope

- **WHEN** an authenticated partner user requests the current-user session or an in-scope Application or RP configuration
- **THEN** the backend returns the canonical partner role and public workspace UUID for each active partner scope and only the authorized resource context needed by that request
- **AND** the frontend can render the permitted task and role label without inferring access from a Boolean or child identifier

#### Scenario: Missing or invalid authorization context fails closed

- **WHEN** an authenticated identity has no active canonical assignment and no matching pending invitation path
- **THEN** protected product access is denied
- **AND** the client does not infer access from Department metadata, Application or configuration identifiers, group claims, role IDs, or stale session values

#### Scenario: Pending invitation permits only the acceptance path

- **WHEN** an authenticated identity has no active role but matches an active pending invitation
- **THEN** the portal permits the invitation acceptance flow
- **AND** other protected product routes remain unavailable until acceptance creates an active partner assignment
