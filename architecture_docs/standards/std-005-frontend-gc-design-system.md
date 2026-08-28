# STD-005: Frontend GC Design System

Type: Standard
Status: Active

## Read This When

Use this for Government of Canada UI pages, forms, content, navigation,
reusable components, frontend scaffolding, and frontend accessibility review.

Set a simple baseline for using the GC Design System in user-facing frontend work.

For Government of Canada UI, this is a build expectation, not only a review suggestion.

For user-facing page layout, use GC UI Page Layout Rules before implementation.

## Rules

### Standard

- Use GC Design System components first for common Government of Canada UI patterns.
- Start user-facing pages from an approved page pattern and record the page pattern decision before implementation.
- Use the GC Design System React app shell pattern when a React frontend needs
  shared Government of Canada page chrome.
- For services with multiple tasks, use a task-oriented service home or task hub that branches to separate routes or pages instead of placing every workflow on one page.
- Keep a functional home page or service home, and update the shared menu when adding pages so `Home` and the new page or parent task area are discoverable.
- Keep the language toggle in the header through the approved page template or `gcds-header` language-toggle support. Do not add a second standalone language toggle button in the page body.
- For bilingual applications, use a route and i18n pattern that keeps the
  current language, equivalent route, page title, breadcrumbs, and header toggle
  aligned.
- Include GC Design System dependencies in the frontend package.
- Keep GC Design System wrappers in `frontend/src/components/ui/` when a wrapper
  avoids repeated low-level component wiring.
- Keep app chrome, page content shells, and layout helpers in the project's
  shared layout folder, normally `frontend/src/components/layout/` for new
  projects or `frontend/src/components/Layout/` when that convention already
  exists.
- Do not create custom UI components when a GC Design System component fits.
- Do not build custom buttons, inputs, selects, textareas, labels, fieldsets, legends, headers, footers, alerts, or links when a GC Design System component fits.
- Treat plain HTML controls as exceptions, not defaults. Raw `<button>`,
  `<input>`, `<select>`, `<textarea>`, `<a>`, `<header>`, `<footer>`, `<nav>`,
  `<label>`, `<fieldset>`, `<legend>`, and alert roles need either a matching GC Design
  System component or a recorded custom UI exception.
- Preserve accessibility, bilingual, and Canada.ca consistency expectations.
- Document exceptions when the design system is not used.
- Keep custom styling small, intentional, scoped, and aligned with the frontend
  CSS and design-system boundary.
- Record standards impact for meaningful UI work.

### Scaffold Baseline

When creating or regenerating a Government of Canada frontend, implement this
baseline before feature-specific page work:

- For React projects, add `@gcds-core/components`,
  `@gcds-core/components-react`, and the required GC Design System CSS imports.
  For other stacks, add the equivalent GC Design System web components and CSS
  imports.
- Create a shared app shell, normally `RootLayout`, `Header`, `TopNav`, and
  `Footer`, using GC Design System React components in React projects.
- Create a functional home or service-home route as the default entry point.
- Put top navigation in the header menu slot. It must include `Home` and each
  primary task area that the scaffold creates.
- Store route IDs, labels, breadcrumbs, and navigation visibility in route
  metadata or a single navigation model instead of duplicating hard-coded links.
- Put the language toggle in the header when bilingual routes or content exist.
- Add feature pages only after the route can be reached from the service home,
  shared menu, parent task area, or an approved recorded exception.

### Component-use baseline

Before implementation, list each visible or interactive UI need and the GC
Design System component that will satisfy it. Use the installed React wrappers
from `@gcds-core/components-react` in the frontend, or equivalent GC
Design System web components in another stack.

Use these default mappings unless the page pattern calls for something else:

- Page shell: `GcdsHeader`, `GcdsFooter`, `GcdsContainer`,
  `GcdsDateModified`, `GcdsHeading`, `GcdsBreadcrumbs`, and
  `GcdsBreadcrumbsItem`.
- Navigation and links: `GcdsTopNav`, `GcdsNavLink`, `GcdsTopicMenu`,
  `GcdsSideNav`, `GcdsLink`, `GcdsPagination`, and `GcdsStepper`.
- Actions and forms: `GcdsButton`, `GcdsInput`, `GcdsTextarea`,
  `GcdsSelect`, `GcdsCheckboxes`, `GcdsRadios`, `GcdsDateInput`,
  `GcdsFileUploader`, `GcdsFieldset`, `GcdsLabel`, `GcdsHint`,
  `GcdsErrorMessage`, `GcdsErrorSummary`, and `GcdsSearch`.
- Status and content: `GcdsNotice`, `GcdsDetails`, `GcdsCard`,
  `GcdsGrid`, `GcdsTable` when available in the project stack, `GcdsText`, and
  `GcdsSrOnly`.
- Read-only itemized data: use PAT-017: Itemized Data Display to choose
  between description lists, lists, and tables.
- Frontend data tables: use PAT-023: Frontend Data Table. Prefer `GcdsTable`
  or `<gcds-table>` for related data in rows and columns. Use semantic
  `<table>` with scoped styling based on GC Design System tokens or CSS
  Shortcuts only when the component does not fit.

If a component does not fit, record the exception in the page pattern decision
before coding. The exception should name the unsupported need, the custom
element, the accessibility behavior it must preserve, and the review path.

## Examples

- Use `@gcds-core/components` and `@gcds-core/components-react` from `frontend/package.json`.
- Import GC Design System styles from `frontend/src/main.tsx`.
- Use `@gcds-core/css-shortcuts` when the project opts into GC Design System
  spacing and utility classes.
- Start with GC Design System components or page templates before writing custom markup.
- For read-only data displays, use the GC Design System table component for
  tabular data, PAT-023 table implementation guidance, and PAT-017
  description-list styling for labelled facts.
- Record the selected page pattern before implementing a new user-facing page shell.
- Add new user-facing pages to the shared header menu, section side navigation, or approved parent task menu in the same implementation change.
- Use separate task pages or routes for distinct workflows when the project has more than one user goal.
- Review forms, errors, headings, links, buttons, navigation, focus, and keyboard behavior.
- Use Storybook or equivalent review fixtures when page states, forms, error
  states, or responsive layout need visual review.

## Checks

- [ ] GC Design System components are used where they fit.
- [ ] The page pattern decision names the approved page pattern and page shell when user-facing page work changed.
- [ ] The entry page branches to separate task pages or routes when there are multiple user goals.
- [ ] The home page or service home orients people to the main tasks.
- [ ] The shared menu includes `Home` and the changed page or parent task area, or the exclusion reason is recorded.
- [ ] The language toggle is provided by the header and links to equivalent content in the other official language when bilingual routes exist.
- [ ] The app shell uses the shared header, navigation, skip target, main
      content, and footer pattern.
- [ ] Custom components or styling have a short reason.
- [ ] Custom CSS follows the frontend CSS and design-system boundary.
- [ ] Forms, errors, headings, links, buttons, and navigation were reviewed.
- [ ] Keyboard navigation, focus, contrast, and screen-reader behavior were considered.
- [ ] Frontend data tables follow PAT-023 when tabular data is displayed.
- [ ] English and French content needs were considered.
- [ ] Storybook or equivalent review fixtures were updated when meaningful UI
      states changed.
- [ ] The standards impact block was captured for meaningful UI work.
- [ ] Tests or verification were updated when user-facing behavior changed.
- [ ] New or regenerated frontend scaffolds include GC Design System
      dependencies, shared shell components, a functional home or service home,
      route metadata, and header menu navigation before feature-specific pages.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-005-FRONTEND-GC-DESIGN-SYSTEM](../schemas/standards/std-005-frontend-gc-design-system.schema.yaml)
- Used for: helping agents and reviewers check GC Design System component use,
  shared app shell, header, footer, navigation, language-toggle behavior,
  custom UI explanations, and design-system exception triggers.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
