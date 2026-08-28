# PAT-023: Frontend Data Table

Type: Pattern
Status: Active

## Problem

Frontend data tables need consistent Government of Canada styling, accessible
structure, responsive behaviour, and predictable data controls. Without a
shared pattern, teams tend to create visually inconsistent tables, add
filtering or pagination without a task reason, or use cards and layout grids
where semantic table relationships matter.

The GC Design System provides `gcds-table` for structured data in rows and
columns. Canada.ca and WET also provide table guidance and behaviours that may
fit projects already using GCWeb or WET.

## Use When

- A user-facing frontend shows records with shared attributes.
- Users need to scan, compare, sort, filter, or page through related data.
- A table needs to match GC Design System look and feel.
- A read-only table includes links, row actions, status text, or missing
  values that need consistent treatment.
- The team needs a repeatable standard for table component wrappers,
  responsive checks, and visual review.

## Do Not Use When

- The page shows facts about one item or a short item summary. Use
  [PAT-017: Itemized Data Display](pat-017-itemized-data-display.md).
- The repeated values are editable in place. Use
  [PAT-016: Editable List](pat-016-editable-list.md).
- The component is really a complex data grid with row selection, bulk actions,
  frozen columns, inline editing, virtual scrolling, or spreadsheet-like
  navigation.
- The content is a navigation menu, task hub, dashboard card group, or visual
  page layout.
- The data model, labels, mobile task, or privacy rules are not clear enough to
  design the table safely.

## Trade-Offs

- `GcdsTable` or `<gcds-table>` gives the strongest GC Design System alignment,
  but its mobile responsive layout removes columns. If mobile users need
  side-by-side comparison, reduce the dataset, split the table, or record a
  different responsive decision.
- WET and GCWeb table patterns provide established Government of Canada table
  behaviours, but they add interaction and testing responsibility and should
  not be mixed into a GCDS React app casually.
- Sorting, filtering, and pagination help with larger datasets, but add state,
  keyboard paths, screen-reader behaviour, and regression coverage.
- Custom CSS can improve readability only when it stays scoped and uses GC
  Design System tokens or CSS Shortcuts. Do not style design-system internals.

## Approach

1. Confirm the data is genuinely tabular: rows are records, columns are shared
   attributes, and users benefit from comparing the same field across records.
2. Choose the implementation path before styling.
3. Design the table information architecture: caption, row identity, columns,
   order, alignment, missing values, and optional actions.
4. Add sorting, filtering, and pagination only when they support the user task.
5. Keep visual styling quiet and GC-aligned: clear headers, consistent
   alignment, readable spacing, restrained borders, and real text values.
6. Verify desktop, mobile, keyboard, screen-reader, empty, loading, and
   overflow states.

### Implementation Choice

| Need | Preferred implementation |
|---|---|
| Standard GCDS frontend table | `GcdsTable` in React, or `<gcds-table>` in HTML or Vue |
| Angular frontend | `gcds-table-ng` |
| GCDS component unavailable or insufficient | Semantic `<table>` with scoped project CSS using GC Design System tokens or CSS Shortcuts |
| Existing GCWeb or WET page | Project-approved WET table classes and behaviours |
| Complex data grid | A separately approved accessible grid component and architecture decision |

Do not create a custom table look before trying the GC Design System table
component. If the GCDS component does not fit, record the reason and the
accessibility behaviour the alternative must preserve.

### Table Anatomy

Every frontend table needs:

- a unique caption or an equivalent nearby heading that names the table
- at least one column header or row header
- one data facet per column
- concise, consistent column headers, preferably noun phrases
- a stable row identifier when users need to discuss, open, or compare a row
- real text for missing values, such as `Not applicable`, `No value`, or `-`
- links and actions only where they support a clear task
- an empty state outside the table when there are no rows to render

Use row headers for the column that names each row. Avoid nested tables, merged
cells, split cells, and multiple header levels unless an accessibility review
has accepted the structure.

### Styling Rules

Use the table component defaults first. Add scoped CSS only for needs the
component does not cover.

- Keep the table inside the page's normal `GcdsContainer` or approved content
  width.
- Do not force all tables to the same width for visual symmetry.
- Avoid fixed pixel widths and clipped text. Let long IDs, URLs, and reference
  numbers wrap.
- Left-align text, dates, postal codes, phone numbers, IDs, and other
  non-quantitative values.
- Right-align quantities, measurements, currency amounts, and decimal values;
  use consistent decimal precision.
- Align headers with their column content.
- Put units in column headers, such as `Amount (CAD)`, instead of repeating
  units in every cell.
- Keep cell text short enough for row scanning. Move long descriptions to a
  detail page, details component, or summary list.
- Do not communicate status by colour alone. Use visible status text.
- Do not use images of tabular data.

When a semantic `<table>` is required instead of `GcdsTable`, use a named
wrapper and GC Design System tokens or CSS Shortcuts for spacing, typography,
border, overflow, and wrapping. Keep any WET classes limited to pages already
using WET or GCWeb.

### Controls

Use controls only when the data size and task justify them:

- No table controls: small, static tables where the default order is enough.
- Sorting: users need to reorganize by recency, priority, magnitude, status, or
  another meaningful column.
- Default sort: the initial order reflects how users are most likely to read
  the data.
- Filtering: users are likely to search for a specific value or need to narrow
  a larger dataset.
- Pagination: the number of rows makes the page too long or slow, or the table
  has more than about 12 rows and users do not need to see everything at once.
- Server-side table controls: the dataset is large, sensitive, access-scoped,
  or expensive to send to the browser.

Keep filter, sort, pagination, and page-size state predictable. For list pages,
preserve meaningful state in the URL or route state when users navigate to a
row detail page and return.

Avoid an `All` page-size option for large datasets unless performance and
privacy have been reviewed.

### GCDS Example

For HTML, Vue, or React web components, `gcds-table` takes `columns` and `data`
at minimum. React projects using `@gcds-core/components-react` should pass the
same shape through the React wrapper and use `renderCell` for custom cell
content when needed.

```html
<gcds-table
  sort
  filter
  pagination
  pagination-size="10"
  columns='[
    { "field": "request_id", "header": "Request ID", "rowHeader": true, "sort": true },
    { "field": "received_on", "header": "Received on", "sort": true },
    { "field": "amount", "header": "Amount (CAD)", "alignment": "end", "sort": true },
    { "field": "status", "header": "Status", "sort": true }
  ]'
  data='[
    { "request_id": "REQ-2026-001", "received_on": "2026-06-01", "amount": "$125.00", "status": "Ready for review" },
    { "request_id": "REQ-2026-002", "received_on": "2026-06-02", "amount": "No value", "status": "Draft" }
  ]'
>
  <div slot="caption">
    <h2>Open requests</h2>
    <p>Requests assigned to the current review team.</p>
  </div>
</gcds-table>
```

Use custom cell content sparingly. Links or buttons inside cells must still use
GC Design System link or button components where they fit, have clear text, and
remain reachable in keyboard order.

### Expected Files

- `frontend/src/components/ui/`: reusable table wrapper only when it removes
  repeated GCDS table wiring or normalizes project defaults.
- `frontend/src/features/<feature>/`: feature-specific table composition,
  columns, data mapping, loading state, empty state, and row actions.
- `frontend/src/features/<feature>/*.css`: scoped table styling only when GCDS
  components, tokens, and CSS Shortcuts are insufficient.
- Storybook or equivalent review fixture: table examples for empty, short,
  long, filtered, paginated, mobile, and overflow states when the table is
  shared or user-facing.

### Source Guidance

This pattern adapts:

- [GC Design System table design guidance](https://design-system.canada.ca/en/components/table/design/)
  for table anatomy, captions, simple structure, alignment, units, missing
  values, filtering, sorting, and pagination.
- [GC Design System table code guidance](https://design-system.canada.ca/en/components/table/code/)
  for `gcds-table`, `gcds-table-ng`, `columns`, `data`, caption slot,
  filtering, sorting, pagination, column alignment, row headers, slotted
  content, and React `renderCell`.
- [Canada.ca tables guidance](https://design.canada.ca/common-design-patterns/tables.html)
  for avoiding layout tables and images of data, beta responsive tables, WET
  table classes, and considering sorting, filtering, and pagination for larger
  tables.
- [GC Design System CSS Shortcuts](https://design-system.canada.ca/en/css-shortcuts/)
  for custom styling aligned to GCDS colours, spacing, typography, layout, and
  borders.
- [WET table guidance](https://wet-boew.github.io/wet-boew-styleguide/design/tables-en.html)
  for semantic table structure, captions, header scope, empty-cell
  placeholders, table widths, WET classes, and responsive table handling.

## Checks

### Tests

- The table renders the expected rows, columns, caption, and empty state.
- Missing values render as real text, not blank cells.
- Row links or row actions keep the expected route or query state.
- Sorting and filtering produce predictable row order and results when enabled.
- Pagination preserves page size, current page, and total count expectations.
- Server-side table controls request only authorized data and handle loading,
  empty, error, and retry states.

### Verification

- Desktop and mobile screenshots show no clipped headers, overlapping controls,
  or unreadable cells.
- Mobile review confirms the responsive behaviour still supports the primary
  user task.
- Keyboard review reaches filter, sort, pagination, links, and actions in a
  predictable order.
- Screen-reader review confirms the table has an accessible name, headers are
  announced acceptably, and controls are understandable.
- Visual review confirms custom styling uses GC Design System tokens, CSS
  Shortcuts, or documented WET/GCWeb classes.

### Stop Conditions

- Users need row selection, bulk actions, inline editing, virtual scrolling,
  frozen columns, keyboard grid navigation, or spreadsheet-like interaction.
- Mobile users must compare many records side by side and the responsive table
  behaviour hides columns needed for that comparison.
- The data includes sensitive, personal, security, audit, or financial fields
  and visibility, masking, export, or retention rules are unclear.
- The dataset is too large for client-side filtering, sorting, pagination, or
  an `All` page-size option.
- The project would need to mix GCDS and WET/GCWeb table behaviours without an
  approved frontend architecture decision.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-023-FRONTEND-DATA-TABLE](../../schemas/patterns/pat-023-frontend-data-table.schema.yaml)
- Used for: helping agents and reviewers check table decision, implementation
  choice, anatomy, controls, responsive behavior, accessibility, privacy,
  screenshots, and tests.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
