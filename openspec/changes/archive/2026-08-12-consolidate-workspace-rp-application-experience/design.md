# Design: Consolidate workspace RP application experience

## Context

The portal currently has two frontend representations of the same
workspace-owned RP application:

- `/your-applications` is a current-user projection whose detail page is an
  MVP1 IBM Verify-backed OAuth setup screen; and
- `/workspaces/$workspaceUuid/applications` is the MVP2 owner context, but its
  detail page mixes configuration, invitations, lifecycle actions, usage,
  audit, linking, and deletion.

The persistence model and current workspace requirements are authoritative:
a workspace is the partner container, application information is optional
workspace-owned service metadata, and an RP application is exactly one
environment-specific registration owned by one workspace. The current-user
list is not a second ownership model.

The reported registration failure is adjacent but independently diagnosable.
Basics creation and draft reload succeeded. The Endpoints `PATCH` returned
`422`, and the frontend mapped that response to the same unavailable-draft
notice used for load or server failures. The log does not expose the field or
contract error, so this design specifies recovery and verification behavior
without declaring an unproven implementation cause.

## Goals

- Make workspace ownership explicit in canonical RP application URLs, API
  projections, navigation, and authorization checks.
- Give both application lists the same secret-free RP summary semantics and
  shared presentation contract.
- Replace the MVP1 IBM-backed landing page with a focused RP application task
  hub.
- Provide a portal-owned, secret-free Configuration view that remains usable
  when IBM Verify is unavailable.
- Preserve existing Usage and Manage credentials capabilities on focused
  workspace-scoped routes.
- Make Step 2 validation actionable and recoverable, including protection
  against frontend/backend request-contract drift.

## Non-goals

- Provider synchronization, IBM Verify mutation, or provider reconciliation.
- Changing role definitions or granting CL Admin partner configuration or
  secret capabilities.
- Combining application information with environment-specific RP application
  records.
- Implementing the bug fix during this requirements-only pass.
- Adding operational metrics or configuration fields to the task-hub landing
  page.

## Domain and ownership model

```text
Department
  -> Workspace (partner boundary)
       -> Application information (optional shared service metadata)
            -> zero or more linked RP applications
       -> RP application (one CanadaLogin environment registration)

Current user
  -> active canonical workspace grants
       -> authorized projection of the same RP applications
```

The RP application's `workspaceUuid` is part of every canonical navigation and
resource-scope decision. An application-information link adds service context
but never changes RP ownership. Multiple environment registrations may link to
the same application-information record without becoming one RP record.

`/your-applications` remains valuable for users assigned to more than one
workspace. It is an operational index over grant-authorized RP summaries, not
an alternate detail hierarchy. Selecting an item resolves to the canonical
workspace route returned by the summary.

## Canonical routes

| User goal | Canonical route |
|---|---|
| Browse the current user's RP applications | `/your-applications` |
| Browse one workspace's RP applications | `/workspaces/$workspaceUuid/applications` |
| Select an RP application task | `/workspaces/$workspaceUuid/applications/$rpApplicationUuid` |
| View or edit portal registration configuration | `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/configuration` |
| View application usage | `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/usage` |
| Manage client credentials | `/workspaces/$workspaceUuid/applications/$rpApplicationUuid/manage-credentials` |

The old `/your-applications/$rpApplicationUuid` detail and focused child paths
remain temporary compatibility entries. They resolve the RP application
through the current user's server-scoped projection, verify the active grant,
derive `workspaceUuid`, and redirect to the equivalent canonical route. An
unknown, missing, revoked, or out-of-scope application receives the same safe
not-found behavior. Redirect logic must not load IBM Verify or secret data.

The existing accessible-resource backend APIs may remain compatibility
adapters for provider-backed Usage or credential operations during migration.
Canonical pages must validate that the RP application belongs to the workspace
in the URL and authorize the operation using that workspace's active grant
before invoking those adapters. New portal-owned overview, summary, and
Configuration reads use workspace-scoped APIs.

## Shared RP application summary

Both `/your-applications` and the selected-workspace list consume one
secret-free summary schema. The current-user endpoint adds grant role and
workspace label as projection context, but it does not redefine RP fields.

The common user-visible summary contains:

- RP application UUID and owning workspace UUID;
- localized English/French RP application name;
- localized workspace name where the surface is cross-workspace;
- CanadaLogin environment;
- onboarding state;
- promotion state when available; and
- the next permitted resume-task destination when work is incomplete.

Provider identifiers, client identifiers, credentials, secrets, raw provider
status, raw authorization policy, and IBM payloads are excluded. List ordering,
status labels, badges, empty states, and meaningful link text use the same
shared component or presentation adapter on both surfaces. Workspace context
may be visually compact inside the workspace-owned list because it is already
identified by the page H1; the underlying summary meaning remains identical.

## RP application overview task hub

The canonical overview follows `PAT-001: UI Page Patterns` and the selected
page-pattern decision:

- one localized RP application name as H1;
- concise portal-owned environment and lifecycle context below the H1;
- one single-destination GC Design System card for each permitted feature;
- no embedded configuration rows, provider request, usage result, credential
  value, invitation table, audit trail, edit form, or destructive control.

Card availability follows canonical capability checks in the RP application's
workspace:

| Role | Configuration | Usage | Manage credentials |
|---|---|---|---|
| RP Admin | read/write | read | read/lifecycle |
| RP User (Edit) | read/write | read | read/lifecycle |
| Read Only | read | read | hidden and denied |
| CL Admin | hidden; only permitted overview metadata remains | hidden | hidden and denied |

Capabilities, not role-name checks distributed through page components, are
the implementation source. The current matrix maps the cards to
`rp_configuration_read`, `mau_report_read`, and both `partner_secret_read` and
the appropriate secret-lifecycle permission. Direct child routes and backend
operations enforce the same boundary even when a card is hidden.

## Focused Configuration view

Configuration is the human-readable view of the portal-owned registration
record and server-backed registration draft/submission state. It is not a live
IBM Verify detail view. It groups the saved questionnaire using semantic
headings and definition or itemized data patterns, including when present:

- application identity, environment, application URLs, and lifecycle state;
- redirect and post-logout redirect URLs, logout mode, and logout URL;
- client type, authentication method, public key-distribution choice, scopes,
  sector identifier, pairwise identifier sharing, and PKCE;
- message-signing and validation selections and algorithms; and
- encryption, decryption, roadmap, and revisit-date answers.

Only active, safely displayable fields are returned. Private JWK members,
symmetric keys, credentials, client secrets, tokens, raw provider payloads,
and internal policy data are never serialized. Public certificate/JWK content
is handled by the existing public-key safety rule and may be represented by a
safe presence or exchange-status summary instead of rendering raw material.
The public CanadaLogin discovery endpoint may be included from backend OIDC
configuration when useful; its absence does not make Configuration
unavailable.

RP Admin and RP User (Edit) receive focused Edit or Resume registration links
when lifecycle state permits. Read Only receives the same permitted values
without mutation controls. Delete or unlink remains a separately confirmed,
capability-protected action associated with Configuration, not a task-hub
card. Application-information editing stays on application-information routes.

## Rehoming the overloaded workspace detail

Every action on the current long workspace detail page must be inventoried
before replacement:

| Existing responsibility | Destination |
|---|---|
| View questionnaire/configuration | Configuration |
| Resume or edit registration | Configuration |
| Link/unlink application information | Configuration or its focused edit flow |
| Delete RP application | Confirmed action from Configuration |
| Usage summary/report | Usage |
| Credential lifecycle | Manage credentials |
| Partner invitations and workspace role access | Workspace Access |
| RP audit trail | Existing focused audit/report route or secondary link from Usage; not a fourth primary card |
| Application-information details | Existing application-information route |

No responsibility is silently dropped. If an action lacks a safe focused route
during implementation, the old detail remains as a temporary compatibility
surface for that action until the task and tests are migrated.

## Registration Step 2 validation and recovery

`completeStep` remains a server validation boundary. The frontend sends the
documented camelCase registration-draft contract, including `stepId`,
`saveMode`, `expectedDraftVersion`, and current `registrationAnswers`. The
generated schema or a shared typed adapter is the source for serialization;
hand-maintained key renaming is covered by an integration/contract test.

For a correctable `422`:

- remain on Endpoints;
- keep the user's entered values in the form;
- keep the last server-saved draft and version as the recovery baseline;
- focus a localized error summary linked to affected controls;
- show safe field-level messages for validation issues returned by the API;
- avoid “draft could not be loaded or saved” wording; and
- do not mark the step complete or advance.

For a version conflict, reload/merge behavior follows the existing draft
concurrency requirement rather than silently overwriting. For a network,
service, or unexpected persistence failure, show the scoped localized retry
notice while preserving the form and last server-saved state. A genuine draft
load failure remains distinct because no usable step data is available.

Tests must prove a representative valid Endpoints payload advances and returns
the next draft version. They must also send the actual frontend-serialized
payload through the backend contract to catch alias, enum, conditional-field,
and list-shape drift. Logs record actor reference, workspace/RP identifiers,
step, safe field names, result, stable error code, request/correlation ID, and
no questionnaire values, URLs, certificates, keys, credentials, or tokens.

## API and data changes

- Define one strict `RPApplicationSummaryRead`-style schema used by workspace
  and current-user projections; naming may follow the established schema
  module, but field semantics are shared.
- Add or adapt a workspace-scoped, secret-free RP overview/configuration read.
- Keep authorization and RP/workspace ownership checks server-side.
- Preserve existing registration persistence; no database migration is
  expected unless implementation discovers a missing portal-owned field.
- Treat a newly discovered schema or migration need as a design checkpoint and
  update this change before implementation continues.
- Deprecate the IBM-backed accessible OAuth setup endpoint after all callers
  migrate; remove it only with route/API compatibility tests and no remaining
  internal references.

## Accessibility, bilingual, security, and privacy

- Use the shared AppShell, main landmark, skip target, breadcrumbs, GCDS
  headings, cards, links, notices, and error summary components.
- Cards have one linked title and no nested controls. Source, keyboard, and
  visual order remain the same and reflow to one column at narrow widths and
  200-percent zoom.
- English and French names, headings, card content, status labels, route
  metadata, errors, field feedback, accessible names, and redirects have
  equivalent behavior. Long French text must not clip or overflow.
- Localized RP names use the active language with an explicit safe fallback;
  raw UUIDs are not primary labels.
- Authorization occurs before returning summary/configuration data or invoking
  provider-backed operations. Missing and out-of-scope resources share safe
  not-found behavior.
- No configuration landing request retrieves secrets. Credential values remain
  confined to the focused credential route, masked by default, and governed by
  existing audit and lifecycle requirements.

## Standards and controls

- Standards: `STD-002`, `STD-004`, `STD-005`, `STD-006`, `STD-007`,
  `STD-008`, `STD-009`, `STD-010`, `STD-011`, `STD-013`, `STD-014`,
  `STD-017`, `STD-018`, and `STD-019`.
- Patterns: `PAT-001`, `PAT-013`, `PAT-014`, `PAT-017`, `PAT-020`, and
  `PAT-022`.
- Baseline: `BAS-001`.
- Affected controls: `GC-WEB-002`, `GC-WEB-003`, `GC-WEB-004`,
  `GC-WEB-005`, `GC-WEB-007`, `GC-WEB-008`, `GC-WEB-010`, and
  `GC-WEB-011`.
- Custom UI or CSS exception: none planned.
- At adoption Level 2, implementation records focused verification and skipped
  checks. A formal baseline assessment or Evidence Bundle is deferred unless
  release-readiness scope is requested.

## Slice plan

### Slice 1: Reproduce and repair Endpoints validation recovery

Capture the actual `422` response body locally, add frontend-to-backend
contract fixtures, identify whether the cause is invalid input or serializer
drift, then implement actionable error summary/field feedback and the valid
advance regression. This slice does not depend on route consolidation.

### Slice 2: Shared summary and canonical navigation

Align backend summary schemas and list presentation, make both list surfaces
link to the workspace-scoped overview, add compatibility redirects, and update
the active Reports change to use workspace-scoped application usage routes.

### Slice 3: RP task hub and Configuration

Build the role-aware three-feature task hub and secret-free portal
Configuration route, then move every compatible action from the long detail
page to its focused owner.

### Slice 4: Usage and credential route migration

Move the user-facing Usage and Manage credentials entries under the workspace
route, preserve server-side grant/ownership enforcement and temporary legacy
redirects, and remove remaining IBM-backed landing dependencies.

### Slice 5: Verification and archive

Run focused backend/frontend, contract, authorization, accessibility,
bilingual, responsive, route, and local browser checks. Remove deprecated
surfaces only after callers and action inventory are complete, validate the
OpenSpec change strictly, then archive without `--skip-specs`.

## Open questions

None block local implementation. The exact invalid Endpoints field or contract
shape remains an implementation investigation with an explicit stop condition:
do not loosen server validation or discard an answer solely to make the request
pass.
