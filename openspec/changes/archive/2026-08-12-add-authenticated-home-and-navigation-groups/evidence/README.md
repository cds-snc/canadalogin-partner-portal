# Local Verification Note

## Scope And Control Boundary

This note covers the authenticated service Home, deterministic admission
routing, grouped global navigation, the Administration task hub, and the
partner operational overview delivered by this change.

Verification used only localhost services and deterministic `local.example`
personas. No shared environment, IBM Security Verify tenant, real secret,
production identifier, production data, or real personal information was
used. The route catalog controls discoverability only; the FastAPI BFF and its
canonical authorization context remain authoritative.

## Page-Pattern And Design-System Review

- `/` follows PAT-001 as a service Home: one localized H1, short orientation,
  and authorized parent task links without dashboard widgets or inline work.
- `/administration` follows PAT-001 as a task hub. Users and access,
  Departments, Tiers, Audit logs, and fixed Role reference remain focused
  child pages, with catalog-derived breadcrumbs and `GcdsSideNav` navigation.
- `/your-applications` follows PAT-021 as an authenticated operational
  overview. Applications lead, workspaces remain a separate section, and each
  section has independent loading, empty, error, partial, and retry behaviour.
- The shell uses GC Design System header, language control, top navigation,
  navigation groups and links, breadcrumbs, side navigation, content
  container, headings, notices, footer, skip link, and main landmark. No custom
  menu or page-shell exception was introduced.
- The typed route catalog is the single source for localized navigation labels,
  visibility, active path families, breadcrumb ancestry, surfaces, and return
  routes. Source route files remain thin and the TanStack route tree remains
  generated.
- Review against PAT-017, PAT-020, and PAT-022 confirms summaries are
  item-focused, feedback is scoped to the affected section with a recovery
  action, and forms/reports/large collections remain on dedicated pages.

## Screenshots And Interaction Evidence

| Evidence | What it demonstrates |
|---|---|
| `home-rp-admin-desktop.png` | Authenticated RP Admin Home exposes only the authorized Partner work task area. |
| `your-applications-desktop.png` | Populated operational overview uses meaningful application and workspace names rather than raw UUID labels. |
| `your-applications-mobile.png` | The overview reflows at 375 by 812 without horizontal overflow or clipped actions. |
| `your-applications-200-percent.png` | The overview remains usable at 200 percent browser zoom without horizontal overflow. |
| `your-applications-partial-fr.png` | French partial state keeps available application work visible while the workspace error remains section-scoped and retryable. |
| `mobile-navigation-keyboard-open.png` | Keyboard Enter opens the mobile header menu and the trigger retains a visible focus indicator. |
| `administration-cl-admin-desktop.png` | CL Admin task hub, breadcrumbs, side navigation, and authorized destinations use the shared page shell. |
| `administration-cl-admin-mobile.png` | Administration content and the GC Design System side navigation reflow on mobile. |

Keyboard inspection confirmed that grouped navigation opens without hover and
that links, account controls, language control, side navigation, and recovery
actions remain in predictable document order. Active links use component
state/`aria-current` and are not communicated by colour alone. The mobile
header and side-navigation components each use the GC Design System's localized
`Menu` trigger inside separately labelled navigation landmarks.

## Bilingual Review

- English and French locale files have matching key structure for the changed
  Home, navigation, Administration, overview, status, and recovery content.
- The header language control changes the shared application preference and
  preserves the equivalent current route instead of creating a second page
  toggle or durable authority state.
- The French partial-state screenshot verifies translated headings, lifecycle
  content, error copy, retry action, shell, and navigation in a meaningful
  asynchronous state.
- Application and workspace names are source data; fixed role, lifecycle,
  environment, navigation, accessible-name, and recovery labels are localized.

## Security, Privacy, And Sensitive-Surface Review

- Protected route entry forces BFF current-user revalidation. Failed
  revalidation cannot expose stale protected navigation or authorize a request.
- Admission tests reject external, scheme-relative, executable, backslash,
  unknown, unauthorized, and stale intended destinations. Query and fragment
  state cannot supply client-authored authorization.
- Direct backend checks prove denied workspace, oversight, and bearer-token
  requests do not reach the protected service operation.
- Source inspection found no new analytics hook or logging of current-user
  response bodies, authorization payloads, OIDC tokens, or invitation tokens.
- Browser inspection found only the existing `i18nextLng` preference in local
  storage, empty session storage, and the current route in the URL. No
  authorization context, token, or personal-data copy was found in browser
  history or storage.
- Screenshots and fixtures contain only deterministic local personas and
  `local.example` identifiers. Raw workspace UUIDs are retained only as route
  and lookup keys and are not used as visible context labels.

## Checks Run

- Full frontend Vitest suite: 83 files and 413 tests passed.
- Focused admission-routing suite: 45 tests passed, including the table-driven
  prerequisite and destination matrix.
- Focused Home, header, account group, Administration, navigation-catalog,
  overview, invitation, and translation tests passed.
- Focused backend authority checks: 4 tests passed; one dependency deprecation
  warning was emitted.
- TypeScript `tsc --noEmit`: passed.
- ESLint for `frontend/src`: passed.
- Scoped Prettier for all files changed by this Home/navigation slice: passed.
- Vite production build and generated TanStack route-tree refresh: passed; only
  the existing chunk-size warnings were emitted.
- Frontend GC Design System standards check: passed.
- UI page-shell check: passed.
- Secret check: passed with optional `gitleaks` scan skipped because the binary
  is not installed.
- Strict OpenSpec validation and scenario-preservation preflight: passed.
- Scoped `git diff --check`: passed.

## BAS-001 Control Assessment

| Control | Status | Evidence and result |
|---|---|---|
| GC-WEB-001 | applies | Partner-facing and administrative web-application scope, audience, local boundary, and service areas are recorded in this change and note. |
| GC-WEB-002 | applies | Recorded page-pattern decisions, GC Design System component use, page-shell check, and desktop/mobile screenshots pass the local review. |
| GC-WEB-003 | applies | Semantic structure, unit coverage, keyboard operation, visible focus, non-colour active state, mobile, and zoom checks pass. Formal assistive-technology review remains a release-review check. |
| GC-WEB-004 | applies | English/French key parity, equivalent-route language-control test, and French partial-state review pass. Human translation review remains a release-review check. |
| GC-WEB-005 | applies | Desktop, 375-pixel mobile, narrow navigation, and 200 percent zoom checks show no horizontal overflow or unavailable task control. |
| GC-WEB-006 | applies | The change creates no new collection or durable copy. URL, storage, logs, screenshots, analytics hooks, and fixtures were checked for sensitive data; only fake local identities were used. |
| GC-WEB-007 | applies | Fail-closed BFF revalidation, safe destination handling, direct backend denial, lint/tests, and secret checks pass. No deployment path changed. |
| GC-WEB-008 | applies | Accepted ADR-001/ADR-003 boundaries, canonical authorization-context tests, protected-route tests, logout/session behaviour, and backend denial checks provide local evidence. |
| GC-WEB-009 | not_applicable | This UI/navigation change introduces no business record, audit event, export, persistence schema, retention rule, or disposition path. |
| GC-WEB-010 | applies | Typed existing fetch clients and endpoint-specific wire contracts are preserved. No API response changed, so OpenAPI regeneration and response-model migration were not triggered. |
| GC-WEB-011 | applies | No analytics, monitoring, or production operations change was introduced. Source/browser inspection found no sensitive diagnostic payloads; production readiness remains outside this local-only change. |

The BAS-001 result is a local implementation and verification pass, not a
production release approval. No control exception or waiver is requested.

## Skipped Checks And Remaining Risk

- No formal screen-reader or complete assistive-technology session was run.
- Firefox and Safari were not run because their Playwright executables are not
  installed; interactive review used the installed system Chrome.
- No real IBM, shared-environment, or production integration was contacted.
- The optional `gitleaks` binary is not installed; the repository secret-check
  adapter otherwise passed.
- The repository-wide Prettier check still reports 68 pre-existing or unrelated
  dirty files. Every file in this slice passes scoped Prettier.
- No consumed API response changed, so generated OpenAPI comparison was not
  applicable to this slice.

Formal assistive-technology, supported-browser, human translation, and release
owner review remain appropriate before a real release. These are recorded
release-review activities rather than Level 2 local implementation blockers.

