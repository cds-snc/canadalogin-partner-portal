# Design: Align the RP-configuration table presentation

## Technical approach

Extend the shared `DataTable` composition with two general capabilities that
the underlying GCDS table already supports:

- map an identified column as the semantic row header; and
- render a row navigation action from a real href through the GCDS
  Button-as-link wrapper.

Add an optional action-column label and table-level sort toggle so feature
tables retain their recorded information architecture. Then compose the RP
configuration rows through `DataTable` with sorting enabled, filtering and
pagination disabled, a localized count, and the existing canonical task-hub
href.

## Page pattern decision

- Page role: focused Application-child collection.
- Pattern: `PAT-023: Frontend Data Table` inside the existing GC Design System
  app shell.
- Navigation: one row action opens the selected RP task hub.
- Components: existing `DataTable`, `Table`, and GCDS Button-as-link wrappers.
- Custom UI exceptions: none.
- Shared menu and route structure: unchanged.

## Impacted artifacts

- Frontend shared table composition and focused unit tests.
- RP summary table composition, translations, unit tests, and real-GCDS fixture.
- Application table row-header declaration for parity with its current spec.
- OpenSpec delta and current spec after archive.
- Backend, API, OpenAPI, data, and authorization: unchanged.

## Accessibility and bilingual behavior

- Configuration name remains the row header.
- The Action destination remains a real link with localized visible text and
  configuration-name context in its accessible name.
- Sort controls are limited to comparable data columns; Action is not sortable.
- English/French record labels and action context remain equivalent.
- Narrow viewport, keyboard focus, and long-French real-component checks remain
  required.

## Verification

- Shared `DataTable` tests for row-header, sort, action label, and href mapping.
- RP table tests for controls, columns, count, link semantics, and route.
- Real GCDS Chromium fixture for table semantics, focus, and reflow.
- Translation parity, lint, build, design-system/page-shell checks, strict
  OpenSpec validation, and scenario-preservation review.
