# Design: Repair collection-table identity presentation

## Technical approach

Keep both collections on the shared `DataTable` and GCDS `Table` wrappers, but
do not set `rowHeader` on either identity column. The GCDS row-header option
adds a strong visual boundary that is not useful for these short collections.
The table caption and column headers continue to expose the relationships, and
each row action keeps the displayed identity in its accessible name.

For Applications, normalize the resolved i18n language to English or French,
map one `name` field from `serviceNameEn` or `serviceNameFr`, and render one
localized `Name` column. Do not fall back to the other official-language name
inside this collection; use localized missing-value text if the active-
language value is unexpectedly absent.

## Page pattern decision

- Page role: workspace Application collection and Application-child RP-
  configuration collection.
- Pattern: `PAT-023: Frontend Data Table` in the existing GC Design System app
  shell.
- Components: existing `DataTable`, `Table`, and GCDS action wrappers.
- Identity treatment: normal first-column body cells, with identity repeated in
  the accessible name of row actions.
- Custom UI exceptions: none; no raw table or custom CSS is introduced.
- Shared menu, routes, API, and authorization: unchanged.

## Accessibility and bilingual behavior

- Captions, column headers, source order, and localized action context remain
  available to assistive technology.
- Removing `rowHeader` removes the unintended visual divider without hiding or
  duplicating identity text.
- The Applications table exposes exactly one service name and one name header
  in the active interface language.
- English, French, regional language codes, keyboard reachability, long French
  content, and narrow reflow require regression coverage.

## Verification

- Unit-test the English and French Application row mapping, one name column,
  and localized action context.
- Unit-test the RP identity as a normal cell while preserving the real link.
- Exercise the real GCDS RP fixture for normal cells, sort controls, keyboard
  reachability, French count, and narrow reflow.
- Run translation parity, full frontend unit tests, lint, production build,
  formatting, GC Design System checks, page-shell checks, and strict OpenSpec
  validation.
