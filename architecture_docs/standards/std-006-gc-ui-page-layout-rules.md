# STD-006: GC UI Page Layout Rules

Type: Standard
Status: Active

## Read This When

Use this before planning, designing, implementing, or reviewing:

- new frontend scaffolding
- new user-facing pages
- layout changes
- navigation changes
- forms
- multi-step flows
- header changes
- footer changes
- menu changes
- breadcrumb changes
- language toggle changes

Set the baseline for Government of Canada user-facing page layout.

## Rules

### Core Rule

User-facing pages must start from an approved page pattern. Do not build from a blank custom layout unless a human approves an exception.

For new Government of Canada frontend scaffolding, the approved page pattern,
shared app shell, service home, and shared menu are part of the first
implementation slice. Do not defer them to review or a later polish pass.

### Approved Page Path

For a new GC Design System page, start with an approved page pattern.

The default is the GC Design System Basic page template. It gives the page shell needed by most user-facing pages: header, footer, main content, skip link target, H1, and date modified.

For React frontends that use the GC Design System, implement the selected page
pattern through the shared GC Design System React app shell. Do not rebuild
headers, footers, language toggles, or top navigation separately inside each
page.

For a new or existing project or feature area with more than one user task,
start with a task-oriented service home or task hub instead of putting every
workflow on one page. Use the Basic page shell with clear task links, short
descriptions, and separate destination routes or pages for each major task.
This is not a marketing landing page; it is a functional entry point that helps
people choose the right task.

Single-task services can start directly on the task page when there is only one clear action and no meaningful branching.

Use an operational dashboard only when authenticated repeat users need to
monitor, triage, compare, or resume work across related records. A dashboard
can orient an operational area, but full forms, reports, review queues,
configuration, and help should still live on focused destination routes or
pages. Do not use a dashboard as the default public landing page or as a
container for unrelated forms, reports, and admin tools.

When a design package proposes a different layout, record whether the work still maps to an approved template. If it does not, record an exception before implementation starts.

### Home Page And Menu Rule

Every project frontend should have a functional home page or service home route that orients people before they start work. The home page should:

- identify the project or service purpose in one H1
- summarize the local work context or service purpose in short plain language
- link to the main tasks, feature areas, or setup paths
- keep operational content focused on orientation and task selection, not marketing
- stay reachable from the shared header menu as `Home`

When adding or creating a user-facing page, update the shared navigation menu in the same change. The menu must include `Home` and the new page or its parent task area unless the page pattern decision records why the page is intentionally not in primary navigation.

When scaffolding from a template, create the shared menu even if the initial
application has only one feature page. The default is still `Home` plus the
primary task area or a recorded single-page rationale.

Use the navigation component that fits the page pattern:

- `gcds-header` `slot="menu"` with `gcds-top-nav` and `gcds-nav-link` for normal app or service navigation.
- `gcds-topic-menu` when the page is a Canada.ca theme or topic entry point.
- `gcds-side-nav` when a section has a persistent local navigation tree.
- Breadcrumbs as location support, not as the only way to discover top-level pages.

Do not leave new pages accessible only by direct URL, test fixture, or temporary link. If the project has only one user-facing page, record the single-page rationale and keep `Home` in the shared shell.

### Navigation Path Rule

Navigation is part of the page design, not something to defer to accessibility
checks. Accessibility checks can catch keyboard, focus, label, and landmark
problems, but they do not replace an intentional route map.

Before implementation, record the expected navigation path for each primary
task. For most service pages, the path should look like:

```text
Home or service home -> task group or task link -> task page -> confirmation, review, or next step
```

The recorded path should name:

- the entry route
- the destination route or routes
- which shared menu, task link, breadcrumb, side navigation, or top navigation
  element gets people there
- whether the destination is in primary navigation or intentionally nested
- how people return to the service home or parent task area

Avoid designs where people must guess URLs, use browser history as the main
way back, pass through unrelated pages, or rely on breadcrumbs as the only
discoverability mechanism.

### Language Toggle Rule

The language toggle belongs in the header. For GC Design System pages, use the header component language-toggle support, such as `lang-href` on `gcds-header`, instead of adding a second standalone language toggle button in page content.

When bilingual routes or content exist, the toggle should link to the equivalent page in the other official language. Do not add an extra toggle in the main content unless the selected approved template does not provide a header language toggle and a human has approved the exception.

For route-based React applications, use the bilingual route and i18n pattern so
the URL language, `html[lang]`, route helper output, breadcrumbs, and header
toggle all agree.

If switching language would lose unsaved form data or session state, record the risk and the mitigation before implementation. Do not silently remove the header toggle.

### Required Page Shell

For user-facing pages, decide and record:

- Header.
- Footer.
- Main content with a stable skip link target.
- One H1 that describes the page.
- Date modified when required for the page type.
- Breadcrumbs when the page type and information architecture need them.
- Language toggle when bilingual routes or content exist.
- A shared navigation menu with `Home` and the new page or parent task area for multi-page services.
- A single source for route labels, menu links, breadcrumbs, and navigation
  visibility where the frontend has structured routing.
- Search, theme or topic menu, top navigation, or side navigation when the page type needs them.

### Forms And Multi-Step Flows

Forms and multi-step flows still start from an approved page pattern. Use the
multi-step task flow pattern when a task spans more than one page. Add form
components, validation, error summary, field-level errors, stepper, review
screens, and confirmation states inside the approved page shell.

Do not create custom buttons, inputs, selects, textareas, labels, fieldsets, legends, notices, or links when a GC Design System component fits.

### Page Length And Splitting

Use the page length and splitting pattern when a page starts mixing multiple
tasks, long forms, reports, status panels, or help content. Long pages are
acceptable only when they serve one coherent goal and include appropriate
headings, in-page navigation, or details components.

Split pages when users must scroll past unrelated content to start the task,
when there is more than one substantial form, or when different roles see
substantially different sections.

### Target Stack

Do not force one frontend framework. Use the target stack selected by the project.

- For React frontends, use `@gcds-core/components-react`.
- For framework-agnostic or static HTML, use GC Design System web components.
- For GCWeb/WET pages, use GCWeb/WET intentionally and do not mix page shells without a recorded reason.

## Examples

### Page And Task Structure

Use separate routes or pages when the service has distinct tasks, long forms, multi-step workflows, or content that would make one page hard to scan.

Good defaults:

- Use a service home or task hub when the first screen needs to branch to multiple workflows.
- Use clear task links with short descriptions for task choices.
- Use separate task pages for create, view, update, admin, reporting, setup, or help workflows when they have different user goals.
- Use a multi-page process pattern when a task has a sequence of steps.
- Use a dashboard overview only for authenticated operational triage or
  resume-work needs.
- Use an in-page table of contents for long single-topic content pages.
- Use the shared app shell for header, footer, skip link, language toggle,
  breadcrumbs, and top navigation.

Avoid:

- putting unrelated workflows, admin tools, reports, forms, and help content on one page
- using dashboards as landing pages for people who only need to choose a task
- hiding required task content inside accordions or details components to make
  a long page look shorter
- adding a language toggle inside the page body when the header already provides it
- using a hero or marketing layout for an operational service entry point

## Checks

### Required Decision And Verification

Before implementation starts, record the selected page pattern and any exception.

Before handoff, collect:

- desktop screenshot
- mobile screenshot
- design-system checklist
- accessibility result
- page shell checker result when the checker applies
- Storybook or equivalent review fixture result when meaningful UI states
  changed
- exception list, if any
- skipped checks and reasons
- evidence that user-facing routes are reachable from `Home`, the shared menu,
  or a recorded parent task path

Record meaningful screenshots, accessibility checks, design-system checks, exceptions, and skipped checks before handoff.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-006-GC-UI-PAGE-LAYOUT-RULES](../schemas/standards/std-006-gc-ui-page-layout-rules.schema.yaml)
- Used for: helping agents and reviewers check page pattern selection, page
  shell alignment, navigation path, language-toggle behavior, layout evidence,
  route discoverability, and page-layout exception triggers.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
