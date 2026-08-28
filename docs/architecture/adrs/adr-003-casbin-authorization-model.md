# ADR-003: Casbin Authorization Model

Type: Architecture Decision Record
Status: Accepted

## Date

2026-08-11

## Context

Before this decision, protected backend routes declared Casbin resource/action
requirements while PermissionGuard evaluated database-backed policies from the
access_policy table. The subject resolver granted a wildcard admin subject from
is_superuser, expanded mutable names from user.role_ids, and added username or
numeric user-ID subjects. Other paths derived authority from
workspace_admin/workspace_member values, RP application access grants,
application-owner groups, or historical owner data.

Those sources do not form one deterministic product authorization model. They
can disagree about a user's role, do not consistently carry workspace scope,
and allow policy identity to depend on mutable labels or direct user subjects.
The authenticated session and current-user responses also do not expose one
safe, scope-aware authorization context.

The active
[define-four-role-authorization-model OpenSpec change](../../../openspec/changes/archive/2026-08-12-define-four-role-authorization-model/)
implements the selected model. OIDC remains the authentication boundary: it
establishes a trusted local user identity and backend session, while
server-owned, normalized assignments establish authorization. Casbin remains
the selected coarse capability engine; it does not replace service-level
workspace and object checks.

## Baseline And Control Impact

- Applicable baseline: BAS-001: Government of Canada Web Application Baseline.
- Affected controls: GC-WEB-007: Security, GC-WEB-008: Identity And Access,
  GC-WEB-009: Information Management, Records, And Audit, GC-WEB-010: APIs,
  Interoperability, And Data Exchange, and GC-WEB-011: Logging, Monitoring,
  Analytics, And Operational Readiness.
- Baseline status impact: applies to this meaningful identity, security, API,
  and data change.
- Evidence needed before release: role/capability allow-and-deny tests,
  workspace and object-scope tests, CL Admin secret-denial tests before any
  external call, assignment and policy migration review, current-user contract
  tests, local-simulation boundary tests, and focused IAM and security review.

## Standard, Pattern, Control, Or Baseline Decision

- Applicable guidance: STD-002: Work Contexts, STD-013: Security and Privacy
  Basics, STD-014: Secrets and Configuration, STD-017: Government of Canada
  Standards Review, STD-019: Government of Canada Web Application Baseline
  Governance, STD-020: Database Persistence, PAT-009: OIDC Backend Session,
  PAT-010: RBAC Policy Check, PAT-018: Local Role Simulation, and PAT-025:
  Dependency Substitution.
- Decision type: follows.
- Reason: stable server-owned role keys, normalized assignment records,
  immutable capability policy, and explicit object scope provide one
  reviewable authorization boundary.
- Risk or trade-off: policy and assignment data become deployment-critical,
  and a coarse Casbin decision remains insufficient for workspace-owned
  objects.
- Mitigation: use staged, reversible expansion and cutover; fail closed on
  ambiguous state; enforce service-level scope before data access; and require
  allow/deny, migration, and boundary tests before acceptance.
- Owner: Partner Portal security and backend maintainers.
- Review trigger: role taxonomy, role authority, assignment storage, Casbin
  matcher, protected object scope, identity claims, bootstrap, or policy
  provisioning changes.
- Related schema contract: normalized global user-role assignments, canonical
  partner workspace access grants, immutable role/capability mappings, and the
  authenticated authorization-context API contract.
- Related waiver or evidence record: none. This ADR does not approve a
  production migration, exception, or residual risk.

## Reference Architecture Impact

- Reference architecture: none selected.
- Relationship: not applicable.
- Variation summary: none.
- Follow-up needed in the reference architecture: none.

## Decision

The project adopts the following authorization model.

### Fixed Role Taxonomy

The product supports exactly four authorization roles in this phase:

| Stable machine key | Display label | Scope | Capability summary | Explicit denials |
|---|---|---|---|---|
| cl_admin | CL Admin | Global platform | Users and access, invitations, immutable role reference, partner bootstrap, initial RP Admin assignment, cross-workspace metadata, and explicit Production-review outcomes | RP secret values and lifecycle, partner configuration editing, partner MAU, aggregate reporting, generic audit browsing, catalog/policy CRUD, and broad Verify administration |
| rp_admin | RP Admin | One partner workspace | Workspace, Application, contacts, RP configuration, checklist/CATS, Production-review request, secrets and secret-change log, scoped MAU, and invitations/assignments for RP User (Edit) or Read Only | RP Admin assignment, CL/global administration, cross-workspace oversight, aggregate reporting, generic audit browsing, and Production-review outcomes |
| rp_user_edit | RP User (Edit) | One partner workspace | Application/contact editing, RP configuration, checklist/CATS, Production-review request, secret workflows/change log, and scoped MAU | Invitations, role assignment, CL/global administration, cross-workspace oversight, aggregate reporting, generic audit browsing, and Production-review outcomes |
| read_only | Read Only | One partner workspace | Workspace/Application/RP-configuration metadata, checklist/CATS visibility, Production-review status, and scoped MAU | Mutations, copy, review requests, invitations, role assignment, secrets/change log, CL/global administration, aggregate reporting, generic audit browsing, and Production-review outcomes |

Machine keys are immutable policy and persistence identities. Display labels are
bilingual presentation content and never become policy subjects. Role
definitions are fixed system reference data: no API or UI may create, rename,
delete, or add capabilities to a canonical role.

### Normalized Assignment Sources And Workspace Scope

Authorization is resolved only from active, normalized server records:

- The global CL Admin role is represented by the immutable cl_admin role.code
  and an active user_role association. Its assignment_source is constrained to
  migration, bootstrap, admin, or local_fixture.
- RP Admin, RP User (Edit), and Read Only are represented by one canonical
  partner workspace access-grant record for the user and workspace. The
  existing physical RP application access-grant table may remain during the
  staged migration, but its domain meaning is workspace access.
- A partner grant carries exactly one of rp_admin, rp_user_edit, or read_only,
  has an active or revoked lifecycle, and retains assignment or invitation
  lineage for audit.
- A user may hold partner roles in several workspaces, but at most one active
  partner role in each workspace. The selected resource's workspace determines
  which grant is relevant; roles from different workspaces are never unioned.
- A CL Admin account cannot concurrently hold a partner grant. Separate
  identities, including separate local fixtures, represent platform and partner
  perspectives.

user.role_ids, is_superuser, workspace_member roles, arbitrary reusable roles,
OIDC application-owner or administrator groups, historical owner-email data,
and legacy application-owner records are not canonical assignment sources.
They may be read only for controlled migration reconciliation and cannot grant
new authority.

### Deterministic Resolution And Fail-Closed Precedence

The backend resolves current active assignments for every protected request, or
uses an equivalent invalidation mechanism proven to make revocation effective
on the next request. The session stores identity, not a durable permission
snapshot.

Resolution is deterministic:

1. An active cl_admin assignment authorizes only the global CL Admin
   capabilities and only when no partner grant is active for that account.
2. Otherwise, a protected workspace object requires exactly one active
   canonical partner grant for that object's workspace and uses that grant's
   single role.
3. Grants in other workspaces do not contribute permissions.
4. No assignment means no product authority.
5. Mixed CL Admin/partner state, duplicate active roles in one workspace,
   unknown or legacy values, malformed records, deleted definitions, and
   unresolved scope all fail closed and require reconciliation.

This replaces unordered first-role selection and permission union. Invitation
acceptance is a grant-creation path, not a hidden precedence rule: an existing
active workspace grant blocks acceptance until an authorized actor performs an
explicit atomic role replacement.

### Stable Policy Subjects And Immutable Policy

Casbin policy subjects are canonical machine role keys only. Direct username,
numeric user-ID, raw role-ID, mutable display-name, is_superuser/admin-wildcard,
anonymous fallback, and upstream group subjects are retired from protected
product authorization.

Canonical role-to-capability policy is system-owned and immutable at runtime.
No role, policy, or access-policy CRUD API or UI may create direct-user
subjects, change canonical capabilities, or change scope semantics. The
Administration role surface is an immutable reference, not a role editor.
Policy initialization is idempotent and is delivered through reviewed code,
configuration, or migration data appropriate to the selected policy store.
Deprecated admin and application-owner subjects are removed only after the
canonical resolver, policy initialization, and migration checks pass.

### Server-Owned Enforcement And Authorization Context

Casbin supplies a centralized coarse capability decision. Before returning or
mutating a protected resource, the backend service also verifies the
workspace, tenant, owner, resource lifecycle, and other domain constraints.
Out-of-scope resources use the existing safe unavailable or not-found response
where the product contract requires non-disclosure. Client-side visibility is
never an enforcement boundary.

Authenticated APIs return a server-owned authorization context using stable
machine keys and public workspace UUIDs. The shape distinguishes one nullable
global role from the list of active partner-workspace assignments:

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

For CL Admin, globalRole is cl_admin and partnerAccess is empty. The contract
does not expose internal IDs, Casbin subjects or rules, raw OIDC claims,
isSuperuser, or a client-editable permission list. The frontend may map these
keys to bilingual labels and visibility states, but the server recomputes and
enforces authority.

### CL Admin Secret Boundary

CL Admin is an access-administration and Production-review role, not a partner
superuser. It cannot read RP client secret values, retrieve client credentials,
invoke partner secret lifecycle operations, edit partner configuration, or use
partner-scoped MAU as an implicit global report.

The portal does not expose a generic IBM Security Verify administration
surface. Provider adapters are bounded to authentication and safe identity
binding, retained-RP adoption, and an authorized RP-configuration service
operation. Secret reads, client credentials, and secret lifecycle calls are
denied for CL Admin before any external request. A new provider operation needs
an explicit permission-matrix and contract update; it does not inherit a
wildcard administrator grant.

### Bootstrap And Last-Administrator Invariant

The first CL Admin is created by an idempotent, explicitly invoked assignment
bootstrap using a clear configuration name such as INITIAL_CL_ADMIN_EMAIL.
Bootstrap creates the same normalized cl_admin assignment used at runtime. It
is neither a fifth role nor an authorization bypass, and it does not restore
is_superuser.

Administrative assignment and revocation must prevent removal of the last
active CL Admin. Concurrent CL Admin roster and target-user mutations are
serialized so that last-admin and no-mixed-assignment invariants hold.

### Local-Only Role Simulation

Local simulation follows PAT-018 and PAT-025 and remains an explicitly
configured identity substitute. A backend-owned allowlist maps a fixture
identifier to fake users and normalized assignments, creates the normal
backend session shape, and passes through the same authorization resolver.
The frontend cannot submit an arbitrary role.

The selector and fixture session endpoint are enabled only when all three
conditions agree:

- ENVIRONMENT=local;
- AUTH_MODE=local_dev; and
- ENABLE_DEV_ROLE_SELECTOR=true.

Any inconsistent configuration, or any shared test deployment, staging, or
production context, fails closed. Local data uses reserved `local.example`
identities and
deterministic fixture identifiers only; it never uses real identities,
credentials, claims, or production data. Network binding is defense in depth
and is not the authorization gate. Local simulation proves application
session, role, route, and scope behavior but does not prove real OIDC,
claim-mapping, identity-assurance, or deployed-provider behavior.

## Options Considered

### Option 1: Keep Mutable Roles, Superuser, And Direct Subjects

- Benefits: least immediate migration work.
- Costs: retains several competing sources of authority and mutable policy
  identity.
- Risks: non-deterministic access, hidden user-specific permissions, stale
  revocation, privilege escalation, and incomplete workspace isolation.

### Option 2: Fixed Server-Owned Roles With Stable Policy Subjects

- Benefits: one permission vocabulary, deterministic scope, reviewable
  assignments, safe client context, and testable allow/deny behavior.
- Costs: requires staged persistence, API, policy, and application migration.
- Risks: a faulty reconciliation or cutover can deny intended access or grant
  unintended authority.

### Option 3: Identity-Provider Groups As Authorization

- Benefits: fewer local assignment records.
- Costs: couples portal permissions and workspace scope to external group
  design.
- Risks: group drift, insufficient object scope, delayed revocation, and
  provider-specific authorization behavior.

Option 2 is selected.

## Consequences

- The role catalog and capability matrix become system-owned contracts rather
  than administrator-authored data.
- Normalized global assignments and partner workspace grants become audit and
  migration-critical records.
- The backend must load current assignment state, enforce both capability and
  object scope, and fail closed when assignment state is ambiguous.
- is_superuser, user.role_ids, workspace role authority, direct Casbin
  subjects, legacy application-owner policy, and role/policy/catalog CRUD
  require a staged retirement after runtime parity is verified.
- Authenticated-user and grant-accessible RP application contracts must carry safe
  role and workspace context without exposing policy internals.
- Tests must cover every role/capability pair, no-role access, cross-workspace
  objects, revocation, mixed and duplicate assignments, last-CL-Admin
  protection, policy immutability, direct-subject denial, and CL Admin secret
  denial.
- This accepted model is a durable architecture contract. Changes to its role
  taxonomy, authority sources, precedence, policy ownership, or scope rules
  require an ADR update or superseding decision.

## Acceptance Evidence

ADR-003 was accepted on 2026-08-11 after the local implementation and
verification recorded by the
[define-four-role-authorization-model OpenSpec change](../../../openspec/changes/archive/2026-08-12-define-four-role-authorization-model/).
The acceptance review confirmed:

- strict OpenSpec validation and scenario preservation;
- focused backend role-matrix, normalized-assignment, object-scope,
  current-user contract, policy-immutability, local-simulation, security, and
  migration tests;
- focused frontend session, route/action visibility, bilingual role-label,
  local-persona, and assignment-contract tests;
- a current generated OpenAPI contract; and
- focused IAM review with no blocking local architecture finding.

The review used local fake or test-only data. Real OIDC provider behavior,
shared and production configuration, the environment-specific reconciliation
manifest, physical legacy-column removal, retention/disposition approval, and
production rollout remain separate delivery and release gates. Acceptance of
this ADR does not approve those actions, waive their controls, or pass the
BAS-001 release gate.

## Baseline Gate Impact

Acceptance of this ADR does not pass the BAS-001 release gate. The local
acceptance review records evidence for the canonical role matrix,
assignment-source and migration design, server-side capability and object-scope
tests, safe current-user contract, audit-event contracts, secret denial before
external calls, and the local-simulation boundary. Before release, the project
must update the affected BAS-001 control assessment with environment-specific
evidence. Production cutover, retention, rollback ownership, deployed-provider
verification, and residual-risk acceptance require separate human decisions.

## Review Triggers

- The fixed role taxonomy or permission matrix changes.
- CL Admin gains any partner configuration or secret capability.
- Global and partner role coexistence or role-combination semantics change.
- The source of truth moves away from normalized server-owned assignments.
- Casbin matchers, policy storage, initialization, or policy ownership change.
- Direct user or identity-provider subjects are proposed again.
- The authenticated authorization-context contract changes.
- A workspace, tenant, ownership, bootstrap, or last-administrator invariant
  changes.
- Local role simulation is requested outside a local developer context.

## Links

- [OpenSpec proposal](../../../openspec/changes/archive/2026-08-12-define-four-role-authorization-model/proposal.md)
- [OpenSpec design](../../../openspec/changes/archive/2026-08-12-define-four-role-authorization-model/design.md)
- [Approved-scope alignment change](../../../openspec/changes/align-partner-portal-to-approved-product-scope/)
- [Partner Portal Onboarding PRD](../../plans/partner-portal-onboarding-prd.md)
- [Partner Portal MVP PRD](../../plans/partner-portal-mvp.md)
- [Codebase architecture](../codebase.md)
- [Development conventions](../../repo-guidance/development-conventions.md)
- [Casbin subject resolution and code-owned policy](../../../backend/src/app/core/access_control.py)
- [Casbin model](../../../backend/src/app/core/casbin_model.conf)
- [Canonical authorization contracts](../../../backend/src/app/core/authorization.py)
- [Authorization resolution and assignments](../../../backend/src/app/services/authorization_service.py)
- [Authorization API contracts](../../../backend/src/app/schemas/authorization.py)
- [Four-role migration guidance](../../../backend/src/migrations/README.md)
- [PAT-010: RBAC Policy Check](../../../architecture_docs/patterns/security/pat-010-rbac-policy-check.md)
- [PAT-018: Local Role Simulation](../../../architecture_docs/patterns/security/pat-018-local-role-simulation.md)
