## Context

The current workspace feature is implemented as a vertical slice in the main partner portal application. On the backend, the entry point is `backend/src/app/api/v1/workspaces.py`, which depends primarily on `WorkspaceService`, workspace-related schemas, repository adapters such as `crud_workspaces`, and route-level tests. On the frontend, the feature spans `features/workspaces`, `fetch/workspaces.ts`, workspace-related `application-info` fetch helpers, route files for workspaces and current-user RP applications, invitation routes, translations, and tests.

The repository already contains separate `demo/backend` and `demo/frontend` applications, so the target environment for the moved feature exists. The requested outcome is not a shared abstraction or a temporary copy. The workspaces feature should be relocated into the demo applications and then removed from the main app, while leaving the rest of the main platform intact.

Two existing constraints shape the design. First, invited-developer flows are app-scoped rather than workspace-member-scoped, so endpoints such as `/api/v1/rp-application-developer-invitations/accept` and `/api/v1/rp-applications/mine*` must stay preserved as part of the moved slice. Second, frontend nested-route behavior must keep TanStack Router layout rules intact, so route extraction cannot break child-route rendering assumptions.

## Goals / Non-Goals

**Goals:**
- Extract the workspaces and RP application management feature from the main backend and frontend into `demo/backend` and `demo/frontend`.
- Preserve existing API contracts and frontend route behavior for the moved feature inside demo, including invited-developer flows.
- Remove the extracted feature slice from the main app after demo has equivalent route registration and focused coverage.
- Minimize unrelated changes by keeping shared infrastructure in place unless it is truly owned only by the workspace feature.

**Non-Goals:**
- Refactor the repository into shared packages or redesign the monorepo architecture.
- Change authentication, database, exception, or authorization platform behavior beyond what the moved feature strictly needs.
- Redesign the workspace UI, rename public routes, or introduce demo-specific behavior changes as part of this move.
- Remove or rewrite unrelated services that happen to import workspace-owned data indirectly unless they are blocked by the extraction.

## Decisions

### 1. Extract by feature ownership, not by top-level file moves alone
The migration boundary will be defined by the workspaces feature behavior: workspace CRUD, member management, RP application management, application info management, client secret rotation, usage reporting, and invited-developer flows. This prevents accidentally moving shared infrastructure simply because it is imported by workspace code.

### 2. Keep shared infrastructure in the main app unless it is workspace-exclusive
Authentication dependencies, DB/session setup, common exceptions, shared schemas, and generic access-control mechanisms remain where they are unless a dependency proves to be workspace-specific. This keeps the rest of the application stable and aligns with the instruction to avoid touching unrelated code.

### 3. Preserve route and API compatibility inside demo
The demo applications will keep the moved route shapes and payload contracts, especially `/api/v1/workspaces/*`, `/api/v1/rp-application-developer-invitations/accept`, `/api/v1/rp-applications/mine*`, `/invitations/rp-applications`, and `/rp-applications/mine/$rpApplicationUuid`. Compatibility lowers migration risk and keeps frontend/backend pairing straightforward.

### 4. Migrate backend and frontend in paired slices
The backend router/service/schema/test move and the frontend feature/fetch/route/test move should be advanced as a coordinated slice. That reduces the chance that demo receives only half of the feature or that main-app removal strands one side of the contract.

### 5. Remove from the main app only after demo parity checks pass
The main app should lose the feature only after the demo backend can register the moved routes, the demo frontend can render and call them, and focused tests for the moved slice are in place. This keeps the extraction reversible during development.

### Alternatives considered
- Duplicate first, remove later: rejected because it creates drift and does not meet the requested end state.
- Shared-module extraction: rejected because it broadens scope and changes repository architecture without a clear need.

## Risks / Trade-offs

- **Hidden cross-feature backend dependencies** -> Audit imports from `WorkspaceService`, schemas, repositories, and route registration before removal; leave shared modules in place when they serve other features.
- **Frontend route breakage during extraction** -> Preserve TanStack route hierarchy and verify parent-layout behavior when moving invitation and RP application detail routes.
- **Invite-flow regressions** -> Treat `/rp-application-developer-invitations/accept` and `/rp-applications/mine*` as mandatory parity paths in both code movement and testing.
- **Test ownership ambiguity** -> Move feature-owned tests to demo, but keep shared-infrastructure tests in the main app when they validate common behavior rather than workspace logic.
- **Rollback complexity after partial removal** -> Sequence the migration so demo onboarding and validation happen before main-app deletion, allowing revert by restoring main registration if needed.

## Migration Plan

1. Map the exact backend ownership boundary from `api/v1/workspaces.py` through `WorkspaceService`, workspace-specific schemas, repositories, and tests.
2. Map the exact frontend ownership boundary from `features/workspaces`, `fetch/workspaces.ts`, related `application-info` fetch code, route files, translations, and tests.
3. Move or recreate the backend feature slice inside `demo/backend`, wiring router registration and any required dependencies against demo’s app structure.
4. Move or recreate the frontend feature slice inside `demo/frontend`, wiring routes, fetchers, translations, and page composition against demo’s app structure.
5. Add or relocate focused tests in demo for the moved backend endpoints and frontend flows, including invite acceptance and current-user RP application paths.
6. Validate demo behavior, then remove the workspace feature slice and its registrations from the main app while preserving shared modules still needed elsewhere.
7. Run focused verification in both apps. If regressions appear before final removal, rollback by restoring the main app’s route registration and feature files from the extraction branch state.

## Open Questions

- Which workspace-adjacent schemas and repository helpers are used outside the workspaces feature and therefore must remain shared?
- Do the demo backend and frontend already have the auth and application shell capabilities required to host the moved routes unchanged, or will thin compatibility adapters be needed?
- Which existing tests should remain in the main repo roots because they validate platform behavior rather than workspace feature behavior?