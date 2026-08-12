# Tasks: Define the Four-Role Authorization Model

## 0. Specification And Sequencing

- [x] 0.1 Record the product decision to support exactly CL Admin, RP Admin, RP User (Edit), and Read Only.
- [x] 0.2 Record CL Admin as global and the three partner roles as workspace-scoped.
- [x] 0.3 Retire arbitrary reusable roles, is_superuser authority, and workspace_admin/workspace_member as product authorization roles in the deltas.
- [x] 0.4 Record the permission matrix, CL Admin secret denial, partner invitation delegation, reporting scope, and local persona matrix.
- [x] 0.5 Review this draft with the product owner and record any accepted wording refinements.
	Decision note (2026-08-11): product review approved the four canonical roles, scope boundaries, grant-derived access model, and owner-era retirement as written; no behavioural wording refinement was requested.
- [x] 0.6 Keep add-authenticated-home-and-navigation-groups dependent on this role/context contract and repair that package's scenario-preservation issue before archive.
	Progress note (2026-08-11): the Home/navigation proposal and design now depend explicitly on this change's canonical server-owned authorization context. Its access-and-dashboard delta models renamed and new behavior with explicit added/removed requirement migrations, and `make validate-openspec-change CHANGE_ID=add-authenticated-home-and-navigation-groups` passes the scenario-preservation preflight.

## 1. Architecture And Shared Contracts

- [x] 1.1 Update ADR-003 with the fixed role taxonomy, assignment sources, workspace scope, deterministic precedence, CL Admin secret denial, and direct-subject retirement.
	Progress note (2026-08-11): ADR-003 is Accepted and records the fixed four-role taxonomy, normalized assignment sources, deterministic fail-closed resolution, immutable policy subjects, workspace/object enforcement, CL Admin secret denial, bootstrap invariants, and guarded local simulation contract. Acceptance is based on local implementation and verification and does not approve production migration or release.
- [x] 1.2 Define immutable role.code identity plus shared backend role and lifecycle types for cl_admin, rp_admin, rp_user_edit, read_only, active, revoked, pending, accepted, and expired.
- [x] 1.3 Define the immutable server-owned permission matrix, Verify operation allowlist, and resource-scope decision interface without mutable or direct-user policy subjects.
- [x] 1.4 Define the authenticated authorization-context and grant-accessible RP application response contracts with stable machine keys and public workspace UUIDs.
- [x] 1.5 Record the API's canonical serialized field names and update OpenAPI contract expectations.
- [x] 1.6 Define assignment, revocation, invitation-transition, and privileged-access audit event shapes without secrets, tokens, or unnecessary personal information.
	Progress note (2026-08-11): immutable canonical role/lifecycle/capability contracts, a default-deny role matrix, Verify allowlist, workspace decision point, camelCase authorization-context DTOs, grant-accessible RP application DTOs, and minimized typed audit events are covered by focused contract tests.
- [x] 1.7 Obtain the service-owner decision for durable denied/failed privileged-decision auditing: request-scoped audit boundary or outbox, minimized fields, audit-store failure policy, and retention. Successful transactional assignment/invitation audit records may continue locally, but this operational policy must not be inferred.
	Decision note (2026-08-11): use an independent request-scoped audit outbox; fail closed before an allowed privileged action when its minimized decision cannot be durably enqueued; preserve an already denied/failed result while retrying and alerting on audit failure; exclude bodies, emails, tokens, sessions, claims, and secrets; and retain records without deletion until an approved schedule exists.
- [x] 1.8 Record that this MVP preserves assignments, grants, invitations, authorization audit records, and MVP1 portal secret-lifecycle audit records without automatic deletion; defer the exact retention/disposition schedule and any automated disposition behavior to a future production-cutover MVP rather than blocking this implementation or archive.
	Decision note (2026-08-12): product confirmed that the retention horizon is more than two years and spans several future MVPs. This change therefore implements preservation only and makes no production retention-policy claim.

## 2. Persistence Expansion And Migration

- [x] 2.1 Add the normalized user_role association with unique UUID, restricted user/role/actor foreign keys, assignment_source, lifecycle checks, indexes, and active-assignment uniqueness.
- [x] 2.2 Make the fixed CL Admin role definition immutable and remove role-definition CRUD from the target contract.
- [x] 2.3 Add partner-role, invitation-status, grant-status, lifecycle, and status/is_deleted constraints as non-validating expansion where needed; validate and add not-null only after reconciliation.
- [x] 2.4 Make source_invitation_uuid a unique ON DELETE RESTRICT acceptance-lineage FK after orphan analysis, retain the separate non-unique delegated_by_grant_uuid authorization-provenance FK, and document dependency-order downgrade.
- [x] 2.5 Add or confirm one-active-grant-per-user/workspace and one-pending-invitation-per-email/workspace constraints.
- [x] 2.6 Build a dry-run reconciliation report for orphaned, duplicated, deleted/disabled, malformed role_ids, unknown, invalid-status, contradictory soft-delete, and mixed CL Admin/partner records with pre/post counts.
- [x] 2.7 Reject every non-empty legacy CL Admin backfill list, report every admin-only, malformed, disabled, deleted, and mixed case, and create no legacy CL Admin assignment. Keep `src.scripts.create_initial_cl_admin` as the only initial CL Admin path, using a newly designated internal identity and its idempotent, locked, audited canonical assignment transaction rather than raw SQL or a legacy user.
	Progress note (2026-08-12): migration and reconciliation validators reject every non-empty `clAdminAssignments` list, migration 0020 contains no legacy CL Admin assignment path, and minimized provenance records zero assignments. Choosing and executing the real initial identity remains production-cutover work, not an implementation/archive gate.
- [x] 2.8 Canonicalize the three known persisted partner display strings and preserve valid canonical grants, but reject every non-empty legacy workspace-membership backfill list and create no canonical grant from workspace_admin or workspace_member. Report those rows and leave them non-authoritative; after cutover, CL Admin creates the workspace and assigns its first RP Admin through canonical role management, and same-workspace RP Admin manages RP User (Edit) and Read Only.
	Progress note (2026-08-12): migration 0020 and the reconciliation validator now reject every non-empty `workspaceMemberDispositions` list, and the legacy membership-to-grant implementation path has been removed. Candidate manifests contain no access decisions, populated PostgreSQL fixtures assert that membership-only users receive no active grant, and focused migration/reconciliation verification passes 25 tests with the three explicitly gated PostgreSQL executions skipped locally.
- [x] 2.9 Add disposable-PostgreSQL migration tests for upgrade from populated revision 0018, idempotence, invalid legacy values, conflicts, every constraint, revision-identifier storage, and the documented additive downgrade/re-upgrade.
- [x] 2.10 Defer removal of role_ids, is_superuser, workspace role authorization, and legacy policies until runtime parity is verified.
- [x] 2.11 Resolve the existing-MVP1-RP adoption scope, gate the current mutating ten-minute IBM sync off until review is available, and create the focused add-cl-admin-rp-registration-adoption change for implementation before non-local migration.
	Decision note (2026-08-12): launch adopts existing MVP1 RP registrations only after CL Admin creates partner workspaces. A CL Admin screen starts from unassigned local RP records, matches each selected record to IBM Verify by stable application ID, fills only allowlisted missing non-secret metadata without overwriting non-empty portal values, and explicitly links the retained local RP UUID to one workspace. IBM owner data never grants access; secrets and IBM audit history are not imported; existing portal secret-lifecycle audit records remain attached to the retained local UUID.
	Progress note (2026-08-12): the legacy mutating IBM RP sync defaults off and has no cron schedule unless explicitly enabled in local/test; configuration rejects enablement in dev, staging, and production while the reviewed linking workflow is absent. Its inert handler remains registered to satisfy ARQ's non-empty worker requirement, but a first-line guard stops direct or queued invocation before time-window, IBM client, service, or database access. Focused configuration/worker tests, Ruff checks, and independent QA pass. The implementation and non-local readiness work now live in add-cl-admin-rp-registration-adoption; no real IBM or shared-environment action was performed.

## 3. Backend Authorization And Session Context

- [x] 3.1 Resolve active CL Admin and partner grants from normalized server state for every protected request or through a proven equivalent invalidation mechanism.
- [x] 3.2 Replace get_current_superuser and frontend-dependent superuser assumptions with the canonical CL Admin capability.
- [x] 3.3 Remove upstream group, historical owner-email, raw role-ID, mutable role-name, username, and numeric-subject authorization fallbacks.
- [x] 3.4 Enforce one partner role per workspace, multi-workspace isolation, and no concurrent CL Admin/partner assignments using target-user and CL-Admin-roster transaction locks.
- [x] 3.5 Enforce both coarse capability and workspace/object ownership before returning or mutating protected resources.
- [x] 3.6 Return safe unavailable/not-found responses for out-of-scope protected subresources where current specs require non-disclosure.
- [x] 3.7 Replace authenticated-user isSuperuser/roleUuids/Boolean-only grant context with the scope-aware authorization contract.
- [x] 3.8 Add partner role and workspace scope to grant-accessible RP application responses.
- [x] 3.9 Rename and harden the initial CL Admin bootstrap configuration and prevent removal of the last active CL Admin.
- [x] 3.10 Refresh OpenAPI and cross-stack contract tests.
- [x] 3.11 Retire authorization-policy CRUD and prove canonical capability mappings, scope rules, and direct-user subjects cannot be changed through UI or API.
	Progress note (2026-08-11): protected requests now resolve normalized active assignments through the canonical authorization service and immutable matrix. The grant-derived `/api/v1/rp-applications/accessible` route family replaces the former owner-oriented `/mine` family without IBM-owner membership, owner-email snapshots, or an OIDC user token. Partner roles receive only their active workspace applications; CL Admin and no-access users receive an empty collection, and out-of-scope child resources fail safely before external Verify calls. OpenAPI export, semantic checks, and cross-stack contracts pass.

## 4. Invitation And Grant Lifecycle

- [x] 4.1 Validate invitation role and status through shared types and database constraints.
- [x] 4.2 Scope duplicate pending invitations to normalized email plus workspace rather than RP application.
- [x] 4.3 Validate token, lifecycle, expiry, identity, and scope before grant mutation.
- [x] 4.4 Make accepted-link replay idempotent, reject acceptance when an active workspace grant exists, and require explicit role replacement outside invitation acceptance.
- [x] 4.5 Preserve invitation/grant history, enforce unique acceptance lineage through source_invitation_uuid, and retain restricted non-unique delegation provenance through delegated_by_grant_uuid.
- [x] 4.6 Allow only CL Admin to assign RP Admin and only same-workspace RP Admin to invite RP User (Edit) or Read Only.
- [x] 4.7 Add transition, concurrent reissue, replay, active-grant collision, duplicate, delegation, expiry, revocation, and cross-workspace tests.
	Progress note (2026-08-11): the invitation and explicit role-assignment services share the normalized serialization boundary, validate lifecycle before mutation, reject implicit role replacement, and preserve unique acceptance lineage separately from RP Admin delegation provenance. Focused service/API tests and five live simultaneous PostgreSQL invitation-concurrency scenarios pass.

## 5. Role Permission Conformance

- [x] 5.1 Enforce CL Admin platform governance, bootstrap, oversight, review, and aggregate reporting without RP secret access.
- [x] 5.2 Enforce RP Admin partner administration, configuration, secret, report, and staff-invitation permissions without RP Admin delegation or production approval.
- [x] 5.3 Enforce RP User (Edit) configuration, secret, CATS, promotion-request, and report permissions without invitation or approval permissions.
- [x] 5.4 Enforce Read Only metadata, OAuth, MAU, aggregate-report, and redacted bounded-audit reads without mutation, internal events, or secret access.
- [x] 5.5 Allow all partner roles to access aggregate reports for exactly one explicitly selected active workspace per request.
- [x] 5.6 Restrict queues, internal review notes, cross-workspace filters, and production outcome transitions to CL Admin.
- [x] 5.7 Retire workspace_member authorization and update partner/workspace administration APIs to use canonical partner grants.
	Progress note (2026-08-11): the backend permission matrix, workspace/object guards, grant-accessible application routes, canonical assignment APIs, invitation delegation, reporting scope, and secret-before-external-call denials implement the four-role conformance rules. Focused allow/deny and cross-workspace suites pass, including RP Admin, RP User (Edit), Read Only, CL Admin, revoked, and no-access cases.

## 6. Frontend Role-Aware Experience

- [x] 6.1 Update authenticated-user and RP application types for the authorization-context contract.
- [x] 6.2 Replace isSuperuser route guards and existing non-Home authorization branches with server-returned canonical context.
- [x] 6.3 Show only canonical bilingual role labels and active workspace context.
- [x] 6.4 Align workspace, application information, RP configuration, invitation, credential, reporting, oversight, and platform administration actions with the permission matrix.
- [x] 6.5 Remove arbitrary role-definition create/edit/delete flows and legacy workspace-role selectors.
- [x] 6.6 Hide unavailable labels and actions on existing workspace, application, invitation, credential, reporting, oversight, and administration surfaces while keeping backend authorization authoritative.
- [x] 6.7 Update English/French role guidance and remove obsolete upstream authorization-group wording.
- [x] 6.8 Hand the accepted authorization context to add-authenticated-home-and-navigation-groups; keep Home/header grouping and its visibility tests owned by that rebased package.
	Progress note (2026-08-11): every reachable role-aware surface now consumes the strict server-owned authorization context, canonical workspace role, and grant-accessible RP application contracts, with bilingual labels and permission-matrix route/action visibility. Arbitrary role and legacy workspace-member mutation UI is unreachable, and historical application-owner fields are absent from public types and screens. The source authorization scan is clean, and the integrated frontend suite passes (79 files, 378 tests) together with TypeScript, ESLint, changed-file Prettier, and the production build. The dependent Home/navigation package has the canonical contract handoff; its grouped Home/header redesign and dedicated visibility suite remain deliberately owned by that separate change.

## 7. Deterministic Local Personas

- [x] 7.1 Add safe backend-owned fixture users with stable UUIDv5 identifiers and reserved `local.example` emails for CL Admin, RP Admin, RP User (Edit), Read Only, and no access.
- [x] 7.2 Seed two fake partner workspaces and RP applications for allowed-scope and cross-scope verification.
- [x] 7.3 Add ENVIRONMENT=local, AUTH_MODE=local_dev, and ENABLE_DEV_ROLE_SELECTOR=true composition with fail-closed startup validation.
- [x] 7.4 Add a development-only backend session endpoint that accepts only fixture IDs and reuses the normal session/authorization path.
- [x] 7.5 Add a visibly local-only frontend selector and simulated-user summary.
- [x] 7.6 Add safe sample configuration and local setup/reset documentation.
- [x] 7.7 Prove local fixtures and selector routes are unavailable in shared, test-deployment, staging, and production configuration.
- [x] 7.8 Make the separate local seed idempotent, namespace-scoped for cleanup, non-zero on failure, and impossible to run from reference migrations or non-local startup.
	Progress note (2026-08-11): the exact local-mode configuration gate protects both fixture seeding and the selector endpoint, fixture identifiers are deterministic and namespace-scoped, and local persona emails use the reserved `local.example` domain. The live seed succeeds and a second run produces no duplicate state. Configuration and route tests prove arbitrary-role rejection, session-shape parity, cross-workspace denial, and absence outside the exact local gate.

## 8. Verification And Review

- [x] 8.1 Add backend allow/deny tests for every role/action pair, no-role access, cross-workspace objects, revocation, concurrent last-CL-Admin and mixed-assignment protection, and CL Admin secret denial before external calls.
- [x] 8.2 Add frontend route/action visibility tests for every persona and unavailable state.
- [x] 8.3 Add PostgreSQL migration, concurrent transaction, and database constraint tests, including every invalid role/status, soft-delete, uniqueness, and source-invitation case.
- [x] 8.4 Add session/current-user serialization and OpenAPI contract tests.
- [x] 8.5 Run focused IAM, security/privacy, and information-management review.
- [x] 8.6 Run accessibility, bilingual, and GC Design System review for changed role-aware UI.
- [x] 8.7 Run make validate-openspec-change CHANGE_ID=define-four-role-authorization-model.
- [x] 8.8 Run backend tests, frontend unit tests, typecheck, lint, build, OpenAPI checks, and the local verification wrapper.
- [x] 8.9 Record any skipped real-OIDC, shared-environment, container, browser, or production checks and the remaining risk.
- [x] 8.10 Test the local seed twice, allowlist and arbitrary-role rejection, simulated/real session-shape parity, non-local route absence, and cross-workspace denial.
- [x] 8.11 Accept ADR-003 after strict OpenSpec validation, focused backend and frontend authorization verification, current OpenAPI confirmation, and focused IAM review; keep real OIDC, environment-specific migration, retention, and release evidence outside the acceptance claim.
	Progress note (2026-08-11): the integrated backend suite passes 708 tests with 12 environment-gated skips; the integrated frontend suite passes 378 tests across 79 files together with TypeScript, ESLint, changed-file Prettier, the production build, and GC Design System/page-shell checks. OpenAPI export, freshness, and semantic authorization assertions pass. Live disposable PostgreSQL migration, seed, invitation-concurrency, authorization-concurrency, and department-assignment concurrency suites pass with no temporary database residue. The final all-persona localhost browser walkthrough covers CL Admin, RP Admin, RP User (Edit), Read Only, no-access, English/French behavior, grant-accessible application scope, table/form custom-element activation, and cross-workspace denial. An incompatible pinned TanStack Router Devtools adapter discovered during this walkthrough was removed from the local-development shell; the application router and React Query Devtools remain unchanged, and the frontend suite/typecheck/lint pass after removal. The scoped local-verification wrapper completed 10 checks and reported one tool-adapter failure because `uv` is absent from PATH; the same backend suite passed directly from the repository virtual environment. ShellCheck and gitleaks were unavailable, and optional container checks were disabled; these skips do not replace CI scanning. Real OIDC, external IBM Verify, shared environments, staging, production, and deployment were intentionally not exercised under the localhost-only control boundary. The remaining risk is environment-specific identity-provider and deployment configuration; no real secrets or data are required for the completed local checks.

## 9. Contract Cleanup And Archive

- [x] 9.1 Preserve dormant physical legacy authorization fields, role rows, owner snapshots, and workspace-membership history without reachable product authorization reads or writes. Defer physical deletion to a future change tentatively named `retire-legacy-authorization-storage-at-production-cutover`, after backup, disposition, rollback, and non-local rollout expectations are approved.
	Decision note (2026-08-12): product deferred retention/disposition work for several future MVPs. Under STD-020 and PAT-012, zero-backfill and runtime non-authority do not authorize irreversible record deletion; physical storage is therefore preserved and is not an archive gate for this functional authorization change.
- [x] 9.2 Confirm no historical application-owner or owner-email backfill grants partner access.
- [x] 9.3 Confirm every MODIFIED requirement preserves all intended current scenarios and every REMOVED requirement has a migration path.
- [x] 9.4 Re-run holistic QA after the 2026-08-12 zero-membership-backfill decision and resolve blocking findings.
	Progress note (2026-08-12): holistic review confirms that migration 0020 and reconciliation fail closed with zero legacy-derived CL Admin assignments or workspace grants, reject canonical grants with inactive/deleted parents, preserve dormant legacy storage without making it authoritative, and keep lifecycle deletion fields only as defense-in-depth integrity guards. The full backend suite passes 725 tests with 12 environment-gated skips; focused migration/reconciliation verification passes 25 tests with three disposable-PostgreSQL executions skipped because their explicit local gate and administrator URL are not configured. Scoped Ruff lint/format, strict OpenSpec validation, and scenario preservation pass. The repository-wide Markdown wrapper still reports unrelated pre-existing baseline findings outside this change; no changed document is among them. No local QA blocker remains. Task 2.11 is the separate product decision about adopting pre-existing IBM Verify RP registrations.
- [x] 9.5 Archive with openspec archive define-four-role-authorization-model --yes after implementation and verification; do not use --skip-specs.
	Progress note (2026-08-12): the verified package was archived without `--skip-specs` under `openspec/changes/archive/2026-08-12-define-four-role-authorization-model`, and its eight deltas were merged into current specifications.
- [x] 9.6 Confirm all eight current capabilities (six core plus two accessible-application capabilities) contain the implemented behavior, reconcile their Purpose text with archived truth, and confirm the active package moved under the dated archive folder.
	Progress note (2026-08-12): all eight current specifications contain the archived authorization behavior and their Purpose text now describes the canonical four-role, grant-scoped contract rather than owner-era or placeholder behavior.
- [x] 9.7 Repair/rebase the active Home/navigation delta against the archived authorization contract before its own implementation or archive.
	Progress note (2026-08-12): the active Home/navigation package now consumes the merged current authorization contract, records the archived dependency, and passes strict OpenSpec/scenario-preservation validation.
	Progress note (2026-08-12): runtime authorization and public contracts no longer expose or consult application-owner snapshots, legacy role/group policy mutation, or workspace-role writes. Retention scheduling, physical disposition, and environment execution are future production-cutover work and do not block archive. Dormant legacy storage remains preserved and non-authoritative. Product confirmed that launch will adopt pre-existing MVP1 RP registrations through the explicit CL Admin workflow owned by add-cl-admin-rp-registration-adoption; that dependent implementation does not reopen or broaden this completed role contract.
