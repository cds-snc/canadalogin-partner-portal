# Proposal

## Why

The workspace area currently has the right domain capabilities but not a
coherent user journey. Workspace detail presents metadata before its task
links, the legacy `/members` label no longer matches canonical role assignments
and invitations, partner reporting has no discoverable workspace route, raw
workspace UUIDs appear as context, and the conditional RP registration
questionnaire is treated as one long form.

STD-005, STD-006, PAT-001, PAT-019, PAT-021, and PAT-022 point to a workspace
task hub with focused destinations and a route-per-step registration flow. This
change records that deeper workspace information architecture without widening
the global Home/navigation change or duplicating the four-role authorization
model.

## Work Context And Assumptions

- Context: local developer and localhost planning default per STD-002.
- Data posture: fake, seeded, or test-only data for local verification.
- Source-of-truth assumption: current shipped workspace and reporting behavior
  remains current until this change is implemented, verified, and archived.
- UI assumption: `/workspaces` remains the workspace chooser/list and
  `/workspaces/$workspaceUuid` becomes the selected workspace task hub.
- Draft assumption: `/workspaces/$workspaceUuid/applications/new` collects and
  validates the minimum Basics identity before creating a server-backed
  workspace RP application
  draft. After that first successful save, the returned RP application UUID,
  server-held questionnaire payload, completed-step marker, and monotonic draft
  version are the durable source for save-and-return behavior. The same record
  may be resumed only while its onboarding state is `draft`; submitted,
  under-review, approved, launched, unknown, or missing-state registrations are
  not editable through this flow. Route state or browser storage alone is not
  a draft source.
- Scope boundary: this change refines routes, page roles, draft/task-flow
  behavior, navigation, and UI evidence. It does not define new product roles,
  permission values, report formulas, onboarding questionnaire fields, or
  production rollout decisions.

## Dependencies And Ownership

- Archived `define-four-role-authorization-model` owns canonical roles, workspace scope,
  assignment and invitation behavior, secret boundaries, aggregate-report
  permissions, and backend authorization.
- This package is rebased against the archived change's merged current
  capabilities and does not restate the role matrix.
- `add-authenticated-home-and-navigation-groups` owns Home and the global
  Partner work navigation group. This package owns the routes and page patterns
  below its `Workspaces` destination.
- Existing reporting requirements own metric definitions, filters, aggregate
  scope, and exports. This package gives partner reporting a discoverable
  workspace route.

## What Changes

- Keep `/workspaces` as the accessible workspace chooser/list.
- Make `/workspaces/$workspaceUuid` a PAT-001 workspace task hub.
- Add persistent workspace navigation for Overview, Application information,
  RP applications, Access, Reports, and Settings, filtered by canonical
  authorization.
- Use `/workspaces/$workspaceUuid/access` as the canonical user-facing route for
  role assignments and invitations; redirect legacy `/members` links there.
- Use `/workspaces/$workspaceUuid/reports` for aggregate partner reporting
  explicitly scoped to the selected workspace.
- Keep record-level application audit on existing application routes and make
  its path discoverable from the workspace task area without inventing a new
  cross-application audit API.
- Use workspace names rather than raw UUIDs as primary visible context,
  breadcrumb text, and navigation labels.
- Replace the long conditional RP registration form with a PAT-019
  route-per-step flow covering Basics, Endpoints, Client and access, Signing,
  Encryption, Review, and Confirmation.
- Make the existing `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/edit`
  route a compatibility entry that resumes a `draft` registration at its
  canonical step and safely returns all non-draft or unknown states to detail
  without mutation.
- Define the existing resource-oriented draft API and PostgreSQL record shape,
  server-backed partial persistence, step completion versus incomplete
  draft persistence, Continue, Back, Save and
  exit, Cancel, review/change, final submission, refresh, session-expiry,
  network-error, and language-switch recovery behavior.

## Capabilities

### Modified Capabilities

- `partner-portal-workspace-and-rp-application-management`
- `partner-portal-onboarding-oversight-and-reporting`

## Impact

- Frontend workspace route tree, task-hub content, side navigation,
  breadcrumbs, compatibility redirects, and route metadata.
- Workspace Access and Reports entry routes connected to role-owned APIs and
  capability guards.
- Workspace RP application create/draft-edit flow, server-backed draft
  contract, lifecycle editability matrix, and registration route sequence.
- English/French content, page titles, step labels, error/recovery copy,
  breadcrumbs, and accessible names.
- Backend/API and persistence work needed to support durable drafts, partial
  draft persistence, step-save/recovery, optimistic conflict handling,
  lifecycle edit guards, an atomic final transition, and a workspace-scoped
  BFF facade over the existing aggregate-report service.
- Generated OpenAPI and frontend wire clients for the changed RP application
  draft and workspace report contracts, without a new universal envelope or
  casing migration.
- Focused UI, API-contract, route, draft-recovery, accessibility, responsive,
  and bilingual tests and evidence.

## Resolved Direction

- Workspace entry pages are task hubs, not dashboards.
- Operational reporting gets a dedicated focused page; it is not embedded in
  the workspace hub.
- Access replaces the legacy Members concept at the UI boundary.
- The OIDC questionnaire is one consequential multi-step transaction, not a
  long single page or a collection of hidden accordions.
- Final submission is the only action that advances final business state;
  intermediate saves update a `draft` registration without marking incomplete
  steps valid or transitioning it from `draft` to `submitted`.
- Final submission is a portal-local lifecycle transition only. Creating,
  saving, or submitting the registration does not create, update, or provision
  an RP in IBM Verify; a separate IBM-integration package owns those actions.
- Offline key exchange accepts public certificate/public JWK material only;
  private or symmetric key intake is not part of the ordinary registration
  record or this change.
- Backend authorization remains authoritative for every workspace, task, step,
  report, assignment, invitation, and audit request.

## Out Of Scope

- Changing the four canonical roles or their capabilities.
- Defining assignment, invitation, credential, or report data semantics already
  owned by the role and reporting changes.
- Adding new aggregate metrics, cross-application workspace audit queries, or
  charts.
- Changing the onboarding questionnaire field catalog or business validation
  rules; this change only distinguishes incomplete draft persistence, step
  completion, complete final-submit validation, and the security boundary that
  forbids private or symmetric key material in the existing offline public-key
  field.
- Designing amendments or revisions for `submitted`, `under_review`,
  `approved`, or `launched` registrations; those states remain non-editable
  until a separately specified revision lifecycle exists.
- Calling, provisioning, updating, or synchronizing IBM Verify. The submitted
  portal record is an input to the separately governed IBM-integration flow.
- A global workspace switcher; users select context through `/workspaces`.
- Production deployment, shared environments, real data, or real secrets.
