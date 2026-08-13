# Page pattern decision: Collection identity cells

## Page or flow

Workspace Applications and one Application's RP-configuration collection.

## Selected pattern

Continue using `PAT-023: Frontend Data Table` through the shared `DataTable`
composition and the GC Design System table component.

## Identity and language decision

- Use a normal first-column cell for the stable record identity.
- Do not enable the GCDS row-header treatment on these collections because its
  heavy first-column divider harms the intended quiet comparison-table
  presentation.
- Keep table captions and column headers and include the displayed identity in
  every row action's accessible name.
- Show exactly one Application `Name` column selected from the active English
  or French interface language.
- Keep both bilingual values on edit and detail surfaces; this decision only
  narrows the collection table.
- Keep the locale-neutral RP configuration name in the RP collection.

## Component decisions

- Reuse `DataTable`, `Table`, and existing GCDS action wrappers.
- Add no raw interactive elements and no custom table CSS.
- Preserve existing RP sorting, count, and control decisions.

## Exceptions

No custom UI exception. This records a deliberate omission of the optional
GCDS row-header mode for these collections while retaining standard table
semantics and named actions.

## Verification

- English/French table content and accessible action-name tests.
- Real GCDS normal-cell, keyboard, sort, long-French, and 200-percent reflow
  checks.
