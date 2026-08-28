# Proposal

## Why

The Administration `Users and access` module currently behaves like a generic
user CRUD table. Its primary action creates an immediately enabled local user,
the table gives identity-provider provenance the same prominence as access,
and workspace assignments are managed only after navigating into one
workspace. This does not match the canonical authorization model or the
intended onboarding journey:

- CL Admin needs one cross-workspace place to invite a new partner user and to
  manage an existing user's global and workspace access.
- A new user's invitation must select the workspace and role before the user
  accepts it; a separate create-then-assign sequence is not a valid product
  workflow.
- The initial RP Admin must be invitable after the workspace exists and before
  any RP application exists.
- RP Admin still needs the workspace `Access` surface to manage lower partner
  roles only inside the assigned workspace.
- `auth_provider` is useful backend identity-link provenance, but is not a role
  and is not useful as a primary CL Admin directory column when CanadaLogin is
  the production identity path.
- Shared data-table actions currently expose contextual screen-reader text
  visually because the hidden-text class is not defined, producing long labels
  such as `Manage <record name>`.

## Work Context And Assumptions

- Context: local developer and localhost implementation and verification under
  STD-002.
- Data: fake, seeded, or test-only identities, workspaces, assignments, and
  invitations only.
- External systems: CanadaLogin, IBM Security Verify, and GC Notify are not
  called. Local persona sessions remain the explicit identity substitute.
- Email delivery: automatic invitation email delivery is not required; the
  existing generated acceptance-link behavior remains sufficient for local
  verification.
- Identity: `auth_provider` and `auth_subject` remain server-side identity
  provenance. This change removes provider provenance from the primary user
  directory presentation; it does not replace CanadaLogin or use roles as
  identity-provider values.
- Records: invitation, assignment, revocation, replacement, and audit history
  remains retained under the current logical lifecycle. Physical disposition
  and a long-term retention schedule remain future work and no records are
  deleted by this change.
- Authorization: the archived four-role model and its delegation matrix remain
  authoritative. This change adds no product role or permission.

## What Changes

- Replace the Administration `Create user` product action with `Invite user`.
- Make `/users` the CL Admin cross-workspace user and access directory.
- Add focused `/users/invite` and `/users/$userUuid` task routes.
- Show global and workspace access summaries in the directory instead of the
  raw authentication-provider column.
- Let CL Admin add, replace, or revoke an existing user's permitted workspace
  role from the user detail route by reusing canonical role-assignment APIs.
- Create invitations directly in a workspace, with an optional RP application
  source only when the invitation was started from an application.
- Allow CL Admin to invite the first RP Admin before any RP application exists.
- Keep workspace `Access` as the scoped surface where RP Admin manages only RP
  User (Edit) and Read Only and where CL Admin may work in workspace context.
- Keep invitation acceptance identity-matched and make its success destination
  the assigned workspace when no RP application exists.
- Keep backend identity-provider provenance and remove it from the main table.
- Use concise visible row actions such as `Manage` or `View`, with the record
  identity included only in the accessible name.

## Capabilities

### Modified Capabilities

- `partner-portal-platform-administration-and-supportability`
- `partner-portal-external-developer-invitations-and-scoped-access`
- `partner-portal-workspace-and-rp-application-management`

## Impact

- Active OpenSpec deltas and the page-pattern decision for Users and access.
- Frontend user directory, focused invite and manage-access pages, workspace
  Access invitation behavior, routes, query hooks, API clients, translations,
  table action accessibility, and tests.
- Backend workspace invitation routes, invitation service, public schemas,
  user access-summary reads, canonical role-assignment orchestration, audit
  metadata, and authorization tests.
- An additive Alembic revision making the invitation's RP application source
  optional while retaining required workspace ownership and existing records.
- Generated OpenAPI and TanStack Router artifacts through supported commands.
- BAS-001 controls GC-WEB-002 through GC-WEB-010, with GC-WEB-011 reviewed for
  safe audit and operational logging impact.

## Out Of Scope

- Creating, updating, or provisioning a user, group, role, workspace, or RP
  application in IBM Security Verify.
- Changing CanadaLogin sign-in, OIDC claims, session architecture, or identity
  binding.
- Automatic email delivery or GC Notify integration.
- New product roles, mutable role definitions, or permission editing.
- Physical deletion, retention scheduling, or disposition of identity,
  invitation, assignment, or audit records.
- Shared-environment deployment, production data, real credentials, or release
  approval.
