# PAT-021: Dashboard Overview Page

Type: Pattern
Status: Active

## Problem

Dashboards are easy to overuse as default landing pages. In Government of
Canada services, most people need a clear task path, not a dense wall of cards,
charts, and status widgets.

Use a dashboard only when an authenticated user has an operational need to
monitor, triage, compare, or resume work across several related records.

## Use When

- Authenticated users need an overview of work, status, alerts, or recent
  activity.
- The page supports repeat users who need to triage or resume tasks quickly.
- Users need to compare several queues, records, cases, clients, submissions, or
  configuration areas.
- Each section has a clear data source, owner, refresh behaviour, and next
  action.

## Do Not Use When

- The page is a public landing page or service home. Use
  [PAT-001: UI Page Patterns](pat-001-ui-page-patterns.md) instead.
- The page is only a collection of shortcuts with no status or operational
  context.
- The dashboard would mix unrelated workflows, forms, reports, and admin tools
  on one page.
- The data is not reliable enough to support user decisions.
- Users need to complete a linear task. Use
  [PAT-019: Multi-Step Task Flow](pat-019-multi-step-task-flow.md) when the task
  spans pages.

## Trade-Offs

- Dashboards help repeat users scan and triage, but they can bury first-time
  users and low-frequency tasks.
- Summary widgets save time, but each widget needs loading, empty, error, and
  stale-data behaviour.
- Charts can reveal trends, but they add accessibility, data-table, and
  interpretation responsibilities.

## Approach

1. Define the audience and the decisions the dashboard supports.
2. Confirm this is an authenticated operational overview, not a public landing
   page or task hub.
3. Put the user's current role, organization, tenant, or access context in the
   shared shell when it changes what they see.
4. Lead with the highest-value status, alert, queue, or resume-work section.
5. Group content by user decision or next action, not by database table.
6. Give each section a clear heading, data source, timestamp or freshness cue
   when needed, and link to the relevant task or detail page.
7. Use itemized data, tables, notices, and links before inventing custom cards or
   charts.
8. Move full reports, large tables, complex filters, and data-changing forms to
   separate pages.
9. Provide empty, loading, error, unauthorized, and partial-data states for each
   section.

### Dashboard Decision

| Page need | Use this structure | Avoid |
|---|---|---|
| Public entry point or landing page | Service home, services and information, or most requested pattern | Operational dashboard widgets |
| Authenticated work overview | Dashboard overview with queues, status, and resume-work links | Marketing hero, decorative cards, or generic metrics |
| Large queue or report | Dedicated list, search, or report page linked from the dashboard | Full data table embedded in the dashboard |
| Linear task | Form page or multi-step task flow | Dashboard page with hidden task sequence |
| Admin configuration | Task hub plus separate configuration pages | One page containing every admin form |

### Page Structure

A dashboard overview should include:

- one H1 that names the overview, such as `Dashboard`, `Case overview`, or
  `Client management`
- optional short context text only when the audience or scope is not obvious
- current user or access context in the shared shell, not as a large page card
- one primary resume-work, alert, or status section when there is a clear top
  priority
- task links to full pages for create, review, manage, report, or configure
  workflows
- compact sections with clear headings
- empty and error states for each data-driven section

Avoid:

- full-width hero sections
- decorative chart grids
- nested cards
- more than one primary action per section
- mixing forms, reports, and help content into the same overview
- using cards only to make a page look designed

### Data And Widgets

Each dashboard section or widget should have:

- a named purpose
- the user decision or action it supports
- the data source and freshness expectation
- loading, empty, error, and unauthorized states
- a link to the full task, list, or report when the summary is not enough
- a privacy and authorization check when the data is sensitive

Use [PAT-017: Itemized Data Display](pat-017-itemized-data-display.md) for
read-only summaries and structure selection. Use
[PAT-023: Frontend Data Table](pat-023-frontend-data-table.md) for frontend
tables, especially queues, reports, and sortable or paginated record lists. Use
[PAT-020: Status and Feedback](pat-020-status-and-feedback.md) for section
status, errors, warnings, and empty states.

### Charts And Metrics

Use charts only when the visual pattern helps users make a real decision. Every
chart should have a title, plain-language interpretation, accessible text, and a
link or PAT-023 table for the underlying data when the data matters.

Do not use charts for single values, vanity metrics, or decoration. Prefer
plain text, itemized data, or tables for exact values and operational queues.

### Source Guidance

This pattern adapts:

- [Canada.ca services and information guidance](https://design.canada.ca/common-design-patterns/services-information.html)
  for landing pages that provide clear task choices.
- [Canada.ca most requested guidance](https://design.canada.ca/common-design-patterns/most-requested.html)
  for landing pages where people are trying to find where to start.
- [Canada.ca introduction block guidance](https://design.canada.ca/common-design-patterns/intro-block.html)
  for keeping landing-page introductions brief and task-oriented.

## Checks

### Tests

- Dashboard sections render loading, empty, error, unauthorized, and success
  states.
- Task links route to the expected full pages.
- Sensitive sections enforce backend authorization.
- Stale or partial data is labelled safely.
- Charts or metrics have accessible labels and equivalent data when required.

### Verification

- Desktop and mobile screenshots show the dashboard without clipped widgets or
  overlapping content.
- Keyboard navigation reaches task links and recovery actions in a predictable
  order.
- Screen-reader review confirms headings, sections, and status messages are
  understandable.
- Review confirms the page is not being used as a public landing page or as a
  substitute for separate task pages.

### Stop Conditions

- Dashboard audience, decisions, or data sources are unclear.
- Real operational data, personal information, or authorization data would be
  exposed without handling rules.
- The page needs complex reporting, search, filtering, or bulk actions that
  have not been designed as separate workflows.
