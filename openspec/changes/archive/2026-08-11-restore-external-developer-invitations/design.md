# Design

## Context

The repository already supports authenticated current-user RP application experiences and workspace-scoped RP application management, but it does not currently ship a live invitation-management surface or a dedicated OpenSpec package for invited-developer collaboration. Invitation-related evidence is partial and split across locales, config, a GC Notify service, and an archived invitation migration.

This change isolates that missing behavior into a dedicated package so implementation can proceed without leaving invitation scope buried in the broader dashboard-reconciliation change.

The onboarding change at [openspec/changes/advance-onboarding-governance-and-reporting](../advance-onboarding-governance-and-reporting/proposal.md) already adds role-boundary guidance for the same capability. Archive sequencing for these two changes must preserve both the invitation requirements from this package and the guidance requirement from the onboarding package.

Relevant standards and patterns for planning:

- UI and route design: STD-005, STD-006, STD-007, STD-017.
- API and error contracts: STD-009 and STD-010.
- Persistence and ownership boundaries: STD-020 and PAT-012.
- Authenticated management tables and summaries: PAT-017 and PAT-023.

## Goals / Non-Goals

**Goals:**

- Define a dedicated invitation lifecycle for one existing department-owned workspace-scoped RP application.
- Define bootstrap platform-admin invitation creation with an invitation-scoped role assignment.
- Define `RP Admin` invitation boundaries for inviting additional staff.
- Define tokenized invitation acceptance and the corresponding denial or recovery paths.
- Define invited-developer access scoping for current-user RP application surfaces.
- Define the minimum IAM, persistence, delivery, and verification slices needed to implement the behavior.

**Non-Goals:**

- No production rollout, approval, or shared-environment configuration in this planning change.
- No general workspace membership or workspace-admin delegation for invited developers.
- No broad role-model rewrite in this change.
- No attempt to solve every future collaboration pattern beyond one RP-application invitation flow.

## Decisions

### Decision 1: Split invitation scope into its own active change

- Choice: move invitation lifecycle and invited-developer access scope out of the generic PRD-gap change and into this dedicated package.
- Rationale: invitation behavior has distinct UI, API, IAM, persistence, and verification needs that should not stay bundled with dashboard-summary planning.

### Decision 2: Use an explicit invitation lifecycle

- Choice: model invitation state with the working lifecycle `pending`, `accepted`, `expired`, and `revoked`.
- Rationale: the current delta already implies accepted, expired, and revoked outcomes, and implementation needs a compact state vocabulary for management views and acceptance rules.
- Trade-off: reissue or reactivation behavior can keep using the same state vocabulary without inventing extra long-lived states.

First-release lifecycle action rules:

- create stores a new `pending` invitation with a token hash and expiry timestamp
- accept is allowed only for a `pending` invitation whose token is valid, whose invited email matches the signed-in CanadaLogin account, and whose expiry has not passed
- revoke makes an issued invitation unavailable for future acceptance while preserving history for invitation-management views
- expire is reached when a `pending` invitation passes `invite_expires_at` before acceptance; expired invitations remain visible in history but are not acceptable
- reissue produces a fresh `pending` invitation with a new token and expiry while making the previous issued invitation unavailable for future acceptance

### Decision 3: Manage bootstrap invitations as a platform-admin action anchored to an existing partner context

- Choice: define bootstrap invitation-management behavior as a platform-admin action anchored to one existing workspace that represents the partner context. The first-release management entry point may still be one workspace-scoped RP application, but the granted access scope is the containing workspace rather than the department.
- Route and API plan:
	- `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/developer-invitations`
	- `/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations`
- Rationale: the existing workspace is the only durable scope in the current data model that can distinguish different partners inside the same department. Department data is too broad to use as the authorization boundary.

### Decision 4: Require existing partner setup before invitation creation

- Choice: a platform admin can create an invitation only after the partner context already exists as a workspace. A specific RP application in that workspace can remain the first-release entry point for invitation management, but the role grant scope is the containing workspace or partner context.
- Rationale: the existing workspace and RP-application model already gives implementation a durable partner-sized boundary without treating department as the deciding access fact.
- Trade-off: this does not solve future product needs for a first-class partner entity, but it avoids inventing one for the first release.

### Decision 5: Allow RP Admin users to invite their own staff, but not other RP Admin users

- Choice: after `CL Admin` users bootstrap the initial partner-side `RP Admin` users, those `RP Admin` users may create invitations only for `RP User (Edit)` and `Read Only` within the same partner context.
- Rationale: the partner needs some delegated onboarding and access-management capability, but escalation to another `RP Admin` remains a `CL Admin`-only action.
- Trade-off: implementation still needs to verify that the live current-user route family can enforce these role differences without leaking secret-related actions.

### Decision 6: Use a tokenized acceptance route without requiring automatic email delivery in the first release

- Choice: define acceptance on `/invitations/rp-applications/$token`, matching the configured `RP_APPLICATION_INVITE_URL_BASE` path root, but do not require automatic email dispatch in the first release.
- Rationale: the config and locale copy already converge on an RP-application invitation URL family, and creation of the invitation record should not be blocked on delivery integration.
- Trade-off: the first release may rely on manual or out-of-band delivery of the invitation link until GC Notify delivery is added.

### Decision 7: Invitation acceptance requires an email match and applies the invitation's existing partner context

- Choice: invitation acceptance requires the invited email to match the CanadaLogin account email, and accepted invitees use the invitation's existing workspace or partner context rather than completing a separate self-service department or partner-definition step.
- Rationale: the inviter already anchors the invitation to the target partner context, and the department does not provide a narrow enough boundary when multiple partners can exist inside the same department.
- Trade-off: invitation handling becomes a deliberate exception to the normal first-time department-setup path.

### Decision 8: First login checks pending invitations before the current OIDC group-based denial path

- Choice: when a user signs in with CanadaLogin, the portal checks for active pending invitations that match the normalized email before the current OIDC group-based denial path rejects the user.
- Rationale: today `sync_oidc_user` denies access when the user is in neither configured upstream group. Invitation-backed users need a local eligibility path before that denial.
- Trade-off: the OIDC login flow becomes aware of local invitation state and must avoid duplicate role assignment on repeated logins.

First-release login and eligibility path:

1. OIDC sign-in still establishes identity from the CanadaLogin subject and normalized email before any invitation-specific authorization decision.
2. If the resolved local user already has a portal-authorizing platform role or superuser access, the existing local-role authorization path remains in effect.
3. If the user does not have portal-authorizing platform access, the portal checks for an active pending invitation whose invited email matches the signed-in CanadaLogin email before applying the upstream-group denial path.
4. If no matching pending invitation or existing active partner-scoped access grant exists, the portal denies access through the normal local access-denied path.
5. Invitation acceptance and resulting partner-scoped access grants become the local source of truth for later current-user RP application access; repeated sign-in must not create duplicate grants.

### Decision 9: Accepted invitation roles are assigned as partner-scoped local access grants

- Choice: once a valid pending invitation is confirmed on first login, the portal creates or updates the local user record and records the invitation's role assignment against the invitation's partner workspace context.
- Rationale: invitation-backed access needs durable local authorization state after the first accepted login.
- Trade-off: the implementation must define how partner-scoped role assignments coexist with existing platform roles without treating them as ordinary reusable platform roles, and how those assignments become the source of truth for current-user RP application access instead of the current owner-email snapshot path.

First accepted-login sequence for this slice:

1. Validate the invitation token and invited email against the signed-in CanadaLogin account.
2. Create or update the local user record for that identity without forcing a separate `/profile/setup` department flow.
3. Create or update the active `rp_application_access_grant` for the invitation's partner workspace and role.
4. Mark the invitation accepted so the token cannot be used to create duplicate local access later.
5. Use the resulting partner-scoped access grant, not workspace membership and not owner-email snapshots alone, as the invited user's durable current-user RP application access record.

Recommended data model for this slice:

- keep the reusable role catalog global rather than attaching department or partner identity directly to the role lookup row
- keep platform-wide admin roles such as `CL Admin` separate from partner-scoped access grants
- store invited-developer access through a partner-scoped grant record that links the local user, the partner workspace, the invited role, active or revoked status, and the invitation source when present
- treat department as descriptive metadata for the workspace or RP application, not as the deciding access scope
- treat the partner-scoped grant as workspace-wide for the first release, so the granted role applies to all RP applications in that partner workspace rather than to a hand-picked RP-application subset

### Decision 10: Invitation-backed access is partner-scoped and never becomes workspace membership

- Choice: accepted invitees get access to RP applications that belong to the granted partner workspace context and are allowed by the assigned invited role, but do not become workspace members.
- Rationale: partner scope, not department, is the right collaboration boundary when one partner can own multiple RP applications.
- First-release simplification: do not add RP-specific permission slicing inside a partner workspace. If a user has a partner-scoped invited role for that workspace, the role applies consistently to every RP application in that workspace.

### Decision 11: Invitation assignment uses the PRD role labels for first-release invited access

- Choice: the first-release invited-access role catalog uses `RP Admin`, `RP User (Edit)`, and `Read Only` for invitation-scoped access, while `CL Admin` remains the portal-side bootstrap role.
- Rationale: these are the starting PRD role labels already used elsewhere in planning, and using them directly avoids inventing an extra partner-manager role name.
- Trade-off: implementation still needs to map these labels onto the current code-level role and permission model without forcing a broad runtime rename in the same slice.

### Decision 12: First-release invited-access permissions follow the PRD role boundaries

- Choice: `RP User (Edit)` can manage RP configuration work needed for onboarding and operations, including submitting RP requests and performing secret rotation workflows, but cannot manage invitation or role assignment. `Read Only` can view partner information and submitted RP configuration, but cannot edit and cannot view secret values.
- Rationale: this matches the clarified product intent and gives implementation a concrete first-release permission boundary.
- Trade-off: if a current-user route mixes editable configuration with secret display in one surface, implementation may need small route or DTO refinements to enforce this boundary cleanly.

### Decision 13: Reuse the archived invitation schema concepts, but keep first-release access levels simple

- Choice: plan around the archived `rp_application_developer_invitation` concepts: invited email, token hash, expiry, inviter, accepted or revoked timestamps, an assigned invitation role or access label, optional GC Notify notification identifier, and related audit-safe identifiers.
- Rationale: these names already match the domain and keep invitation storage auditable.
- Trade-off: if the first release ships only one invited-developer access level, the stored role or access label can remain constrained to one supported value.

### Decision 14: First-release invited access is mapped to the existing current-user route family route by route

- Choice: map invitation-scoped access onto the existing `/your-applications` frontend routes and `/api/v1/rp-applications/mine/**` backend routes, plus the planned invitation-management route for `RP Admin` users.
- Rationale: implementation needs a concrete replacement target for the current owner-email checks in `RPApplicationService`, and the current code already concentrates partner self-service under the current-user route family.
- Trade-off: one stale frontend helper still references `GET` and `PATCH /api/v1/rp-applications/mine/{rp_application_uuid}` even though no matching backend route currently exists. That helper should not drive the first-release permission model unless implementation intentionally adds the route.
- Denial rule: when an invitation-backed user requests a current-user RP-application route or subresource that is outside that user's partner-scoped access set, the portal should respond as not found instead of confirming the resource exists. This same not-found posture should apply to secret and invitation-management subresources that are outside the caller's role for that partner context.

First-release invited-access matrix:

| Surface | Frontend route | Backend route | RP Admin | RP User (Edit) | Read Only | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Current-user application list | `/your-applications` | `GET /api/v1/rp-applications/mine` | allow | allow | allow | Show only RP applications that belong to a partner workspace where the user has an active invited-role grant. |
| Current-user application entry and summary | `/your-applications/$rpApplicationUuid` | `GET /api/v1/rp-applications/mine/{rp_application_uuid}/department` and `GET /api/v1/rp-applications/mine/{rp_application_uuid}/oauth-setup` | allow | allow | allow | Read-only app summary and OAuth configuration for RP applications inside the granted partner workspace only. |
| Department self-setup | `/your-applications/$rpApplicationUuid/department-setup` | `PATCH /api/v1/rp-applications/mine/{rp_application_uuid}/department` | deny | deny | deny | Invitation-backed users inherit existing partner context and should not assign department context themselves. Department remains metadata, not access scope. |
| Client credentials and secret rotation | `/your-applications/$rpApplicationUuid/manage-credentials` | `GET /api/v1/rp-applications/mine/{rp_application_uuid}/client`, `GET /api/v1/rp-applications/mine/{rp_application_uuid}/client/rotated-secrets`, `POST /api/v1/rp-applications/mine/{rp_application_uuid}/client/rotate-secret`, `POST /api/v1/rp-applications/mine/{rp_application_uuid}/client/rotated-secrets`, `DELETE /api/v1/rp-applications/mine/{rp_application_uuid}/client/rotated-secrets/{value}` | allow | allow | deny | `Read Only` cannot view secret values or mutate secret state. Access is allowed only when the RP application belongs to the granted partner workspace. |
| MAU report | `/your-applications/$rpApplicationUuid/mau-report` | `GET /api/v1/rp-applications/mine/{rp_application_uuid}/mau-report` | allow | allow | allow | Read-only reporting for RP applications inside the granted partner workspace only. |
| Invitation management | `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/developer-invitations` | `GET`, `POST`, revoke, and reissue on `/api/v1/workspaces/{workspace_uuid}/applications/{rp_application_uuid}/developer-invitations` | allow | deny | deny | `RP Admin` can invite only `RP User (Edit)` and `Read Only` within the same partner workspace context. Only `CL Admin` can assign `RP Admin`. |
| Workspace and platform-admin surfaces outside invitation scope | `/workspaces`, `/workspaces/$workspaceUuid`, workspace-scoped application admin routes, `/roles`, `/users` | Corresponding workspace, membership, RP-application admin, and platform-admin APIs | deny | deny | deny | Invitation acceptance does not grant workspace membership or reusable platform-admin authority. |

Implication for implementation:

- when a partner-scoped invited-role grant exists for workspace `W`, `/api/v1/rp-applications/mine` should return every RP application in workspace `W` that is still active
- per-RP inclusion lists are out of scope for the first release
- if future product needs require limiting a partner user to only selected RP applications inside a workspace, that should be added as a later change instead of being implied now
- implementation may use coexistence mode while rollout is incomplete: owner-email checks can remain as fallback for pre-existing owner access, but invitation-backed users must gain access from partner-scoped local grants rather than from owner-email snapshots alone

## Standards impact

```yaml
standards_impact:
	ui:
		applies: true
		decision: Use the shared authenticated shell plus GC Design System components. Use PAT-023 for platform-admin invitation management tables and PAT-017 for acceptance-state summaries and notices.
		evidence: Route plan and invitation-state UI tasks recorded in this design and tasks file.
		exceptions: []
	accessibility:
		applies: true
		decision: Acceptance, error, and success states must have clear headings, notices, focus management, and keyboard-accessible actions.
		evidence: Frontend verification tasks for loading, error, mismatch, revoked, expired, and accepted states.
		exceptions: []
	official_languages:
		applies: true
		decision: Invitation management and acceptance copy must ship in English and French with route parity.
		evidence: Locale updates and frontend tests or fixtures for both languages where practical.
		exceptions: []
	security_privacy:
		applies: true
		decision: Invitation tokens must not be stored or logged in plaintext, acceptance must validate the signed-in email against the invited email, and denial paths must not leak unrelated workspace or RP-application data.
		evidence: Token-handling design notes and backend authorization tests.
		exceptions: []
	identity_access:
		applies: true
		decision: Invitation-backed access must be designed alongside the current OIDC group gate and current-user RP application access model, including the pending-invitation check on first login, local user-record role assignment, and the invitation-backed exception to self-service department setup.
		evidence: IAM-focused design tasks and tests for accepted, mismatched, and uninvited users.
		exceptions: []
	information_management:
		applies: true
		decision: Invitation records are business records that need explicit ownership, timestamps, lifecycle status, and audit-safe identifiers.
		evidence: Persistence and migration tasks using STD-020 and PAT-012.
		exceptions: []
	verification:
		applies: true
		decision: Validate this change package and add targeted backend and frontend tests for invitation lifecycle and access scoping.
		evidence: `make validate-openspec-change`, backend tests, and frontend route or state tests.
		exceptions: []
	gc_web_application_baseline:
		applies: true
		decision: Treat the eventual invitation-management implementation as a meaningful GC web application change.
		evidence: Baseline applicability captured when implementation starts.
		exceptions: []
```

## Slice Plan

### Slice 1: Invitation management contract

- Outcome: `CL Admin` users can create, list, role-assign, revoke, and reissue invitations for one existing department-owned workspace-scoped RP application, and accepted `RP Admin` users can invite additional staff within permitted role boundaries.
- Impacted areas: management route, management API, persistence, optional delivery integration, tests.
- Exit condition: partner prerequisites, invitation actions, bootstrap versus delegated actors, assigned roles, and table behavior are defined.

### Slice 2: Invitation acceptance and identity validation

- Outcome: invitees can open a tokenized route, validate the invitation against their signed-in email, inherit the invitation's existing partner context, and receive the right accepted or denied outcome.
- Impacted areas: acceptance route, token validation, OIDC or session entry behavior, local user-record updates, frontend authenticated-route gating, locale copy, tests.
- Exit condition: valid, invalid, expired, revoked, email-mismatch, and first-login role-assignment paths are defined.

### Slice 3: Partner-scoped invited-developer access

- Outcome: accepted invitees can reach only RP applications inside the granted partner workspace context and cannot access unrelated RP applications or workspace routes.
- Impacted areas: current-user RP application queries, authorization checks, replacement or extension of current owner-email access checks, access mapping, tests.
- Exit condition: allowed and denied surfaces are enumerated and testable.

### Slice 4: Verification and archive coordination

- Outcome: invitation lifecycle, acceptance, and access-scoping checks are ready for verification, and later archive preserves sibling onboarding guidance for the same capability.
- Impacted areas: OpenSpec validation, backend and frontend tests, archive follow-through notes.
- Exit condition: verification tasks and archive-coordination tasks are explicit.

## Implementation readiness

- Ready after: the supported invitation role catalog and allowed invited-developer surface list are resolved.
- Recommended implementation order:
	1. Slice 1 invitation management contract
	2. Slice 2 acceptance and identity validation
	3. Slice 3 app-scoped access enforcement
	4. Slice 4 verification and archive coordination
- Current blockers:
	- the current OIDC login gate must be reconciled with pending-invitation checks and first-login role assignment
	- the current `/rp-applications/mine` access model still derives visibility from `application_owner` email snapshots and must be replaced or extended for invitation-backed access
	- the frontend authenticated-route gate still redirects users without a department to `/profile/setup`, which conflicts with the invitation rule that accepted invitees inherit partner context instead of completing self-service department setup
	- implementation must replace the current owner-email guard points in `list_current_user_rp_applications`, `get_current_user_rp_application_department_preflight`, `assign_current_user_rp_application_department`, `_get_current_user_secret_context`, and the `get_current_user_rp_application_by_uuid` path used by MAU reporting so partner-scoped role grants become the new access source of truth

## Open Questions

- Human decision required only if implementation reveals a route or API contract that cannot support the adopted first-release permission boundary without additional slicing.
