# PAT-022: Page Length and Splitting

Type: Pattern
Status: Active

## Problem

Generated pages often become too long because they combine orientation, task
selection, forms, reports, help text, status, and administration on one route.
Long pages are not automatically wrong, but they need a clear reason, structure,
and navigation support.

## Use When

- A page is becoming hard to scan, test, or explain in one H1.
- A page includes several tasks, forms, data views, or user goals.
- Long content needs a decision between one page, multiple pages, details
  sections, in-page table of contents, or a multi-step flow.
- A design review needs a consistent way to challenge oversized generated pages.

## Do Not Use When

- The page is already a short, focused single task or single content page.
- The content is required to remain together for legal, policy, or publication
  reasons and has an approved long-page structure.
- The split would hide required information, break task flow, or create
  unnecessary navigation.

## Trade-Offs

- Shorter pages are easier to scan and test, but too many pages can create
  navigation overhead.
- In-page navigation helps long reference content, but it does not fix a page
  that contains several different tasks.
- Details components can reduce visual length, but they must not hide required
  steps, errors, or primary actions.

## Approach

1. Start by naming the page's single primary user goal.
2. Split the page when it has multiple primary goals, unrelated workflows,
   separate permission contexts, or more than one substantial form.
3. Keep the page when it supports one focused task or one coherent content
   topic.
4. Use an in-page table of contents for long reference content with clear
   subsections.
5. Use a multi-step task flow for long or conditional transactions.
6. Use details components only for secondary information that users do not need
   to complete the main task.
7. Move large tables, reports, settings, and admin tools to separate routes.
8. Verify the resulting page at mobile, zoomed, keyboard, and screen-reader
   review levels.

### Split Decision

| Symptom | Better structure |
|---|---|
| The H1 cannot describe the whole page clearly | Split by user goal or task area |
| The page has several primary actions | Use a service home, task hub, or dashboard overview |
| The page has more than one substantial form | Split into separate form pages or a multi-step flow |
| The page mixes create, view, edit, report, and help workflows | Use separate task pages linked from a service home |
| The page has a long table or report | Use a dedicated list, search, or report page with PAT-023 table guidance |
| The page has many content subsections but one topic | Use an in-page table of contents |
| The page has sequential steps | Use a multi-step task flow or ordered multi-page navigation |
| The page has optional supporting information | Use `GcdsDetails` or link to supporting content |

### Page Length Guidance

Do not use a fixed word count or pixel height as the only rule. Instead, treat
these as review triggers:

- the primary task or action is not visible after the H1 and short introduction
- users must scroll past unrelated content to start the task
- a mobile screenshot cannot show the page purpose and first useful action
- the page has more than about five to seven major sections
- the page needs an in-page table of contents and also contains forms or
  workflow actions
- a reviewer cannot describe the page with one user goal
- different roles or permissions see substantially different sections
- the page has repeated empty, loading, error, or success states for unrelated
  features

When these triggers appear, choose an intentional structure rather than adding
more cards or accordions.

For related service pages using subway navigation, keep the grouped pages to a
small set. Canada.ca guidance recommends six or fewer pages where possible and
no more than eight.

### Landing Pages

For public or unauthenticated landing pages, prefer task-choice patterns:

- service home or task hub for project-specific applications
- services and information links when the page is a roadmap to destinations
- most requested when top tasks need to be surfaced first
- short introduction block when a landing page needs context

Do not use landing pages for completing complex tasks. Do not use decorative
hero sections, large dashboards, or promotional layouts for operational service
entry points.

### Forms

Keep a form on one page when the task is short, the fields are closely related,
and validation is easy to recover from.

Split a form when:

- it has several unrelated field groups
- later fields depend on earlier answers
- users need to gather information before continuing
- the final action is consequential and needs review
- the form collects sensitive data and needs careful confirmation
- mobile users would need to scroll through many screens of fields before
  submitting

Use [PAT-003: Form Page](../frontend/pat-003-form-page.md) for focused forms
and [PAT-019: Multi-Step Task Flow](pat-019-multi-step-task-flow.md) for
multi-page forms.

### Source Guidance

This pattern adapts:

- [Canada.ca in-page table of contents guidance](https://design.canada.ca/common-design-patterns/in-page-toc.html)
  for long single pages with multiple subsections.
- [Canada.ca ordered multi-page navigation guidance](https://design.canada.ca/common-design-patterns/ordered-multipage.html)
  for content spanning multiple pages with a preferred order.
- [Canada.ca subway navigation guidance](https://design.canada.ca/common-design-patterns/subway-navigation.html)
  for breaking long and complex service content into focused pages.
- [Canada.ca services and information guidance](https://design.canada.ca/common-design-patterns/services-information.html)
  for landing pages that primarily help users choose a task destination.

## Checks

### Tests

- Primary task pages expose one clear goal, primary action, and recovery path.
- Split routes are reachable from `Home`, service home, shared menu, parent task
  area, or dashboard overview.
- Forms preserve state and validation behaviour after splitting.
- In-page table of contents links target the correct headings.
- Details components do not hide required instructions, form fields, errors, or
  actions.

### Verification

- Desktop and mobile screenshots show the page purpose and first useful action
  clearly.
- Keyboard and screen-reader review confirm headings and navigation order are
  understandable after splitting.
- Design review records why the page remained long or why it was split.
- Long content pages place `On this page` links below the H1 and introduction.

### Stop Conditions

- The split would affect legal, policy, accessibility, or records obligations
  that are not understood.
- Different roles need different page structures and the authorization model is
  unclear.
- A long transaction needs save-and-return, review, or confirmation behaviour
  that has not been designed.
