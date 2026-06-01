## 1. Map extraction boundaries

- [x] 1.1 Inventory the backend files, imports, schemas, repositories, registrations, and tests directly required by `api/v1/workspaces.py` and `WorkspaceService`.
- [x] 1.2 Inventory the frontend files, routes, fetch helpers, translations, and tests directly required by `features/workspaces`, invitation routes, and `/rp-applications/mine*` flows.
- [x] 1.3 Separate workspace-owned modules from shared infrastructure that must remain in the main app after the extraction.

## 2. Migrate backend feature to demo

- [ ] 2.1 Add the migrated workspace and RP application backend routes to `demo/backend` with the dependencies needed by the demo app.
- [ ] 2.2 Move or recreate the workspace service, schema, and repository logic in `demo/backend` while preserving existing API contracts.
- [ ] 2.3 Migrate invited-developer acceptance and current-user RP application backend behavior into `demo/backend`.
- [ ] 2.4 Add focused demo backend tests for workspace management and invited-developer flows.

## 3. Migrate frontend feature to demo

- [ ] 3.1 Add the migrated workspace management pages, route wiring, and fetch helpers to `demo/frontend`.
- [ ] 3.2 Migrate invitation entry routes and current-user RP application detail routes into `demo/frontend` without breaking route hierarchy assumptions.
- [ ] 3.3 Move or recreate the workspace-related translations and feature-specific frontend dependencies in `demo/frontend`.
- [ ] 3.4 Add focused demo frontend tests for workspace management, invitation entry, and current-user RP application flows.

## 4. Remove feature ownership from main app

- [ ] 4.1 Remove main backend workspace route registration and workspace-owned backend modules after demo parity is in place.
- [ ] 4.2 Remove main frontend workspace routes, pages, fetch wiring, and feature-owned dependencies after demo parity is in place.
- [ ] 4.3 Keep shared auth, database, exception, authorization, and other non-workspace dependencies in the main app when they are still used elsewhere.

## 5. Verify migration outcome

- [ ] 5.1 Run focused demo backend validation to confirm migrated workspace and invited-developer endpoints behave correctly.
- [ ] 5.2 Run focused demo frontend validation to confirm migrated workspace, invitation, and current-user RP application routes behave correctly.
- [ ] 5.3 Run focused main-app validation to confirm the removed workspace feature surface is no longer exposed while unrelated functionality remains intact.
- [ ] 5.4 Document any remaining migration follow-ups discovered during verification before closing the change.