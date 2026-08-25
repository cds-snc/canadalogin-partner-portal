# Tasks: Refine access, configuration copy, and shared navigation

## 0. OpenSpec and design readiness

- [x] 0.1 Confirm Delorean Level 2 and local developer / localhost scope.
- [x] 0.2 Inventory Administration, Users and access, selected-user access,
  workspace Access, RP progression/review, shared Header, route catalog,
  translations, APIs, services, tests, and current OpenSpec requirements.
- [x] 0.3 Reproduce the pending-invitation destination loss and inspect the
  reviewed pages with fake local persona data.
- [x] 0.4 Record which cards remain hubs, which repeated records become
  tables, the focused route map, copy semantics, Production-review separation,
  menu behavior, page-pattern decision, and standards impact.
- [x] 0.5 Review and approve the proposal, design, route map, task plan, and
  seven capability deltas before implementation.
- [x] 0.6 Validate this active change strictly and run scenario-preservation
  and scoped Markdown checks; resolve all findings before implementation.

## 1. Split central Users and access

- [x] 1.1 Convert `/users/$userUuid` to a compact, capability-aware task hub
  with safe identity context and available Global access, Workspace access,
  and Pending invitations destinations.
- [x] 1.2 Add focused global-access and workspace-access child routes and move
  the embedded add-workspace-access form to
  `/users/$userUuid/workspace-access/new`.
- [x] 1.3 Render selected-user assignments and invitations as semantic
  comparison tables with captions, row headers, text statuses, and concise
  uniquely named row links.
- [x] 1.4 Change each `/users` pending-invitation `Manage` action to a real
  record-specific link containing the selected workspace UUID and invitation
  UUID. Prove that two invites in one workspace have different destinations.
- [x] 1.5 Keep the CL Admin-only centralized authorization boundary, safe
  unavailable behavior, canonical role service, and minimized identity fields
  on every child route.
- [x] 1.6 Add loading, empty, error, conflict, stale, unauthorized, success,
  direct-entry, parent-mismatch, and bilingual route tests.

## 2. Split selected-workspace Access

- [x] 2.1 Convert `/workspaces/$workspaceUuid/access` to a task hub for
  current assignments, add existing user, invitations, and invite user.
- [x] 2.2 Add `/access/assignments`, `/access/assignments/new`, and
  `/access/assignments/$assignmentUuid` routes; move search, selection, and
  assignment management to focused pages.
- [x] 2.3 Add `/access/invitations`, `/access/invitations/new`, and
  `/access/invitations/$invitationUuid` routes; move create, reissue, revoke,
  and other lifecycle controls to the selected record's focused page.
- [x] 2.4 Use semantic tables for eligible-user results, assignments, and
  invitations. Do not wrap rows in cards or embed forms beneath collections.
- [x] 2.5 Preserve the canonical CL Admin/RP Admin delegation matrix and
  invitation lifecycle, including concurrent, expired, revoked, accepted,
  reissued, and read-only states.
- [x] 2.6 Revalidate session, capability, workspace, record ancestry, and
  active state on every direct route and mutation. Return the same safe result
  for missing and out-of-scope records.
- [x] 2.7 Preserve a safe `/members` redirect, add visible parent links and
  breadcrumbs, and update all route-catalog metadata and callers.

## 3. Implement RP-configuration copy

- [x] 3.1 Verify the active schema supports several configurations in one
  CanadaLogin environment and optional source lineage without a migration;
  record and test any newly discovered persistence need before proceeding.
- [x] 3.2 Add one idempotent source-scoped copy service that authorizes the
  selected workspace/Application/source hierarchy, creates a distinct draft,
  records lineage, and never mutates or overwrites the source or a sibling.
- [x] 3.3 Add `POST .../rp-configurations/{sourceUuid}/copy` with target
  configuration name, target Partner environment, explicit Test/Staging/
  Production selection, idempotency key, typed success, and standard safe
  errors.
- [x] 3.4 Centralize and test the reviewed reusable-answer allowlist. Exclude
  names, Partner environment, endpoints, URLs, redirect/logout URIs,
  credentials, secrets, provider IDs, certificates, private/offline/JWK key
  material, review outcomes, and audit history.
- [x] 3.5 Add the focused `/copy` form for Test, Staging, and Production
  sources; default but do not lock the target environment; explain copied and
  excluded fields; and resume the new draft at its earliest incomplete step.
- [x] 3.6 Make `Copy configuration` a secondary selected-record lifecycle
  action rather than a task-hub card. Remove Promote/Progress/next-environment
  product language from the canonical path.
- [x] 3.7 Record a minimized copy audit event and prove copied values, secrets,
  tokens, personal information, and raw provider data are absent from logs and
  audit payloads.
- [x] 3.8 Add source/target environment matrix, same-environment, repeated
  name, legacy missing-source metadata, source immutability, no-overwrite,
  ancestry mismatch, unauthorized, concurrency, and idempotent replay tests.

## 4. Separate Production review and progression compatibility

- [x] 4.1 Remove implicit Production-review creation from copy. Prove a
  Production copy produces only a new draft and lineage record.
- [x] 4.2 Keep `Request Production review` as an explicit action for the
  selected Production configuration, with the existing role boundary,
  readiness context, and CL Admin outcome flow.
- [x] 4.3 Update readiness, review, lifecycle, and status language so copy is
  never presented as approval, deployment, launch, or a next-environment step.
- [x] 4.4 Redirect authorized saved browser `/progression` routes to the
  equivalent `/copy` form without mutation. Use the normal safe result for a
  stale, revoked, missing, or mismatched source.
- [x] 4.5 Route the legacy POST `/progression` contract through the copy
  service for a bounded compatibility period and prove old/new replay cannot
  create two targets.
- [ ] 4.6 Inventory compatibility callers and record the shared-rollout owner,
  telemetry, and sunset decision before removing the adapter.

## 5. Simplify and stabilize shared navigation

- [x] 5.1 Replace the one-item Partner work disclosure with a direct
  `Partner workspaces` `GcdsNavLink` and update active-parent and route-catalog
  tests.
- [x] 5.2 Remove the optional verbose Partner-work close trigger and all
  translations/tests that require a nested `Close Partner work menu` label.
- [x] 5.3 Keep the display name and compact active workspace/role context in
  the shell; add the protected bilingual `/account` route for safe detailed
  identity, organization, and canonical access summaries; and keep only
  supported Account/sign-out items inside the disclosure.
- [x] 5.4 Ensure only one disclosure is open and dismiss it on Escape, sibling
  activation, outside activation, destination selection, route/language
  transition, sign out, and responsive-mode change. Return focus on Escape and
  clear stale delayed-close work.
- [x] 5.5 Preserve the standard GCDS mobile root Menu/Close behavior and prove a
  Close control is present only while its corresponding panel is open.
- [x] 5.6 Replace GCDS mocks where necessary with real-component integration or
  browser coverage for trigger text, `aria-expanded`, focus, Escape, rapid
  close/reopen, route selection, sibling state, and outside activation.
- [x] 5.7 Verify below 768 px, 768-1023 px, 1024 px and wider, 200 percent zoom,
  keyboard-only use, visible focus, and long English/French labels.

## 6. Contracts, content, and documentation

- [x] 6.1 Update English/French translations, route metadata, breadcrumbs,
  headings, hints, statuses, copy exclusions, error messages, success content,
  and accessible names together.
- [x] 6.2 Update OpenAPI and checked frontend contract types for the copy API
  and any focused access endpoints.
- [x] 6.3 Update `docs/design/partner-portal-mvp2-product-design-requirements.md`
  BR-16 and `docs/plans/partner-portal-onboarding-prd.md` so they describe
  explicit copy and separate Production review rather than next-environment
  progression.
- [x] 6.4 Update affected current-capability purpose text and other user-facing
  specification summaries at archive so they use Copy configuration and
  Production review rather than promotion/progression vocabulary.
- [x] 6.5 Update developer documentation and compatibility records for the
  access route map, copy endpoint, legacy adapters, and safe local fixtures.

## 7. Review and verification

- [x] 7.1 Run focused frontend unit/integration tests and backend service/API/
  authorization tests for every changed scenario.
- [x] 7.2 Run lint, type checking, production frontend build, backend format/
  lint, OpenAPI export verification, and the repository's relevant fast and
  local verification checks.
- [x] 7.3 Run automated accessibility checks plus focused keyboard and screen-
  reader review of hubs, tables, row links, forms, errors, menus, dismissal,
  and focus return.
- [x] 7.4 Capture fake-data desktop, mobile, intermediate-width,
  200-percent-zoom, and long-French evidence for the changed flows. Keep real
  email addresses, tokens, secrets, and production identifiers out of evidence.
- [x] 7.5 Perform targeted GC Design System, accessibility, bilingual,
  branding, privacy/security, IAM, and information-management review; resolve
  findings or record bounded remaining risk.
- [x] 7.6 Run a holistic whole-change QA review and confirm requirement,
  scenario, implementation, test, and documentation traceability.
- [x] 7.7 Archive only after implementation and verification are complete so
  all seven current specs receive their deltas. Do not use `--skip-specs`.

## 8. Non-local readiness

- [ ] 8.1 Name the shared target, access path, data rules, monitoring,
  compatibility sunset, rollback path, and evidence owner before deployment.
- [x] 8.2 Keep production out of scope until explicit approval and release-
  readiness evidence are recorded.
