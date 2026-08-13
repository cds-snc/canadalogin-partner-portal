# Page pattern decision: RP-configuration collection presentation

## Page or flow

One Application's RP-configuration collection.

## Selected pattern

`PAT-023: Frontend Data Table` through the same shared `DataTable` composition
used by the parent Applications collection.

## Why this pattern fits

Each RP configuration has the same comparable identity, environment, status,
and destination fields. Shared presentation improves consistency and scanning
without turning the small collection into a complex grid.

## Navigation

- Entry: Workspace -> Applications -> Application -> RP configurations.
- Destination: one contained `View RP configuration` link per row opens the
  canonical task hub.
- Return: RP task hub returns to this collection.
- Individual record routes remain contextual and hidden from global navigation.

## Component decisions

- Use shared `DataTable` and its GCDS `Table` wrapper.
- Sort Name, Partner environment, CanadaLogin environment, and Status.
- Keep Action unsortable and keep filtering and pagination disabled.
- Show the shared localized record count.
- Use configuration name as the row header.
- Render the action as a GCDS Button-as-link backed by the canonical href.
- Add no custom CSS or raw interactive elements.

## Exceptions

None.

## Verification

- Unit, real-component keyboard, long-French, narrow viewport, 200-percent
  reflow, translation, build, lint, and GC Design System checks.
