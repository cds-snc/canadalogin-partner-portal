# Local Verification Note

## Scope And Control Boundary

This note covers the workspace chooser and task hub, canonical Access and
selected-workspace Reports routes, and the route-per-step RP application
registration flow delivered by this change.

Verification used localhost services, deterministic `local.example` personas,
fake workspace and RP application records, and a local PostgreSQL database. No
shared environment, IBM Security Verify tenant, real secret, production
identifier, production data, or real personal information was used or mutated.
The FastAPI BFF and its canonical authorization context remain authoritative.

The registration boundary is deliberately portal-local. Draft creation,
partial and completed-step saves, final submission, and retry recovery do not
call, provision, update, enrich, or synchronize IBM Verify or another external
system. A separately governed IBM-interactions package owns any later IBM
operation and consumes the submitted portal record.

## Page-Pattern And Design-System Review

- `/workspaces` is the authorized chooser and
  `/workspaces/$workspaceUuid` follows PAT-001 as a selected-workspace task hub.
- Overview, Application information, RP applications, Access, Reports, and
  Settings use one typed, capability-filtered route catalog for labels,
  breadcrumbs, active families, return paths, and discoverability.
- `/workspaces/$workspaceUuid/access` is the canonical assignment and
  invitation destination. The legacy `/members` route rechecks authority and
  redirects to Access without introducing a second access model.
- `/workspaces/$workspaceUuid/reports` is a focused selected-workspace report
  page over the existing reporting service. It cannot select or disclose a
  second workspace and remains distinct from internal cross-workspace
  oversight.
- Registration follows PAT-019 across Basics, Endpoints, Client and access,
  Signing, Encryption, Review, and Confirmation routes. Review follows PAT-017
  with localized summaries and Change links.
- The shared shell and changed pages use GC Design System header, language
  control, breadcrumbs, side navigation, input, textarea, selection, radio,
  checkbox, error summary, notice, button, link, date-modified, footer, skip
  link, and landmark patterns. No custom page-shell exception was introduced.

## Screenshots And Interaction Evidence

| Evidence | What it demonstrates |
|---|---|
| `workspace-hub-rp-admin-desktop.png` | Authorized RP Admin workspace hub, named context, task hierarchy, breadcrumbs, and side navigation. |
| `workspace-hub-rp-admin-mobile.png` | Workspace hub and navigation reflow at a 375 by 812 viewport. |
| `workspace-hub-rp-admin-fr.png` | French workspace shell, task labels, and content parity. |
| `workspace-hub-200-percent.png` | Equivalent 720-CSS-pixel reflow used as the available local approximation for 200 percent zoom. |
| `registration-basics-errors.png` | Basics error summary, field errors, bilingual service-name inputs, and no placeholder creation on invalid input. |
| `registration-endpoints-middle-step.png` | A populated middle step with durable server-backed answers and workflow controls. |
| `registration-review.png` | Complete Review summary, Change links, consequences, and explicit portal-local submission boundary. |
| `registration-confirmation.png` | Successful submitted lifecycle state, next steps, detail link, and workspace return link. |
| `registration-confirmation-fr.png` | French Confirmation, shell, navigation instructions, status, and IBM boundary parity. |

The installed system Chrome completed a real local-database journey from
Basics through every step, Review, final submission, and English/French
Confirmation. Each draft write and the final transition returned success. The
browser also exposed and drove fixes for the React 19 GCDS textarea event
adapter, conditional FastCRUD update-return semantics, live GCDS localization,
and overly broad query-cache invalidation.

Keyboard and accessibility-tree inspection confirmed one H1, labelled
navigation landmarks, explicit status/error semantics, linked field errors,
predictable task and form-control order, non-colour active state, and usable
Back, Continue, Save and exit, Cancel, Change, and submit controls. Live
English/French switching preserved the equivalent route and unsaved form state
while updating GCDS internal instructions without remount errors.

## API, Persistence, And Lifecycle Evidence

- Separate typed contracts cover minimum-Basics create, safe partial or
  completed-step patch, versioned final submit, and fixed public responses.
- Additive migration `0024_rp_registration_draft_metadata.py` adds the opaque
  creation key, non-negative monotonic draft version, and nullable completed
  step marker to the existing RP application aggregate. It applied
  successfully to disposable local PostgreSQL.
- Create retry is idempotent by creation key; mismatched keys or payloads fail
  with stable conflict responses. Conditional updates bind workspace,
  application, editable state, and expected version.
- Partial saves validate supplied-value safety; completed-step saves validate
  the merged active step and prerequisites; final submit validates the complete
  merged questionnaire and performs one atomic `draft` to `submitted`
  transition.
- Ambiguous final-submit retry returns the already-submitted representation
  without repeating the state transition or success audit event.
- Offline exchange accepts only public certificate or public JWK material.
  Private JWK members, symmetric keys, credentials, and other secret material
  are rejected before persistence.
- Operational events contain safe identifiers, step/save metadata, changed
  field names, outcome, and correlation ID only; answer and key values are
  excluded.
- Generated OpenAPI exposes the typed workspace report and registration
  contracts. Frontend fetch clients use the canonical camelCase wire shape.

## Bilingual Review

- English and French locale files have matching key structure for the workspace
  hub, Access, Reports, all registration steps, validation, Review, Change
  links, Confirmation, statuses, breadcrumbs, and recovery content.
- Browser switching verified localized GCDS header, signature, skip link,
  breadcrumb, primary and side-navigation instructions, required tokens, date
  modified, page content, and confirmation guidance on the equivalent route.
- Workspace and service names remain source data; fixed navigation, lifecycle,
  environment, validation, accessible-name, and recovery labels are localized.

## Security, Privacy, And Sensitive-Surface Review

- Every route and write rechecks canonical capability, workspace scope,
  application parentage, lifecycle state, and version on the server.
- Direct denial and cross-workspace tests prove protected services are not
  reached when authorization or scope fails.
- URL and history contain only opaque route UUIDs; questionnaire answers,
  authorization context, creation keys, key material, credentials, and tokens
  are not placed in query strings or fragments.
- Browser inspection found no registration values in local or session storage.
  Draft authority and answers are server-backed; the browser holds only normal
  in-memory form/query state and the shared language preference.
- API errors, logs, audit events, report exports, screenshots, and fixtures were
  inspected for answer values, certificate/JWK material, credentials,
  invitation tokens, secrets, and real data. Evidence contains fake local data
  only.
- Backend dependency-order tests prove the registration routes do not resolve
  an IBM provider. The local runtime had no IBM client configured and its
  request log showed only portal-local API calls.

## Checks Run

- Focused backend registration and external-dependency suites: 47 tests passed.
- Broader focused backend workspace, report, registration, migration,
  authorization, configuration, and OpenAPI suites: 180 tests passed.
- Full frontend Vitest suite: 91 files and 449 tests passed.
- Focused post-review GCDS language, wrapper, layout, and registration-cache
  suite: 6 files and 13 tests passed.
- Backend Ruff lint and format checks for the scoped implementation: passed.
- TypeScript `tsc --noEmit`: passed.
- ESLint for `frontend/src`: passed.
- Scoped Prettier for the changed registration and localization files: passed.
- Vite production build and generated TanStack route-tree refresh: passed; only
  the existing chunk-size warnings were emitted.
- Additive migration applied successfully to local PostgreSQL.
- Generated OpenAPI export completed; the contract comparison found no
  uncommitted generated-contract drift.
- Frontend GC Design System standards and UI page-shell checks: passed.
- Strict OpenSpec validation and scenario-preservation preflight: passed.
- Secret checks passed; optional `gitleaks` was skipped because the binary is
  not installed.
- Scoped `git diff --check`: passed.

## BAS-001 Control Assessment

| Control | Status | Evidence and result |
|---|---|---|
| GC-WEB-001 | applies | Workspace, access, reporting, registration scope, audiences, route hierarchy, and local boundary are recorded in the change and this note. |
| GC-WEB-002 | applies | Recorded PAT-001, PAT-017, and PAT-019 decisions, GC Design System use, page-shell checks, and screenshots pass local review. |
| GC-WEB-003 | applies | Semantic structure, errors, focus/order, keyboard operation, accessibility-tree inspection, non-colour state, mobile, and equivalent zoom checks pass. Formal assistive-technology review remains release work. |
| GC-WEB-004 | applies | English/French key parity, equivalent-route switching, GCDS internal localization, and French hub/Confirmation evidence pass. Human translation review remains release work. |
| GC-WEB-005 | applies | Desktop, 375-pixel mobile, middle-step, error, Review, Confirmation, and 720-CSS-pixel equivalent zoom checks preserve usable content and actions. |
| GC-WEB-006 | applies | Collection is limited to RP onboarding needs. URL, storage, logs, audits, exports, screenshots, and fixtures were checked; only fake local data was used. |
| GC-WEB-007 | applies | Server-side capability/scope/state/version checks, secret-material rejection, safe errors/logs, tests, lint, and secret checks pass. No deployment path changed. |
| GC-WEB-008 | applies | Existing BFF/session authority, canonical role capabilities, scoped service tests, lifecycle rechecks, and fail-closed dependency order provide local evidence. |
| GC-WEB-009 | applies | Registration remains in the existing soft-deletable RP application aggregate with existing retention unchanged. This MVP performs no physical disposition; any later policy or deletion requires a future approved change. |
| GC-WEB-010 | applies | Typed Pydantic responses, generated OpenAPI, camelCase TypeScript clients, path-bound workspace reports, stable errors, and cache-consistency tests pass. |
| GC-WEB-011 | applies | Safe operational events exclude answers and key values. No analytics or production-operations change was introduced; shared-environment readiness remains outside local scope. |

The BAS-001 result is a local implementation and verification pass, not a
production release approval. Public registration configuration is stored in
the existing PostgreSQL aggregate and transported through the authenticated
BFF. Shared-environment database encryption, backup, and key-management
configuration remain deployment evidence. No private or symmetric key intake,
control exception, or waiver is requested.

## Skipped Checks And Remaining Risk

- No formal screen-reader or complete assistive-technology session was run;
  semantic accessibility-tree and keyboard inspection were completed.
- Firefox and Safari were not run because their Playwright executables are not
  installed; interactive review used installed system Chrome.
- The browser runtime did not expose a reliable zoom control; the available
  720-CSS-pixel viewport provided the equivalent 200-percent reflow check.
- No real IBM, shared environment, production integration, or external system
  was contacted. That is an intentional product boundary, not missing local
  registration verification.
- The optional `gitleaks` binary is not installed; the repository secret-check
  adapter otherwise passed.
- Shared-environment at-rest encryption, backup, browser matrix, formal
  assistive-technology, human translation, and release-owner review remain
  release-readiness activities rather than Level 2 local blockers.
