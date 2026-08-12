# Design: Define the Four-Role Authorization Model

## Context

The current implementation stores platform role IDs in user.role_ids JSON,
uses is_superuser for several CL Admin operations, keeps workspace membership
roles in workspace_member.role, and stores partner roles in
rp_application_access_grant.role. Casbin policies use mutable role names, while
authenticated-user responses collapse partner access to a Boolean.

The target model keeps authentication and authorization separate:

- OIDC establishes a trusted local user identity and backend session.
- Server-owned assignments establish one global CL Admin role or scoped
  partner roles.
- A central backend authorization boundary resolves active assignments and
  resource scope for every protected request.
- Clients receive enough safe context to render the correct tasks, but clients
  never become the enforcement boundary.

Role assignments and grants are authorization and audit records. They require
referential integrity, deterministic lifecycle behavior, and traceable
assignment/revocation events.

## Goals

- Establish one authoritative four-role vocabulary and permission matrix.
- Remove superuser, generic-role, workspace-role, and legacy-group ambiguity.
- Normalize assignment persistence and enforce integrity in PostgreSQL.
- Make workspace scope and partner role visible in authenticated API contracts.
- Enforce least privilege, safe cross-workspace behavior, and CL Admin secret
  separation.
- Make role changes effective without requiring users to sign in again.
- Provide a deterministic, local-only persona matrix through the same backend
  session and authorization path.

## Non-Goals

- Replacing OIDC as the selected real authentication mechanism.
- Accessing a real identity provider, shared environment, or production data.
- Defining a future customizable role builder.
- Introducing RP-application-specific role slicing inside a workspace.
- Approving production migration, retention, rollback, or residual risk.

## Canonical Role And Permission Matrix

| Machine key | Display label | Scope | Allowed capability families | Explicit denials |
|---|---|---|---|---|
| cl_admin | CL Admin | Global platform | Platform governance; partner bootstrap; initial RP Admin assignment; cross-workspace metadata, oversight, review, and aggregate reporting | RP secret values; client credentials; secret lifecycle; partner configuration editing |
| rp_admin | RP Admin | One partner workspace | Workspace metadata; application information; RP configuration; partner secrets; MAU, aggregate reporting, and bounded partner audit events; invite RP User (Edit) and Read Only | Assign RP Admin; platform governance; cross-workspace oversight; production approve/reject |
| rp_user_edit | RP User (Edit) | One partner workspace | Read/edit partner configuration and promotion-request metadata; secret workflows; CATS-related fields; MAU, aggregate reporting, and bounded partner audit events | Invitations; role assignment; platform governance; cross-workspace oversight; production approve/reject |
| read_only | Read Only | One partner workspace | Partner metadata; OAuth configuration; MAU; aggregate reporting; bounded partner audit events with actor contact and sensitive payloads redacted | Mutations; invitations; role assignment; secret values; secret lifecycle; platform governance; internal audit events |

The display labels are bilingual content keys owned by the frontend content
layer. Persistence, policies, API branching, and tests use the stable machine
keys.

## Decisions

### Decision 1: Fixed role definitions replace arbitrary role CRUD

The role catalog contains immutable system definitions only. For this phase the
only global role definition is cl_admin. Partner role keys are constrained
values on workspace-scoped access grants and invitations.

The role table uses a unique role.code VARCHAR(64) value as the immutable
identity for coded system definitions. The canonical platform row uses code
cl_admin; its display name is not policy identity. Dormant uncoded legacy rows
remain nullable, quarantined, and non-authoritative in this MVP rather than
receiving invented canonical codes. A future production-cutover/disposition
change may physically retire those rows and consider a NOT NULL contract after
backup and rollback expectations are approved. Partner keys do not become rows
in the global role table.

The role administration experience may list the fixed definitions and manage
assignments, but it does not create, rename, or delete definitions. This avoids
policy identity changing when a display name changes and prevents a magic role
name from acquiring wildcard authority.

Canonical authorization policy is also immutable system-owned data. No UI or
API may add capabilities to a canonical role, create direct-user policy
subjects, or change scope rules. Any separate governance record named policy
must be explicitly non-authorization metadata; the legacy access-policy CRUD
surface is retired from CL Admin governance.

Alternative considered: keep arbitrary reusable roles and designate one as CL
Admin. Rejected because it preserves the current split between product roles,
mutable names, is_superuser, and Casbin policy subjects.

### Decision 2: Normalize global assignments in user_role

Replace user.role_ids JSON as an authorization source with a user_role
association table. The dormant JSON field remains physically present and
non-authoritative until a future production-cutover change defines its
disposition and rollback boundary.

Proposed fields:

| Field | Contract |
|---|---|
| uuid | Required globally unique public-safe assignment identifier |
| user_id | Required indexed foreign key to user with ON DELETE RESTRICT |
| role_id | Required indexed foreign key to fixed role definition with ON DELETE RESTRICT |
| status | Constrained to active or revoked |
| assignment_source | Constrained to migration, bootstrap, admin, or local_fixture |
| assigned_at | Required assignment timestamp |
| assigned_by_user_id | Actor foreign key with ON DELETE RESTRICT; nullable only for migration, bootstrap, or local_fixture source |
| revoked_at | Required when status is revoked |
| revoked_by_user_id | Actor foreign key with ON DELETE RESTRICT; required for administrative revocation |
| created_at / updated_at | Record lifecycle metadata |

Use an indexed partial unique constraint for one active assignment per
user/role plus checks that active rows have no revocation metadata and revoked
rows have revoked_at. Revocation preserves the row for audit and permits a
later new assignment. Authorization queries load only active assignments and
active fixed definitions. An idempotent backfill never reactivates an existing
revoked assignment.

Assignment operations serialize on a transaction-scoped PostgreSQL advisory
lock for the target user. CL Admin roster mutations also serialize on one
dedicated roster lock. These locks cover both the global-assignment and partner-
grant tables, so concurrent operations cannot create mixed CL Admin/partner
access or revoke the last CL Admin. The service performs each change in one
transaction and fails closed if it detects pre-existing mixed assignments.

### Decision 3: One partner access grant is the workspace authorization source

The existing RP application access-grant model becomes the canonical
workspace-scoped partner authorization record. It stores exactly one active
role per user/workspace. It does not grant a second workspace membership role.

The existing physical table name may remain during the expand/backfill phase to
limit migration risk. The domain/service/API name is partner workspace access.
A physical table rename is optional only if ADR-003 and the migration review
show that the clarity benefit outweighs deployment churn.

Required integrity:

- role is constrained to rp_admin, rp_user_edit, or read_only;
- status is constrained to active or revoked;
- one active grant exists per user/workspace;
- user_id and workspace_id remain indexed foreign keys;
- source_invitation_uuid becomes a nullable, indexed, unique foreign key to the
  invitation UUID with ON DELETE RESTRICT, so one accepted invitation cannot
  source multiple grants;
- invitation and grant records are retained rather than hard-deleted; this MVP
  intentionally implements no automated retention/disposition schedule.

Status is the positive authorization lifecycle source of truth. Active rows
cannot be soft-deleted or carry revocation timestamps; revoked rows require
revocation metadata and never authorize. Legacy `is_deleted` and `deleted_at`
fields remain defense-in-depth integrity guards that fail closed on
contradictory lifecycle state, but never create authority; their physical
disposition is deferred. The existing
invitation.delegated_by_grant_uuid field is not the reverse of source
invitation lineage: it records which active RP Admin grant authorized a
delegated invitation, while grant.source_invitation_uuid records which accepted
invitation created one resulting grant. Retain both restricted provenance
links, keep only source_invitation_uuid unique, and add or drop their
constraints in dependency order during upgrade or downgrade.

The workspace_member role column and its workspace_admin/workspace_member
values stop participating in authorization. Existing membership data is
reported but never migrated to partner grants; the legacy relation is retired
from runtime authorization after verification proves it contributes no
canonical authority. Its rows and physical storage remain preserved until a
future production-cutover/disposition change. Go-forward access is created
only through canonical role management.

### Decision 4: Assignment semantics are deterministic

- A user can have partner grants in multiple workspaces.
- A user has at most one active partner role per workspace.
- Changing a partner role atomically revokes the previous grant and activates
  the replacement; permissions are never combined inside one workspace.
- A CL Admin account cannot concurrently hold active partner grants.
- Unknown or legacy role values provide no access.
- When resolving an object, the backend checks both capability and workspace
  ownership before returning data or performing an action.
- Out-of-scope protected subresources resolve through the existing safe
  unavailable/not-found behavior where required by the current specs.

Preventing CL Admin and partner-role coexistence also guarantees the PRD rule
that CL Admin never receives RP secret values. During migration, mixed accounts
must be reported for explicit resolution rather than silently unioning access.

Assignment authority is explicit:

| Actor | Target action | Allowed scope |
|---|---|---|
| CL Admin | Assign or revoke CL Admin | Eligible users without partner grants; never revoke the last CL Admin or self-revoke when last |
| CL Admin | Invite, assign, replace, or revoke RP Admin | One existing partner workspace |
| CL Admin | Assign, replace, or revoke RP User (Edit) or Read Only | Any existing partner workspace for support/recovery |
| RP Admin | Invite, replace, or revoke RP User (Edit) or Read Only | The actor's own workspace only |
| RP Admin | Assign, replace, or revoke RP Admin | Never |
| RP User (Edit) / Read Only | Any role mutation | Never |

Invitation acceptance is not a generic role-change path. Invitation creation
for an email that already has an active grant in the workspace is rejected and
the actor is directed to the authorized assignment-replacement operation. A
pending lower-privilege invitation can therefore never silently preserve,
replace, or downgrade an active RP Admin grant. Self-revocation uses the same
authority and last-admin rules; no actor can bypass them through a direct data
or policy operation.

### Decision 5: OIDC and the session do not own authorization state

OIDC claims establish identity and account linkage only. Upstream application
owners/admin group claims, historical owner-email snapshots, direct username
subjects, numeric user subjects, raw role IDs, and is_superuser do not
independently grant product access after cutover.

The backend session retains the user identity, not a durable snapshot of
permissions. Each protected request resolves current active assignments so a
revocation takes effect on the next request without requiring a new sign-in.

The first CL Admin is bootstrapped by assigning cl_admin directly through an
idempotent, explicitly invoked seed path configured through
`INITIAL_CL_ADMIN_EMAIL`. The bootstrap path is not a fifth role and is not a
runtime bypass.

### Decision 6: Policies use stable keys plus object scope

Casbin or its replacement policy boundary uses stable machine keys, not mutable
display labels. Coarse capability checks remain centralized, while service
logic validates the workspace/resource boundary before data access.

Policy initialization is idempotent. Deprecated admin and application owners
subjects are removed only after the new policy path and migration checks pass.
No direct user subject receives a hidden fallback permission.

The Verify administration adapter uses an explicit CL Admin operation
allowlist covering required user, application, group, entitlement, login, and
audit-query administration while excluding client credentials, secret reads,
and secret lifecycle operations. The backend denies excluded operations before
calling Verify and redacts secret-bearing fields from allowed responses. New
Verify operations require an explicit matrix and contract update rather than
inheriting a broad administrator wildcard.

### Decision 7: Authenticated APIs return a safe authorization context

The authenticated-user contract exposes canonical machine keys and public
workspace UUIDs. It does not expose internal integer IDs, Casbin subjects,
policy rules, raw OIDC claims, or isSuperuser.

Illustrative CL Admin contract:

~~~json
{
  "authorizationContext": {
    "globalRole": "cl_admin",
    "partnerAccess": []
  }
}
~~~

Illustrative partner-user contract:

~~~json
{
  "authorizationContext": {
    "globalRole": null,
    "partnerAccess": [
      {
        "workspaceUuid": "00000000-0000-0000-0000-000000000000",
        "role": "rp_user_edit"
      }
    ]
  }
}
~~~

globalRole is null for partner users, and partnerAccess is empty for CL Admin.
The grant-derived `/api/v1/rp-applications/accessible` projection returns RP
applications reachable through active partner workspace grants and includes the
effective workspace UUID and partner role needed to render role-appropriate
actions. It replaces the owner-era `/api/v1/rp-applications/mine` route family.
The projection does not consult IBM application-owner membership, historical
owner-email snapshots, or an OIDC user token. Workspace-scoped APIs remain the
authoritative resource boundary; the projection only avoids client-side N+1
requests when a user has active grants in multiple workspaces.

The frontend maps machine keys to bilingual labels and route/action visibility.
Backend checks remain authoritative even when the client hides an unavailable
action.

### Decision 8: Invitation and grant lifecycle fails closed

Invitation role values use the three partner keys. Invitation status is
constrained to pending, accepted, expired, or revoked. Grant status is
constrained to active or revoked.

Valid invitation transitions are:

- pending to accepted;
- pending to expired;
- pending to revoked;
- expired or revoked to a newly issued invitation record, never back to
  pending on the same token.

Reissuing a still-pending invitation is one serialized transaction: the old
record first transitions to revoked with a replacement reason and link to the
new invitation, then exactly one new pending record is created. Concurrent
reissue attempts lock the email/workspace invitation key and can produce only
one pending result.

Acceptance checks current invitation status, token, expiry, signed-in identity,
and workspace scope before mutating a grant. Reopening an accepted or replaced
invitation is idempotent and cannot overwrite the current grant role.

Acceptance also verifies that the user has no active grant in that workspace.
If one exists, acceptance is rejected without changing either record; an
authorized actor must use the explicit atomic role-replacement operation.

At most one pending invitation exists for an email/workspace pair. The RP
application remains the invitation entry point and historical context, while
the accepted role applies to the whole workspace.

### Decision 9: Reporting follows caller scope

- CL Admin receives cross-workspace aggregate reporting and internal oversight.
- The three partner roles receive the same aggregate report families for one
  explicitly selected active workspace per request. A user with assignments in
  multiple workspaces switches scope rather than receiving a unioned report.
- Partner filters cannot expand scope.
- Partner roles do not receive internal queues, review notes, cross-workspace
  rows, record-level exports beyond their allowed scope, or any secret value.

### Decision 10: Local role simulation is an explicit identity substitute

Follow PAT-018 and PAT-025. A backend-owned local fixture allowlist creates the
same session shape used by OIDC and uses the normal authorization resolver.
The frontend selector submits only a fixture identifier, never an arbitrary
role.

The feature is enabled only when all of these exact conditions agree:

- ENVIRONMENT=local;
- AUTH_MODE=local_dev;
- ENABLE_DEV_ROLE_SELECTOR=true.

Any inconsistent, shared, test-deployment, staging, or production
configuration fails closed. Network binding is defense in depth and is not the
identity gate.

### Decision 11: Existing MVP1 RP registrations use explicit CL Admin adoption

Launch adopts existing RP registrations only after CL Admin creates the
partner workspace that will own them. The adoption workflow starts from an
existing, non-deleted local MVP1 RP record with no workspace and a stable IBM
application ID. It never bulk-creates access or infers a workspace from IBM
owner metadata.

For one selected candidate, the backend may read IBM Verify application detail
through the existing injected administration adapter. The response is reduced
to an allowlist of non-secret registration metadata. Missing local values may
be filled from that safe projection; non-empty portal-authored values remain
authoritative and any difference is shown for CL Admin follow-up rather than
silently overwritten. Client credentials, current or rotated secrets, IBM
owners, raw upstream payloads, and IBM audit history are excluded.

The final action explicitly links the retained local RP UUID and IBM
application ID to one active workspace, derives the department from that
workspace, preserves all existing portal secret-lifecycle audit history, and
records the actor and linkage decision. Concurrent or repeated adoption of the
same record is idempotent for the same workspace and fails safely for a
different workspace. The separate active change
add-cl-admin-rp-registration-adoption owns the API, UI, tests, and real-
integration readiness; the unattended mutating synchronization job remains
off outside local/test until that workflow is complete.

## Deterministic Local Persona Matrix

| Fixture ID | Role and scope | Primary proof |
|---|---|---|
| local-cl-admin | CL Admin; no partner grant | Platform governance, bootstrap, oversight, reporting, secret denial |
| local-rp-admin | RP Admin in workspace Alpha | Partner administration, secrets, staff invitation, RP Admin invitation denial |
| local-rp-user-edit | RP User (Edit) in workspace Alpha | Configuration/secret workflows, invitation denial |
| local-read-only | Read Only in workspace Alpha | Read/report access, mutation and secret denial |
| local-no-access | No active assignment | Acceptance path only when a matching pending invitation exists; otherwise denied |

Workspace Beta contains separate RP applications used for cross-scope denial.
Programmatic tests also create a user with different partner roles in Alpha and
Beta to prove per-workspace resolution. Fixture names and reserved
`local.example` emails
are disposable local data and are never promoted as reusable identifiers.
The local seed owns one recorded UUID namespace and derives stable UUIDv5 user,
workspace, application, assignment, and invitation identifiers from fixture
keys. It uses fixed `local.example` addresses, is idempotent, exits non-zero on
partial failure, and can clean up only records in its namespace. It runs as a
separate guarded local command, never in a reference-data migration or normal
non-local startup.

## Data Migration Plan

Use PAT-012 with separate reviewed revisions and releases. Constraints are not
validated against unknown legacy data before it is inventoried and repaired.

1. Additive expand revision:
   - add nullable role.code, the user_role association, lifecycle fields, and
     supporting indexes;
   - seed exactly one immutable cl_admin role code while leaving arbitrary
     legacy role rows uncoded and non-authoritative;
   - add role/status checks and missing foreign keys as PostgreSQL NOT VALID
     where supported, without adding NOT NULL to populated legacy columns;
   - add new API fields without removing legacy fields.
2. Preflight and reconciliation:
   - inventory duplicate, orphaned, deleted-role, malformed role_ids, disabled
     user, mixed CL Admin/partner, invalid status, source-invitation, and
     contradictory status/is_deleted records;
   - report exact pre/post candidate counts and abort on unexplained rows;
   - report legacy account/workspace candidates without creating an access-
     assignment manifest; legacy state is evidence for review, never authority;
   - preserve existing non-local records rather than resetting the database;
   - discover existing IBM Verify RP registrations by stable IBM application
     ID and match existing local RP records without creating owner-derived
     authority, changing stable local RP UUIDs, or importing secret values.
   - gate the existing mutating IBM synchronization worker off for non-local
     cutover until the reviewed partner-linking workflow is implemented; its
     current ten-minute job creates unassigned RP records and is not the
     required approval boundary.
3. Explicit value backfill revision:
   - canonicalize known persisted partner strings after trimming surrounding
     whitespace: RP Admin to rp_admin, RP User (Edit) to rp_user_edit, and Read
     Only to read_only; comparison is case-sensitive after trimming and any
     other value aborts into the reconciliation report;
   - preserve existing valid explicit canonical partner grants;
   - map no legacy admin, reusable-role, or is_superuser identity to cl_admin;
     report every such candidate and establish the initial CL Admin separately
     through the idempotent application-managed database bootstrap script with
     a newly designated internal identity, never through ad hoc SQL or inferred
     legacy authority;
   - map no workspace_admin or workspace_member row into canonical access. All
     legacy workspace memberships remain quarantined and non-authoritative;
     after cutover, CL Admin establishes a workspace and its first RP Admin
     through canonical role management, and same-workspace RP Admin manages RP
     User (Edit) and Read Only access;
   - do not map application owners, arbitrary reusable roles, upstream groups,
     or owner-email snapshots;
   - make the operation idempotent and never reactivate a revoked assignment.
4. Validate and switch release:
   - validate checks and FKs, add required NOT NULL constraints only after
     reconciliation, and verify partial uniqueness;
   - deploy server authorization and writes against normalized sources;
   - return the new authorization context and verify the full permission
     matrix before disabling legacy reads.
5. Runtime contract release:
   - remove is_superuser, user.role_ids, legacy role/policy CRUD, legacy Casbin
     subjects, obsolete workspace role writes, and obsolete seed/config paths
     from runtime authorization, APIs, and supported mutation paths;
   - retain dormant legacy columns and workspace_member history without
     authority or writes. A future change tentatively named
     `retire-legacy-authorization-storage-at-production-cutover` owns physical
     deletion only after backup, disposition, rollback, row-count, permission,
     and audit expectations are approved.

Before the runtime contract release, application rollback may restore legacy
reads while leaving additive schema intact. Alembic downgrade for the additive
revision drops new constraints and tables in reverse dependency order but does
not claim to reconstruct changed display strings, JSON role arrays, flags, or
revoked authority. Physical storage cleanup is deliberately absent from this
change; its future rollout must define recovery through a reviewed forward fix,
backup restore, or another approved mechanism.

## Audit And Information Lifecycle

Role assignment, role replacement, revocation, invitation transition, and
privileged authorization decisions are auditable. Audit context contains actor,
target user, stable role key, public resource UUID, action, outcome, timestamp,
and correlation identifier where available.

Do not log raw invitation tokens, RP secrets, raw session identifiers, raw OIDC
claims, or unnecessary email addresses. Authorization assignment, grant, and
invitation records are retained without automatic deletion in this MVP;
implementation must not hard-delete them merely to simplify the role
migration. The exact retention and disposition schedule is explicitly deferred
to a future production-cutover MVP.

Denied and failed privileged decisions are written through an independent
request-scoped audit outbox so a rolled-back business transaction does not
erase the decision record. Before an allowed privileged action executes, the
minimized decision must be durably enqueued; enqueue failure is fail-closed.
For a request that is already denied or has already failed, audit-store failure
does not broaden access or replace that safe outcome: the audit write is
retried and an operational alert is raised. The event contains only the typed
actor UUID/type, timestamp, correlation ID, result, canonical role when
resolved, capability, public resource/workspace UUID, decision reason, and
Verify operation when applicable. Request bodies, email addresses, tokens,
session identifiers, claims, and secret values are excluded.

Portal-triggered secret reveal and lifecycle actions continue the MVP1 audit
contract: local records are created against the stable local RP UUID for
`REVEAL_SECRET`, `VIEW_ROTATED`, `ROTATE_SECRET` or `REGENERATE`, and
`DELETE_ROTATED`. Those records include the actor, operation, target, and time,
but never a secret value. A reviewed RP import must preserve the stable local
RP UUID, linked IBM application ID, and all existing local audit records. IBM
operational history is not imported as a replacement audit source and does not
change this contract.

~~~yaml
sensitive_data:
  data_element: authorization_assignment_and_invitation_identity
  classification: personal_information_and_audit_record
  source: local_user_database_and_invitation_workflow
  stored_where:
    - application_database
    - approved_audit_store
  logged: internal_identifiers_or_redacted_values_only
  returned_to_client: safe_role_keys_and_public_workspace_uuids_only
  retention: preserve_without_automatic_deletion_pending_future_mvp
  controls:
    - server-side authorization
    - foreign-key and uniqueness constraints
    - lifecycle state validation
    - scoped API responses
    - audit events
    - no secret or token logging
~~~

## Standards Impact

~~~yaml
standards_impact:
  ui:
    applies: true
    decision: Role-aware UI consumes backend authorization context and does not enforce access by itself.
    evidence: Route and action visibility tests for existing workspace, invitation, reporting, credential, oversight, and administration surfaces; the dependent Home change owns Home/header evidence.
    exceptions: []
  accessibility:
    applies: true
    decision: Authorized, unavailable, and denied states retain clear headings, focus behavior, keyboard access, and non-colour-only cues.
    evidence: Focused route/state tests plus keyboard and zoom review for changed surfaces.
    exceptions: []
  official_languages:
    applies: true
    decision: Role labels, permission guidance, and denial/recovery content maintain English/French parity.
    evidence: Locale parity checks and bilingual frontend assertions.
    exceptions: []
  security_privacy:
    applies: true
    decision: Enforce least privilege and workspace scope on the server, fail closed, preserve safe unavailable behavior, and never expose RP secrets to CL Admin or Read Only.
    evidence: Backend allow/deny/scope/secret tests and safe-error checks.
    exceptions: []
  identity_access:
    applies: true
    decision: Follow PAT-009 and PAT-010, keep OIDC as identity only, and use server-owned normalized role/grant sources with deterministic precedence.
    evidence: Updated ADR-003, policy tests, session/effective-access contract tests, and OpenAPI review.
    exceptions: []
  information_management:
    applies: true
    decision: Role assignments, grants, invitations, privileged changes, and required denials preserve ownership, lifecycle metadata, and auditability.
    evidence: Schema/migration review, constraint tests, and audit-event tests.
    exceptions: []
  verification:
    applies: true
    decision: Use PAT-018 local fixtures through the real backend authorization path and verify every role plus no-role, cross-scope, stale-invitation, and migration cases.
    evidence: OpenSpec validation, backend/frontend role matrices, OpenAPI checks, and local verification output.
    exceptions: []
  gc_web_application_baseline:
    applies: true
    decision: Treat implementation as a meaningful UI, accessibility, official-languages, privacy, identity, security, API, and data change affecting BAS-001 and GC-WEB-002 through GC-WEB-011.
    evidence: Level-2 advisory baseline impact plus UI, accessibility, bilingual, IAM, security/privacy, and information-management review before archive.
    exceptions: []
~~~

Applicable guidance:

- STD-002: Work Contexts
- STD-004: Frontend React and TypeScript
- STD-005: Frontend GC Design System
- STD-006: GC UI Page Layout Rules
- STD-007: UI Accessibility Basics
- STD-008: Backend FastAPI
- STD-009: REST API
- STD-010: API Response and Error Models
- STD-011: Logging and Observability
- STD-013: Security and Privacy Basics
- STD-014: Secrets and Configuration
- STD-017: Government of Canada Standards Review
- STD-019: Government of Canada Web Application Baseline Governance
- STD-020: Database Persistence
- PAT-001: UI Page Patterns
- PAT-009: OIDC Backend Session
- PAT-010: RBAC Policy Check
- PAT-012: Alembic PostgreSQL Change
- PAT-013: GC Design System React App Shell
- PAT-014: Bilingual Route and I18n
- PAT-015: Storybook UI Review Fixture
- PAT-018: Local Role Simulation
- PAT-025: Dependency Substitution
- BAS-001: Government of Canada Web Application Baseline
- GC-WEB-002: Canada.ca Design, Federal Identity, And Page Shell
- GC-WEB-003: Accessibility
- GC-WEB-004: Official Languages And Plain Language
- GC-WEB-005: Mobile And Responsive Behaviour
- GC-WEB-006: Privacy And Personal Information
- GC-WEB-007: Security
- GC-WEB-008: Identity And Access
- GC-WEB-009: Information Management, Records, And Audit
- GC-WEB-010: APIs, Interoperability, And Data Exchange
- GC-WEB-011: Logging, Monitoring, Analytics, And Operational Readiness

## Impacted Artifacts

- OpenSpec deltas under this change.
- Role-aware existing-surface page-pattern decision under this change.
- ADR-003 and the solution ADR index.
- Backend role, user, workspace-member, access-grant, invitation, policy, audit,
  and grant-accessible application models/schemas/services.
- Alembic migrations and idempotent reference/bootstrap data.
- Auth/session dependencies, Casbin initialization, route/service scope checks,
  invitation acceptance, reporting, and seed scripts.
- OpenAPI output and frontend fetch types.
- Frontend route guards, role labels, workspace/application
  action controls, invitations, credentials, reports, and local selector.
- Local setup/sample configuration and local-development documentation.
- Backend, frontend, migration, contract, and local-mode tests.

## Slice Plan

### Slice 1: Architecture and canonical contracts

- Outcome: ADR-003, fixed role keys, permission matrix, lifecycle vocabulary,
  and effective authorization DTO are implementation-ready.
- Exit: no code path needs to invent role precedence, scope, or secret rules.

### Slice 2: Expand and backfill persistence

- Outcome: user_role and constrained grant/invitation persistence exist with a
  reviewed, idempotent migration and reconciliation report.
- Exit: legacy and canonical records can be compared without changing runtime
  authorization.

### Slice 3: Server authorization and session context

- Outcome: normalized assignments drive protected requests and the authenticated
  API returns safe role/scope context.
- Exit: is_superuser, role_ids, groups, and direct subjects no longer decide
  runtime authorization.

### Slice 4: Invitation lifecycle and partner workflows

- Outcome: partner grants, invitations, secrets, workspace configuration, and
  reporting enforce the matrix and workspace boundary.
- Exit: stale invitation replay, cross-workspace access, and unauthorized
  secret/report paths fail closed.

### Slice 5: Frontend role-aware experience

- Outcome: existing routes, labels, and controls consume the server context and
  present only valid tasks for each role; the dependent Home package owns
  grouped Home/header navigation.
- Exit: frontend matrices cover all four roles without relying on isSuperuser.

### Slice 6: Deterministic local personas

- Outcome: a clean local setup can select each fixture persona and exercise the
  real session/authorization boundary.
- Exit: local role review is reproducible and non-local configuration proves
  the selector unavailable.

### Slice 7: Verification and archive follow-through

- Outcome: migrations, policies, APIs, backend routes, frontend visibility,
  OpenSpec, and affected standards have review evidence.
- Exit: the change can be archived into current specs without scenario loss.

## Risks And Trade-Offs

- The package has more than ten deltas across six capabilities. Keeping one
  semantic cutover is intentional: archiving only part of the change would
  leave conflicting role sources and actor names in current specs. Delivery is
  still separated into reversible implementation slices.
- Migration can accidentally elevate legacy users. Mitigation: explicit
  precedence, least-privilege mapping, reconciliation output, and fail-closed
  unknown values.
- Removing superuser can lock out administration. Mitigation: idempotent initial
  CL Admin seed, last-CL-Admin invariant, and expand/switch verification before
  contract cleanup.
- Session-cached permissions can delay revocation. Mitigation: resolve active
  server state on each protected request or use an equivalent invalidation
  mechanism proven by tests.
- Adding source-invitation integrity can expose orphan records. Mitigation:
  inventory and repair or explicitly quarantine invalid rows before validating
  the foreign key.
- A local selector can be enabled outside local development. Mitigation:
  one fail-closed composition decision, startup validation, and negative
  configuration tests.
- This change overlaps role-aware navigation with the active Home change.
  Mitigation: this change owns role semantics/context; Home owns information
  architecture and consumes the accepted contract afterward.

## ADR Impact

ADR-003 is accepted as the durable decision for Casbin authorization,
multi-role semantics, and workspace boundaries. It records stable role keys,
fixed definitions, normalized sources, scope resolution, CL Admin secret
denial, direct-subject retirement, bootstrap, policy initialization, and
service-level object checks. The acceptance evidence is local and does not
approve environment-specific reconciliation, production migration, or release.

## Open Questions

- Production deployment sequencing, rollback owner, monitoring, and approval
  remain outside this local change.

These questions do not block local implementation or verification.

The exact retention/disposition schedule is not an open question for this
change: the product decision is to preserve records without automatic deletion
and revisit a schedule in a future production-cutover MVP.

## Archive Follow-Through

OpenSpec delta archive updates requirements but not each capability's Purpose
paragraph. Before the real archive, reconcile Purpose text so current truth no
longer describes a reusable role catalog, distinct workspace authorization
roles, owner-only workspace behavior, or the oversight placeholder. The six
affected capabilities plus the two accessible-application capabilities must
instead describe the canonical role model,
workspace-scoped partner access, invitation lifecycle, onboarding oversight,
platform administration, and department-onboarding precedence they own. Rebase
the active Home/navigation package after that current-spec update.

## Implementation Readiness

Local implementation and verification are complete, and ADR-003 is accepted.
Dormant legacy storage is preserved and no longer an archive gate; physical
cleanup belongs to the named future production-cutover/disposition change.
The pre-existing IBM Verify RP adoption scope is resolved and delegated to
add-cl-admin-rp-registration-adoption. Holistic QA is complete, so this package
is ready for archive and dependent-change follow-through. Retention scheduling,
the adoption workflow's real IBM verification, and production execution are
future release concerns. No shared-environment or production action is
authorized.
