# Proposal: Define the Four-Role Authorization Model

## Why

The portal currently has several overlapping authorization concepts: reusable
platform roles, the user is_superuser flag, workspace membership roles,
partner access-grant roles, upstream OIDC group names, and direct Casbin
subjects. Those concepts do not produce one reliable product role model. In
particular, assigning the reusable admin role does not make a user a functional
CL Admin, partner role and scope are not returned to clients, and a clean local
environment cannot exercise the intended role branches.

The product direction is now explicit: the portal supports exactly four product
authorization roles for this phase:

- CL Admin
- RP Admin
- RP User (Edit)
- Read Only

This change makes those four roles authoritative across requirements, data,
APIs, backend authorization, frontend visibility, invitation lifecycle,
reporting, and local development.

## Work Context And Control Boundary

- Context: local developer and localhost planning per STD-002.
- Allowed work: repository-scoped specification and design changes, fake or
  fixture data design, and local validation.
- Data posture: fake, seeded, or test-only data; no real user records.
- Identity-provider mode: unavailable for this planning slice. OIDC remains the
  selected real identity path, while PAT-018 defines the future local-only
  identity substitute.
- Denied scope: production, shared environments, real credentials, real
  personal information, deployment, external-system mutation, approval, or
  waiver decisions.
- Reusable artifacts use durable domain names. Names beginning with local are
  reserved for disposable local personas and fixtures.

## What Changes

- Define one fixed, immutable four-role taxonomy and permission matrix.
- Make CL Admin the only global platform role and retire is_superuser as an
  independent authorization source.
- Make RP Admin, RP User (Edit), and Read Only workspace-scoped partner roles
  backed by one canonical partner access-grant model.
- Retire arbitrary reusable-role CRUD and the separate workspace_admin and
  workspace_member authorization vocabulary.
- Replace user.role_ids JSON as an authorization source with a normalized
  user_role association and explicit assignment lifecycle. Preserve the
  dormant legacy field until a future cutover/disposition change authorizes
  physical removal.
- Constrain workspace/partner role values and invitation/grant lifecycle values
  with shared application types and database constraints.
- Add referential integrity for source_invitation_uuid and preserve invitation
  and assignment history.
- Return canonical role and workspace scope through authenticated-user and
  current-user application API contracts.
- Replace owner-derived `/api/v1/rp-applications/mine` contracts with
  grant-derived `/api/v1/rp-applications/accessible` contracts. Historical
  application-owner snapshots do not authorize these resources.
- Make role revocation and role replacement effective on the next protected
  request.
- Align invitation acceptance, stale-link handling, scoped reporting, route
  visibility, and secret boundaries with the four-role matrix.
- Define deterministic local personas that exercise all four roles plus
  no-access and cross-scope failures through the real backend authorization
  boundary.

Breaking changes:

- BREAKING: role-definition create, rename, and delete operations are removed.
- BREAKING: user.role_ids and is_superuser stop being authorization contracts.
- BREAKING: workspace_admin and workspace_member stop being accepted role
  values.
- BREAKING: authenticated-user responses replace isSuperuser/raw role IDs with
  a scope-aware authorization context.
- BREAKING: current-user RP application endpoints under
  `/api/v1/rp-applications/mine` are retired in favour of the
  `/api/v1/rp-applications/accessible` route family and accessible-resource
  DTOs.
- BREAKING: legacy application owners data and upstream group claims do not
  create partner access.

## Capabilities

### Modified Capabilities

- partner-portal-role-management
- partner-portal-external-developer-invitations-and-scoped-access
- partner-portal-workspace-and-rp-application-management
- partner-portal-onboarding-oversight-and-reporting
- partner-portal-platform-administration-and-supportability
- partner-portal-access-and-dashboard
- current-user-rp-oauth-setup
- current-user-rp-application-department-setup

### Related Active Change

- add-authenticated-home-and-navigation-groups owns authenticated Home and
  grouped navigation. It consumes the authorization context from this change
  and must be rebased against the resulting current access/dashboard spec
  before implementation or archive.

## Resolved Decisions

- Product review approved the four-role wording and permission boundaries on
  2026-08-11 without behavioural refinement.
- Exactly four product authorization labels are supported for this phase.
- Stable machine keys are cl_admin, rp_admin, rp_user_edit, and read_only.
- CL Admin is global and internal; it cannot access RP secret values or perform
  partner-side secret lifecycle actions.
- Partner roles are scoped to one workspace and apply to every RP application
  in that workspace.
- A user may hold partner roles in multiple workspaces, but at most one active
  partner role in each workspace.
- A CL Admin account does not concurrently hold a partner role. Separate local
  personas are used when both product perspectives need testing.
- RP Admin can invite RP User (Edit) and Read Only users in the same workspace,
  but only CL Admin can assign RP Admin.
- Role definitions are fixed reference data. Administration manages
  assignments, not arbitrary role definitions.
- OIDC establishes identity only. Server-owned local assignments determine
  authorization.
- Unknown, deleted, revoked, legacy, or malformed role values fail closed.
- Existing explicit canonical partner grants are preserved during migration.
  Legacy workspace_admin and workspace_member rows are reported but never
  converted into canonical partner grants, because either conversion could
  create new product authority. They remain non-authoritative after cutover;
  partner access is established later through canonical workspace and role
  management. No legacy record is inferred as RP Admin, RP User (Edit), or
  Read Only.
- The application owners role, historical owner-email snapshots, and arbitrary
  reusable roles receive no automatic authorization mapping.
- No legacy admin, reusable-role, or is_superuser identity is promoted to CL
  Admin during migration. The initial CL Admin is established only through the
  idempotent application-managed database bootstrap script, using a newly
  designated internal identity rather than ad hoc SQL or legacy authority. A
  legacy identity receives partner access only through a new explicit
  canonical role-management action after its partner workspace exists. CL
  Admin creates the workspace and assigns its first RP Admin; same-workspace RP
  Admin manages RP User (Edit) and Read Only access under the approved matrix.
- Existing non-local records are preserved rather than reset, but legacy
  identity and workspace-membership state carries no canonical authority. The
  migration leaves every such row quarantined by default instead of requiring
  per-row access decisions.
- Physical deletion of dormant legacy authorization columns, role rows, owner
  snapshots, or workspace-membership history is not part of this MVP. Those
  records remain non-authoritative and preserved until a future production-
  cutover change defines backup, disposition, and rollback expectations.
- Launch will adopt RP registrations already stored by MVP1 through a focused
  CL Admin workflow after partner workspaces exist. A CL Admin explicitly links
  one unassigned local RP record to one workspace using its stable IBM
  application ID. An on-demand IBM Verify read may fill allowlisted missing
  non-secret metadata, but it never imports secrets, overwrites non-empty local
  values, copies IBM audit history, or derives portal access from IBM owners.
  The implementation is owned by the dependent active change
  add-cl-admin-rp-registration-adoption.
- Durable privileged-decision auditing uses an independent request-scoped
  audit outbox. An allowed privileged action fails closed if its minimized
  decision cannot be durably enqueued before execution. An already denied or
  failed request keeps that outcome while audit persistence is retried and
  alerted. This MVP preserves authorization records and audit events without
  automatic deletion. The exact retention and disposition schedule is
  intentionally deferred to a future production-cutover MVP and does not block
  implementation or archive of this change.

## Out Of Scope

- Production or shared-environment cutover.
- Real identity-provider configuration or assurance verification.
- New partner workflow capabilities unrelated to role enforcement.
- Defining or automating the production retention/disposition schedule for
  authorization records; a future production-cutover MVP owns that decision.
- Physically deleting dormant legacy authorization fields, relations, or
  historical rows before that future cutover/disposition decision.
- Authenticated Home information architecture, except for documenting its
  dependency on the authorization context from this change.
- Sending invitation email automatically.

## Dependencies And Sequencing

- Accepted ADR-003 records the four-role source, scope, precedence, policy, and
  object-authorization decisions implemented by this change.
- This change should establish and implement the authorization contract before
  add-authenticated-home-and-navigation-groups implements role-aware Home and
  navigation visibility.
- The access/dashboard delta in this change owns only department-onboarding
  precedence for invitation-backed and canonical partner access; it does not
  own the Home information architecture.
- The active Home change currently needs its own scenario-preservation repair
  before archive; this change does not modify that package.
- Database work follows STD-020 and PAT-012 using an expand, backfill, switch,
  and contract sequence.
- Local personas follow PAT-018 and PAT-025 and must be impossible to enable in
  shared or production modes.
- A non-local migration that preserves existing data first establishes the
  partner workspace inventory, then discovers IBM Verify RP registrations
  without deriving authority from owner metadata, and then links each reviewed
  RP registration to one established workspace before assigning a partner
  role. The import must preserve stable local RP UUIDs, IBM application IDs,
  and existing local secret-lifecycle audit history, and must not ingest secret
  values. The MVP1 portal audit store remains the record for portal-triggered
  secret operations; IBM history is not copied in or substituted as a new
  source of truth by this change.
- add-cl-admin-rp-registration-adoption owns the reviewed CL Admin candidate,
  metadata-preview, and explicit workspace-linking workflow. The unattended
  mutating synchronization job remains disabled outside local/test until that
  workflow is implemented and verified.

## Impact

- Backend models, migrations, repositories, services, policy resolution, OIDC
  admission, session/current-user schemas, invitation acceptance, reporting,
  audit logging, and seed scripts.
- Frontend authenticated-user types, route guards, role display,
  invitation controls, credential controls, reporting entry points, and
  English/French content.
- OpenAPI contracts and generated frontend expectations.
- Backend migration, lifecycle, permission-matrix, object-scope, invitation,
  reporting, and local-mode tests.
- Frontend route/action visibility and local-persona tests.
- Local setup documentation and safe sample configuration.
