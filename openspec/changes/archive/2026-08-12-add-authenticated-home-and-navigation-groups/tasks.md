# Tasks

## 0. Change Setup And Boundaries

- [x] 0.1 Confirm this change owns authenticated Home, admission routing,
  global navigation, the Administration task hub, and the partner operational
  overview without defining roles or capabilities.
- [x] 0.2 Split workspace task-hub, Access, Reports, and multi-step registration
  work into `refine-workspace-task-hub-and-registration-flow` so deeper routes
  remain independently implementable and traceable.
- [x] 0.3 After `define-four-role-authorization-model` is implemented and
  archived, rebase this package against the resulting current access/dashboard
  spec and canonical route-capability contract.
	Progress note (2026-08-12): the dependency is archived under the dated archive folder; the package now consumes the merged current authorization contract and strict OpenSpec/scenario-preservation validation passes.

## 1. Admission And Service-Home Contract

- [x] 1.1 Define the deterministic order for authentication, terms, tokenized
  invitation acceptance, applicable profile setup, canonical authorization,
  safe destination resumption, Home, and access denial.
- [x] 1.2 Define `/` as the authenticated PAT-001 service Home after admission
  while preserving the unauthenticated public Home.
- [x] 1.3 Define safe authorized deep-link resumption and prohibit automatic
  pending-invitation selection without a valid tokenized invitation route.
- [x] 1.4 Record the authenticated Home page-pattern decision and task paths.

## 2. Shared Navigation Contract

- [x] 2.1 Define the exact first-level hierarchy: Home, Partner work,
  Onboarding oversight, Administration, and the separate account group.
- [x] 2.2 Define Partner work children, empty-group omission, active-route
  families, Support utility placement, and the exclusion of Administration
  children from first-level navigation.
- [x] 2.3 Define one route/navigation catalog for localized labels, parents,
  visibility, active state, breadcrumbs, Home/side-navigation exposure, return
  paths, and hidden-route reasons.
- [x] 2.4 Define keyboard, focus, non-colour active state, mobile/zoom reflow,
  header language behavior, and English/French parity.

## 3. Administration Task Hub Contract

- [x] 3.1 Define `/administration` as a PAT-001 task hub instead of a dashboard
  or all-in-one administration page.
- [x] 3.2 Define authorized child destinations for Users and access,
  Departments, Tiers, Audit logs, and fixed Role reference.
- [x] 3.3 Exclude `/policies` from the information architecture while
  authorization-policy CRUD is retired.
- [x] 3.4 Record Administration breadcrumbs, persistent `GcdsSideNav`, return
  paths, content boundaries, and the page-pattern decision.

## 4. Partner Operational Overview Contract

- [x] 4.1 Define `/your-applications` as a PAT-021 partner operational overview
  rather than the generic authenticated Home.
- [x] 4.2 Preserve accessible-application, invitation-backed application,
  workspace-summary, empty-state, and no-inline-workflow behavior explicitly.
- [x] 4.3 Retire the duplicated page-level profile card in favour of the safe
  shared-shell user/context summary.
- [x] 4.4 Define populated, loading, empty, partial, error, and unauthorized
  states and record the page-pattern decision.

## 5. Implementation Slices

- [x] 5.1 Build the typed route/navigation catalog from source route metadata
  after the four-role rebase; keep generated TanStack Router artifacts derived,
  make any new parent source route render an `Outlet`, and do not hand-edit the
  generated route tree.
	Progress note (2026-08-12): added one typed catalog for route IDs, localized label keys, parent task areas, active path families, canonical-context visibility predicates, menu/Home/side-nav/breadcrumb surfaces, breadcrumbs, return routes, and hidden reasons. Focused catalog tests pass (5), TypeScript passes, and scoped ESLint/Prettier checks pass; no generated route artifact or new parent route was edited in this slice.
- [x] 5.2 Implement protected-route current-user revalidation through the
  FastAPI BFF with TanStack Query; treat Zustand/current cached state as a UI
  projection only and fail closed when the server session cannot be confirmed.
	Progress note (2026-08-12): route entry forces a no-store BFF current-user query through TanStack Query, synchronizes only the result into the Zustand UI projection, and clears/cancels query state on logout. Failed or absent session confirmation cannot expose stale protected navigation; focused session/query tests pass.
- [x] 5.3 Implement admission routing, intended-destination sanitization and
  revalidation, Home defaulting, and no-access behavior.
	Progress note (2026-08-12): authenticated admission now applies terms and applicable profile setup before Home, allowlists internal route families, removes query/fragment authority, checks route-family discoverability against fresh canonical context, resumes authorized paths for destination-level scope enforcement, defaults usable access to `/`, and routes no-access users safely to `/access-denied`.
- [x] 5.4 Implement the authenticated Home task sections and authorized parent
  links without operational dashboard content.
	Progress note (2026-08-12): `/` now preserves the public sign-in page for signed-out users and presents an admitted user's authorized Partner work, Onboarding oversight, and Administration task sections from the typed catalog. It contains orientation and links only, with English/French descriptions and no dashboard widgets or inline work.
- [x] 5.5 Replace the flat header with `GcdsTopNav`, `GcdsNavGroup`, and
  `GcdsNavLink`; move Support to the footer or utility area and keep account
  controls separate.
	Progress note (2026-08-12): the authenticated header now uses the catalog to render Home, a capability-filtered Partner work `GcdsNavGroup`, direct authorized Onboarding oversight and Administration parents, and no flat administration children. Support is in equivalent English/French footer utility links, and Sign out is inside the current-user group. The shared language control uses the application preference/i18n source rather than writing a separate key and reloading. Focused header/user/footer/translation tests pass (18), together with TypeScript and scoped ESLint.
- [x] 5.6 Implement `/administration`, its authorized task links, translated
  `GcdsSideNav`, breadcrumbs, and parent active-state behavior for flat child
  URLs.
	Progress note (2026-08-12): added the capability-guarded `/administration` task hub with catalog-derived Users and access, Departments, Tiers, Audit logs, and fixed Role reference links. A responsive persistent `GcdsSideNav` wraps the hub and flat child route families; catalog breadcrumbs render Home, Administration, and the current child, and `/policies` remains excluded. The supported Vite router generator updated the derived route tree and the production build succeeds. Focused tests, the full frontend unit suite (83 files, 405 tests), TypeScript, ESLint, Prettier, and strict OpenSpec/scenario-preservation validation pass.
- [x] 5.7 Refine `/your-applications` into the recorded operational overview and
  remove duplicated profile presentation.
	Progress note (2026-08-12): `/your-applications` now presents focused application and workspace sections, meaningful record links, lifecycle summaries, independent loading/empty/error states, and scoped retry controls. The obsolete profile/department/role presentation and its extra department query were removed. Focused page tests pass (5), together with TypeScript, ESLint, Prettier, and diff checks.
- [x] 5.8 Keep source routes thin, put page/query behavior in feature pages and
  hooks, and keep low-level current-user/application/workspace HTTP behavior in
  typed `frontend/src/fetch/` clients.
	Progress note (2026-08-12): file routes remain lazy route declarations; current-user query ownership is in the session query/hook layer, workspace query ownership remains in `useWorkspaces`, the operational page owns composition, and the low-level current-user, workspace, and accessible-application requests remain typed fetch clients.
- [x] 5.9 Preserve each consumed endpoint's implemented wire casing and
  explicit success model while ADR-002 is Proposed; regenerate OpenAPI and
  update Pydantic models, TypeScript wire types, and contract tests together if
  the four-role rebase changes a response.
	Progress note (2026-08-12): this change did not alter a backend response or generated API contract. Existing fetch-client types and casing remain intact; the Home/navigation and operational-overview work only consumes the four-role canonical projections.
- [x] 5.10 Update English and French content, accessible names, page titles,
  breadcrumbs, task descriptions, statuses, and recovery links with parity.
	Progress note (2026-08-12): the shared catalog supplies localized navigation labels, active states, and breadcrumb ancestry; service Home, Administration, and Your applications provide equivalent English/French headings, descriptions, statuses, empty/error copy, and recovery actions. The operational overview now sets its localized document title and its scoped retries have equivalent accessible names.

## 6. Tests And UI Evidence

- [x] 6.1 Add table-driven admission tests for terms, valid invitation route,
  applicable profile setup, authorized preserved destination, Home default,
  and no access, including rejection of external, executable, sensitive, or
  stale intended-destination state.
	Progress note (2026-08-12): a table-driven matrix covers terms, tokenized invitation precedence, applicable profile setup, authorized destination resumption, Home defaulting, and no access. Focused cases also reject external, scheme-relative, executable, backslash, unknown, unauthorized, query/fragment authority, and stale workspace destinations; the 45-test admission suite passes.
- [x] 6.2 Add representative authorization-context tests for Home links,
  Partner work children, empty groups, oversight, Administration, account
  separation, hidden destinations, stale client projection, failed session
  revalidation, and direct backend denial.
	Progress note (2026-08-12): Home, header, route-catalog, authorization, session-query, access-denied, and backend denial tests cover RP Admin, CL Admin, empty/no-access, hidden-route, stale-projection, failed-session, wrong-workspace, and direct-service-denial contexts. Four focused backend authority checks pass without invoking protected services after denial.
- [x] 6.3 Add route-reachability, parent-active-state, breadcrumb, side-nav, and
  return-path tests for Home, partner overview, and Administration children.
	Progress note (2026-08-12): the catalog and page tests cover every visible parent and Administration child path, active path families, breadcrumbs, side navigation, and return metadata. The generated route tree and production build pass.
- [x] 6.4 Add keyboard, focus, non-hover, mobile, narrow viewport, and 200
  percent zoom checks for grouped navigation.
	Progress note (2026-08-12): local system-Chrome review confirms Enter opens the grouped mobile navigation without hover, focus remains visible, and task controls remain available at desktop, 375-pixel mobile, narrow navigation, and 200 percent zoom with no horizontal overflow. Screenshots and skipped assistive-technology/browser reasons are recorded in evidence/README.md.
- [x] 6.5 Add English/French parity and equivalent-route language-control tests.
	Progress note (2026-08-12): locale-contract tests pass, the header test confirms the shared preference changes while preserving `/users`, and a French partial-state screenshot verifies meaningful translated shell, navigation, status, error, and recovery content.
- [x] 6.6 Add populated, invitation-backed, loading, empty, partial, error, and
  unauthorized coverage for `/your-applications`.
	Progress note (2026-08-12): six focused overview states cover loading, populated, empty, lifecycle-unavailable, independently retryable errors, and invitation-backed partial data; admission/access-denied and invitation acceptance tests cover unauthorized and tokenized access behavior.
- [x] 6.7 Capture desktop and mobile screenshots, accessibility results,
  design-system review, page-shell checks, route-reachability evidence, and
  any skipped-check reasons.
	Progress note (2026-08-12): evidence/README.md records eight desktop/mobile/zoom/keyboard/bilingual screenshots, page-pattern and design-system review, accessibility and route evidence, command results, skips, and residual release-review checks.
- [x] 6.8 When a consumed API response changes, verify generated OpenAPI,
  serialized JSON, typed fetch clients, explicit success models, the nested
  safe error contract, and TanStack Query refresh/invalidation behavior.
	Progress note (2026-08-12): not triggered because no consumed API response changed. Existing endpoint casing, typed fetch clients, explicit response models, safe error mapping, section retry behavior, and session-query refresh behavior remain covered without an OpenAPI regeneration.
- [x] 6.9 Inspect browser URL/history, local/session storage, analytics hooks,
  logs, screenshots, and fixtures to confirm they contain no OIDC tokens,
  copied invitation tokens, authorization payloads, or real personal data.
	Progress note (2026-08-12): source and browser inspection found only the existing language preference in local storage, empty session storage, and the current route in the URL; no token, authorization payload, analytics copy, sensitive log, real person, or raw UUID display was found. Evidence uses deterministic `local.example` fixtures only.

## 7. Validation And Follow-Through

- [x] 7.1 Run `make validate-openspec-change CHANGE_ID=add-authenticated-home-and-navigation-groups` after this refinement and record the result.
  Progress note (2026-08-11): strict OpenSpec validation and the local
  scenario-preservation preflight pass for the refined Home, navigation,
  Administration, and partner-overview package. Rerun after the architecture
  alignment pass also passes, including the added BFF/session, API-contract,
  sensitive-data, and standards-impact scenarios.
- [x] 7.2 Rerun validation and scenario-preservation review after the four-role
  archive/rebase; consume the accepted ADR-003 contract and rerun the
  architecture and standards-impact review because the pre-rebase result does
  not satisfy this task.
	Progress note (2026-08-12): post-archive strict validation and scenario preservation pass; the route catalog remains presentation-only and continues to rely on backend authorization under accepted ADR-003.
- [x] 7.3 Before archive, update the current capability Purpose so it describes
  authenticated Home, admission routing, grouped navigation, and dedicated
  operational/task pages rather than the old landing-page model.
	Progress note (2026-08-12): the current capability Purpose now names authenticated admission, service Home, server-owned authorization context, grouped navigation, and dedicated task/operational pages.
- [x] 7.4 Archive this functional change only after implementation and
  verification, then confirm the current access/dashboard spec preserves all
  mapped scenarios and the active package moved to archive.
	Progress note (2026-08-12): `openspec archive add-authenticated-home-and-navigation-groups --yes` promoted the functional delta into the current access/dashboard spec and moved the package to `openspec/changes/archive/2026-08-12-add-authenticated-home-and-navigation-groups`. Post-archive inspection confirms the complete modified navigation scenario set, all five added requirements, and the three intentional obsolete landing/dashboard requirements were handled as recorded.
- [x] 7.5 Before release review, assess BAS-001 controls GC-WEB-001 through
  GC-WEB-008 and GC-WEB-010 through GC-WEB-011 with the implementation
  evidence; record GC-WEB-009 as not applicable unless the delivered scope
  introduces a new record or audit lifecycle.
	Progress note (2026-08-12): evidence/README.md assesses every requested BAS-001 control. GC-WEB-001 through GC-WEB-008 and GC-WEB-010 through GC-WEB-011 apply with local evidence; GC-WEB-009 is not applicable because the change introduces no record or audit lifecycle. No exception or waiver is requested, and formal assistive-technology, supported-browser, human translation, and release-owner review remain recorded release-review activities.
