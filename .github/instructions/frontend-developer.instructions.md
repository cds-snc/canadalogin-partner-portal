---
applyTo: "frontend/**"
---

# Frontend Developer

## Overview

Use this guidance when frontend work must follow the structure and coding standard already used in this repository.

This frontend is not organized as ad hoc React files. It uses a repeatable pattern across routes, feature-owned pages and hooks, shared fetch utilities, Zustand stores, shared UI wrappers, and tests. New code should extend that pattern instead of introducing a second frontend architecture.

## Frontend Shape

Follow the existing module layout under `frontend/src`:

- `routes/`: TanStack Router file routes and route guards
- `features/`: feature-owned pages, hooks, and related code
- `components/`: shared layout, UI, charts, forms, and utility components
- `fetch/`: shared request helpers and feature API clients
- `hooks/`: shared hook exports and app-wide hook entry points
- `store/`: Zustand stores and shared state helpers
- `lib/`: small shared runtime helpers such as query client utilities
- `common/`, `types/`, `utils/`: shared support code
- `styles/`: global style entry points

Mirror the existing feature layout. Do not place feature-specific page logic into broad shared folders when a feature directory already exists for that concern.

## Required Working Pattern

### 1. Start from an existing feature

Use an existing feature as the template before writing code. Good reference sets in this repo:

- Users: route in `src/routes/users.ts`, page in `src/features/users/pages/UsersPage.tsx`, hooks in `src/features/users/hooks/`, API client in `src/fetch/users.ts`
- Roles, tiers, policies, posts, access, and auth follow similar patterns

Prefer extending the closest existing feature over inventing a new layout.

### 2. Keep route files thin

Route files in `src/routes/` should mostly:

- define the URL with `createFileRoute(...)`
- attach route-entry auth behavior when needed
- lazily import the page component when that pattern already exists
- pass rendering to feature pages or root pages

Do not move page state, API orchestration, or UI composition into the route file.

### 3. Put page logic in features

For feature-backed screens, keep the page component under `src/features/<feature>/pages/`.

Match the existing style:

- feature pages assemble shared UI primitives and feature hooks
- feature hooks own query and state orchestration for that domain
- feature API clients live in `src/fetch/<feature>.ts`
- shared hook exports are re-exported from `src/hooks/index.ts`

If a screen is a real feature, do not place it under `src/pages/` just because it renders a page.

### 4. Use TanStack Router conventions already in the repo

This frontend uses file-based TanStack Router routes.

Follow these rules:

- create or update route files in `src/routes/`
- treat `src/routeTree.gen.ts` as generated output and do not edit it manually
- keep the app shell rooted in `src/routes/__root.ts`
- use `beforeLoad`, `loader`, `loaderDeps`, and `validateSearch` where the current route pattern requires them
- when a new child route sits under an existing page route, convert the parent route into a layout that renders `Outlet` and move the original page UI into an `index.ts` child route

If a generated stub route file already exists, replace it in place instead of trying to add a second file for the same path.

### 5. Reuse the auth-routing model for protected pages

Protected route decisions in this repo must revalidate server session state.

Use the existing helpers in `src/features/auth/auth-routing.ts`:

- `requireAuthenticatedUser(...)` for protected routes
- `redirectAuthenticatedUser(...)` when authenticated users should be bounced away
- `completeLoginRedirect(...)` for login-complete flows when needed

Keep these rules aligned with the repo's current behavior:

- use `revalidateCurrentUser()` for route-entry auth decisions
- fail closed on route entry when revalidation fails
- keep `/login` public
- do not trust only hydrated Zustand auth state for protected-route access

For the invited RP application developer flow specifically:

- keep `/invitations/rp-applications?token=...` protected with `requireAuthenticatedUser(...)` while preserving the invite token in the redirect path
- keep `/access-denied` public so blocked OIDC users can land there after backend denial
- use `/rp-applications/mine/$rpApplicationUuid` for invited-developer detail pages
- do not send invited developers to workspace-scoped RP application pages because they are not workspace members

### 6. Reuse shared fetch helpers instead of raw page-level fetch calls

This repo centralizes HTTP request behavior in `src/fetch/`.

Follow the existing pattern:

- shared request mechanics live in `request-json.ts`
- feature API clients live in files such as `fetch/users.ts`, `fetch/auth.ts`, or `fetch/posts.ts`
- use `buildApiUrl(...)`, `requestJson(...)`, and the shared request error types instead of duplicating fetch error handling in components
- preserve `credentials: "include"` behavior for session-based auth

Do not scatter raw `fetch(...)` calls through page components when the request belongs in the fetch layer.

For invited RP application developer work, keep the fetch contract in `src/fetch/workspaces.ts` aligned with these endpoints:

- `POST /api/v1/rp-application-developer-invitations/accept`
- `GET /api/v1/rp-applications/mine`
- `GET /api/v1/rp-applications/mine/{rpApplicationUuid}`
- `PATCH /api/v1/rp-applications/mine/{rpApplicationUuid}`

### 7. Use React Query and Zustand where the repo already does

The app uses:

- TanStack Query for server-backed state and cacheable requests
- Zustand for app state such as auth state, preferences, and admin list state

Match the existing boundaries:

- use feature hooks with `useQuery(...)` for server data
- keep query keys explicit and colocated with the feature hook
- keep shared query client usage on `appQueryClient`
- keep auth and other app state in `store/`, not ad hoc module globals

### 8. Reuse shared UI wrappers and layout components

Shared UI primitives live under `src/components/ui/` and many wrap GCDS components.

Follow these rules:

- reuse shared UI wrappers before introducing a new primitive
- reuse shared layout components from `src/components/layout/`
- export broadly shared primitives through `src/components/index.ts` only when that matches the existing pattern
- verify dependencies of legacy shared components before assuming a new feature broke the build

This repo has existing wrapper and barrel dependencies, so avoid casually deleting or bypassing them.

### 9. Keep API origin and cookie behavior aligned with local auth

When touching auth or API base URL behavior:

- do not hardcode `localhost` as the fallback backend origin when `VITE_API_BASE_URL` is unset
- keep local hostname behavior compatible with backend session cookies
- prefer logic that avoids cookie-origin drift between `localhost` and `127.0.0.1`

Frontend auth regressions in local development are often origin-mismatch problems rather than missing logout logic.

## Coding Standard To Preserve

- Use TypeScript for frontend code under `src/`
- Prefer alias imports through `@/` when the repo already uses them
- Keep route files small and feature pages focused
- Add explicit types for exported functions, hooks, state shapes, and API responses
- Reuse existing error types and helper functions instead of inventing parallel request handling
- Follow the repo's ESLint and Prettier style, including tabs, semicolons, double quotes, and explicit return-type discipline
- Preserve accessibility expectations already enforced by the current lint rules and shared wrappers

## Feature Checklist

When adding or changing a frontend feature, check whether the work needs each of the following:

1. Route file in `src/routes/`
2. Feature page in `src/features/<feature>/pages/`
3. Feature hook in `src/features/<feature>/hooks/`
4. Fetch client updates in `src/fetch/`
5. Shared hook re-export in `src/hooks/index.ts` if the feature hook is app-facing
6. Store updates in `src/store/` if app state changes are needed
7. Shared UI or layout updates in `src/components/`
8. Auth-routing changes if the page is protected or login-related
9. Unit tests in `frontend/tests/unit/`
10. E2E coverage in `frontend/e2e/` when user flow behavior changes materially

Do not stop at the route file if the feature also needs fetch, store, auth, or test updates.

## Frontend Auth Rules

When frontend work touches login, logout, session hydration, or protected pages, explicitly check all of the following:

1. Is the route protected with the correct auth-routing helper?
2. Does route entry revalidate backend session state instead of trusting cached store state?
3. Will unauthorized responses redirect correctly through the shared fetch layer?
4. Is `/login` still public and free from route-entry auth checks that can block sign-in?
5. Does local hostname behavior preserve cookie-based session flow?

Protected route guards in this repo should fail closed. If route-entry auth revalidation fails, redirect to `/login` instead of letting the page render into a broken authenticated state.

## Testing Pattern

Match the existing frontend test organization:

- route tests under `tests/unit/routes/`
- feature auth tests under `tests/unit/features/auth/`
- fetch client tests under `tests/unit/fetch/`
- store tests under `tests/unit/store/`
- page tests under `tests/unit/pages/`
- UI component tests under `tests/unit/components/ui/`
- feature API or feature behavior tests under `tests/unit/features/<feature>/`

The current frontend stack uses:

- Vitest for unit tests
- Testing Library for component and page behavior
- Playwright for e2e flows

When auth or protected-route behavior changes, add or update tests for:

- auth-routing helper behavior
- auth store hydration or refresh behavior when relevant
- login-route behavior when search params or redirects change
- affected page behavior for authenticated and unauthenticated users

When the invitation flow changes, also add or update route-contract tests for `/invitations/rp-applications` and fetch-client tests for the current-user RP application endpoints.

## Verification

Before considering frontend work complete, verify the affected scope.

Typical frontend commands for this repo:

```bash
cd frontend
pnpm run lint
pnpm run test:unit
pnpm run build
```
