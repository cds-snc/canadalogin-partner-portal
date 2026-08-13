# Page pattern decision: RP-configuration collection destination

## Page or flow

One Application's RP-configuration comparison table and the selected
RP-configuration task hub.

## Selected pattern

- `PAT-023: Frontend Data Table` for the collection.
- `PAT-001: UI Page Patterns` basic task hub for one RP configuration.
- Existing GC Design System React app shell and bilingual route patterns.

## Why this pattern fits

Users compare stable facets in the collection, then select one record to reach
its distinct tasks. The task hub is the correct destination because
Configuration, Usage, Manage credentials, and draft setup are sibling tasks for
the selected RP configuration. A row link directly to one child task hides the
other permitted tasks.

## Navigation

- Entry: `Home -> Partner workspaces -> Workspace -> Applications ->
Application -> RP configurations`.
- Row destination: the canonical RP-configuration hub for the selected row.
- Draft continuation: state-aware `Resume setup` from the hub.
- Return path: hub to the parent RP-configurations collection; focused child
  routes back to the hub.
- Hidden from primary navigation: individual record routes remain contextual.

## Component and content decisions

- Keep `GcdsTable` with Name, Partner environment, CanadaLogin environment,
  Status, and Action.
- Keep configuration name as the row header.
- Use one `GcdsLink` action: `View RP configuration` plus screen-reader name
  context.
- Use the existing GCDS Button-as-link wrapper for `Resume setup` on an
  editable draft's hub.
- Do not add a clickable row, nested child-task links, filters, sorting,
  pagination, or inline editing.
- English and French action and accessible names remain equivalent.

## Exceptions

None.

## Verification

- Unit tests prove exact hub and resume destinations and read-only behavior.
- Translation parity, frontend lint/build, and GC Design System checks pass.
- Keyboard/link-purpose semantics are reviewed from the rendered table
  contract.
