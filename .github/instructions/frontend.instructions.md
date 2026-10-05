---
name: "Frontend GCDS Rules"
description: "Use when creating or modifying the React frontend, UI components, pages, layouts, forms, navigation, styling, or tests in frontend/. Follow the Government of Canada Design System and existing shared GCDS wrappers."
applyTo:
  - "frontend/src/**/*.ts"
  - "frontend/src/**/*.tsx"
  - "frontend/src/**/*.css"
---

# Frontend GCDS Rules

## Required UI library

This frontend uses the Government of Canada Design System (GCDS), version 1.3.0+, through `@gcds-core/components-react` and the shared wrappers in `frontend/src/components/ui/`.

Use the existing shared wrapper first. If no wrapper exists, use the native GCDS React component. Do not create a custom UI component when an existing wrapper or native GCDS component provides the required behavior.

Relevant shared wrappers include:

- `Container`, `Grid` for layout
- `Heading`, `Text`, `Link`, `ExternalLink`, `SrOnly` for content and accessibility
- `Card`, `Notice`, `Details`, `Icon`, `Stepper`, `DateModified` for content surfaces
- `Button`, `Input`, `Textarea`, `Select`, `Checkboxes`, `Radios`, `DateInput`, `FileUploader`, `Fieldset` for forms
- `ErrorSummary` for page-level form errors
- `Pagination` for paginated navigation
- `Table` and `DataTable` for tabular data
- `Header`, `Footer`, `Breadcrumbs`, `SideNav`, `TopicMenu`, and `LangToggle` for navigation and page chrome
- `Modal`, `Toast`, and `ConfirmDialog` for existing project interaction patterns

### GCDS form validation

- Render `ErrorSummary` at the top of a validated form step when client-side validation fails.
- Pass `errorMessage` to each visible GCDS form control that has an RHF error.
- Build summary links and inline messages from the same RHF error mapping so they cannot diverge.
- Give wrapped GCDS controls stable host IDs and use selectors such as `#field-control` in `errorLinks`. Link to the wrapper host, not the native input inside its shadow DOM.
- Keep request and server failures in `Notice`; do not mix them into client-side form validation summaries.

## Native element restrictions

Do not use raw HTML elements as substitutes for GCDS UI components:

- Use `Heading` or `GcdsHeading`, not raw `h1` through `h6`.
- Use `Text` or `GcdsText`, not raw `p` for visible body copy.
- Use `Link` or `GcdsLink`, not raw `a` for navigation.
- Use `Button` or `GcdsButton`, not raw `button` for actions.
- Use the relevant GCDS form component, not raw form controls.
- Use `Card`, `Notice`, `Table`, `Pagination`, or another GCDS component instead of recreating its UI with `div` elements.

Native semantic elements such as `main`, `section`, `article`, `ul`, `ol`, and `li` are allowed when they provide document structure around GCDS components. A `div` is allowed for layout structure when `Container` or `Grid` does not express the required structure.

If a raw interactive or text element is genuinely required because GCDS cannot support the behavior, verify the GCDS API first and explain the exception in the final response.

## Styling priority

Do not use Tailwind as the default styling system. Apply styling in this order:

1. GCDS component properties and existing shared wrappers.
2. GCDS CSS Shortcuts and responsive utility classes.
3. GCDS design tokens, including `--gcds-*` CSS variables.
4. A small, feature-specific CSS rule when the GCDS API and CSS Shortcuts cannot express the requirement.
5. Tailwind only when all previous options are insufficient.

When Tailwind is unavoidable:

- Keep its use narrow and local to the specific exception.
- Prefer GCDS token values over arbitrary hard-coded colors, spacing, typography, and shadows.
- Do not use Tailwind to replace a GCDS component.
- Do not introduce Tailwind classes merely for convenience or because they are familiar.
- State the reason for the exception in the final summary.

Do not introduce a new styling framework, component library, CSS reset, or design-token system.

## GCDS component catalogue

Use the official catalogue for API details:
https://design-system.canada.ca/en/components/

Common native React components include:

- Layout: `GcdsContainer`, `GcdsGrid`
- Navigation: `GcdsBreadcrumbs`, `GcdsBreadcrumbsItem`, `GcdsPagination`, `GcdsSideNav`, `GcdsTopNav`, `GcdsTopicMenu`, `GcdsLangToggle`, `GcdsLink`
- Content: `GcdsHeading`, `GcdsText`, `GcdsNotice`, `GcdsCard`, `GcdsDetails`, `GcdsIcon`, `GcdsStepper`, `GcdsTable`, `GcdsDateModified`
- Forms: `GcdsButton`, `GcdsInput`, `GcdsTextarea`, `GcdsCheckboxes`, `GcdsRadios`, `GcdsSelect`, `GcdsDateInput`, `GcdsFileUploader`, `GcdsFieldset`, `GcdsSearch`
- Errors and accessibility: `GcdsErrorMessage`, `GcdsErrorSummary`, `GcdsSrOnly`
- Page chrome: `GcdsHeader`, `GcdsFooter`, `GcdsSignature`

Use the component's documented properties and events. For example, use `noticeRole` on `GcdsNotice`, `totalPages` on `GcdsPagination`, and `onGcdsClick` for GCDS events as required by the installed wrapper types.

## Existing project architecture

- Keep route files thin and place page UI in `frontend/src/features/<feature>/pages/`.
- Put server state in feature hooks using TanStack Query.
- Put API calls in `frontend/src/fetch/`; do not call `fetch` directly from components.
- Reuse `@/components/ui` exports before importing GCDS components directly.
- Do not manually edit `frontend/src/routeTree.gen.ts`.
- Preserve the existing bilingual translation structure in `frontend/src/assets/locales/`.
- Match the existing TypeScript, Prettier, ESLint, and test conventions.

## Completion check

Before considering frontend UI work complete:

- Search the changed UI for raw `p`, heading, anchor, button, and form-control elements that should be GCDS components.
- Confirm Tailwind is absent or limited to a documented exception.
- Run focused tests for the changed feature.
- Run frontend lint and build when the environment permits.
