# PAT-013: GC Design System React App Shell

Type: Pattern
Status: Active

## Problem

React applications that use the GC Design System need a consistent app shell so
headers, language toggles, navigation, skip links, breadcrumbs, page content,
and footers are not rebuilt differently on each page.

## Use When

- A React frontend uses `@gcds-core/components-react`.
- A new React frontend scaffold needs a Government of Canada page shell and
  default navigation.
- A project needs a shared user-facing page shell.
- A page or feature adds navigation, language behavior, breadcrumbs, or layout
  structure.

## Do Not Use When

- The project intentionally uses GCWeb/WET or another approved shell and has
  recorded the decision.
- The page is not user-facing and does not need Government of Canada page
  structure.

## Trade-Offs

- Centralizes page shell behavior, but requires new pages to fit the route and
  navigation model.
- Keeps the common shell accessible, but page teams must still provide correct
  headings, content, and local states.

## Approach

1. Import GC Design System React CSS once from the frontend entry point.
2. Mount the router inside application providers for language, user/session
   state, and protected-route behavior.
3. Put shared page chrome in `RootLayout` or the project equivalent.
4. Use `GcdsHeader` with a stable skip target, `lang`, `langHref`, top
   navigation in the `menu` slot, and the language toggle in the `toggle` slot.
5. Use `GcdsTopNav`, `GcdsNavLink`, and `GcdsNavGroup` for service navigation.
   Keep `Home` and primary task areas discoverable.
6. Put breadcrumbs in the shared shell when the information architecture needs
   them. Breadcrumbs support location; they do not replace primary navigation.
7. Provide a real main content landmark or a confirmed GC Design System shell
   equivalent with the same skip-link target.
8. Keep page content in a constrained content container, not in a custom
   one-off layout.
9. Use `GcdsFooter` in the shared shell.
10. Keep release or environment tags outside primary task content and hide them
    when no value is configured.
11. For authenticated apps, show the current user and active role or access
    context in the shared shell or a predictable account/profile surface.
12. Store page IDs and breadcrumb IDs in route metadata so analytics,
    breadcrumbs, and route helpers use the same source.

### Scaffold Acceptance Baseline

A new or regenerated React frontend scaffold is incomplete until it has:

- a single GC Design System CSS import in the frontend entry point
- route metadata for route ID, label, breadcrumb label, and menu visibility
- a functional home or service-home route
- `RootLayout`, `Header`, `TopNav`, and `Footer` shared by every user-facing
  route
- header navigation that includes `Home` and every primary task area created by
  the scaffold
- feature pages reachable from the service home, top navigation, parent task
  area, or a recorded hidden-route exception
- no page-body language toggle when the header can provide the language toggle
- current-user summary and sign-out access when the scaffold includes
  authentication

Default navigation is not optional. If the scaffold creates only one
user-facing route, keep `Home` in the shared menu and record the single-page
rationale instead of omitting the menu.

### Authenticated User Summary

Authenticated applications should make the current session understandable
without forcing users to infer it from page content.

Show a compact current-user summary in the shared shell, account area, or a
profile page reachable from the header. Include:

- the user's display name, email, or another safe user-facing identifier
- the active role, organization, tenant, or access context when it changes what
  the user can see or do
- a sign-out action when sign-out is available
- a link to profile or account details when those details exist

Do not show tokens, raw identity-provider claims, internal IDs, permission
dumps, or sensitive personal information in the shell. If a user can have
multiple roles or access contexts, show the active one and route any real
context switching through a backend-authorized flow.

For local role simulation, label the value as simulated and link to the
local-only selector only when
[PAT-018: Local Role Simulation](../security/pat-018-local-role-simulation.md)
is enabled. Do not include role switching in the non-local account menu unless
the project has a real, approved role-switching workflow.

### Expected Files

- `frontend/src/main.tsx`: router mount and single design-system CSS import.
- `frontend/src/routes.tsx`: route tree, route IDs, breadcrumb metadata, and
  protected-route placement.
- `frontend/src/components/Layout/RootLayout.tsx`: shared shell, content
  container, analytics boundaries, and footer placement.
- `frontend/src/components/Layout/Header.tsx`: `GcdsHeader`, language toggle,
  top navigation, breadcrumbs, and skip target.
- `frontend/src/components/Layout/TopNav.tsx`: primary service navigation.
- `frontend/src/components/Layout/Footer.tsx`: shared footer.
- `frontend/src/components/Layout/AccountSummary.tsx`: current-user summary
  when authentication is enabled.

## Checks

### Tests

- The root route redirects to a default language or service entry route.
- Primary routes render inside the shared shell.
- Header navigation includes `Home` and primary task areas.
- User-facing routes are reachable through route metadata and shared navigation
  or have a recorded hidden-route exception.
- Language toggle keeps the current page or reaches the closest equivalent page.
- Breadcrumbs render from route metadata where required.
- Authenticated shells show the current user and active role or access context
  when that context affects the experience.

### Verification

- Desktop and mobile screenshots show header, menu, language toggle, content,
  current-user summary when authenticated, and footer.
- Keyboard check reaches skip link, navigation, language toggle, page content,
  account/profile controls, and footer in a predictable order.
- Accessibility review confirms one H1 per page and a stable main content
  target.

### Stop Conditions

- The application needs a different Government of Canada shell pattern.
- The navigation model cannot expose `Home` or primary tasks without an
  information-architecture decision.
- Language switching can lose unsaved user input and no mitigation has been
  selected.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-013-GCDS-REACT-APP-SHELL](../../schemas/patterns/pat-013-gcds-react-app-shell.schema.yaml)
- Used for: helping agents and reviewers check the GCDS app shell, header,
  footer, route metadata, navigation, language toggle, account summary,
  screenshots, and accessibility evidence.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
