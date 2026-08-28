# Delta for partner portal role management

## ADDED Requirements

### Requirement: Portal authorization uses exactly four canonical product roles

The portal SHALL support exactly four product authorization roles for this
phase: CL Admin, RP Admin, RP User (Edit), and Read Only. The corresponding
stable machine keys SHALL be cl_admin, rp_admin, rp_user_edit, and read_only.
Product UI, APIs, audit records, help content, and tests SHALL NOT present
is_superuser, admin, application owners, workspace_admin, workspace_member, or
an arbitrary role name as a product authorization role.

Canonical role definitions SHALL be immutable system reference data. The portal
SHALL NOT expose create, rename, or delete operations for role definitions.
Canonical capability mappings, scope rules, and policy subjects SHALL also be
immutable system-owned configuration; no role-management operation SHALL add a
permission or direct-user fallback outside this specification.

#### Scenario: Role reference contains only canonical roles

- **WHEN** an authorized user or client requests the supported product role reference
- **THEN** the portal returns only CL Admin, RP Admin, RP User (Edit), and Read Only with their stable machine keys
- **AND** the response does not include superuser, legacy group, workspace membership, or arbitrary role labels

#### Scenario: Unknown role fails closed

- **WHEN** persisted data, a request, a policy, or a session contains an unknown or legacy role value after cutover
- **THEN** the portal does not grant access from that value
- **AND** the unknown value is not presented as an active product role

#### Scenario: Canonical role definitions cannot be mutated

- **WHEN** a CL Admin uses role administration
- **THEN** the portal permits supported assignment and revocation operations
- **AND** the portal does not permit creation, renaming, or deletion of the four canonical role definitions

#### Scenario: Canonical role permissions cannot be mutated

- **WHEN** a CL Admin requests a capability-mapping, scope-rule, or direct-user policy-subject change
- **THEN** the portal rejects the request
- **AND** the fixed four-role permission matrix remains authoritative

### Requirement: Canonical roles have fixed scope and permission boundaries

CL Admin SHALL be a global internal role. RP Admin, RP User (Edit), and Read
Only SHALL each be scoped to one partner workspace and SHALL apply to every RP
application in that workspace. A user MAY hold partner roles in more than one
workspace but SHALL hold at most one active partner role in each workspace. A
CL Admin account SHALL NOT concurrently hold an active partner role.

The portal SHALL enforce this permission matrix:

| Role | Allowed capability families | Explicitly denied |
|---|---|---|
| CL Admin | Platform governance; partner bootstrap; initial RP Admin assignment; cross-workspace metadata, oversight, review, and aggregate reporting | RP secret values; client credentials; secret lifecycle; partner-side configuration editing |
| RP Admin | Workspace metadata; application information; RP configuration; partner secrets; MAU, aggregate reporting, and bounded partner audit events; invite RP User (Edit) and Read Only | Assign RP Admin; platform governance; cross-workspace oversight; production approve/reject |
| RP User (Edit) | Read/edit partner configuration and promotion-request metadata; secret workflows; CATS-related fields; MAU, aggregate reporting, and bounded partner audit events | Invitations; role assignment; platform governance; cross-workspace oversight; production approve/reject |
| Read Only | Partner metadata; OAuth configuration; MAU; aggregate reporting; bounded partner audit events with sensitive fields redacted | Mutations; invitations; role assignment; secret values; secret lifecycle; platform governance; internal audit events |

#### Scenario: CL Admin performs global administration without secret access

- **WHEN** a CL Admin uses platform governance, partner bootstrap, oversight, review, or aggregate reporting
- **THEN** the portal permits the applicable global operation
- **AND** the same CL Admin cannot retrieve an RP secret value or perform an RP secret lifecycle action

#### Scenario: RP Admin manages one partner workspace

- **WHEN** an RP Admin performs a partner administration, configuration, secret, reporting, or permitted staff-invitation action in the assigned workspace
- **THEN** the portal permits the action within that workspace
- **AND** the RP Admin cannot assign RP Admin or use platform or cross-workspace oversight operations

#### Scenario: RP User Edit changes partner configuration without invitation authority

- **WHEN** an RP User (Edit) changes permitted RP configuration, promotion-request metadata, a permitted secret, or a CATS-related field in the assigned workspace
- **THEN** the portal permits the action
- **AND** the user cannot manage invitations, roles, or production review outcomes

#### Scenario: Read Only sees permitted data without mutation or secrets

- **WHEN** a Read Only user opens permitted partner metadata, OAuth configuration, MAU, or aggregate reports in the assigned workspace
- **THEN** the portal returns the permitted read-only information
- **AND** the user cannot mutate the workspace or retrieve or change an RP secret

#### Scenario: Partner role applies across its assigned workspace

- **WHEN** a partner user requests a permitted grant-accessible RP application operation for any RP application in the assigned workspace
- **THEN** the portal evaluates the request using that workspace-scoped partner role
- **AND** no separate RP-application-specific role assignment is required

#### Scenario: Partner role does not cross workspace scope

- **WHEN** a partner user requests a protected resource in a workspace without an active partner assignment
- **THEN** the portal denies the operation through the applicable safe unavailable response
- **AND** the portal does not reveal protected resource details from the other workspace

#### Scenario: One user has different roles in different workspaces

- **WHEN** a user holds RP User (Edit) in one workspace and Read Only in another
- **THEN** the portal applies the matching role independently in each workspace
- **AND** permissions from one workspace do not expand the other workspace role

#### Scenario: CL Admin and partner assignments cannot be combined

- **WHEN** an assignment operation would leave one user with both CL Admin and an active partner role
- **THEN** the portal rejects the conflicting assignment
- **AND** the existing valid assignments remain unchanged until an authorized actor resolves the conflict explicitly

### Requirement: Role-assignment authority follows the canonical delegation matrix

CL Admin SHALL assign and revoke CL Admin without revoking the last active CL
Admin. Only CL Admin SHALL assign, replace, or revoke RP Admin. CL Admin MAY
support assignment, replacement, or revocation of a partner role in any
workspace. RP Admin SHALL manage only RP User (Edit) and Read Only in the RP
Admin's own workspace. RP User (Edit) and Read Only SHALL NOT mutate roles.

Invitation acceptance SHALL NOT be used to change an existing active role.
Self-revocation and concurrent operations SHALL use the same authority,
cardinality, and last-CL-Admin rules as other assignment operations.

#### Scenario: CL Admin manages RP Admin assignment

- **WHEN** a CL Admin assigns, replaces, or revokes RP Admin for an existing workspace
- **THEN** the portal performs the authorized change atomically
- **AND** no partner role can perform the same RP Admin mutation

#### Scenario: RP Admin manages only lower partner roles in the same workspace

- **WHEN** an RP Admin assigns, replaces, or revokes RP User (Edit) or Read Only in the assigned workspace
- **THEN** the portal permits the operation within that workspace
- **AND** the RP Admin cannot manage RP Admin or a role in another workspace

#### Scenario: Existing role cannot be changed through invitation acceptance

- **WHEN** an identity already has an active role in a workspace and presents another invitation for that workspace
- **THEN** the portal rejects acceptance without changing either role
- **AND** an authorized actor must use the explicit role-replacement operation

#### Scenario: Unauthorized actor cannot mutate a role

- **WHEN** RP User (Edit), Read Only, or an out-of-scope RP Admin attempts an assignment, replacement, or revocation
- **THEN** the portal denies the operation through the safe error contract
- **AND** the active assignments remain unchanged

### Requirement: Role assignments preserve integrity, lifecycle, and audit history

Global and partner role assignments SHALL be server-owned records with
referential integrity and constrained active or revoked lifecycle states. The
portal SHALL enforce one active global role assignment per user/role and one
active partner role per user/workspace. Assignment, replacement, and revocation
SHALL retain actor, target, role, workspace when applicable, timestamp, and
prior-role context needed for audit.

Revocation or replacement SHALL stop granting access no later than the user's
next protected request. Revoked and historical records SHALL NOT authorize and
SHALL remain available to authorized audit workflows until their retention and
disposition rule permits removal.

#### Scenario: Initial bootstrap creates CL Admin without a superuser role

- **WHEN** the explicitly invoked initial administration bootstrap runs with safe configured identity data
- **THEN** the portal creates an active CL Admin assignment through the canonical assignment model
- **AND** it does not create or expose a superuser product role or permanent runtime bypass

#### Scenario: CL Admin assigns another CL Admin

- **WHEN** an active CL Admin assigns CL Admin to an eligible user with no active partner grant
- **THEN** the portal creates one active canonical global assignment
- **AND** the assignment audit record identifies the actor, target, role, time, and outcome

#### Scenario: Last active CL Admin cannot be revoked

- **WHEN** an authorized actor attempts to revoke the final active CL Admin assignment
- **THEN** the portal rejects the operation
- **AND** at least one active CL Admin remains available

#### Scenario: Partner role replacement is atomic

- **WHEN** an authorized actor changes a user's partner role in one workspace
- **THEN** the portal revokes the prior assignment and activates the replacement as one transaction
- **AND** the user never receives additive permissions from both roles in that workspace

#### Scenario: Revocation affects an existing session

- **WHEN** an active role assignment is revoked while the user has an authenticated session
- **THEN** the next protected request resolves the current server-owned assignment state
- **AND** the revoked role no longer authorizes the request

#### Scenario: Deleted or historical records do not authorize

- **WHEN** role or assignment history is inactive, revoked, deleted, malformed, or unknown
- **THEN** authorization resolution ignores that history
- **AND** administration and audit reads continue to distinguish active access from retained history

#### Scenario: Concurrent assignment changes preserve invariants

- **WHEN** assignment, replacement, or revocation requests race for the same user, workspace, or CL Admin roster
- **THEN** the portal serializes the applicable transaction boundary
- **AND** the result cannot contain both CL Admin and partner access, two active roles in one workspace, or zero active CL Admins

#### Scenario: Mixed legacy state fails closed

- **WHEN** authorization resolution detects a user with both an active CL Admin assignment and an active partner grant
- **THEN** the portal grants neither state until an authorized reconciliation resolves the conflict
- **AND** the conflict is recorded without exposing secret or token material

### Requirement: Authenticated clients receive a safe scope-aware authorization context

The backend SHALL return a scope-aware authorization context for the
authenticated user and grant-accessible RP application resources. The context SHALL
use canonical machine keys and public workspace identifiers and SHALL contain
enough information for role-appropriate route, navigation, label, and action
rendering.

The response SHALL NOT expose internal integer IDs, raw role IDs, Casbin policy
subjects, raw OIDC claims, isSuperuser, or authorization rules. Client rendering
SHALL NOT replace backend authorization.

#### Scenario: CL Admin receives global authorization context

- **WHEN** an authenticated CL Admin requests the current-user session
- **THEN** the backend returns cl_admin as the active global role
- **AND** the response contains no partner grant or superuser label

#### Scenario: Partner user receives role and workspace scope

- **WHEN** an authenticated partner user requests the current-user session or an in-scope grant-accessible RP application
- **THEN** the backend returns the canonical partner role and public workspace UUID for each active partner scope
- **AND** the frontend can render the permitted task and role label without inferring access from a Boolean

#### Scenario: Missing or invalid authorization context fails closed

- **WHEN** an authenticated identity has no active canonical assignment and no matching pending invitation path
- **THEN** protected product access is denied
- **AND** the client does not infer access from department metadata, group claims, role IDs, or stale session values

#### Scenario: Pending invitation permits only the acceptance path

- **WHEN** an authenticated identity has no active role but matches an active pending invitation
- **THEN** the portal permits the invitation acceptance flow
- **AND** other protected product routes remain unavailable until acceptance creates an active partner assignment

### Requirement: Local development provides deterministic canonical-role personas

When explicitly enabled in a local developer context, the portal SHALL provide
backend-owned fake personas for CL Admin, RP Admin, RP User (Edit), Read Only,
and no access. The personas SHALL use the same backend session shape,
authorization resolver, workspace checks, and protected routes as the selected
real identity path.

The local persona endpoint and selector SHALL accept only allowlisted fixture
identifiers and SHALL be unavailable whenever environment, authentication mode,
and explicit selector configuration do not all indicate local development.
The enabling values SHALL be ENVIRONMENT=local, AUTH_MODE=local_dev, and
ENABLE_DEV_ROLE_SELECTOR=true. A separate guarded seed SHALL use stable UUIDv5
identifiers and reserved `local.example` identities, SHALL be idempotent, and
SHALL fail
non-zero on partial creation.

#### Scenario: Developer selects each canonical persona

- **WHEN** local role simulation is explicitly enabled and a developer selects an allowlisted persona
- **THEN** the backend creates the matching fake session with the canonical role and workspace scope
- **AND** the shared shell visibly identifies the session as simulated

#### Scenario: Local personas prove allowed and denied paths

- **WHEN** the developer exercises partner workspace Alpha and an unrelated workspace Beta with the canonical personas
- **THEN** each persona receives only its permission-matrix actions in Alpha
- **AND** cross-scope, secret, mutation, invitation, oversight, and no-role failures remain enforced by the backend

#### Scenario: Arbitrary client role is ignored

- **WHEN** a client submits an unknown fixture identifier or an arbitrary role value
- **THEN** the backend rejects the request
- **AND** no session or authorization assignment is created from client-controlled role data

#### Scenario: Persona selector is unavailable outside local development

- **WHEN** the application runs in a shared, test-deployment, staging, or production configuration
- **THEN** the local persona route, endpoint, and fixtures are unavailable
- **AND** inconsistent configuration fails closed instead of enabling a development identity substitute

#### Scenario: Local persona seed is deterministic and isolated

- **WHEN** the guarded local persona seed runs twice under the required local configuration
- **THEN** it produces the same allowlisted fake identities and scopes without duplicates
- **AND** the same command fails before mutation in every non-local configuration

## MODIFIED Requirements

### Requirement: MVP2 authorization uses locally managed roles instead of the OIDC `application owners` group

After OIDC authentication establishes the user's identity, the portal SHALL
authorize protected product access from active canonical server-owned
assignments. OIDC group claims, the legacy application owners role, historical
owner-email snapshots, arbitrary reusable roles, workspace membership role
values, raw role IDs, direct user policy subjects, and is_superuser SHALL NOT
create or alter canonical authorization after cutover.

#### Scenario: Local role assignments are not overwritten on sign-in

- GIVEN an existing user has active canonical assignments
- WHEN the user signs in through OIDC
- THEN the portal preserves those server-owned assignments for authorization
- AND the sign-in flow does not replace them from upstream group claims

#### Scenario: Upstream `application owners` membership does not grant portal access by itself in MVP2

- GIVEN a user has no active canonical role assignment
- WHEN the user signs in with an upstream application owners group claim
- THEN the portal does not grant protected product access from that claim
- AND the portal does not backfill a partner grant from historical owner data

#### Scenario: Locally managed roles allow access without upstream `application owners` membership

- GIVEN an existing user has an active canonical role assignment
- WHEN the user signs in without the upstream application owners group claim
- THEN the portal evaluates authorization from the server-owned assignment
- AND the absence of the upstream group claim does not block access by itself

#### Scenario: Superuser flag does not independently grant access

- GIVEN a legacy user record has is_superuser enabled but no active CL Admin assignment
- WHEN that user requests a protected product operation after cutover
- THEN the portal does not authorize the operation from is_superuser
- AND legacy state cannot promote that identity to CL Admin

#### Scenario: Legacy identities receive no CL Admin backfill

- **WHEN** migration encounters a legacy admin, reusable-role, is_superuser, workspace_admin, or workspace_member identity
- **THEN** the migration creates no CL Admin or partner assignment for that identity
- **AND** any later partner access requires an explicit canonical role-management action in an established workspace
- **AND** the initial CL Admin comes only from the explicit canonical bootstrap path

## REMOVED Requirements

### Requirement: Platform administrators manage reusable portal roles

**Reason**: Arbitrary role creation, renaming, and deletion conflicts with the
fixed four-role product model and makes policy identity mutable.

**Migration**: Seed immutable canonical reference data, reject every legacy
admin/is_superuser/reusable-role candidate from CL Admin backfill, establish the
initial CL Admin only through the explicit canonical bootstrap path, and remove
role-definition create/update/delete operations. Legacy identities receive no
automatic partner access; any later access comes only from canonical workspace
role management. Arbitrary roles and application-owner data receive no access
mapping.

### Requirement: Platform administrators manage user role assignments

**Reason**: The additive JSON-backed reusable-role behavior is replaced by
scope-aware canonical assignment lifecycle requirements with referential
integrity and deterministic cardinality.

**Migration**: Backfill no legacy CL Admin or workspace assignment. Establish
the initial CL Admin through the explicit bootstrap path, preserve audit
history, and switch administration to canonical assignment/revocation
operations for all go-forward access.

### Requirement: Workspace membership roles stay distinct from platform roles

**Reason**: workspace_admin and workspace_member would remain a second,
conflicting product authorization vocabulary.

**Migration**: Preserve valid explicit canonical partner grants. Report
workspace_admin and workspace_member rows but create no canonical access from
them; all remain quarantined without canonical authorization. After
verification proves they contribute no access, retire workspace membership role
values as authorization inputs. Establish later access only through canonical
role management.
