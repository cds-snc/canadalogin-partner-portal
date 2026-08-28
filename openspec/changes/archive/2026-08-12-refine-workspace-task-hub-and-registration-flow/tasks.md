# Tasks

## 0. Change Setup And Dependencies

- [x] 0.1 Confirm this package owns workspace information architecture,
  canonical Access and Reports entry routes, and the RP registration task flow
  without owning roles, permission values, report formulas, or questionnaire
  business fields.
- [x] 0.2 Record the local developer/localhost boundary with fake or test-only
  data and no production, deployment, external mutation, or real-secret scope.
- [x] 0.3 After `define-four-role-authorization-model` is implemented and
  archived, rebase this package against the resulting workspace, reporting,
  assignment, invitation, and route-capability contracts.
	Progress note (2026-08-12): the dependency is archived; the merged current contracts still support the selected workspace hierarchy, scoped reports, canonical assignments/invitations, and secret boundary, and strict validation passes.
- [x] 0.4 Confirm the rebased requirements still align with the global Partner
  work hierarchy from `add-authenticated-home-and-navigation-groups`.
	Progress note (2026-08-12): `/workspaces` remains the global Partner work destination while this package owns its chooser, selected-workspace hub, and child task routes; no duplicate global navigation group is introduced.

## 1. Workspace Task-Area Contract

- [x] 1.1 Define `/workspaces` as the authorized chooser and
  `/workspaces/$workspaceUuid` as a PAT-001 task hub.
- [x] 1.2 Define Overview, Application information, RP applications, Access,
  Reports, and Settings as capability-filtered workspace destinations.
- [x] 1.3 Define workspace-name context, breadcrumbs, translated persistent
  `GcdsSideNav`, active state, return paths, and raw-UUID restrictions.
- [x] 1.4 Keep application audit on the existing application-scoped route and
  avoid inventing a workspace-wide audit API.
- [x] 1.5 Record the workspace task-area page-pattern decision.

## 2. Access And Reporting Route Contract

- [x] 2.1 Define `/workspaces/$workspaceUuid/access` as the canonical visible
  assignment and invitation destination supplied by the role model.
- [x] 2.2 Define the authorized compatibility redirect from legacy `/members`
  to `/access` without changing authority.
- [x] 2.3 Define `/workspaces/$workspaceUuid/reports` as the selected-workspace
  partner reporting route and keep `/onboarding-oversight/reports` internal and
  cross-workspace.
- [x] 2.4 Define discoverability, selected scope, cross-workspace denial,
  loading/empty/error/partial states, export scope, and return paths.
- [x] 2.5 Record focused Access and selected-workspace Reports page-pattern
  decisions, including forms/actions, tables, confirmations, scoped states,
  accessibility, bilingual behavior, and evidence.

## 3. Multi-Step Registration Contract

- [x] 3.1 Select PAT-019 and record Basics, Endpoints, Client and access,
  Signing, Encryption, Review, and Confirmation routes.
- [x] 3.2 Define the authorized server-backed `draft`, the explicit lifecycle
  editability matrix, existing Edit-route migration, state rechecks, and
  concurrency as the flow source-of-truth contract.
- [x] 3.3 Distinguish safe incomplete draft persistence from step completion
  and final validation, and define Continue, Back, Save and exit, Cancel,
  dependent-answer invalidation, future-step recovery, Review/Change, final
  submission, and Confirmation.
- [x] 3.4 Define refresh, network failure, session expiry, revoked scope,
  language switching, and sensitive-value handling.
- [x] 3.5 Record the RP application registration flow page-pattern decision and
  GC Design System component plan.
- [x] 3.6 Record `/workspaces/$workspaceUuid/applications/new` as a
  pre-resource Basics step: valid Basics creates the RP application draft and
  redirects using the returned UUID; invalid Basics creates no placeholder
  record.
- [x] 3.7 Select the existing RP application aggregate and resource routes for
  draft create/read/partial update/final transition, including separate
  partial, completed-step, and complete-submission validation behavior.
- [x] 3.8 Select additive unique `registration_creation_key`,
  `registration_draft_version`, and `registration_last_completed_step`
  persistence, idempotent create retry, conditional updates, stable safe `409`
  conflicts, one atomic final transition, migrated-draft marker derivation, and
  the no-second-draft-store boundary.
- [x] 3.9 Record the sensitive-data, audit-redaction, API/error, OpenAPI,
  frontend dependency, BFF/session, and standards/baseline architecture
  boundaries.

## 4. Workspace Hub And Navigation Implementation

- [x] 4.1 Build the typed workspace route metadata for labels, capabilities,
  side navigation, breadcrumbs, active state, return paths, and redirects from
  source routes or a focused navigation module; regenerate TanStack Router
  output, never hand-edit it, and render `Outlet` from new source parents.
	Progress note (2026-08-12): added one typed workspace route catalog for Overview, Application information, RP applications, Access, Reports, and Settings, with localized labels, canonical visibility predicates, hub/side-nav/breadcrumb surfaces, active route families, ancestry, return paths, and the exact `/members` compatibility target. Focused catalog and locale-contract tests pass (8), TypeScript and scoped ESLint/Prettier pass, and the supported Vite build/regeneration path succeeds with only existing chunk-size warnings; no source parent route changed in this metadata-only slice.
- [x] 4.2 Refine `/workspaces` into the authorized chooser and
  `/workspaces/$workspaceUuid` into the bounded task hub.
	Progress note (2026-08-12): retained the capability-aware chooser and replaced the selected workspace metadata-first page with a bounded task hub whose links come from the typed workspace catalog.
- [x] 4.3 Implement workspace-name context and neutral fallbacks without raw
  UUIDs as primary visible labels.
	Progress note (2026-08-12): selected-workspace headings, role context, side-navigation labels, and breadcrumbs use the fetched workspace name or a neutral translated Workspace fallback; focused tests assert raw workspace UUIDs are not visible labels.
- [x] 4.4 Implement translated `GcdsSideNav` and `GcdsBreadcrumbs` across the
  workspace child route family.
	Progress note (2026-08-12): the selected-workspace source parent now renders a capability-filtered translated side navigation around its `Outlet`; the shared header builds Home, Workspaces, named workspace, and active task breadcrumbs from the same catalog.
- [x] 4.5 Implement the authorized `/members` to `/access` compatibility
  redirect and update visible labels and links to Access.
	Progress note (2026-08-12): `/access` is the canonical source route and visible label; the legacy `/members` source route first enforces `partner_staff_assignment`, then performs an exact replace redirect to Access.

## 5. Access And Reporting Implementation

- [x] 5.1 Connect `/workspaces/$workspaceUuid/access` to canonical
  assignment/invitation reads and actions after the role rebase.
	Progress note (2026-08-12): Access retains canonical assignment search/assign/replace/revoke operations and now aggregates canonical per-RP invitation reads across the selected workspace, supports confirmed pending-invitation revocation, and links creation/management back to the invitation's owning RP application without a second invitation store.
- [x] 5.2 Add thin `GET /api/v1/workspaces/{workspace_uuid}/reports` and
  `/reports/export` BFF routes that bind scope to the path resource and reuse
  the existing aggregate-report service/models without a second workspace
  query selector or duplicated metric logic.
	Progress note (2026-08-12): both path-bound routes delegate to `OnboardingOversightService` and its existing response/export contracts; API tests prove an ignored `workspace_uuid` query cannot override the path scope and OpenAPI exposes only the path selector.
- [x] 5.3 Keep application audit links on application detail and ensure the hub
  explains Reports and audit paths without a false aggregate-audit route.
	Progress note (2026-08-12): the hub describes aggregate workspace reports, the Reports scope notice directs application audit activity to each RP application, and the existing application-detail audit route remains unchanged.
- [x] 5.4 Add safe loading, empty, partial, error, denied, filter-reset, retry,
  export, and return behavior for focused Access and Reports pages.
	Progress note (2026-08-12): both pages now expose scoped loading/empty/error behavior, preserve independent Access sections and the last valid report during partial failures, enforce route capability guards, reset report form state from normalized URL filters, provide retry/export/return actions, and confirm invitation/assignment revocations.
- [x] 5.5 Keep routes thin, put Access/Reports server orchestration in
  feature-owned TanStack Query hooks, and keep endpoint-specific wire behavior
  in typed fetch clients; update/invalidate scoped query keys after writes and
  preserve the last valid report result on rejected filters.
	Progress note (2026-08-12): source routes contain only admission/search wiring, typed fetch clients own endpoint behavior, feature hooks own scoped queries and invitation invalidation, and the shared report content preserves its last successful result when a later filter request fails.

## 6. Multi-Step Registration Implementation

- [x] 6.1 Add separate typed Pydantic contracts for minimum-Basics draft create,
  safe partial or completed-step writes, versioned final submission, and the
  fixed `WorkspaceRPApplicationRegistrationDraftRead` public-UUID/typed-answer
  response; exclude internal integer IDs, repository models, raw JSONB,
  authorization internals, and secret key material while preserving explicit
  success/error models.
- [x] 6.2 Add the additive Alembic migration and SQLAlchemy/repository support
  for unique opaque `registration_creation_key`, non-negative monotonic
  `registration_draft_version`, and nullable
  `registration_last_completed_step`, including existing-row backfill,
  constraint/index review (`version >= 0`, unique non-null creation key, and
  nullable allowed-step marker), new-draft initialization at version `1` plus
  completed `basics`, contiguous progress derivation for legacy drafts, and
  conditional update by workspace, application, `draft` state, and expected
  version.
- [x] 6.3 Implement server-backed draft create after valid Basics,
  typed read/resume and partial/complete update through the dedicated
  `/registration-draft` BFF subresource, the draft-only Edit-route state gate,
  entry/write/submit authorization and state rechecks, safe `409` conflict
  handling, and the typed flow model for routes, labels, completion, and
  dependent answers.
- [x] 6.4 Implement service-owned merge and validation so partial persistence
  checks supplied-value safety, completed-step writes validate the merged
  active step/prerequisites, and final submission validates the complete merged
  questionnaire before one atomic versioned portal-local state transition,
  without calling, provisioning, updating, or synchronizing IBM Verify.
- [x] 6.4a Validate offline exchange as public certificate/public JWK material
  only and reject private JWK members, symmetric key values, credentials, or
  other secret key material before persistence.
- [x] 6.5 Split the questionnaire into Basics, Endpoints, Client and access,
  Signing, and Encryption step pages using GC Design System form components.
- [x] 6.6 Implement current-step validation, error summary, field errors,
  Continue, Back, Save and exit, Cancel, and future-step recovery.
- [x] 6.7 Implement PAT-017 Review summaries, localized Change links,
  consequences, and one idempotent final submit action.
- [x] 6.8 Implement Confirmation with resulting status, next steps, RP
  application detail link, and workspace hub link.
- [x] 6.9 Implement refresh, network, session-expiry, revoked-scope, and
  language-switch recovery without unsafe URL, analytics, log, or browser-only
  draft storage.
- [x] 6.10 Emit approved audit/operational events for draft create/save,
  conflicts/denials, and final submission using safe IDs, step/save metadata,
  changed field names, result, and correlation ID only; never record answer,
  certificate/JWK, credential, token, or unnecessary personal values.
- [x] 6.11 Regenerate OpenAPI and the TanStack Router artifact through supported
  commands, then align TypeScript wire types, typed fetch clients, feature
  hooks, and application/list query-cache updates with the generated contracts;
  reconcile the existing snake_case RP application frontend helpers to the
  canonical camelCase OpenAPI instead of preserving two preferred wire shapes.
- [x] 6.12 Update English and French steps, fields, hints, validation, Review,
  Change links, Confirmation, statuses, breadcrumbs, and recovery content with
  parity.
	Progress note (2026-08-12): the existing RP application aggregate now owns
	one typed, versioned server-backed registration draft; route-per-step UI,
	partial/completed/final validation, public-key-only intake, idempotent create
	and submit, safe audit metadata, generated contracts, and bilingual recovery
	are implemented. Browser and dependency-order checks confirm create, save,
	final submit, and retry remain portal-local and never resolve or call IBM.

## 7. Tests And UI Evidence

- [x] 7.1 Add workspace chooser/hub route-reachability, side-navigation,
  breadcrumb, active-state, return-path, raw-UUID, and capability-context tests.
- [x] 7.2 Add Access route, legacy redirect, invitation/assignment visibility,
  denied, and cross-workspace tests without duplicating the role matrix source.
- [x] 7.3 Add selected-workspace report, filter, export, empty, partial, error,
  internal-route separation, shared-service reuse, path-bound workspace scope,
  missing second workspace selector, and cross-scope tests.
- [x] 7.4 Add registration start/resume, draft-only Edit behavior, every
  non-draft/unknown state guard, incomplete persistence versus step completion,
  no-placeholder invalid Basics, same-key create retry, changed-key/payload
  create conflict, legacy contiguous-step derivation, version increment, stable
  version-conflict code, no-overwrite concurrency, per-step validation, Back,
  Save and exit, Cancel, dependent
  invalidation, future-step recovery, Review/Change, idempotent `draft` to
  `submitted` transition, ambiguous-response retry returning the submitted
  representation without duplicate side effects/audit, no IBM/external adapter
  calls during create/save/final-submit/retry, and Confirmation tests.
- [x] 7.5 Add refresh, network, session expiry, revoked scope, equivalent-route
  language switch, unsaved-input mitigation, and sensitive-client-surface tests.
- [x] 7.5a Add public certificate/JWK acceptance plus private-key, symmetric-key,
  credential, unsafe error, log, audit, and persistence rejection tests.
- [x] 7.6 Run keyboard, focus, screen-reader, narrow viewport, mobile, and 200
  percent zoom checks for the workspace hub, side navigation, a middle form
  step, errors, Review, and Confirmation.
- [x] 7.7 Capture required desktop/mobile screenshots, bilingual review,
  design-system checklist, page-shell checks, and skipped-check reasons.
- [x] 7.8 Verify the Alembic migration, RP application model/constraints,
  repository conditional update, route/service/schema split, generated OpenAPI,
  serialized JSON/error shape, TypeScript client parity, and post-write query
  cache consistency.
- [x] 7.9 Inspect URL/history, local/session storage, analytics, API errors,
  logs, audit events, exports, screenshots, and fixtures for assignment personal
  data, authorization payloads, questionnaire values, certificate/JWK material,
  credentials, invitation tokens, secrets, and real data.
	Progress note (2026-08-12): local Chrome completed the fake-data flow against
	PostgreSQL and produced the evidence bundle. Backend focused suites pass 180
	tests, frontend passes 91 files/449 tests plus typecheck/lint/build, migration
	0024 applies locally, OpenSpec/design-system/page-shell/secret checks pass,
	and sensitive-surface inspection found no answers or key material in URLs,
	storage, logs, audits, exports, or screenshots. Formal assistive-technology,
	cross-browser, shared-environment, and real IBM checks are explicitly skipped
	or outside this portal-local change.

## 8. Validation And Follow-Through

- [x] 8.1 Run `make validate-openspec-change CHANGE_ID=refine-workspace-task-hub-and-registration-flow` after this specification package is created.
  Progress note (2026-08-11): strict OpenSpec validation and the local
  scenario-preservation preflight pass for the new workspace IA, Access,
  selected-workspace Reports, current questionnaire clarification, and
  multi-step registration package. Rerun after the architecture alignment pass
  also passes, including the selected report BFF routes, versioned draft
  aggregate, API/error contract, sensitive-data, and standards-impact work.
- [x] 8.2 Rerun validation after the four-role archive/rebase and review all
  cross-change scenario semantics against accepted ADR-003, architecture
  alignment, and standards impact before implementation.
	Progress note (2026-08-12): strict OpenSpec and scenario-preservation validation pass after rebase; backend scope remains authoritative and the global/workspace route ownership boundary is unchanged.
- [x] 8.3 Before archive, update affected current capability Purpose text so it
  describes the workspace task hierarchy, Access, scoped Reports, and
  multi-step registration behavior.
	Progress note (2026-08-12): current workspace-management and reporting
	capability Purpose text now names the workspace task hierarchy, canonical
	Access, selected-workspace Reports, and multi-step portal registration.
- [x] 8.4 Archive only after implementation and verification, then confirm both
  current specs were updated and the completed package moved to archive.
	Progress note (2026-08-12): `openspec archive
	refine-workspace-task-hub-and-registration-flow --yes` updated both current
	capability specs with four added and one modified requirement, removed no
	requirements, and moved the completed package to
	`archive/2026-08-12-refine-workspace-task-hub-and-registration-flow`.
- [x] 8.5 Before archive, assess all BAS-001 GC-WEB-001 through GC-WEB-011
  controls, record that this MVP leaves existing RP application retention
  unchanged and defers physical disposition to a future approved change, and
  confirm the at-rest protection expected for sensitive public registration
  configuration; private/symmetric key intake remains out of scope.
	Progress note (2026-08-12): `evidence/README.md` assesses every control. The
	existing RP application retention remains unchanged by product decision;
	physical disposition is deferred to a future approved change. Public
	registration configuration stays in the existing authenticated PostgreSQL
	aggregate, private/symmetric key values are rejected, and shared-environment
	at-rest encryption/backup proof remains release-readiness work.
