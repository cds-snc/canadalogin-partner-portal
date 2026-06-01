## Design Summary

Move the workspace management feature set out of the main partner portal application and into the existing `demo/` backend and frontend applications. The scope includes the backend `api/v1/workspaces.py` endpoints and the related service, repository, schema, and test layers that directly support those routes, along with the frontend workspaces feature pages, route wiring, fetch helpers, translations, and tests that depend on those APIs. The rest of the main application must remain untouched and operational.

The chosen direction is a hard extraction rather than a shared-module refactor or a temporary duplicate. The main app will stop owning workspace and RP application management flows after the move. The demo apps will become the only maintained home for that slice, including invited-developer flows such as `/api/v1/rp-application-developer-invitations/accept`, `/api/v1/rp-applications/mine*`, and the related frontend invitation and current-user RP application routes. The extraction must preserve those contracts inside demo even though they are removed from the main app.

The change should be organized around a dependency-aware migration plan: identify the exact backend and frontend ownership boundary, relocate the feature into `demo/`, rewire registrations and imports in both app stacks, then remove the extracted slice from the main app only after demo has equivalent behavior coverage. The migration should minimize incidental edits outside the workspace feature boundary.

## Alternatives Considered

### Alternative A: Hard extraction into demo with feature removal from the main app
- **Approach**: Move the workspaces API/router, service logic, schemas, frontend feature pages, fetch clients, route files, translations, and tests into `demo/`; update demo app registration and remove the extracted code from the main app once demo is functional.
- **Pros**: Matches the requested end state; gives demo clear ownership; avoids long-term duplication; keeps future edits local to one stack.
- **Cons**: Requires careful dependency mapping across backend and frontend; may expose hidden coupling to shared auth, access-control, and schema layers; removal step can break imports if done out of order.
- **Why not chosen**: Chosen.

### Alternative B: Duplicate the feature into demo first, then defer removal from the main app
- **Approach**: Copy the workspaces feature into demo, keep the main app implementation intact for a transition period, and remove the original later in a follow-up.
- **Pros**: Lower short-term risk; easier rollback; reduces pressure to fully untangle dependencies in one pass.
- **Cons**: Violates the requested outcome; creates two sources of truth; increases drift risk for invite flow and RP application routes; makes future cleanup harder.
- **Why not chosen**: It does not satisfy the user’s instruction to move the feature into demo and remove it from the main app.

### Alternative C: Extract shared workspace modules and have both apps depend on them
- **Approach**: Refactor backend and frontend workspace logic into shared packages or shared directories, then have main and demo consume the same implementation while gradually retiring main routes.
- **Pros**: Reduces code duplication; can preserve behavior consistency across apps; may improve long-term reuse if both apps need the feature.
- **Cons**: Higher design and packaging cost; expands scope into repository architecture; conflicts with the instruction that the rest of the system should stay untouched; unnecessary if demo becomes the sole owner.
- **Why not chosen**: This solves a broader reuse problem that is not required by the request and would force unrelated changes across the repo.

## Agreed Approach

Use Alternative A: perform a bounded extraction of the workspaces feature into the existing demo backend and frontend, then remove that feature slice from the main application. The extraction boundary should be defined by behavior ownership rather than by single files alone. On the backend, that means starting from `api/v1/workspaces.py` and following its direct dependencies into `WorkspaceService`, workspace-related schemas, repository adapters, and route-level tests, while preserving shared infrastructure such as auth, database setup, exception envelopes, and generic access-control helpers in place. On the frontend, the boundary starts from `features/workspaces`, `fetch/workspaces.ts`, related application-info fetch code, invitation and RP-application routes, and workspace-specific translations and tests.

The move must preserve the invited-developer flow semantics in demo. That includes the app-scoped invitation acceptance endpoint and the `/rp-applications/mine` current-user flows, which are intentionally distinct from workspace-member flows. Routes and API contracts should be preserved inside demo unless a deliberate demo-specific change is later proposed.

Removal from the main app should happen only after demo has equivalent route registration, imports, and focused test coverage for the extracted slice. Shared code that other features still need must remain in the main app; only workspace-owned logic moves.

## Key Decisions

- The destination is the existing `demo/backend` and `demo/frontend` applications, not a new package or a shared library.
- The main app will no longer host workspace management or RP application management flows after the extraction.
- Shared platform layers such as authentication, DB/session setup, common exception handling, and generic authorization infrastructure stay where they are unless they are strictly workspace-owned.
- Invited-developer behavior and routes are part of the moved feature and must remain functional in demo.
- The migration should be dependency-aware and test-backed so removal from the main app happens after demo parity, not before.

## Open Questions

- Which exact subset of workspace-adjacent backend tests should move to `demo/backend/tests` versus remain in the main backend because they validate shared infrastructure?
- Should demo preserve the exact same URL paths and payloads for all workspace endpoints, or are any demo-only simplifications acceptable later?
- Are there any non-obvious consumers outside `features/workspaces` and `fetch/workspaces.ts` that still depend on workspace-specific types or translations and need to be updated during extraction?