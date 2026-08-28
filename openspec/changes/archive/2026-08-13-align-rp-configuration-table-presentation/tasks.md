# Tasks: Align the RP-configuration table presentation

## Specification and design

- [x] Classify the user feedback as a small table-control requirement adjustment.
- [x] Confirm local-only work context and no secret or production scope.
- [x] Record the shared `PAT-023` table composition and no custom UI exception.
- [x] Preserve every existing scenario in the modified requirement delta.
- [x] Validate the active OpenSpec change strictly.

## Implementation

- [x] Add row-header, href action, action-label, and sort options to `DataTable`.
- [x] Compose RP configurations through `DataTable` with sorting enabled.
- [x] Keep filtering and pagination disabled and preserve the canonical hub link.
- [x] Add equivalent English/French record-count copy.

## Tests and verification

- [x] Cover shared table mappings and RP presentation semantics in unit tests.
- [x] Verify the real GCDS table, keyboard focus, and narrow reflow in Chromium.
- [x] Run the full frontend unit suite, lint, production build, formatting, and
      translation checks.
- [x] Run GC Design System, page-shell, diff, and strict OpenSpec checks.

## Developer readiness

- [x] Confirm implementation and verification are complete.
- [x] Archive without `--skip-specs`.
- [x] Confirm the current spec and archived package contain the verified table
      behavior and all preserved scenarios.
