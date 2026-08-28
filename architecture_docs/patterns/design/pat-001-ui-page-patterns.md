# PAT-001: UI Page Patterns

Type: Pattern
Status: Active

## Problem

User-facing pages need a repeatable page structure so teams do not invent one-off layouts, navigation paths, or accessibility behavior for each screen.

Use this folder to record reusable page patterns for user-facing UI work.

These patterns should stay focused on page structure, navigation, accessibility, and design-system alignment.

## Use When

- A user-facing page, route, form, or task flow is being planned, implemented, or reviewed.
- A new frontend scaffold needs a service home, shared menu, page shell, or
  route structure.
- An overloaded feature area needs to be refactored into a task hub, dashboard
  overview, and focused destination pages.
- The work needs GC Design System page structure, navigation, accessibility, or design-system alignment.

## Do Not Use When

- The work is backend-only or does not affect a user-facing UI.
- A project has already selected a different approved page framework and recorded the exception.

## Trade-Offs

- Increases upfront design discipline, but avoids inaccessible or undiscoverable page structures.
- Works best when page pattern decisions are recorded before implementation starts.

## Approach

### Approved Patterns

| Page need | Approved page pattern | Use this when |
|---|---|---|
| Service home or task hub | GC Design System Basic page template plus Canada.ca services and information pattern | The first screen needs to branch to several task flows, sections, or destination pages. |
| Top-task entry page | GC Design System Basic page template plus most requested pattern | The page has many choices and needs to surface the most common tasks first. |
| Basic user-facing page | GC Design System Basic page template | The page is a normal content or task page that needs the standard page shell. |
| Basic page with form | GC Design System Basic page template plus GC Design System form components | The page collects user input, shows validation, or submits data. |
| Basic page with multi-step flow | GC Design System Basic page template plus the multi-step task flow pattern | The flow has multiple screens, progress, review, confirmation, or save-and-return behaviour. |
| Long information page | GC Design System Basic page template plus in-page table of contents or details components | The page has many subsections, secondary content, or lengthy guidance but is not a transaction. |
| Operational dashboard or overview | GC Design System Basic page template plus dashboard overview pattern | Authenticated repeat users need to monitor, triage, compare, or resume work across related records. |
| GCWeb/WET page | GCWeb/WET implementation pattern | The project has intentionally chosen GCWeb/WET or is maintaining an existing GCWeb/WET page. |

If none of these fit, record an exception in the page pattern decision before implementation starts.

### Service Home And Task Branching

When a new or existing solution or feature area includes multiple user goals,
start with a service home or task hub that branches to separate pages or
routes. Keep the entry page focused on helping people choose the right task.

Use separate destination pages or routes for distinct workflows, such as applying, checking status, updating information, admin review, reporting, setup, or help. Do not put all workflow states, forms, reports, and help content on a single page unless the work is genuinely one small task.

This is a functional entry point, not a marketing landing page. Avoid hero sections, promotional copy, decorative images, and large all-purpose dashboards unless they are the approved pattern for the actual service need.

Treat the service home as the app's home page. It should orient people to the project, expose the main tasks or setup paths, and stay reachable as `Home` in the shared header menu.

For a new scaffold, implement the service home and shared menu before feature
pages. The scaffold is not complete when a page exists only as the default route
or can only be reached by a direct URL.

For public or unauthenticated landing pages, use task-choice patterns such as
services and information or most requested. Do not use a dashboard as the
default landing page unless the audience is an authenticated operational user
with a clear monitoring or triage need.

Use the dashboard overview pattern only when authenticated operational users
need to monitor, triage, compare, or resume work across related records. A
dashboard can be the entry point for an operational area, but it should still
link to focused destination pages for full forms, reports, review queues,
configuration, or help.

Use the page length and splitting pattern when a page or design starts
combining several tasks, long forms, reports, status panels, and help content.

### Shared Menu Requirement

When a new user-facing page or task route is created, update the shared navigation menu as part of the same change. The menu should include:

- `Home`
- the new page when it is a primary destination
- the parent task area when the new page belongs under a task group
- a recorded exclusion reason when the page is intentionally hidden from primary navigation

Use `gcds-top-nav` in the header menu slot for normal application or service navigation. Use `gcds-topic-menu` for Canada.ca theme or topic navigation, and `gcds-side-nav` for persistent section navigation. Breadcrumbs help people understand location, but they do not replace the shared menu for discoverability.

Record the expected path people will use to reach each primary task before
implementation starts. The path should begin at `Home` or the service home,
name the task link or navigation element, name the destination route, and
describe how people return to the service home or parent task area.

### Required Page Shell

Record how the selected pattern provides:

- header
- footer
- main content
- skip link
- H1
- date modified when required
- breadcrumbs when required
- language toggle through the header when required
- shared menu with `Home` and relevant task destinations
- search and additional navigation when required

The language toggle should come from the selected header pattern or `gcds-header` language-toggle support. Do not add a separate language toggle button in the main page content when the header already provides it.

### Component Baseline

When using the GC Design System in React, use GC Design System React wrappers
for visible and interactive UI. Raw HTML controls are exceptions, not defaults:

- Use `GcdsButton` for buttons.
- Use `GcdsInput`, `GcdsTextarea`, `GcdsSelect`, `GcdsCheckboxes`,
  `GcdsRadios`, `GcdsDateInput`, and `GcdsFileUploader` for form controls.
- Use `GcdsErrorSummary`, `GcdsErrorMessage`, `GcdsHint`, `GcdsLabel`, and
  `GcdsFieldset` for form support.
- Use `GcdsLink`, `GcdsNavLink`, `GcdsTopNav`, `GcdsSideNav`,
  `GcdsTopicMenu`, and `GcdsBreadcrumbs` for links and navigation.
- Use `GcdsNotice` for status and `GcdsDetails` for disclosure.

If a raw element is still needed, record the exception in the page pattern
decision before implementation.

### React App Shell

When the project uses React and `@gcds-core/components-react`, implement the
selected page pattern through the shared GC Design System React app shell
pattern. The shell owns header, footer, top navigation, language toggle,
breadcrumbs, skip target, and the main content container.

Use the bilingual route and i18n pattern when the shell has English and French
routes. Use the Storybook UI review fixture pattern when page states need visual
or accessibility review.

Use the multi-step task flow pattern when a task spans more than one page. Use
the status and feedback pattern when pages need loading, empty, error,
unauthorized, warning, success, or service-disruption states.

Use the dashboard overview pattern only for authenticated operational overview
pages. Use the page length and splitting pattern when a route becomes too long
or starts mixing several user goals.

### Implementation Notes

When building a new page in another stack, use the same decision flow, but use the equivalent GC Design System web components or the selected GCWeb/WET pattern.

## Checks

- [ ] The selected page pattern is recorded before implementation.
- [ ] The page shell includes the required header, footer, main landmark, H1, navigation, and language behavior.
- [ ] Screenshots, accessibility checks, and design-system checks are captured for meaningful user-facing changes.
- [ ] App shell, bilingual route, and Storybook review fixture patterns are used
      when they apply.
- [ ] Exceptions are recorded before custom layout or custom UI is implemented.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-001-UI-PAGE-PATTERNS](../../schemas/patterns/pat-001-ui-page-patterns.schema.yaml)
- Used for: helping agents and reviewers check page-pattern selection, page
  shell, navigation path, design-system use, accessibility evidence, and UI
  exceptions.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
