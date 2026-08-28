# Design

## Context

Canonical authorization already supports global CL Admin assignments and one
partner role per user/workspace. The product surfaces are misaligned with that
model: `/users` is a direct user-creation/profile modal, while the only complete
partner-assignment UI is nested below one workspace. The invitation aggregate
is workspace-owned in behavior but its persistence and routes still require an
RP application, preventing the first RP Admin invitation before partner
application work starts.

This change aligns the UI and invitation boundary with the existing
authorization source of truth. It does not invent a second membership model.

Relevant guidance:

- STD-002: Work Contexts
- STD-004: Frontend React and TypeScript
- STD-005: Frontend GC Design System
- STD-006: GC UI Page Layout Rules
- STD-007: UI Accessibility Basics
- STD-008: Backend FastAPI
- STD-009: REST API
- STD-010: API Response and Error Models
- STD-012: Testing Basics
- STD-013: Security and Privacy Basics
- STD-017: Government of Canada Standards Review
- STD-018: Frontend CSS and Design-System Boundary
- STD-019: Government of Canada Web Application Baseline Governance
- STD-020: Database Persistence
- PAT-001: UI Page Patterns
- PAT-002: API Query and Mutation
- PAT-003: Form Page
- PAT-004: Protected Route
- PAT-005: Router, Service, Schema
- PAT-008: Audit Log
- PAT-010: RBAC Policy Check
- PAT-012: Alembic PostgreSQL Change
- PAT-013: GC Design System React App Shell
- PAT-014: Bilingual Route and I18n
- PAT-015: Storybook UI Review Fixture
- PAT-017: Itemized Data Display
- PAT-020: Status and Feedback
- PAT-022: Page Length and Splitting
- PAT-023: Frontend Data Table
- PAT-024: Full-Stack Feature Slice

## Goals / Non-Goals

**Goals:**

- Give CL Admin one discoverable cross-workspace identity and access area.
- Make `Invite user` a complete workspace-and-role onboarding task.
- Let CL Admin manage an existing user's permitted assignments without first
  finding each workspace.
- Preserve the scoped workspace Access surface for RP Admin delegation.
- Allow workspace invitations before an RP application exists.
- Present authorization state rather than identity-provider implementation
  detail in the user directory.
- Keep visible row-action text concise while preserving unique accessible
  names.

**Non-goals:**

- A second authorization service, membership table, or client-side permission
  engine.
- Direct user provisioning in CanadaLogin or IBM Security Verify.
- Automatic email delivery.
- A retention/disposition rollout or destructive migration.

## Route And Page Pattern Catalog

| Route | Pattern | Purpose |
|---|---|---|
| `/administration` | Existing PAT-001 task hub | Discover Users and access |
| `/users` | PAT-023 focused directory | Search and compare identity and access summaries |
| `/users/invite` | PAT-003 focused form | Invite a new identity into one workspace role |
| `/users/$userUuid` | PAT-017/PAT-023 focused detail | Review profile, global access, workspace access, and pending invitations; perform permitted changes |
| `/workspaces/$workspaceUuid/access` | Existing focused access page | Manage access in one workspace under the actor's delegation boundary |

`/users` does not embed invitation and assignment forms. It provides the
directory, one `Invite user` action, and concise `Manage` row actions to focused
routes. The Administration hub and shared menu continue to expose the parent
task area; the new child routes are intentionally nested rather than separate
top-level navigation items.

## Decisions

### Decision 1: Users and access is the CL Admin cross-workspace surface

- `/users` is available only to canonical CL Admin.
- The directory shows a safe user identifier, account status, global access,
  and workspace-access summary.
- The primary table does not show `auth_provider`, raw OIDC claims,
  `auth_subject`, internal IDs, or policy details.
- `/users/$userUuid` reads active canonical global and workspace assignments
  plus the minimum pending invitation lifecycle fields a CL Admin may manage.
- Assignment, replacement, revocation, and last-CL-Admin rules remain in the
  existing authorization service and canonical mutation APIs.

### Decision 2: Creating a local enabled user is not the product onboarding flow

- The `Create user` UI is removed and replaced with `Invite user`.
- `/users/invite` collects invited email, workspace, canonical partner role,
  and expiry.
- If the normalized email already resolves to an existing active local
  identity, the form does not create a duplicate user or invitation. It safely
  directs the CL Admin to that user's manage-access route, where an immediate
  canonical assignment may be confirmed.
- If no identity exists, one pending workspace invitation is created. The local
  identity is created or bound only through the existing signed-in,
  email-matched invitation-acceptance path.
- A disabled or deleted identity, conflicting CL Admin/partner access, existing
  same-workspace assignment, or ambiguous identity match fails safely without
  changing access.
- The existing backend direct-user-create endpoint may remain temporarily for
  internal compatibility, but it is not called by the product UI and must not
  be described as the partner onboarding path.

### Decision 3: Invitations are workspace-owned with optional RP application provenance

- `workspace_id` remains required and authoritative.
- `rp_application_id` becomes nullable and records optional source provenance
  only when the invitation starts from an RP application.
- New canonical endpoints are resource-oriented under
  `/api/v1/workspaces/{workspaceUuid}/invitations` for list, create, revoke, and
  reissue behavior.
- Existing RP-application invitation endpoints delegate to the same service
  with the application as optional source provenance during a compatibility
  period; they do not own a second invitation lifecycle.
- The pending-email/workspace uniqueness rule, token hashing, expiry,
  revocation, reissue, identity matching, idempotent acceptance, assignment
  lineage, and audit rules remain unchanged.
- Acceptance of an invitation without an RP application returns or redirects
  to the authorized workspace hub. When a valid source RP application exists,
  the product may offer that application as a next step without making it an
  authorization dependency.

### Decision 4: CL Admin and RP Admin use the same rules through different page scopes

- CL Admin can manage all canonical partner roles from Users and access and may
  also use a selected workspace's Access page.
- RP Admin can use only the assigned workspace's Access page and can manage
  only RP User (Edit) and Read Only.
- RP User (Edit) and Read Only see no assignment or invitation mutation
  controls and remain denied by the backend.
- Frontend route/action visibility is a usability projection only; every read
  and write rechecks current server-owned authorization and workspace scope.

### Decision 5: Identity provenance remains backend-only operational context

- `auth_provider` and `auth_subject` continue to bind a portal identity to the
  configured provider and protect against unsafe identity replacement.
- Product roles remain canonical local assignments and are never stored in or
  inferred from `auth_provider`.
- The user directory replaces the provider column with global and workspace
  access summaries.
- A future multi-provider support view may expose a localized identity-link
  status to authorized support users, but raw provider values are not required
  for this MVP task.

### Decision 6: Row actions use short visible verbs and contextual accessible names

- The shared DataTable action renderer shows only the supplied concise verb,
  such as `Manage`, `View`, `Edit`, or `Remove`.
- The record identifier is rendered with a working visually-hidden utility so
  the accessible name remains unique, for example `Manage alex@example.test`.
- Table call sites avoid repeating the record noun when the column heading and
  table context already make it clear.
- Destructive or ambiguous actions keep explicit visible wording when the
  consequence cannot be understood from a short verb alone.

## API Contracts

The service keeps its established camelCase public JSON convention.

### User access detail

```yaml
method: GET
path: /api/v1/users/{userUuid}/access
auth:
  required: true
  roles: [cl_admin]
response:
  status: 200
  body_model: UserAccessAdministrationRead
status_codes: [200, 401, 403, 404, 422, 500]
```

The response contains the public user UUID, safe display/email/status fields,
optional canonical global role, active workspace assignment summaries using
public workspace UUID/name and canonical role key, and manageable pending
invitation summaries. It excludes internal IDs, raw provider identifiers,
claims, policies, tokens, and invitation acceptance URLs.

### Workspace invitations

```yaml
method: GET|POST
path: /api/v1/workspaces/{workspaceUuid}/invitations
auth:
  required: true
  roles: [cl_admin, rp_admin]
request:
  body_model: WorkspaceInvitationCreate
response:
  body_model: WorkspaceInvitationRead | WorkspaceInvitationWriteResponse
status_codes: [200, 201, 400, 401, 403, 404, 409, 422, 500]
```

Revoke and reissue use nested invitation resources under the same workspace.
The service applies the existing delegation matrix before returning records or
performing writes. Only the create/reissue response may contain the generated
acceptance URL; list and user-access detail responses do not expose tokens or
acceptance URLs.

### Invitation target resolution

```yaml
method: POST
path: /api/v1/users/invitation-target-resolution
auth:
  required: true
  roles: [cl_admin]
request:
  body_model: UserInvitationTargetResolutionRequest
response:
  status: 200
  body_model: UserInvitationTargetResolutionRead
status_codes: [200, 401, 403, 422, 500]
```

The request contains only the proposed invitee email. The response classifies
the target as a new identity, an existing manageable identity, or an
ineligible identity and includes a public user UUID only for the manageable
existing-identity outcome. It does not expose provider identifiers, matching
records, internal IDs, roles, or the reason an ineligible identity failed
closed.

## Data And Migration

- Add Alembic revision `0025_workspace_invitations` within the configured
  revision-ID capacity.
- Alter `rp_application_developer_invitation.rp_application_id` to nullable;
  keep its foreign key and index.
- Preserve every existing non-null RP application association and invitation
  lifecycle record.
- Update SQLAlchemy and internal Pydantic projections to `int | None`.
- Keep `workspace_id` non-null, the existing normalized pending
  email/workspace unique index, role/status/lifecycle checks, token-hash
  uniqueness, and revocation/reissue lineage.
- Downgrade must fail with a clear instruction when workspace-only invitation
  rows exist; it must not delete them to restore `NOT NULL`.
- No backfill, external lookup, or IBM call is needed.

## Security, Privacy, And Information Management

- Email address is personal information used for identity matching and access
  administration. It is stored in the invitation record, shown only to
  authorized access managers, excluded from URLs/analytics, and not written to
  diagnostic body logs.
- Invitation tokens remain hashed at rest. Raw tokens appear only in the
  intended acceptance URL returned at create/reissue and are not returned by
  list/detail summaries or audit records.
- Assignment and invitation mutations remain audited with actor, safe target
  UUID, workspace UUID, role, lifecycle transition, result, time, and
  correlation ID; no raw provider identifier, token, claim, or secret is
  recorded.
- Existing logical history is retained. This change makes no physical
  disposition decision and performs no destructive cleanup.
- All authorization and identity-resolution failures use safe errors and leave
  current assignments/invitations unchanged.

## Cache And Derived Artifacts

- Successful assignment, replacement, revocation, invitation creation,
  revocation, or reissue invalidates the user directory/access detail,
  selected workspace Access, invitation, and current-session queries that may
  be affected.
- OpenAPI and the TanStack Router tree are regenerated through the supported
  project commands; generated files are not edited manually.

## Standards Impact

```yaml
standards_impact:
  ui:
    applies: true
    decision: Use the recorded PAT-001 directory and focused task routes with GC Design System components.
    evidence: Desktop/mobile screenshots, design-system checks, and page-shell checks are required.
    exceptions: []
  accessibility:
    applies: true
    decision: Preserve semantic table structure, concise visible actions, unique accessible names, keyboard order, focus, errors, and confirmations.
    evidence: Focused unit checks plus keyboard, zoom, and screen-reader review.
    exceptions: []
  official_languages:
    applies: true
    decision: Add equivalent English and French labels, hints, errors, statuses, and accessible names.
    evidence: Translation parity and route/title checks.
    exceptions: []
  security_privacy:
    applies: true
    decision: Minimize email/provider data, hash tokens, return safe errors, and enforce server authorization.
    evidence: Validation, authorization, token-surface, logging, and failure-path tests.
    exceptions: []
  identity_access:
    applies: true
    decision: Reuse the canonical four-role service; preserve CanadaLogin identity binding and the delegation matrix.
    evidence: CL Admin, RP Admin, denied-role, cross-workspace, conflict, and acceptance tests.
    exceptions: []
  information_management:
    applies: true
    decision: Preserve invitation/assignment history and audit consequential actions; defer physical disposition to a future change.
    evidence: Migration review and audit-event tests.
    exceptions: []
  verification:
    applies: true
    decision: Run focused frontend/backend/migration/API checks and local browser review with fake data.
    evidence: OpenSpec validation, test output, generated-artifact diffs, and verification notes.
    exceptions: []
  gc_web_application_baseline:
    applies: true
    decision: Update the BAS-001 assessment for the affected controls before archive.
    evidence: Local assessment record covering GC-WEB-002 through GC-WEB-010 and review of GC-WEB-011.
    exceptions: []
```

## Baseline Applicability

- GC-WEB-001: applies; partner-facing administrative web application scope is
  unchanged.
- GC-WEB-002: applies; Users and access uses the shared GC page shell and
  approved route patterns.
- GC-WEB-003: applies; table actions, forms, errors, confirmations, and the
  complete invite/manage process require accessibility evidence.
- GC-WEB-004: applies; all visible and accessible content requires English and
  French parity.
- GC-WEB-005: applies; directory and focused tasks require mobile/zoom review.
- GC-WEB-006: applies; email and identity-link data are personal information.
- GC-WEB-007: applies; invitation input, tokens, authorization, and safe errors
  are security-sensitive.
- GC-WEB-008: applies; this is a material identity-and-access workflow change.
- GC-WEB-009: applies; invitation/assignment/audit history is retained.
- GC-WEB-010: applies; resource routes, schemas, OpenAPI, and frontend clients
  change.
- GC-WEB-011: applies only to changed audit/diagnostic behavior; no deployment,
  analytics, monitoring, or external operational integration is added.

## Risks And Mitigations

- **Risk:** a workspace-only invitation breaks code that assumes an RP
  application. **Mitigation:** make application provenance optional at every
  internal boundary, add no-application service/API/acceptance tests, and keep
  application routes as delegating compatibility adapters.
- **Risk:** centralized management bypasses workspace authorization rules.
  **Mitigation:** reuse the canonical assignment service and add route/service
  tests for delegation, cross-workspace scope, mixed access, and stale state.
- **Risk:** user enumeration or unnecessary provider disclosure. **Mitigation:**
  keep the surface CL Admin-only, return minimal fields, and omit raw provider
  values and identity subjects.
- **Risk:** the invitation form surprises an existing user with a second
  lifecycle. **Mitigation:** resolve an existing identity safely and direct the
  actor to the explicit manage-access confirmation rather than creating a
  duplicate invitation.
