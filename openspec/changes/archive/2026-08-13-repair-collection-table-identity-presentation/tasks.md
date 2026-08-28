# Tasks: Repair collection-table identity presentation

## Specification and design

- [x] Confirm the visual regression source and local-only control boundary.
- [x] Record the GCDS identity-cell and active-language table decision.
- [x] Preserve every existing scenario in the modified requirement delta.
- [x] Validate the active OpenSpec change strictly.

## Implementation

- [x] Remove row-header treatment from Applications and RP configurations.
- [x] Replace the two Application language columns with one localized Name
      column.
- [x] Use the displayed localized name in Application action context.
- [x] Preserve RP sorting, count, link, and responsive behavior.

## Tests and verification

- [x] Cover English and French Application table identity in unit tests.
- [x] Cover normal identity cells and links in RP unit and real-GCDS tests.
- [x] Run full frontend unit tests, lint, production build, and formatting.
- [x] Run bilingual, GC Design System, page-shell, diff, and strict OpenSpec
      checks.

## Developer readiness

- [x] Confirm implementation and verification are complete.
- [x] Archive without `--skip-specs`.
- [x] Confirm the current spec and archived package contain the verified table
      behavior and all preserved scenarios.
