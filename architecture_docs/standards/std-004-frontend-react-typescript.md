# STD-004: Frontend React and TypeScript

Type: Standard
Status: Active

## Read This When

Use this for `frontend/` components, features, hooks, API clients, shared types,
utilities, frontend tests, and React frontend scaffolding.

Set the baseline for React and TypeScript frontend work in a project.

## Rules

- Use React and TypeScript by default for the frontend.
- Use Vite for local development and builds.
- Use the accepted full-stack application stack when adding routes,
  server-state, forms, validation, i18n, tests, or app state.
- Use the GC Design System React app shell pattern for Government of Canada
  user-facing applications.
- For new Government of Canada React frontends, scaffold the shared
  `RootLayout`, header, top navigation, footer, home or service-home route, and
  route metadata before feature pages.
- Keep components small and named clearly.
- Type component props and API responses.
- Keep source route definitions in `frontend/src/routes/` or
  `frontend/src/routes.tsx` when the app has multiple routes, and keep route
  IDs, breadcrumb IDs, and page metadata close to the route definition.
- Keep source route files thin. Routing concerns such as route metadata,
  guards, loaders, parameters, and lazy imports belong there; page composition
  and feature behavior belong in feature-owned pages and hooks.
- For TanStack Router, when adding a child route beneath an existing page
  route, convert the parent into a layout route that renders `<Outlet>`.
  Move the original parent page into an index child route, or the router's
  equivalent index route, so both the parent URL and nested child content have
  an explicit render path.
- Use typed route helpers or route IDs for app links instead of spreading
  hard-coded paths through components.
- Keep feature-owned pages and hooks in `frontend/src/features/<feature>/`.
- Keep shared layout in the project's layout folder, normally
  `frontend/src/components/layout/` for new projects or
  `frontend/src/components/Layout/` when that convention already exists.
- Keep shared UI wrappers in `frontend/src/components/ui/`.
- Keep low-level API calls in typed helpers under `frontend/src/services/` or
  `frontend/src/fetch/`, and use one path consistently. Components, route
  files, and feature hooks should call those helpers instead of implementing
  transport behavior directly.
- Treat generated router files as derived artifacts. Do not manually edit
  generated files such as TanStack Router's `routeTree.gen.ts`; change the
  source route definition and regenerate the artifact through the
  project-supported command.
- Use TanStack Query for server state instead of storing API responses in client
  state.
- Use Zustand for small client-side preferences or session-adjacent state only
  when React state or TanStack Query is not a better fit.
- Use React Hook Form and Zod for non-trivial forms.
- Use English and French i18n resource files when user-facing content grows
  beyond the first page.
- For bilingual apps, treat the route language as the source of truth during
  navigation and keep equivalent-language links in the shared header.
- Use Storybook or equivalent review fixtures for meaningful user-facing
  components, pages, forms, and task states.
- Keep business rules visible and testable.
- Handle loading, empty, error, and success states.
- Keep accessibility visible in review.
- Avoid `any` unless there is a short reason.

## Examples

- Put shared UI in `frontend/src/components/`.
- Put feature-level behavior in `frontend/src/features/`.
- Put route files in `frontend/src/routes/` or `frontend/src/routes.tsx` once
  the app has structured routing.
- A TanStack Router source route may declare `beforeLoad`, route metadata, and a
  lazy page import while the page component and data orchestration remain under
  `frontend/src/features/<feature>/`.
- If a nested TanStack Router navigation changes the URL but child content does
  not render, inspect the parent route's render path first and confirm that its
  layout renders `<Outlet>`.
- When route generation is enabled, use the project's documented development,
  build, or generation command to refresh the route tree after changing source
  routes.
- Put reusable hooks in `frontend/src/hooks/`.
- Put API clients in `frontend/src/services/`.
- Put shared types in `frontend/src/types/`.
- Put small helpers in `frontend/src/utils/`.
- Use `frontend/src/config.ts` for public frontend configuration.
- Use a route helper such as `frontend/src/utils/routeHelpers.ts` when route IDs
  are used to generate app links.
- Split i18n resources by feature or domain when a single file becomes hard to
  review.
- Keep Storybook review helpers in `frontend/src/stories/` when the project uses
  a central review-fixture structure.

## Checks

- [ ] Components have clear names and focused responsibilities.
- [ ] Props, API responses, and shared helpers are typed.
- [ ] Source route files contain routing concerns, while page composition and
      feature behavior stay in feature-owned pages and hooks.
- [ ] A TanStack Router page route that gained child routes was converted to a
      layout that renders `<Outlet>`, and its original page remains reachable
      through an index child or equivalent route.
- [ ] Low-level API calls stay in typed helpers under
      `frontend/src/services/`, `frontend/src/fetch/`, or the project-approved
      API client path.
- [ ] Generated router artifacts were not manually edited; affected source
      routes were changed and the project-supported generator was run.
- [ ] Route links use route helpers or route IDs where the app has structured
      routes.
- [ ] Government of Canada React scaffolds use the shared GC Design System app
      shell and expose `Home` plus primary task areas through shared navigation.
- [ ] Server state uses TanStack Query when the app has real API reads or mutations.
- [ ] Feature-owned pages and hooks stay under `frontend/src/features/<feature>/`.
- [ ] Non-trivial forms use typed validation.
- [ ] Bilingual route, i18n, and language-toggle behavior are aligned when the
      app supports English and French.
- [ ] Loading, empty, error, and success states are covered.
- [ ] Accessibility and design-system alignment were reviewed.
- [ ] Storybook or equivalent UI review fixtures cover meaningful user-facing
      states.
- [ ] Important behavior has tests or verification.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-004-FRONTEND-REACT-TYPESCRIPT](../schemas/standards/std-004-frontend-react-typescript.schema.yaml)
- Used for: helping agents and reviewers check frontend structure, TypeScript
  typing, thin source routes, nested TanStack layout render paths, feature
  ownership, typed API client location, generated router artifacts, UI states,
  review fixtures, and verification evidence.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
