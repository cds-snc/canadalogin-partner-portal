## Context

The dashboard already renders RP application links to `/rp-applications/mine/<uuid>` in `frontend/src/features/dashboard/pages/DashboardPage.tsx`, but the production route tree has no matching route entry today (`frontend/src/routeTree.gen.ts`).

The frontend fetch layer already includes current-user RP detail endpoints in `frontend/src/fetch/rp-applications.ts` and also includes workspace-scoped client credential calls used by admin/workspace surfaces. This creates a mismatch with the desired current-user, workspace-agnostic experience when building the owner-facing OAuth setup page.

On backend, production exposes `GET /rp-applications/mine` in `backend/src/app/api/v1/rp_applications.py` but does not expose a production current-user detail endpoint. Authorization for current-user listing currently relies on local owner snapshot matching in `RPApplicationService.list_current_user_rp_applications` (`backend/src/app/services/rp_application_service.py`).

Error routing behavior in frontend currently has a built-in access-denied redirect for `403` in `frontend/src/fetch/request-json.ts`, and a dedicated `/access-denied` route exists. No reusable generic `/error` route currently exists.

## Goals / Non-Goals

**Goals:**
- Add a production current-user RP OAuth setup endpoint that returns a strict DTO with no workspace terms.
- Keep authorization local-first (owner snapshot) before IBM Verify retrieval.
- Add a read-only frontend route/page at `/rp-applications/mine/$rpApplicationUuid` with section order: Application context first, OAuth setup second.
- Add reusable generic error route `/error` with typed kinds (`not_found`, `unexpected`).
- Apply agreed redirect mapping: `403 -> /access-denied`, `404 -> /error?kind=not_found`, all others including 5xx/network -> `/error?kind=unexpected`.
- Enforce missing client secret as an unexpected error for this flow.
- Ship EN/FR localized copy and tests.

**Non-Goals:**
- No write operations (no rotation, edit, or mutation actions) on the new OAuth setup page.
- No workspace navigation, labels, or workspace identifiers in the new DTO/UI.
- No feature flag or phased rollout for v1.
- No change to existing admin/workspace-scoped APIs used by other pages.

## Decisions

### Decision 1: Add a dedicated aggregated current-user endpoint
- Choice: introduce `GET /api/v1/rp-applications/mine/{rpApplicationUuid}/oauth-setup` returning a strict page-specific DTO.
- Rationale: frontend needs one read-only call and must not reason about workspace internals.
- Alternatives considered:
  - Reuse workspace-scoped client endpoints from frontend: rejected because it leaks workspace concepts and requires workspace UUID in UI flow.
  - Multiple endpoint fan-out from frontend: rejected due to extra coupling and error complexity.

### Decision 2: Keep local owner authorization as the gate
- Choice: authorize using local owner snapshot before upstream calls.
- Rationale: this is consistent with existing current-user listing behavior and keeps auth decisions available even when IBM Verify is degraded.
- Alternatives considered:
  - Live ownership authorization from IBM Verify per request: rejected for latency and upstream availability coupling.

### Decision 3: Enforce client secret presence for this page
- Choice: treat missing `clientSecret` as unexpected error instead of partial render.
- Rationale: product expectation is that secret should always be available for this setup flow.
- Alternatives considered:
  - Render partial page with warning: rejected by product decision for this change.

### Decision 6: Discovery endpoint is backend-owned
- Choice: include `discoveryEndpoint` in the backend OAuth setup response, sourced from backend OIDC configuration (`OIDC_SERVER_METADATA_URL`).
- Rationale: keeps OIDC environment configuration in one source of truth and avoids frontend build-time drift.
- Alternatives considered:
  - Frontend `VITE_*` environment variable for discovery URL: rejected as a long-term approach because it duplicates backend auth configuration.

### Decision 4: Add reusable generic error route
- Choice: create `/error` with typed query kinds and default fallback to `unexpected`.
- Rationale: reusable across future flows while keeping current access-denied semantics intact.
- Alternatives considered:
  - Redirect all failures to `/access-denied`: rejected because non-auth failures should not be presented as authorization issues.
  - Build RP-specific error page only: rejected because generic route is explicitly needed for future reuse.

### Decision 5: Preserve dashboard labels and URL shape
- Choice: keep dashboard link text as RP application name and keep path `/rp-applications/mine/$rpApplicationUuid`.
- Rationale: minimal UX churn and aligns with existing navigation expectation.
- Alternatives considered:
  - Introduce `/oauth-setup` subpath: deferred until a future need for nested pages emerges.

## Risks / Trade-offs

- [Risk] IBM Verify upstream instability can increase redirects to `/error?kind=unexpected` -> Mitigation: deterministic error mapping, no raw error exposure, and test coverage for mapping.
- [Risk] Missing client secret hard-fails page even when other data exists -> Mitigation: explicit product rule captured in spec; monitor and revisit if operational reality changes.
- [Risk] New endpoint could drift from existing current-user list ownership logic -> Mitigation: reuse shared ownership check logic in service layer and cover with owner/non-owner tests.
- [Risk] Route additions may break generated route assumptions if generator is not run -> Mitigation: include route generation/update in implementation tasks and frontend tests.

## Migration Plan

1. Add backend schema and service method for OAuth setup DTO assembly, including IBM Verify fetch and secret presence enforcement.
2. Add backend route in `rp_applications` API and tests for success, 403, 404, and unexpected failure classes.
3. Add frontend fetch method for new endpoint with no-store behavior.
4. Add frontend route and page for `/rp-applications/mine/$rpApplicationUuid` with read-only rendering and secret reveal behavior.
5. Add `/error` route and reusable page with typed `kind` handling.
6. Add EN/FR translation keys for new detail and generic error views.
7. Wire redirect logic in RP detail flow to agreed mapping.
8. Execute backend and frontend tests.

Rollback strategy:
- Revert route usage from dashboard and new page/endpoint while preserving existing list behavior.
- Remove `/error` route only if no new consumers depend on it; otherwise keep route and revert RP detail redirects.

## Open Questions

- None blocking for proposal/design scope. Implementation may confirm exact IBM Verify field mapping names for `pkceEnabled` and `redirectUris` in the DTO adapter.
