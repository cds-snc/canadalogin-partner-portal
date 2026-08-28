# Tasks: Align Partner Portal to approved product scope

## 1. OpenSpec and scope baseline

- [x] 1.1 Confirm Delorean Level 2 and a local-only control boundary.
- [x] 1.2 Record the authoritative source order and classify the work as a
  requirement correction/reduction with explicit approved additions.
- [x] 1.3 Audit current requirements and map every removed behavior to its
  retained replacement or intentional retirement.
- [x] 1.4 Create one atomic change with deltas for all seven affected
  capabilities so permission, route, and status contracts remain coherent.
- [x] 1.5 Validate the authored change strictly and pass the OpenSpec scenario-
  preservation preflight.
- [x] 1.6 Keep proposal, design, tasks, and deltas current when implementation
  discovers a materially different dependency.
- [x] 1.7 Update current specs only when implementation and verification are
  complete; archive without `--skip-specs`.

## 2. Establish the narrow status and data contracts

- [x] 2.1 Inventory every database field, schema, API property, authorization
  key, fixture, translation, test, and UI consumer of the generic five-state
  lifecycle, readiness score, internal review, and aggregate reports.
- [x] 2.2 Replace the shared lifecycle contract with editable registration
  draft plus technical completion metadata; keep it separate from Production
  review and integration status.
- [x] 2.3 Constrain Production-review requests to absent, `pending`,
  `approved`, or `rejected` with selected Production configuration, external
  reference, reviewer metadata, timestamps, and retained history. Permit
  partner metadata edits only while pending; treat approved/rejected as
  terminal for that request and do not infer a resubmission workflow.
- [x] 2.4 Prove registration completion, copy, checklist updates, and
  integration status cannot implicitly create or advance Production review.
- [x] 2.5 Add safe migrations/backfills only where required. Do not infer a
  Production-review result from a historical lifecycle value and do not delete
  historical records without a retention decision.

## 3. Preserve minimum auditability before removing audit surfaces

- [x] 3.1 Add or verify the selected-RP secret-change CSV with action time and
  actor in the Sentinel-compatible MVP shape; never include secret values.
- [x] 3.2 Verify retained audit/history for role assignments, invitations,
  adoption, copy, Production review, and sensitive failures.
- [x] 3.3 Remove generic partner audit explorers/downloads, Read Only audit
  entitlement, Administration Audit logs, and Verify audit-query pass-through.
- [x] 3.4 Verify retired audit routes fail safely and operational/security
  structured logging remains intact.

## 4. Narrow canonical authorization and Administration

- [x] 4.1 Update the canonical four-role capability matrix first, retaining
  scopes, assignment integrity, delegation, secrets boundaries, MAU,
  checklist/CATS, explicit Production review, Access, and Invitations.
- [x] 4.2 Keep role wording precise: partner editors may create an RP
  configuration, edit its incomplete draft questionnaire, update separately
  permitted top-level metadata, and copy it; they do not reopen completed
  questionnaire answers through the draft flow.
- [x] 4.3 Remove capabilities for aggregate reports, generic audit browsing,
  internal review notes/outcomes, Department/tier/policy CRUD, and broad Verify
  administration from server authorization and client projections.
- [x] 4.4 Keep `/users`, focused access children, pending invitations,
  `/users/invite`, workspace Access, and immutable Role reference.
- [x] 4.5 Remove Department and tier catalog CRUD while preserving Department
  reference/association needed by profile setup and workspace inheritance.
- [x] 4.6 Remove generic Verify administration for users, applications, groups,
  entitlements, logins, and audit queries. Preserve only bounded provider
  adapters owned by authentication, identity binding, adoption, and RP work.
- [x] 4.7 Update `/administration` to expose only Users and access,
  Invitations, and fixed Role reference tasks with honest authorization and
  empty states.

## 5. Complete the manual invitation-link launch contract

- [x] 5.1 Preserve the CL Admin/RP Admin delegation matrix, workspace scope,
  existing-identity resolution, exact normalized verified-email match,
  configured partner-access domain policy, and pending/accepted/expired/
  revoked lifecycle.
- [x] 5.2 Return an opaque expiring acceptance URL only after create or reissue,
  persist only its hash, and keep write responses private/non-cacheable.
- [x] 5.3 Add bilingual `Copy invitation link` controls and copied confirmation
  to CL Admin and workspace invitation success flows.
- [x] 5.4 Explain that no email is sent, the inviter must use an approved
  channel, and the plaintext link cannot be retrieved after leaving; reissue
  is the recovery path.
- [x] 5.5 Ensure revoke invalidates a pending link, reissue invalidates/replaces
  the old token, and accepted-access revocation uses role management.
- [x] 5.6 Keep token values out of database plaintext, list/detail contracts,
  browser persistence, logs, analytics, evidence, and referrer data.
- [x] 5.7 Add create/copy, reissue, revoke, concurrency, expiry, replay,
  mismatched email, first-login admission, and delegation tests.

## 6. Remove aggregate reporting while retaining MAU and shells

- [x] 6.1 Remove onboarding-throughput, invitation-conversion, secret-hygiene,
  selected-workspace, and cross-workspace aggregate report services, APIs,
  filters, exports, capability keys, UI routes, and tests.
- [x] 6.2 Preserve scoped RP-configuration MAU/usage, current metric fields,
  approved pipeline boundary, and current scoped export.
- [x] 6.3 Narrow `/reports` and report discovery to accessible Application/RP-
  configuration usage destinations; render localized honest empty states.
- [x] 6.4 Remove selected-workspace aggregate report cards/routes and make any
  retained workspace Reports link resolve only to authorized MAU discovery.
- [x] 6.5 Update role, invitation, navigation, and route tests so no removed
  report capability or endpoint remains discoverable or directly accessible.

## 7. Reduce oversight and readiness to approved behavior

- [x] 7.1 Remove free-form internal review notes, internal checklist outcomes,
  Internal review pages, persistence, APIs, capabilities, translations, and
  tests while preserving historical data until disposition is approved.
- [x] 7.2 Remove Application readiness score/count, `submit-ready`, and parent
  status synthesis from models, API responses, tables, hubs, and tests.
- [x] 7.3 Retain a focused checklist/CATS/evidence/process-link surface with
  item-level missing-input visibility and no invented overall status.
- [x] 7.4 Retain `/onboarding-oversight` as a CL Admin dashboard anchor for
  Workspaces, Users/access, Invitations, and explicit Production-review work;
  remove generic backlog states, metrics, notes, and exports.
- [x] 7.5 Keep Production-review request/outcome authorization separate: RP
  Admin and RP User (Edit) request; CL Admin records outcome; Read Only views
  permitted status; CL Admin never receives secret values.
- [x] 7.6 Update Application/RP-configuration hubs, tables, registration flow,
  configuration details, and compatibility routes to use registration
  draft/completion and separate Production-review vocabulary.

## 8. Preserve hierarchy, migration, and focused responsibilities

- [x] 8.1 Preserve Workspace -> Application -> RP-configuration ancestry and
  backend parent/scope validation.
- [x] 8.2 Preserve central Users/access, workspace Access/Invitations, and all
  safe focused assignment/invitation routes.
- [x] 8.3 Preserve CL Admin retained-RP discovery, safe provider metadata
  preview, and explicit auditable adoption into one Application.
- [x] 8.4 Preserve named configurations, recoverable registration drafts,
  questionnaire validation, configuration copy, secret operations, and
  contextual MAU destinations.
- [x] 8.5 Inventory retired URLs and contracts. Redirect only when a safe
  semantically equivalent destination remains; otherwise return the standard
  safe unavailable response.

## 9. Contracts, content, and documentation

- [x] 9.1 Update backend schemas, OpenAPI, generated frontend types, route
  metadata, authorization contracts, and fixtures together.
- [x] 9.2 Update English/French labels, statuses, empty states, link warnings,
  errors, headings, breadcrumbs, and accessible names with parity.
- [x] 9.3 Update current capability purpose text during archive so it no longer
  advertises generic lifecycle, aggregate reporting, internal review,
  readiness scoring, catalog governance, or audit explorers.
- [x] 9.4 Update architecture, route, API, and product-design documentation that
  treats `partner-portal-prd.md` or its derived backlog as authoritative.
- [x] 9.5 Preserve explicit TBDs for CATS evidence mechanism, contact-type
  gates, retention periods, and compatibility sunsets rather than inferring
  implementation policy.

## 10. Review and local verification

- [x] 10.1 Add focused backend service/API/authorization/migration tests for
  each changed scenario and every retained denial boundary.
- [x] 10.2 Add focused frontend unit/integration tests for shells, empty states,
  registration/status wording, checklist/CATS, MAU discovery, Administration,
  and invitation copy/revoke/reissue.
- [x] 10.3 Run lint, type checking, frontend production build, backend format/
  lint/tests, OpenAPI export verification, and relevant repository fast/local
  verification checks.
- [x] 10.4 Run accessibility checks plus keyboard, focus, status, table, copy-
  confirmation, narrow viewport, 200-percent zoom, and long-French review.
- [x] 10.5 Perform targeted bilingual, GC Design System, accessibility,
  privacy/security, IAM, and information-management review.
- [x] 10.6 Capture fake-data local evidence without invitation tokens, email
  addresses, secret values, questionnaire answers, or production identifiers.
- [x] 10.7 Run whole-change QA and confirm proposal -> delta -> code -> test
  traceability before archive.
- [x] 10.8 Rerun
  `make validate-openspec-change CHANGE_ID=align-partner-portal-to-approved-product-scope`
  after the final implementation/spec update and resolve every strict or
  scenario-preservation error.
- [x] 10.9 Archive only after implementation and verification, without
  `--skip-specs`, then inspect the promoted current requirements and capability
  Purpose text for every removed or narrowed behavior.

## Local verification evidence (2026-08-25)

- Control boundary: local developer environment with fake or fixture data only.
  No invitation bearer, email address, secret value, questionnaire answer, real
  personal information, production identifier, deployment, or external-system
  mutation was included in verification evidence.
- OpenSpec: strict active-change validation and scenario-preservation preflight
  passed after the final requirement refinements.
- Backend: full suite passed with 852 tests and 15 documented skips. The skips
  include the opt-in PostgreSQL invitation concurrency checks because the local
  PostgreSQL test URL was not configured. Changed Python files pass Ruff format
  and lint checks.
- Frontend: 114 unit-test files and 533 tests passed; TypeScript checking,
  ESLint, changed-file Prettier, and the production build passed. The build has
  only the existing large-chunk warning.
- Accessibility and UI: 12 Chromium end-to-end checks passed for keyboard and
  focus behavior, tables, copy confirmation, narrow reflow, 200-percent rendered
  scale, and long French content. GC Design System and UI shell checks passed.
  A live assistive-technology/screen-reader session was not available; Firefox
  and WebKit browser binaries were also unavailable and were not downloaded.
- Contracts and repository checks: OpenAPI export verification, repository
  structure, Delorean state, secret checks, scoped Markdown, Terraform format,
  and `git diff --check` passed. The OpenAPI contains the checklist contract and
  no retired lifecycle, readiness, tier, provider-ID, or Department-assignment
  schemas identified by the scope audit.
- Tooling skips and baseline findings: ShellCheck, Gitleaks, and a PlantUML
  renderer were not installed; Terraform provider validation was unavailable.
  Full-repository format/Markdown scripts continue to report pre-existing,
  unrelated files, while every changed file passes its applicable scoped check.
- This evidence supports local OpenSpec archival only. Shared-environment or
  production release still requires the named owners, data reconciliation,
  delivery-channel approval, and release evidence listed below.
- Archive: promoted all seven deltas into current specs without `--skip-specs`
  as `2026-08-26-align-partner-portal-to-approved-product-scope`; inspected and
  corrected the affected current capability Purpose text before final strict
  spec validation.

## Future non-local work outside this change

- A future rollout change must name the shared target, access path, approved
  data, provider configuration, migration/rollback, monitoring, compatibility
  sunset, and evidence owner before deployment.
- Production remains out of scope until explicit approval and release-
  readiness evidence are recorded.
- A named operational owner must approve the permitted external channel or
  channels for manual invitation-link delivery before any non-local launch;
  the portal does not infer that policy or add email delivery in this change.
- A named shared-environment data owner must reconcile any retained legacy
  Production-review row that has no safely mapped canonical status before a
  new request can be created; reconciliation must preserve the historical row
  and its audit history.
