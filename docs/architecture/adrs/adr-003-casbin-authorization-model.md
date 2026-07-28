# ADR-003: Casbin Authorization Model

Type: Architecture Decision Record
Status: Proposed

## Date

2026-07-28

## Context

Protected backend routes declare Casbin resource/action requirements.
`PermissionGuard` uses a database-backed enforcer whose non-default grants are
stored in the `access_policy` table.

The current subject resolver maps superusers to `admin`. For other users it
loads names for `role_ids` and returns the first database result, then falls
back to username, user ID, or `anonymous`. Because the role query has no
deterministic ordering and users can hold multiple role IDs, multi-role
permission semantics are not defined.

Policy provisioning is also split. A standalone seed script provides bootstrap
defaults, while Alembic data migrations provide durable feature grants. Those
sources are not fully aligned.

## Baseline And Control Impact

- Applicable baseline: `BAS-001: Government of Canada Web Application Baseline`
  when Delorean architecture guidance is materialized.
- Affected controls: `GC-WEB-007: Security`, `GC-WEB-008: Identity And Access`,
  and `GC-WEB-009: Information Management, Records, And Audit`.
- Baseline status impact: applies.
- Evidence needed before release: allow/deny tests, ownership tests, policy
  migration review, and deterministic multi-role behaviour tests.

## Standard, Pattern, Control, Or Baseline Decision

- Applicable guidance: `PAT-010: RBAC Policy Check` and
  `STD-020: Database Persistence`.
- Decision type: follows.
- Reason: resource/action policies provide a consistent coarse authorization
  boundary, but identity-to-subject mapping and policy lifecycle need explicit
  project semantics.
- Risk or trade-off: policy data becomes deployment-critical and coarse RBAC
  does not replace object ownership checks.
- Mitigation: use reversible migrations, service-layer ownership checks, and
  allow/deny tests for every new protected capability.
- Owner: Partner Portal security and backend maintainers.
- Review trigger: role model, policy matcher, identity claims, ownership model,
  or policy provisioning changes.
- Related schema contract: `AccessPolicy` subject/resource/action tuples.
- Related waiver or evidence record: none.

## Reference Architecture Impact

- Reference architecture: none selected.
- Relationship: not applicable.
- Variation summary: none.
- Follow-up needed in the reference architecture: none.

## Decision

The following established parts of the model are proposed for formal
acceptance:

- Protected routes declare
  `@casbin_guard.require_permission("<resource>", "<action>")`.
- Casbin supplies the coarse subject/resource/action permission gate.
- Superusers resolve to the `admin` subject, which has the configured wildcard
  default policy.
- Non-default deployed grants are persisted in `access_policy`.
- Services continue to enforce object ownership, tenant boundaries, lifecycle
  rules, and other domain authorization that coarse route RBAC cannot express.
- Simple CRUD capabilities normally use `read` and `write`. Domain transitions
  use explicit action names when the policy model distinguishes them.
- A new protected resource or action is incomplete until the intended deployed
  subjects can receive an idempotent policy grant and allow/deny behaviour is
  tested.
- Durable deployed grants use reversible Alembic data migrations. A standalone
  seed script is local/bootstrap convenience and either stays aligned with
  migrations or is retired.

This ADR cannot become Accepted until the project selects deterministic subject
semantics for users with multiple roles. Acceptable directions include:

1. evaluate the union of all active role permissions; or
2. model and resolve one explicit primary role.

The current behaviour of returning the first unordered role result is not an
intentional decision and must not be documented as the target model.

The project must also decide whether direct username and numeric user-ID
subjects remain supported or whether fallback should be limited to one stable
identifier.

## Options Considered

### Option 1: One-Off Role Checks In Routes

- Benefits: no policy engine or policy data lifecycle.
- Costs: authorization logic spreads through route handlers.
- Risks: inconsistent checks and difficult allow/deny coverage.

### Option 2: Database-Backed Casbin With Explicit Subject Semantics

- Benefits: one permission vocabulary and reviewable deployed grants.
- Costs: policy migrations and subject resolution become critical
  infrastructure.
- Risks: incorrect seed data or ambiguous role selection can deny or grant
  access incorrectly.

### Option 3: Identity-Provider Groups As The Only Authorization Source

- Benefits: fewer local role and policy records.
- Costs: portal permissions become tightly coupled to external group design.
- Risks: object ownership and portal-specific actions still require local
  enforcement.

Option 2 is the proposed direction.

## Consequences

- Policy tuples and migrations are reviewed with protected route changes.
- Backend services retain ownership checks even after a Casbin guard succeeds.
- Multi-role users need an explicit resolution design and tests.
- The runtime bootstrap seeder cannot silently diverge from deployed policy
  migrations.
- Authorization tests cover anonymous, insufficient, sufficient, and
  wrong-owner cases as applicable.

## Baseline Gate Impact

The ADR remains Proposed while multi-role behaviour is ambiguous. Evidence for
acceptance needs deterministic subject tests, reconciled policy provisioning,
and proof that sensitive operations enforce both Casbin and resource ownership.

## Review Triggers

- Multi-role semantics are implemented.
- Direct user subjects are retained, changed, or removed.
- Casbin matchers or the policy schema change.
- Identity-provider groups become the role source of truth.
- A tenant or workspace boundary changes.
- Policy provisioning moves away from Alembic.

## Links

- [Codebase architecture](../codebase.md)
- [Development conventions](../../repo-guidance/development-conventions.md)
- [Casbin subject resolution](../../../backend/src/app/core/access_control.py)
- [Casbin model](../../../backend/src/app/core/casbin_model.conf)
- [Access policy model](../../../backend/src/app/models/access_policy.py)
- [RP application policy migration](../../../backend/src/migrations/versions/0005_seed_rp_application_policies.py)
- [Bootstrap policy seeder](../../../backend/src/scripts/seed_access_policies.py)
