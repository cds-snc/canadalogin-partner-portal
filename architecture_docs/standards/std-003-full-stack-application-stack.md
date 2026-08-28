# STD-003: Full-Stack Application Stack

Type: Standard
Status: Active

## Read This When

Use this when creating, scaffolding, or changing the application stack, app
structure, tooling, tests, local setup, or API contracts.

Record the accepted full-stack application architecture.

## Rules

- Use React, TypeScript, Vite, and GC Design System for the frontend.
- When scaffolding a new Government of Canada frontend, create the shared GC
  Design System app shell, service home, route metadata, and shared navigation
  before adding feature-specific pages.
- Organize frontend code by routes, features, shared UI, layout, hooks, state,
  typed API helpers, shared types, and utilities.
- Use a structured router when the app has multiple routes. React Router route
  objects and TanStack Router are accepted choices; pick one and keep route
  metadata, navigation helpers, and tests aligned with it.
- Use TanStack Query for server-state reads and mutations.
- Use React Hook Form and Zod for non-trivial forms and validation.
- Use i18n resource files for English and French UI strings when user-facing
  content grows beyond the first page.
- Use Zustand only for small client-side state that is not server state.
- Use Storybook and Playwright as optional, reviewable extensions when component
  review or browser end-to-end tests are needed.
- Use FastAPI, Pydantic v2, APIRouter, response models, and generated OpenAPI
  for the backend.
- Keep FastAPI route handlers thin and move behavior into services as soon as a
  route does more than assemble a response.
- Use [STD-020: Database Persistence](std-020-database-persistence.md) when the
  backend needs relational persistence, database models, migrations, seed data,
  or repository/data-access code.
- Use Redis-backed sessions, cache, queues, or rate limiting only when those
  capabilities are selected and explicitly configured with safe values for the
  declared work context. When a required dependency is unavailable or outside
  authorized scope, follow
  [PAT-025: Dependency Substitution](../patterns/full-stack/pat-025-dependency-substitution.md)
  instead of changing the application contract or silently omitting the
  capability.
- Use OIDC as the primary authentication pattern for real sign-in flows.
- A local username/password flow or signed test JWT may be an explicitly
  configured development or test identity substitute when the selected identity
  provider is unavailable. It must enter the same backend-owned session and
  authorization path, remain disabled outside approved development or test
  contexts, and never activate automatically when real configuration fails.
- Use policy-backed authorization, such as Casbin, when routes need RBAC or
  permission checks.
- Keep production deployment recipes, cloud publishing, and shared-environment
  changes out of the generic default until a project opts in.

## Examples

- Local frontend: `127.0.0.1:3000`.
- Local backend: `127.0.0.1:8000`.
- Local data: fake, fixture, seeded, or test-only.
- Secrets: placeholders in example files only.
- CORS: explicit local origins, not wildcard origins.
- Docs and OpenAPI: enabled locally; protected or disabled outside local context.
- Advanced modules: documented and testable before they become required.

## Checks

- [ ] The active implementation code matches the stack decisions or clearly documents a
      follow-on slice.
- [ ] New dependencies are justified by the accepted stack and lockfiles are
      updated.
- [ ] Example config contains no real secrets or production identifiers.
- [ ] Frontend routes, features, API helpers, state, and tests follow the local
      folder conventions.
- [ ] New Government of Canada frontend scaffolds include the shared app shell,
      functional home or service home, route metadata, and shared menu before
      feature-specific pages are added.
- [ ] Multi-route frontends use one router consistently and keep route metadata,
      generated links, and navigation tests aligned.
- [ ] Backend routers, services, dependencies, models, config, and tests follow
      the local folder conventions.
- [ ] Database work follows STD-020 when persistence is enabled.
- [ ] Required dependencies use an approved real target, an explicitly
      configured contract-compatible substitute, or a documented unavailable
      state; local availability alone does not redefine the solution target.
- [ ] Dependency substitutes preserve application-owned contracts and record
      remaining real-integration verification.
- [ ] API contracts, tests, and verification notes are updated when behavior changes.
- [ ] Any shared-environment or production path is blocked until the work
      context standard is satisfied.
