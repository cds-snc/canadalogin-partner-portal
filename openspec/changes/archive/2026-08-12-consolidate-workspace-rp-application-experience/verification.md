# Verification Note: Consolidate workspace RP application experience

## Scope

This note verifies the local developer implementation of
`consolidate-workspace-rp-application-experience` against its active OpenSpec
change. The reviewed scope includes the shared RP application summary,
canonical workspace routes, role-aware task hub, portal-owned Configuration,
workspace-bound Usage and Manage credentials flows, legacy redirects, and the
recoverable Endpoints-step validation path.

Verification used localhost services and fake, seeded, or test-only data. IBM
Verify, shared environments, production data, real secrets, deployment,
publishing, approvals, waivers, and external-system mutation were outside the
control boundary. The local browser exercise changed only a disposable seeded
registration draft.

## Checks Run

- `make run-pytest` with explicit local CORS method/header lists: 811 passed,
  12 skipped.
- Focused backend schema, summary, configuration, registration-draft, API,
  authorization, Usage, and credential tests, including a frontend-shaped
  Endpoints contract fixture.
- Scoped Ruff checks for the changed backend implementation and tests: passed.
- `npm test` in `frontend/`: 100 files and 488 tests passed.
- `tsc --noEmit`: passed after the final UI changes.
- Frontend ESLint with zero warnings, including final scoped lint: passed.
- `npm run build`: passed; Vite reported only its non-blocking large-chunk
  advisory.
- `scripts/delorean/run-frontend-standards-checks.sh`: passed.
- `scripts/delorean/run-ui-page-shell-checks.sh`: passed.
- `git diff --check`: passed.
- Strict active-change validation with the official OpenSpec CLI: passed.
- `make validate-openspec-change
  CHANGE_ID=consolidate-workspace-rp-application-experience`: passed strict
  validation and the modified-requirement scenario-preservation preflight.
- `openspec archive consolidate-workspace-rp-application-experience --yes`:
  succeeded without `--skip-specs`; four current capabilities were updated or
  created and the completed package moved to the dated archive.
- Post-archive strict validation: each of the four affected current specs
  passed individually.
- `scripts/delorean/run-local-verification.sh`: attempted. Structure and
  Delorean state checks passed before the repo-wide format stage encountered
  existing generated/cache and unrelated formatting debt.
- Local browser inspection covered both application lists, RP Admin, RP User
  (Edit), Read Only, and CL Admin task hubs, Configuration, legacy redirects,
  credential-provider outage, French content, keyboard focus, and narrow
  responsive layout.
- Local browser registration exercise submitted a malformed English
  application URL on Step 2, observed a `422`, corrected the field, and then
  advanced successfully to Step 3.

## Results

- Workspace and My Applications surfaces use the same secret-free summary
  mapper and card semantics, stable ordering, localized names/statuses, resume
  destinations, and canonical workspace-scoped overview links.
- The canonical overview presents Configuration, Usage, and Manage credentials
  according to workspace capabilities. Read Only omits credential and mutation
  actions; CL Admin receives safe metadata and a no-partner-actions state.
- Missing, revoked, and out-of-scope deep links receive a safe unavailable
  state without raw identifiers or provider lookup.
- Configuration is read from portal persistence, remains available without IBM
  Verify, shows environment and lifecycle context, and omits raw offline key
  material, credentials, secrets, tokens, provider payloads, and policy data.
- Credential and Usage operations bind the route workspace to the RP
  application before provider access. A credential-provider `503` stays on the
  focused route with a scoped bilingual notice and a canonical return link.
- Legacy detail, MAU, and credential links resolve to their canonical
  workspace-scoped destinations after current-user scope and capability checks.
- The reproduced Step 2 validation failure stayed on Endpoints, preserved the
  entered answers and last saved draft/version, focused the GCDS error summary,
  linked it to `#workspace-rp-application-url-en`, and displayed field-level
  feedback. The server log recorded safe invalid field names and a request or
  correlation identifier without logging the submitted URLs or other answer
  values. Correcting the URL produced a `200` and advanced to
  `client-and-access`.
- At a 320 CSS-pixel viewport, the French Configuration page and task cards
  reflowed to one column with document and body scroll widths equal to the
  viewport. Long French content did not introduce horizontal scrolling.
- Keyboard navigation exposed a visible focus indicator on the GCDS card, and
  semantic inspection confirmed one H1, ordered H2/H3 content, uniquely named
  single-destination cards, and focus on the error-summary host after invalid
  submission.
- English and French page names, task labels, environment values, onboarding
  states, promotion states, errors, and recovery actions have matching
  translation coverage.
- OpenSpec archive preserved existing modified-requirement scenarios, retired
  the seven MVP1 OAuth requirements, retained an explicit legacy-retirement
  requirement, created the canonical RP application experience spec, and
  promoted the summary, route, capability, Configuration, Usage, credential,
  and registration-recovery scenarios into current specs.

No blocking implementation, OpenAPI, OpenSpec, GC Design System, accessibility,
bilingual, authorization, security, privacy, or evidence drift was found in
the scoped review.

## Schema-Backed Checks

- Standard, pattern, control, or baseline checked: `STD-002`, `STD-004` through
  `STD-014` as applicable, `STD-017` through `STD-019`, `PAT-001`, `PAT-013`,
  `PAT-014`, `PAT-017`, `PAT-020`, `PAT-022`, `BAS-001`, and affected
  `GC-WEB-*` controls recorded in the design.
- Schema contract used, if available: strict OpenSpec deltas, generated
  `openapi/openapi.json`, Pydantic request/response schemas, and the shared
  frontend/backend Endpoints fixture.
- Result: pass for local developer readiness.
- Evidence: automated commands and local browser observations in this note;
  related tests under `backend/tests/` and `frontend/tests/unit/`.
- ADR linked, if the project does not follow the guidance: not applicable.
- Waiver linked, if a delivery gate needs one: not applicable.
- Follow-up owner: product and release reviewers for normal pre-release manual
  checks.

## Gaps

- No formal screen-reader session or literal browser 200-percent zoom session
  was run. Semantic, focus, keyboard, long-French, and 320-pixel reflow checks
  provide local implementation evidence, but assistive-technology and literal
  zoom confirmation remain appropriate before release.
- Browser screenshots were inspected during the local session but were not
  retained as repository artifacts. This durable note records the observed
  states without embedding sensitive configuration or credentials.
- The holistic wrapper cannot currently complete because repo-wide format and
  Markdown checks include existing unrelated/generated artifacts. Full backend
  Ruff likewise reports existing debt outside this scoped change. Changed-file
  lint, type, tests, standards, page-shell, OpenAPI, whitespace, and strict
  OpenSpec checks are green.
- Aggregate post-archive `openspec validate --specs --strict` reports 10 of 11
  current specs valid. The sole failure is the pre-existing
  `standardized-error-logging` spec, which lacks the current CLI's Purpose
  section; all four specs affected by this archive pass strict validation.
- The local Usage fixture without an IBM application/department link returns
  the existing safe setup-required `409`; real provider reporting was not in
  the authorized local dependency mode.
- Container, shared-environment, production, and real-provider verification
  were not run because they are outside this local-only change.

## Follow-Up

- Before a shared-environment or production release, run the normal human
  content review, screen-reader/literal 200-percent zoom check, and real
  provider integration checks in a named approved environment.
- Track the unrelated repo-wide format, Markdown, and backend Ruff debt
  separately; it does not change the result of this scoped local verification.
