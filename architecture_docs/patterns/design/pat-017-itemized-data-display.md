# PAT-017: Itemized Data Display

Type: Pattern
Status: Active

## Problem

Read-only itemized data needs a consistent structure so users can scan,
compare, and verify repeated information without every feature inventing a
custom table, card layout, or metadata block.

The GC Design System provides a table component for related data in rows and
columns. Government of Canada pages can also use description lists, ordinary
lists, and WET table patterns where they fit the data and project stack.

## Use When

- A user-facing page shows read-only item details, metadata, summaries, or
  repeated records.
- Users need to scan a list of items but do not need to edit them in place.
- A page needs to show key-value facts, short repeated item summaries, or
  tabular data.
- The display needs responsive, accessible structure before custom styling.

## Do Not Use When

- The list can be edited, added to, removed from, or reordered in place. Use
  [PAT-016: Editable List](pat-016-editable-list.md) instead.
- The collection is a complex data grid with row selection, bulk actions,
  frozen columns, inline editing, or spreadsheet-like interaction.
- The selected structure is already known to be a frontend table that needs
  implementation, styling, sorting, filtering, pagination, or responsive
  behaviour rules. Use [PAT-023: Frontend Data Table](pat-023-frontend-data-table.md).
- The information is a navigation menu, page outline, or task hub rather than
  itemized data.
- The data model, labels, or user task are not clear enough to choose a
  semantic structure.

## Trade-Offs

- Semantic HTML gives better accessibility and resilience than custom grid
  markup, but visual styling still needs GC Design System components, design
  tokens, CSS Shortcuts, or small project-level CSS.
- Description lists work well for key-value facts, but they are not a
  substitute for tables when users need to compare columns across rows.
- WET tables provide Government of Canada table behaviour, but enhanced tables
  add interaction and testing responsibility.

## Approach

1. Identify the relationship in the data before choosing markup.
2. Use a description list for key-value facts about one item or one item
   summary.
3. Use a semantic list for repeated item summaries that are not mainly
   column-comparison tasks.
4. Use `GcdsTable` or `<gcds-table>` for tabular data where rows and columns
   define the meaning, and use
   [PAT-023: Frontend Data Table](pat-023-frontend-data-table.md) for frontend
   table implementation.
5. Use WET or Canada.ca table patterns when the table needs responsive cards,
   sorting, filtering, or pagination.
6. Verify the chosen structure at desktop, mobile, keyboard, and screen-reader
   review levels.

### Structure Decision

| Data shape | Preferred structure | Use this when |
|---|---|---|
| Facts about one item | `<dl>` with `<dt>` and `<dd>` | The page shows metadata such as status, owner, date, URL, version, or contact details. |
| Repeated item summaries | `<ul>` or `<ol>`, with each item containing a heading and optional `<dl>` | Each item is a distinct record and users scan item by item more than column by column. |
| Comparable rows and columns | `GcdsTable`, `<gcds-table>`, or semantic `<table>` following PAT-023 | Users need to compare the same fields across records, especially financial, statistical, numerical, contact, schedule, or status data. |
| Larger sortable or filterable table | PAT-023 table controls, WET table plugin, or equivalent project-approved table implementation | The table has more than about 12 rows, or enough facets that sorting, filtering, or pagination supports the task. |

Do not choose a card layout only because it looks designed. Use cards when each
item is a distinct topic, destination, or action. For dense record data, prefer
a semantic list with dividers or a table.

### Description Lists

Use `<dl>` for labelled values where each term names the value that follows.
This is a good default for read-only details and compact item summaries.

```html
<dl>
  <div>
    <dt>Status</dt>
    <dd>Active</dd>
  </div>
  <div>
    <dt>Redirect URL</dt>
    <dd>https://example.canada.ca/callback</dd>
  </div>
  <div>
    <dt>Last updated</dt>
    <dd>2026-05-21</dd>
  </div>
</dl>
```

Use one `<dl>` for one logical group. It is acceptable to wrap each term-value
group in a `<div>` for styling. Keep terms short and consistent across related
pages.

Description lists must not be left as browser-default `dt` and `dd` styling in
production UI. Use a named component wrapper and style it with GC Design System
tokens or CSS Shortcuts so the display is readable, responsive, and aligned
with nearby GCDS components.

Baseline styling for a read-only details block:

- stack term-value pairs on narrow screens
- use a two-column grid only when labels and values remain readable
- make terms visually distinct with GCDS typography tokens or CSS Shortcuts
- keep `dd` margins reset so values align cleanly with their terms
- use GCDS spacing tokens or CSS Shortcuts for row gaps and vertical rhythm
- add subtle dividers with GCDS border tokens when the list has more than a few
  rows
- allow long URLs, IDs, email addresses, and reference numbers to wrap instead
  of clipping or overflowing
- keep values as real text, links, status text, or inline lists instead of
  images or decorative badges that replace the value

Example scoped CSS:

```css
.itemized-description-list {
  display: grid;
  gap: var(--gcds-spacing-200);
  margin: 0;
}

.itemized-description-list > div {
  border-block-start: 0.0625rem solid var(--gcds-border-default);
  display: grid;
  gap: var(--gcds-spacing-75);
  padding-block-start: var(--gcds-spacing-200);
}

.itemized-description-list dt {
  font-weight: var(--gcds-font-weights-bold);
}

.itemized-description-list dd {
  margin: 0;
  overflow-wrap: anywhere;
}

@media (min-width: 48rem) {
  .itemized-description-list > div {
    grid-template-columns: minmax(10rem, 16rem) minmax(0, 1fr);
  }
}
```

Avoid:

- using `<dl>` only for indentation or visual alignment
- putting many unrelated records into one long flat `<dl>`
- leaving browser-default `dt` and `dd` margins when the list appears in a
  designed page
- hard-coding colours, widths, or spacing instead of using GC Design System
  tokens or CSS Shortcuts
- using ARIA `term` or `definition` roles unless an accessibility review proves
  they improve the actual implementation

### Repeated Item Summaries

Use a semantic list when each item has a readable summary and the user does not
need a column-by-column comparison.

```html
<ul class="itemized-list">
  <li>
    <h3>Production client</h3>
    <dl>
      <div>
        <dt>Status</dt>
        <dd>Active</dd>
      </div>
      <div>
        <dt>Redirect URLs</dt>
        <dd>3 URLs</dd>
      </div>
    </dl>
  </li>
  <li>
    <h3>Test client</h3>
    <dl>
      <div>
        <dt>Status</dt>
        <dd>Inactive</dd>
      </div>
      <div>
        <dt>Redirect URLs</dt>
        <dd>1 URL</dd>
      </div>
    </dl>
  </li>
</ul>
```

Each item should have:

- a clear item title or primary value
- a small set of supporting fields
- optional status text close to the item it describes
- a link to details only when a details page exists
- an empty state when no items exist

Keep the list visually quiet. Dividers, spacing, and clear labels are usually
enough. Do not put UI cards inside other cards, and do not turn dense data into
large decorative cards.

### Tables

Use `GcdsTable`, `<gcds-table>`, or a semantic `<table>` when the data is
genuinely tabular. A table is the right choice when rows and columns carry
meaning and users compare the same field across multiple records.

Use [PAT-023: Frontend Data Table](pat-023-frontend-data-table.md) for table
implementation details, including GCDS component use, captions, alignment,
missing values, sorting, filtering, pagination, responsive behaviour, and
frontend verification.

Table requirements:

- prefer the GC Design System table component when it is available in the
  project stack
- use a table caption or a nearby heading that clearly names the table
- use `<th scope="col">` for column headers
- use `<th scope="row">` when row headers help identify records
- keep each column to one data facet
- use consistent heading text across related tables
- avoid blank cells; use a visible placeholder such as `-` when a value is not
  available
- do not use tables only for visual page layout
- never render tabular data as an image

When the GCDS table component does not fit and the project already uses WET or
GCWeb, use project-approved WET classes and patterns, such as `.table`,
`.table-bordered`, `.table-condensed`, `.table-striped`, `.table-hover`,
`.wb-tables`, or the GCWeb responsive table pattern when they fit the data. For
larger tables, especially tables with more than 12 rows, consider WET table
enhancement for sorting, filtering, and pagination.

### Choosing WET Table Behaviour

Use WET table behaviour when:

- the page already uses WET or GCWeb
- the table has more than about 12 rows and pagination would reduce scanning
- sorting or filtering helps users find the row they need
- users need to compare many records using common facets
- a simple HTML table would make mobile or scanning behaviour poor

Do not use WET table enhancement when:

- the list only has a handful of item summaries
- the data is better understood one record at a time
- responsive card conversion would hide relationships that users need to
  compare
- the project cannot test the enhanced behaviour across desktop and mobile

### GC Design System Components And CSS

Use GC Design System components around the data display where they fit:

- `GcdsHeading` for section and item headings
- `GcdsText` for supporting text and empty states
- `GcdsLink` for item detail links
- `GcdsTable` or `<gcds-table>` for related data in rows and columns
- `GcdsPagination` when pagination is part of the page pattern
- `GcdsNotice` for state that needs prominence
- `GcdsGrid` or CSS shortcuts for layout around the list, not to replace
  semantic list or table markup

If custom CSS is needed, keep it scoped to the component or feature. Prefer
spacing, dividers, wrapping, and responsive stacking over custom visual
treatments that obscure the data relationship.

### Source Guidance

This pattern adapts:

- [Canada.ca tables guidance](https://design.canada.ca/common-design-patterns/tables.html)
  for when to use data tables, avoiding layout tables and images of tabular
  data, and considering WET sorting, filtering, and pagination for larger
  tables.
- [GC Design System table component](https://design-system.canada.ca/en/components/table/)
  for related data in rows and columns, scanning and comparison across records,
  and the mobile responsive layout trade-off.
- [PAT-023: Frontend Data Table](pat-023-frontend-data-table.md)
  for applying GC Design System table guidance in frontend implementation.
- [GC Design System CSS Shortcuts](https://design-system.canada.ca/en/css-shortcuts/)
  for custom styling that uses GCDS design tokens for colours, spacing,
  typography, layout, and borders.
- [WET table guidance](https://wet-boew.github.io/wet-boew-styleguide/design/tables-en.html)
  for semantic table structure, captions, header scope, empty-cell
  placeholders, and responsive table handling.
- [MDN description list guidance](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dl)
  for key-value metadata.
- [MDN ARIA list guidance](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/list_role)
  to prefer semantic HTML lists over ARIA list roles when normal list markup is
  available.

## Checks

### Tests

- The empty state renders when no items exist.
- Key-value displays use stable labels and values.
- Description lists use a named wrapper and GCDS tokens or CSS Shortcuts for
  spacing, typography, dividers, wrapping, and responsive layout.
- Repeated item summaries render every item with a clear title.
- Tables render captions or headings, column headers, row headers when needed,
  and placeholders for missing values.
- Detail links, pagination, sorting, or filtering keep the expected query or
  route state when they exist.

### Verification

- Desktop and mobile screenshots show the selected structure without clipped or
  hidden values.
- Keyboard navigation reaches links, pagination, sorting, and filtering
  controls in a predictable order when those controls exist.
- Screen-reader review confirms list, description list, or table semantics are
  announced acceptably for the task.
- Large or enhanced tables are checked for responsive behaviour and usable
  sorting, filtering, or pagination.

### Stop Conditions

- Users need inline editing, row selection, bulk actions, or spreadsheet-like
  interaction.
- The number of records requires search, filtering, pagination, or a separate
  collection page that has not been designed.
- The display contains sensitive, personal, security, or audit data and the
  masking, retention, or visibility rules are unclear.
