# Tasks: Add CL Admin RP Registration Adoption

## 0. Specification And Dependencies

- [x] 0.1 Record the product decision to adopt existing MVP1 RP registrations through explicit CL Admin workspace linking after workspaces exist.
- [x] 0.2 Record missing-only IBM metadata precedence, secret/owner exclusion, retained local UUID/audit history, and same-workspace idempotence.
- [x] 0.3 Record the local-only work context, fake IBM adapter mode, control boundary, standards impact, and affected BAS-001 controls.
- [x] 0.4 Select and record the approved candidate-list and focused-form page patterns.
- [x] 0.5 Rebase against the archived four-role authorization contract before implementation validation.
	Progress note (2026-08-12): the package consumes canonical CL Admin and workspace authority from the merged current specs; strict OpenSpec and scenario-preservation validation pass after archive.
- [x] 0.6 Rebase frontend routes/navigation against add-authenticated-home-and-navigation-groups and refine-workspace-task-hub-and-registration-flow before the frontend slice or archive.
	Progress note (2026-08-12): both dependencies are archived and current specs
	now expose the global Workspaces parent, typed selected-workspace hierarchy,
	and canonical Access/Reports/registration routes consumed by this package.

## 1. Backend Candidate And Preview Contract

- [x] 1.1 Add camelCase candidate-list, candidate-preview, workspace-link request, and adopted response schemas without internal IDs, owners, secrets, or raw IBM payloads.
- [x] 1.2 Add CL Admin-only local candidate-list and one-candidate preview routes with explicit response models and safe error contracts.
- [x] 1.3 Add and validate the small typed safe-metadata projection contract
  consumed from the separate IBM-interactions package; this package owns the
  supported non-secret allowlist plus missing/fillable/conflict comparison,
  while raw IBM calls and payload mapping stay outside this package.
- [x] 1.4 Add service tests for candidate eligibility, role denial before IBM calls, provider unavailable/not-found/malformed responses, owner/secret stripping, and serialized wire fields.
	Progress note (2026-08-12): candidate listing is database-only; preview
	consumes an injected, extra-forbidden safe projection. The unavailable
	default remains fail closed until the separately governed IBM-interactions
	package supplies an adapter.

## 2. Atomic Workspace Link

- [x] 2.1 Add the idempotent workspace-link route and service transaction with RP/workspace row locking, active-workspace validation, workspace-derived department, and optional application-information/environment inputs.
- [x] 2.2 Preserve local UUID, IBM ID, portal audit history, secret-lifecycle records, and every non-empty local value while filling only missing allowlisted metadata.
- [x] 2.3 Return the current representation for same-workspace retries and `409 rp_application_already_linked` for a different workspace or stale candidate.
- [x] 2.4 Emit minimized success/failure/denied adoption audit events without secrets, owners, raw provider data, or unnecessary personal information.
- [x] 2.5 Add concurrency/idempotence, record-preservation, audit, authorization, and no-network service/API tests.
	Progress note (2026-08-12): RP and workspace rows are locked in one
	transaction, the conditional update detects stale concurrency, and the
	success audit commits with the link. The service independently persists and
	retries minimized authorization and failed-outcome audits; an unauditable
	allowed decision fails closed, while an unauditable denial remains denied and
	alerts. Validation/provider failures roll back before their outcome audit.
	Focused backend result: 27 passed; Ruff lint and format checks pass. All
	provider behavior is injected/fake in tests.

## 3. CL Admin UI

- [x] 3.1 Add the protected `/workspaces/rp-registration-adoption` source route and Workspaces parent task link using canonical route metadata after dependency rebase.
- [x] 3.2 Add typed fetch/query helpers and a feature-owned candidate table with loading, populated, empty, error, and unauthorized states.
- [x] 3.3 Add the focused candidate route and review/form page with safe local/IBM comparison, workspace selection, any unresolved portal fields, validation errors, and explicit confirmation.
- [x] 3.4 Invalidate candidate, workspace, and RP application query state after success and provide links to the adopted RP and selected workspace.
- [x] 3.5 Add English/French content parity, equivalent-language route behavior, and no duplicate body language toggle.
- [x] 3.6 Add unit/route/state tests and Storybook or equivalent review fixtures for populated, empty, provider-unavailable, conflict, validation, success, and denied states.
	Progress note (2026-08-12): the CL Admin-only nested task is discoverable
	from Workspaces and retains the shared bilingual app shell/header toggle. The
	focused page explicitly says the portal does not update IBM Verify. Unit state
	fixtures cover populated, empty, unavailable, conflict, validation, success,
	and denied behavior. Full frontend result: 94 files / 464 tests pass; ESLint,
	TypeScript, route generation, and production build pass.

## 4. Verification And Developer Readiness

- [x] 4.1 Regenerate and check OpenAPI plus TanStack Router artifacts through supported commands.
- [x] 4.2 Run focused backend/frontend tests, typecheck, lint, format, build, API contract checks, and strict OpenSpec/scenario-preservation validation.
- [x] 4.3 Run GC Design System/page-shell, accessibility, bilingual, IAM/security, and information-management review; resolve findings.
- [x] 4.4 Capture desktop/mobile states and record the fake IBM dependency mode, skipped real-IBM check, and remaining non-local risk.
- [x] 4.5 Run holistic QA across code, specs, docs, tests, generated contracts, standards impact, and affected BAS-001 controls.
	Progress note (2026-08-12): OpenAPI is current; the generated TanStack
	route tree and production build pass. Focused adoption tests report 27
	backend passes, and the full frontend reports 94 files / 464 tests passing.
	Frontend lint, TypeScript, build, touched-file formatting, backend
	touched-file Ruff, strict OpenSpec, scenario preservation, structure/state,
	and page-shell checks pass. Desktop/mobile and English/French browser review
	covered empty, populated, provider-unavailable, and responsive-navigation
	states with no console errors; deterministic fixtures cover success focus and
	the remaining states. See `developer-readiness.md`
	and `evidence/README.md` for the local-only boundary and remaining risk.
- [x] 4.6 Archive with `openspec archive add-cl-admin-rp-registration-adoption --yes` only after implementation, dependency rebase, and verification; do not use `--skip-specs`.
	Progress note (2026-08-12): archived as
	`2026-08-12-add-cl-admin-rp-registration-adoption` with the four new
	requirements merged into the current workspace/RP application management
	spec. Tasks 5.1 and 5.2 remain explicit non-local release follow-through.

## 5. Non-Local Follow-Through

- [ ] 5.1 Before shared or production use, name the IBM target, credentials source, data rules, rate limits, timeout/retry policy, rollback, monitoring, support owner, and evidence expectations.
- [ ] 5.2 Run the reviewed real candidate inventory and require one explicit CL Admin workspace decision per retained RP; do not re-enable unattended sync as a substitute.
