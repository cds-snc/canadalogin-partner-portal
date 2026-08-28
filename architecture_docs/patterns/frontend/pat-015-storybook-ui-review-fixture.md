# PAT-015: Storybook UI Review Fixture

Type: Pattern
Status: Active

## Problem

User-facing frontend work needs reviewable UI states without requiring reviewers
to reproduce every backend state or signed-in session manually.

## Use When

- A component, page, form, task flow, or layout change needs visual review.
- A feature has loading, error, empty, validation, confirmation, or success
  states.
- A team wants repeatable accessibility checks for UI states.

## Do Not Use When

- The change is backend-only.
- The UI is too coupled to a real external service to mock safely and needs an
  end-to-end environment instead.

## Trade-Offs

- Adds review fixtures and mocked state, but makes UI states easier to inspect
  before integration.
- Storybook stories do not replace unit, integration, or browser end-to-end
  tests.

## Approach

1. Configure Storybook with the React Vite framework, accessibility addon,
   router addon, and MSW when API state must be mocked.
2. Keep stories close to the owning feature or under a predictable
   `frontend/src/stories/` structure.
3. Provide decorators or render helpers for router, language, user/session, and
   provider context.
4. Prefer route IDs, route objects, or shared page metadata when rendering page
   stories. If a `PageRenderer` switch exists, update it in the same change as
   route additions and keep unknown pages obvious.
5. Add stories for the states reviewers need to see: default, loading, error,
   validation, empty, confirmation, success, and permission/session variants
   when relevant.
6. Use MSW or explicit props to model backend responses. Do not call real
   shared or production services from stories.
7. Keep test stories separate from presentational examples when the project uses
   Storybook test fixtures.
8. Run the Storybook accessibility addon for meaningful user-facing changes and
   record skipped checks with reasons.
9. Keep story labels, mocked content, and fixture data bilingual when the
   component depends on language.

### Expected Files

- `frontend/.storybook/main.js` or `frontend/.storybook/main.ts`: Storybook
  framework and addons.
- `frontend/src/stories/`: shared page, layout, and test story helpers when the
  project uses a central story area.
- `frontend/src/**/<feature>.stories.tsx` or `.stories.jsx`: feature-owned
  stories.
- `frontend/src/stories/Tests/`: test-oriented stories when the project keeps
  them separate.
- `frontend/src/setup-msw.js` and `frontend/public/mockServiceWorker.js`: mocked
  service worker setup when API fixtures are needed.

## Checks

### Tests

- Stories render with required providers and route context.
- Important UI states have stories or tests.
- Mocked API states do not call external services.
- Page story routing stays aligned with app route IDs.

### Verification

- Storybook builds or runs for meaningful UI changes.
- Accessibility addon result or review note is captured for user-facing changes.
- Screenshots or visual review notes cover mobile and desktop when layout
  changed.

### Stop Conditions

- The fixture would need real credentials, production data, or shared services.
- Reviewers cannot tell which story represents the route or state under review.
- A story requires broad duplicate rendering logic that should be moved into app
  route metadata or shared test helpers first.
