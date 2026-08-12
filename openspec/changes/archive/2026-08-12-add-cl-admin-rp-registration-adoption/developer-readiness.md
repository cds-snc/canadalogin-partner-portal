# Developer Readiness: CL Admin RP Registration Adoption

Date: 2026-08-12

## Outcome

The local portal contract is implemented and ready to archive. CL Admin can
list unassigned retained RP registrations, review a safe comparison, and link
one retained RP to one active workspace. The operation preserves the local RP
UUID and existing non-empty portal data, fills only missing allowlisted
metadata, derives the department from the workspace, is safe to retry for the
same workspace, and records minimized authorization and outcome audits.

The portal does not call or update IBM Verify. This package consumes a typed,
extra-forbidden, non-secret projection owned by the separate IBM-interactions
package. Its default provider is unavailable and fails closed. The local tests
use injected fake providers only.

## Verification

- Backend adoption suite: 27 passed.
- Full backend suite: 783 passed, 12 skipped. The skips require explicit
  PostgreSQL or external-integration gates that were not configured.
- Frontend suite: 94 files and 464 tests passed.
- Frontend ESLint, TypeScript, production build, generated route tree, and
  touched-file Prettier checks passed.
- Touched backend Ruff lint and format checks passed.
- Generated OpenAPI freshness check passed.
- Strict target OpenSpec and scenario-preservation checks passed.
- Delorean structure and state checks passed.
- GC Design System/page-shell check passed.
- English/French adoption keys are structurally equivalent, including the
  focused-route breadcrumb.
- Repository diff whitespace check passed.

Known repository-wide formatting, Python lint, and Markdown findings are
pre-existing outside this slice; scoped checks for every file changed by this
package pass. ShellCheck and gitleaks were unavailable locally and were not
substituted with weaker evidence.

## Review Results

- Accessibility: semantic headings and tables, labelled selects, validation
  summary, keyboard order, responsive reflow, visible notices, and focus on
  successful adoption were reviewed and covered by tests.
- Official languages: the same routes and states are available in English and
  French through the shared language toggle; no duplicate body toggle exists.
- IAM and security: canonical server-side `partner_bootstrap` authorization is
  authoritative; partner roles are denied before provider access; IBM owner
  data grants no portal authority; raw payloads, secrets, credentials, owners,
  and unhashed provider identifiers are excluded from responses, audit, and
  logs.
- Information management: the retained local RP record and portal audit
  history remain intact. This change adds a minimized adoption event and does
  not change retention or authorize physical disposition.
- Data integrity: RP and workspace rows are locked, a conditional update
  detects stale adoption, non-empty local data wins, and a different-workspace
  retry returns the stable `rp_application_already_linked` conflict.

## BAS-001 Affected-Control Assessment

- GC-WEB-001/002: repository context and the shared GC page shell remain the
  source of truth; page-shell checks pass.
- GC-WEB-003: accessibility and official-language behavior were reviewed in
  both viewport and locale variants.
- GC-WEB-004/005/006: typed API/data contracts minimize the returned provider
  projection and introduce no new owner or secret collection.
- GC-WEB-007: CL Admin authorization is enforced server-side and fails closed.
- GC-WEB-008: minimized authorization and outcome events cover the privileged
  link action without recording provider payloads.
- GC-WEB-009: the retained RP UUID and audit history preserve record
  continuity; retention remains outside this MVP.
- GC-WEB-010: focused and full local checks provide developer-readiness
  evidence.
- GC-WEB-011: operational IBM integration remains explicitly non-local and is
  not represented as release-ready by this archive.

## Remaining Non-Local Boundary

Tasks 5.1 and 5.2 intentionally remain open. Before shared or production use,
the separate IBM-interactions package must provide an authorized adapter and
the owners must name the target, credential source, data rules, rate limits,
timeout/retry policy, monitoring, rollback, and support path. A CL Admin must
then review the real candidate inventory and make one explicit workspace
decision per retained RP. No real IBM call, shared-environment data access,
deployment, or external mutation was performed here.
