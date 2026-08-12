# Proposal: Show pending invitations in Users and access

## Why

Give CL Admins one cross-workspace view of active pending invitations on
`/users`, including invitations for people who do not yet have a local user
record.

## Problem or opportunity

The portal creates a local user only after a matching Canada Login identity
accepts an invitation. Until then, the invitation is visible only from the
specific workspace Access page. A CL Admin who starts from Users and access
cannot tell who has been invited without opening workspaces one by one.

## Work context

- Local developer / localhost with fake or test-only invitation data.
- No shared environment, production data, deployment, real secret, or
  external-system interaction is in scope.

## Resolved questions

| Question | Answer | Source | Classification | Confidence |
|---|---|---|---|---|
| Should an unaccepted invitee appear as an active user? | No. The user identity and canonical workspace assignment are created or bound only through invitation acceptance. | `partner-portal-external-developer-invitations-and-scoped-access`; archived Users and access design Decision 2 | fact | high |
| Where can invitations be seen today? | Only within an individual workspace Access surface, or on an existing user's focused access page when the invited email already matches that user. | Current API, frontend routes, and Users and access design | fact | high |
| What is the safe local repair? | Add a separate pending-invitations directory to `/users` and link management to the invitation's workspace Access page. | Existing PAT-023 page-pattern decision and user request | safe_assumption | high |

## What Changes

- Add a CL-Admin-only, paginated API projection for active pending
  invitations across non-deleted workspaces.
- Show a separate Pending invitations table on `/users` with invited email,
  workspace, requested role, pending status, expiry, and a concise Manage
  action.
- Link Manage to the existing workspace Access page where invitation lifecycle
  actions already live.
- Refresh the cross-workspace invitation query after create, revoke, or
  reissue operations.
- Cover loading, populated, empty, error, bilingual, authorization, and API
  contract behavior.

## Out of scope

- Treating invitees as enabled users before acceptance.
- Moving revoke or reissue controls into `/users`.
- Invitation history, accepted or revoked invitation reporting, delivery, or
  IBM Security Verify integration.
- Shared-environment or production work.

## Requirements or scenarios affected

- Current spec:
  `openspec/specs/partner-portal-platform-administration-and-supportability/spec.md`
- Requirement: Users and access presents canonical access rather than provider
  internals.
- New scenarios: CL Admin reviews pending invitees across workspaces; the
  invitation directory has a clear empty state.

## Risks

- Invited email is personal information. The endpoint remains CL-Admin-only,
  returns only minimum lifecycle fields, and does not expose invitation tokens,
  provider data, or internal database identifiers.
- Invitation and user rows could be confused. The UI uses a separately headed
  table and explicitly describes invitees as pending, not active users.

## Links

- `STD-002: Work Contexts`
- `PAT-023: Frontend Data Table`
- `PAT-024: Full-Stack Feature Slice`
- Existing Users and access page-pattern decision:
  `openspec/changes/archive/2026-08-12-refine-cl-admin-users-and-access-onboarding/users-and-access-page-pattern-decision.yaml`
