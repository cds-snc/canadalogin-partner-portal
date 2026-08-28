# Evidence Bundle: CL Admin Users And Access Onboarding

## Scope And Lifecycle

- Change: `refine-cl-admin-users-and-access-onboarding`
- OpenSpec lifecycle: archived on 2026-08-12 with current specs updated.
- Work context: local developer/localhost with deterministic fake personas and
  local PostgreSQL/Redis only.
- Control boundary: repo-scoped edits, local commands, and local browser
  interaction were allowed. Shared environments, production, real secrets,
  real personal information, IBM Security Verify, GC Notify, deployment,
  approval, waiver, and release decisions were out of scope.
- Sensitive data: only disposable local email fixtures. No raw provider
  subject, claim, invitation token, or acceptance URL is retained in this
  evidence record.

## Change Summary

CL Admin now has a centralized, access-oriented Users and access directory,
focused invite and manage-access routes, and canonical cross-workspace role
management. Workspace Access remains the scoped surface for RP Admin. The
invitation lifecycle is owned by the workspace, can bootstrap the first RP
Admin without an RP application, and preserves optional RP-application source
provenance. User-facing identity-provider implementation detail is removed.

The page-pattern decision is recorded in
`openspec/changes/archive/2026-08-12-refine-cl-admin-users-and-access-onboarding/users-and-access-page-pattern-decision.yaml`.

## Contract And Data Evidence

- Alembic revision `0025_workspace_invitations` preserves existing records,
  makes RP-application provenance nullable, and refuses an unsafe downgrade
  when workspace-only invitations exist.
- Canonical list/create/revoke/reissue resources live below
  `/api/v1/workspaces/{workspaceUuid}/invitations`; legacy application routes
  delegate to the same service.
- Invitation acceptance creates one canonical workspace assignment and returns
  a safe workspace destination when no source application exists.
- `GET /api/v1/users/{userUuid}/access` and
  `POST /api/v1/users/invitation-target-resolution` expose only the safe fields
  needed by CL Admin.
- `make check-openapi` passed and `openapi/openapi.json` is current.
- The TanStack route tree was generated through the supported Vite route
  generator as part of the production build.

## Verification Results

| Area | Result |
|---|---|
| Focused backend | 138 passed, 5 skipped in 3.75 seconds |
| Scoped backend Ruff lint/format | Passed for 15 implementation/test files |
| Frontend unit | 97 files, 474 tests passed |
| Frontend TypeScript | Passed with `npm exec tsc -- --noEmit` |
| Frontend ESLint | Passed with zero warnings |
| Frontend production build | Passed; existing large-chunk advisory remains |
| Frontend scoped Prettier | Passed |
| GC Design System check | Passed |
| UI page-shell check | Passed |
| OpenAPI current-file check | Passed |
| Strict OpenSpec/scenario preservation | Active change passed before archive; all three affected current specs pass strict validation after archive |

The archive promoted three added and four modified requirements with zero
removals. Repository-wide strict validation remains red only because the
unrelated pre-existing `standardized-error-logging` current spec lacks the
required OpenSpec Purpose/Requirements wrapper.

Focused backend command coverage included the workspace-invitation migration,
invitation service/API/concurrency, users, user search/projection, role
assignment API/service, and authorization mutation/runtime suites.

## Browser And UI Review

Local fake-data review covered:

- CL Admin Users and access directory with no provider column;
- concise visible `Manage` actions with record-specific accessible names;
- invite-new and existing-identity redirection to manage access;
- CL Admin role/workspace assignment controls;
- first RP Admin invitation in a workspace with no RP application;
- invitation revoke and confirmed reissue lifecycle;
- RP Admin exact-email search, lower-role-only delegation, immutable peer RP
  Admin access, own-workspace scope, and denial from `/users`;
- English and French routes, breadcrumbs, controls, table internals, messages,
  and accessible names; and
- desktop semantics plus 390 by 844 responsive table and menu reflow.

The responsive review found and remediated one shared issue: the GCDS table
wrapper did not receive the active language, leaving built-in sort and row
count controls in English on French pages.

## BAS-001 Affected-Control Assessment

Assessment status: complete for this local change. The release gate is
`blocked` because no release owner or non-local evidence was requested; this
assessment and OpenSpec archive are not release approval.

| Control | Status | Local evidence | Remaining release evidence |
|---|---|---|---|
| GC-WEB-001 Scope And Applicability | applies | Partner/administrative scope and local boundary are recorded in proposal/design/tasks. | Confirm release scope and owner. |
| GC-WEB-002 Canada.ca Design, Federal Identity, And Page Shell | applies | Recorded PAT-001 decision, shared GCDS shell, standards and page-shell checks passed. | Persisted visual screenshots were not available from the selected browser surface. |
| GC-WEB-003 Accessibility | applies | Semantic tables/forms/dialogs, concise accessible action names, error/status regions, focused unit checks, and browser accessibility-tree review passed. | Complete keyboard/visible-focus, 200 percent zoom, and assistive-technology review before release. |
| GC-WEB-004 Official Languages And Plain Language | applies | Translation parity tests and live English/French review passed; shared table language defect was fixed. | Human bilingual content review before release. |
| GC-WEB-005 Mobile And Responsive Behaviour | applies | Live 390 by 844 navigation and table reflow retained labels and actions. | Persist desktop/mobile screenshots and complete 200 percent zoom review. |
| GC-WEB-006 Privacy And Personal Information | applies | Email is minimized to authorized access views; raw provider subject/claims and tokens are excluded from reads, logs, and evidence. | Confirm program privacy/retention posture before a real-data release. Physical disposition is a future change. |
| GC-WEB-007 Security | applies | Server-owned authorization, safe identity resolution, token hashing, safe errors, and conflict/concurrency tests passed locally. | Run gated PostgreSQL concurrency checks and shared-environment security validation. |
| GC-WEB-008 Identity And Access | applies | Canonical four-role service and CL Admin/RP Admin browser boundaries passed; lower roles are denied mutations. | Verify real CanadaLogin binding/session flow in its authorized environment. |
| GC-WEB-009 Information Management, Records, And Audit | applies | Migration preserves lifecycle history and consequential mutations retain audit metadata without secrets. | Retention/disposition remains intentionally future-MVP work; no destructive cleanup is authorized. |
| GC-WEB-010 APIs, Interoperability, And Data Exchange | applies | Resource routes, camelCase clients, schemas, OpenAPI check, and compatibility adapters passed. | Verify the separate IBM integration package when it is delivered; this registration/invitation slice makes no IBM call. |
| GC-WEB-011 Logging, Monitoring, Analytics, And Operational Readiness | applies | Safe local audit/diagnostic behavior and error paths were exercised. | Shared-environment logging, monitoring, support, and deployment readiness were not in scope. |

Exceptions: none recorded.

Deferred-control approvals: none claimed. Items in the final column are missing
release evidence or separately scoped future work, not agent-approved risk.

## Skipped And Incomplete Checks

- Five opt-in PostgreSQL concurrency tests were skipped because
  `RUN_*_POSTGRES_TESTS` and their administrative database URLs were not
  configured. Their unit/service equivalents passed.
- A complete browser acceptance with a fresh identity matching the invitation
  could not be performed because the local persona endpoint is deliberately
  allowlisted and does not permit arbitrary identities. Acceptance, email
  matching, idempotency, conflict, and safe-destination behavior are covered by
  service/API tests.
- Persisted desktop/mobile screenshots, assistive-technology testing, keyboard
  visible-focus review, and 200 percent zoom were not available in the selected
  local browser capability boundary.
- Repository-wide backend Ruff is red on unrelated pre-existing tab indentation
  in department tests and formatting in IBM client tests. All backend files in
  this slice pass scoped Ruff lint and format checks.
- No real CanadaLogin, Notify, IBM, shared-environment, deployment, or
  production verification was run.

## Remaining Risk And Follow-Up

- Before release, a human release owner must review the missing non-local,
  accessibility, visual, privacy, security, and operational evidence above.
- The separate IBM interaction package remains responsible for provider calls;
  RP registration and invitation flows in this change do not call IBM.
- Retained MVP1 RP adoption/linking remains a CL Admin workflow after partner
  workspaces exist and is separate from this change.
- Retention/disposition and physical cleanup remain future-MVP work and are not
  authorized by this implementation or evidence record.
