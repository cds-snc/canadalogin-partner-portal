# Design: Open RP configurations from their collection

## Technical approach

Keep the existing five-column GCDS comparison table. Map every row's one action
to the canonical hub route:

`/workspaces/:workspaceUuid/applications/:applicationUuid/rp-configurations/:rpConfigurationUuid`

Use the specific localized action `View RP configuration` with the existing
screen-reader configuration-name context. Do not route collection rows directly
to Registration or Configuration.

On the destination hub, show the existing localized `Resume setup` navigation
when the record is an editable draft and its server-scoped summary supplies a
resume path. The hub continues to capability-gate Configuration, Usage, Manage
credentials, Audit, Settings, progression, and production review.

## Impacted artifacts

- OpenSpec delta: collection row destination scenario.
- Frontend: RP summary table mapping and RP-configuration task hub.
- Locales: equivalent English/French row-action copy.
- Tests: exact row and hub destinations, role/state behavior, translation
  parity.
- API, backend, data, OpenAPI: unchanged.

## Standards and patterns impact

- `PAT-001: UI Page Patterns`: the collection provides a discoverable path to
  the nested task hub.
- `PAT-023: Frontend Data Table`: one clear GCDS link remains in each Action
  cell; no grid behavior or extra collection controls are added.
- `PAT-013: GC Design System React App Shell`: the contextual nested route
  remains hidden from global navigation and reachable from its parent area.
- `PAT-014: Bilingual Route and I18n`: English/French action and accessible-name
  parity are required.
- Existing page pattern: corrected by
  `page-pattern-decision.md` in this change.
- GC Design System components: existing `Link`, `Button`, and `Table` wrappers.
- Custom UI exceptions: none.

## Accessibility, security, and privacy

- The link text names the RP record type and retains the selected
  configuration name in its accessible name.
- Link purpose and keyboard order remain inside the affected row.
- The hub exposes only capability-permitted tasks; direct-route backend
  authorization remains authoritative.
- No secret or provider data is added to the table or hub response.

## Slice plan

1. Route every row to the RP task hub and update bilingual copy/tests.
2. Ensure editable drafts retain `Resume setup` on the hub and verify
   read-only users do not receive it.
3. Run focused tests, lint, build, design-system checks, strict OpenSpec
   validation, and archive after verification.
