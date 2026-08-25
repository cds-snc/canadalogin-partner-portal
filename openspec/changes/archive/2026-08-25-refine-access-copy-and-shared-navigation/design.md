# Design: Refine access, configuration copy, and shared navigation

## Technical approach

This change applies one consistent UI rule across the reviewed areas:

- a hub chooses among distinct tasks;
- a table compares repeated records with shared fields;
- a focused route performs one create, edit, review, or consequential action;
  and
- a link always names and preserves its actual destination record.

The existing role, invitation, RP-configuration, and review services remain the
authoritative domain owners. The route and page split must not create a second
permission model or copy lifecycle.

## Review findings

### Access administration

- `/administration` and `/workspaces/$workspaceUuid` already use appropriate
  single-destination task cards.
- `/users` already uses comparison tables for users and pending invitations.
- `/users/$userUuid` combines identity context, global access, repeated
  workspace assignments, an add-access form, and pending invitations.
- `/workspaces/$workspaceUuid/access` combines eligible-user search, current
  assignments, invitation creation, and invitation lifecycle actions in one
  long page.
- The pending-invitation row retains `invitationUuid`, but its `Manage` action
  navigates only to `/workspaces/$workspaceUuid/access`. The selected record is
  lost by design in the current test and current requirement.
- Workspace-assignment and invitation records use bordered item blocks where
  common columns and row-by-row comparison support a table.

### RP configuration

- The current page and API derive only Test-to-Staging or
  Staging-to-Production and call the operation progression.
- Existing storage already supports several named configurations under one
  Application and several configurations in one CanadaLogin environment.
- The current clone lineage and reusable-answer allowlist are suitable for a
  generalized copy service; no new Partner-environment entity is required.
- Creating a Production target currently creates review tracking in the same
  transaction. The existing focused Production-review flow can instead own
  that explicit intention.

### Shared menu

- The Partner work group contains only `Partner workspaces`.
- The application passes `closeTrigger="Close Partner work menu"`, which swaps
  the visible trigger text while expanded. That optional label causes the
  conspicuous Close control and layout shift.
- Real GCDS components defer focus-leave closure and use different visual and
  behavioral breakpoints, so the disclosure can visibly linger or remain open
  in intermediate and zoomed layouts.
- Top-level disclosures are not coordinated, and route selection or outside
  activation is not covered by the current requirement or tests.
- The current account nav group mixes non-link identity content, badges, a
  button, and a link even though the component's keyboard model expects
  navigation-link/group children.

## Canonical route design

### Central Users and access

| Purpose | Route | Pattern |
|---|---|---|
| Cross-workspace directory | `/users` | user and pending-invitation tables |
| Invite a user | `/users/invite` | focused form; retained |
| Selected user | `/users/$userUuid` | compact user-access task hub |
| Global access | `/users/$userUuid/global-access` | focused facts and permitted action |
| Workspace access | `/users/$userUuid/workspace-access` | assignment table |
| Add workspace access | `/users/$userUuid/workspace-access/new` | focused form |
| Pending invitations | `/users/$userUuid/invitations` | invitation table with canonical record links |

The user-access hub uses cards only for available single-destination tasks.
Assignment and invitation rows link to their canonical workspace-scoped record
when a record-specific action is available.

### Selected workspace Access

| Purpose | Route | Pattern |
|---|---|---|
| Access entry | `/workspaces/$workspaceUuid/access` | task hub |
| Current assignments | `/workspaces/$workspaceUuid/access/assignments` | comparison table |
| Add an existing user | `/workspaces/$workspaceUuid/access/assignments/new` | focused search/select form |
| Manage one assignment | `/workspaces/$workspaceUuid/access/assignments/$assignmentUuid` | focused detail/action flow |
| Invitations | `/workspaces/$workspaceUuid/access/invitations` | comparison table |
| Invite a user | `/workspaces/$workspaceUuid/access/invitations/new` | focused form |
| Manage one invitation | `/workspaces/$workspaceUuid/access/invitations/$invitationUuid` | focused lifecycle page |

`/workspaces/$workspaceUuid/members` continues to redirect safely to the Access
hub. Existing links that formerly expected a form or list on the Access entry
route land on the hub; new record actions always include the relevant public
assignment or invitation identifier.

### Route and state rules

- Breadcrumbs and visible parent links follow `Home -> Administration -> Users
  and access` or `Home -> Partner workspaces -> selected workspace -> Access`.
- A record-specific route revalidates the current session, capability,
  workspace, object ancestry, active/deleted state, and permitted action on the
  backend.
- A missing, revoked, parent-mismatched, or out-of-scope record receives the
  same safe unavailable response.
- Email addresses, invitation tokens, authorization payloads, and internal IDs
  are not placed in URLs, analytics, diagnostic body logs, or evidence.
- List state may use safe query parameters for pagination/filtering only when
  needed; it never carries authority.

### Account context

| Purpose | Route | Pattern |
|---|---|---|
| Safe account details | `/account` | focused authenticated facts page |

The shared shell keeps the signed-in display name and compact active workspace
or role context visible when that context changes the available tasks. The
account disclosure contains an `Account` link to `/account` and the existing
safe sign-out item. `/account` revalidates the current server-owned session,
shows only safe identity, organization, and canonical access summaries, uses
`Home` as its parent route, and never exposes provider subject, raw claim,
policy subject, internal identifier, permission dump, or secret. Its route
metadata, H1, content, accessible names, and language-equivalent destination
are bilingual. Unauthenticated direct entry follows the normal protected-route
admission flow.

## Access page and table design

- Preserve hub cards on `/administration`, selected workspace, selected user,
  and Workspace Access pages because they represent distinct destinations.
- Use `DataTable`/`GcdsTable` for repeated users, eligible-user results,
  assignments, and invitations. Each table has a caption, column headers, one
  useful row header, text status, and a concise action column.
- Do not wrap table rows in cards or place a form below a record collection on
  the same page.
- Use links for `View`, `Manage`, `Add`, and other navigation. Use buttons for
  submission, confirmation, revocation, reissue, cancellation, or another
  action that changes state without first navigating.
- Repeated visible action text may remain concise. Its accessible name includes
  the safe user, workspace, assignment, or invitation label needed to make the
  control unique.
- A focused mutation page explains scope and consequences, uses the canonical
  role choices permitted to the actor, and returns to the affected collection
  after success.
- Read Only users receive applicable data without disabled or misleading
  mutation controls.

## RP-configuration copy design

### User flow

1. An authorized editor chooses `Copy configuration` for one selected RP
   configuration.
2. The portal opens
   `/workspaces/$workspaceUuid/applications/$applicationUuid/rp-configurations/$sourceConfigurationUuid/copy`.
3. The page identifies the source by configuration name, Partner environment,
   and CanadaLogin environment.
4. The editor enters a distinct target configuration name and target Partner
   environment and explicitly selects Test, Staging, or Production. The target
   selector initially shows the source CanadaLogin environment but remains an
   ordinary editable selection.
5. Before submission, the page explains which reusable answers will be copied
   and which environment-specific or secret values must be supplied again.
6. One idempotent submission creates a new draft under the same Application,
   records safe source lineage, and leaves the source unchanged.
7. The portal opens the earliest required target setup step not satisfied by
   the allowlisted copy.

Copy is valid from Test, Staging, or Production to any supported target,
including the same environment. It never selects or overwrites an existing
target based on name or environment.

### API and service

- Add a source-scoped `POST .../rp-configurations/{sourceUuid}/copy` contract
  with an idempotency key, target configuration name, target Partner
  environment, and explicit target CanadaLogin environment.
- Resolve workspace, Application, and source ancestry on the server and use the
  same write capability already required for configuration creation.
- Route both the new endpoint and the bounded legacy `/progression` endpoint
  through one copy service. The legacy adapter accepts only its existing
  contract, maps it to the new service, preserves its idempotency behavior, and
  cannot create a second target on replay.
- Preserve the legacy adapter's 201 lineage-and-draft response shape and safe
  validation/error statuses. Return deprecated `promotionStatus` as `null` and
  `selfServe` as true because the adapter now creates a draft only; a caller
  must use the separate Production-review endpoint for that later intention.
- Retain the source self-reference as internal lineage and expose only safe
  public UUIDs where the product contract needs lineage.
- Create a new draft/version 1 without mutating the source or an existing
  sibling configuration.
- Keep the reviewed reusable-answer allowlist centralized. Exclude configuration
  name, Partner environment, endpoints, application/redirect/logout URLs,
  credentials, secrets, provider application identifiers, certificates,
  private keys, offline/JWK key material, review outcomes, and audit history.
- Record a minimized `rp_configuration_copy` audit event with actor, source and
  target public identifiers, selected target environment, outcome, correlation
  identifier, and timestamp. Do not log copied answer values.

No persistence migration is expected because the current Application
relationship, many-per-environment cardinality, and optional source-lineage
reference support the new behavior. Implementation must verify that assumption
against the active schema before closing the backend task.

Schema verification confirmed that `RPApplication` has no uniqueness rule on
Application plus CanadaLogin environment, keeps `source_rp_configuration_id`
as an optional self-reference, and already has a unique nullable
`registration_creation_key` for idempotent creation. No migration is needed
for the copy slice.

### Production review separation

- A copy to Production creates a draft and no review request.
- An authorized partner editor uses a separate `Request Production review`
  action on the selected Production configuration after required readiness
  information is available.
- The request records the target Production configuration and may include its
  copy source as lineage; it never infers either record from environment.
- CL Admin remains the only role that records review-only outcomes.
- A Production configuration without the required review trace is not shown as
  approved or launched.

### Compatibility and vocabulary

- Product copy uses `Copy configuration` / `Copier la configuration` and
  `source configuration` / `new configuration`; it does not use Promote,
  Progress, or next environment.
- The canonical browser route is `/copy`. A saved `/progression` route
  redirects to the equivalent copy form after normal authorization and
  ancestry checks.
- The legacy API remains a bounded adapter until caller inventory and telemetry
  support removal. Its documented semantic change is that Production target
  creation no longer creates review tracking. The compatibility sunset is a
  release decision, not a blocker for local implementation.
- Update BR-16, product-design requirements, onboarding PRD, route labels,
  OpenAPI, translations, and tests together.

## Shared navigation design

### Information architecture

- Keep `Home`, `Reports`, `Onboarding oversight`, and `Administration` as
  role-aware direct parent-area links.
- Replace the one-item `Partner work` group with a direct `Partner workspaces`
  link to `/workspaces` while it remains the only child destination.
- Introduce a group only when there are at least two coherent second-level
  destinations; target two to five links and do not use a group to decorate a
  single link.
- Keep the signed-in display name and compact active workspace/role context in
  the shell. The account disclosure contains supported `Account` and sign-out
  navigation/session items; detailed safe organization and role facts move to
  `/account` instead of raw mixed content inside `GcdsNavGroup`.
- Keep Support in utility/footer navigation.

### Interaction contract

- The mobile root `Menu`/`Close` trigger belongs to `GcdsTopNav`. `Close` is
  visible only while that root panel is actually open.
- A nested disclosure keeps one short stable visible label in both states;
  chevron direction and `aria-expanded` communicate expansion. Do not provide
  the optional verbose desktop `closeTrigger`.
- At most one top-level disclosure is open.
- Re-activating its trigger toggles it.
- Escape closes the current disclosure and returns focus to its trigger.
- Activating another disclosure closes the first.
- Activating outside navigation, selecting a destination, completing a route
  transition, signing out, or switching responsive presentation closes open
  navigation immediately and clears stale delayed-close work.
- An application rerender or active child route never forces a disclosure open.
- Focus order remains logical, visible, and usable without hover at narrow
  viewports, 768-1023 CSS pixels, desktop widths, 200 percent zoom, and with
  long French labels.

Implementation may coordinate state around the GCDS components only to satisfy
these outcomes. It must not replace their roles, accessible names, focus
semantics, or keyboard behavior with a custom menu system.

## Authorization, privacy, accessibility, and bilingual behavior

- Backend authorization remains authoritative for every central-user,
  workspace-access, configuration-copy, and review request.
- Route visibility and hidden controls are not authorization.
- Central user administration remains CL Admin only. Workspace Access retains
  the canonical CL Admin/RP Admin delegation boundary. Copy retains the
  configuration write capability; Read Only cannot copy.
- Safe errors do not reveal an out-of-scope user, workspace, assignment,
  invitation, Application, or RP configuration.
- Tables preserve caption/header/row-header semantics and responsive access to
  every field and action without page-level horizontal scrolling at 200
  percent zoom.
- Focus moves to the H1, error summary, confirmation heading, or success
  summary appropriate to each route transition.
- English and French routes, headings, labels, hints, statuses, errors,
  disclosures, accessible names, copy explanations, and Production-review
  language remain equivalent. User-entered configuration and Partner-
  environment names remain locale-neutral values.

## Impacted artifacts

- OpenSpec deltas in seven current capabilities.
- Frontend route catalog, routes, pages, shared Header/UserNav, tables,
  translations, fetch contracts, and compatibility redirects.
- Backend request/response schemas, workspace service, API routes, audit
  events, and compatibility adapter.
- OpenAPI export and generated/checked frontend types.
- Product-design BR-16 and onboarding PRD references.
- Unit, service, API, authorization, route, real-component browser,
  accessibility, responsive, and bilingual tests.

## Slice plan

### Slice 1: Access route structure and record links

Build the user-access and Workspace Access hubs, table/list child routes, and
record-specific invitation destination. Retain domain services and add safe
compatibility redirects.

### Slice 2: Access forms and lifecycle actions

Move embedded search/create/manage controls to focused routes, preserve the
delegation matrix, and cover successful, stale, denied, empty, and conflict
states.

### Slice 3: RP configuration copy

Add the copy service and API, focused form, safe allowlist, same-environment
coverage, lineage/audit/idempotency, and bounded progression compatibility.

### Slice 4: Explicit Production review

Remove implicit review creation from copy, connect the existing review flow to
the selected Production configuration, and update readiness and lifecycle
language.

### Slice 5: Shared navigation

Replace the one-item Partner group, normalize the account surface, remove the
verbose close trigger, coordinate dismissal, and add real-component browser
coverage across breakpoints and zoom.

### Slice 6: Documentation and holistic verification

Update old product references, validate OpenSpec and OpenAPI, run focused and
full local checks, collect bilingual/responsive UI evidence, and complete a
whole-change review before archive.

## Human decisions required

No human decision blocks local work. Before a shared rollout, the owner must
approve the compatibility sunset, target environment, rollback path, and
release evidence.
