# PAT-016: Editable List

Type: Pattern
Status: Active

## Problem

Editable lists need a consistent view mode and edit mode so repeated values can
be reviewed, added, changed, removed, validated, and saved without accidental
changes or one-off interaction patterns.

Common examples include redirect URLs, allowed domains, notification email
addresses, contact methods, aliases, tags, and other short repeated values.

## Use When

- A user-facing page shows a list of repeated values that users can manage.
- The list needs add, edit, remove, save, cancel, validation, or error handling.
- The values belong to one parent record or configuration screen.
- The list is short enough to manage directly on the page.

## Do Not Use When

- The list is a large resource collection that needs search, filtering,
  pagination, bulk actions, or separate detail pages.
- Each item has its own lifecycle, permissions, audit trail, or complex form.
- Removing an item is high risk and needs a separate confirmation workflow.
- The page is read-only. Use
  [PAT-017: Itemized Data Display](pat-017-itemized-data-display.md) instead.

## Trade-Offs

- A clear edit mode reduces accidental changes, but adds an extra step before
  users can modify the list.
- Whole-list editing is efficient for short simple lists, but row-level editing
  is clearer when each item has several fields or validation rules.
- Inline controls keep users in context, but need careful focus handling,
  labels, and error messages.

## Approach

1. Show a read-only view mode by default.
2. Provide one primary `Edit list` action for the list.
3. In edit mode, provide consistent actions to add a new item, edit existing
   items, remove items, save changes, and cancel changes.
4. Validate each item and show both summary and field-level errors before save.
5. Return to view mode after a successful save.

### View Mode

Show the current values in a list or simple table. Use clear item text and
supporting metadata only when it helps people distinguish items.

The view mode should include:

- a list heading or label that names the item type
- a read-only list of current values
- an empty state when no items exist
- one `Edit list` action when the current user can manage the list

For values that are URLs, email addresses, or identifiers, render the exact
saved value so users can verify it. Do not hide important parts of the value
behind truncation unless the full value is still available in accessible text.

### Edit Mode

Use one of these edit models and keep it consistent within the page:

| Model | Use this when | Required actions |
|---|---|---|
| Whole-list edit | Items are simple scalar values, such as redirect URLs or email addresses. | `Add item`, per-item `Remove`, `Save`, `Cancel` |
| Row edit | Items have multiple fields or need separate validation. | per-row `Edit`, per-row `Remove`, `Add item`, `Save`, `Cancel` for the active row or form |

For whole-list editing, convert existing items into inputs in place. Put
`Add item` after the current list. When users add an item, append a new blank
row and move focus to its first input.

For row editing, keep non-active rows readable. When a user edits a row, show
only that row's editable fields or move them to a nearby form with a clear
heading. Do not make several rows appear to be independently saving if the
screen actually saves the whole list at once.

### Required Controls

In edit mode, include:

- `Add <item type>` to create a new blank item
- `Remove <item type>` for each removable item
- `Save changes` for whole-list edits
- `Cancel` or `Discard changes` to leave edit mode without saving
- item-level labels such as `Redirect URL 1`, `Redirect URL 2`
- field-level hints when format rules matter
- field-level errors and an error summary when validation fails

Use accessible action names that include the item type and, when helpful, the
item value. For example, `Remove redirect URL https://example.canada.ca/callback`
is clearer than `Remove`.

### Validation And State

Keep the saved list and draft list separate. Do not mutate the saved value until
the user saves successfully.

Validate:

- required items when the list has a minimum count
- maximum count when the system limits how many items can exist
- duplicate values
- item format, such as URL, email address, or domain syntax
- unsafe or unsupported values, such as disallowed URL schemes

When validation fails, keep the user in edit mode, preserve their input, move
focus to the error summary, and link each summary item to the relevant field.

If a remove action would have security, privacy, audit, or operational impact,
show a confirmation step or use a separate workflow instead of a one-click
inline remove.

### GC Design System Components

When using the GC Design System, use design-system components first:

- `GcdsButton` for add, edit, remove, save, and cancel actions
- `GcdsFieldset`, `GcdsLabel`, and `GcdsHint` for grouped list inputs
- `GcdsInput`, `GcdsTextarea`, or `GcdsSelect` for item fields
- `GcdsErrorSummary` and `GcdsErrorMessage` for validation
- `GcdsNotice` for save results when needed

Record a custom UI exception when the list needs custom row layout, drag and
drop ordering, inline disclosure, or a component that the design system does not
provide.

## Checks

### Tests

- View mode shows saved items and the empty state.
- `Edit list` enters edit mode without changing saved values.
- `Add item` appends a blank row and focuses its input.
- Existing items can be edited and removed.
- `Cancel` restores the saved list.
- Validation catches required, duplicate, maximum-count, and format errors.
- Successful save returns to view mode and shows the updated list.

### Verification

- Keyboard-only navigation reaches add, edit, remove, save, and cancel controls
  in a predictable order.
- Per-item actions have accessible names that distinguish the target item.
- Field labels, hints, errors, and error summary links are accessible.
- Desktop and mobile screenshots cover view mode, edit mode, empty state, and
  validation errors when the list is user-facing.

### Stop Conditions

- The item lifecycle needs separate ownership, permissions, audit, approval, or
  recovery rules.
- The list can grow large enough to need search, pagination, or bulk actions.
- Remove behavior could break authentication, routing, delivery, or access and
  the confirmation or rollback path is not defined.
