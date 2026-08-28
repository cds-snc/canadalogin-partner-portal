# Local verification evidence

## Boundary

This evidence covers a local developer database, loopback services, stable
`local.example` fake personas, and generated fixture Applications and RP
configurations only. No shared environment, production system, real secret,
real contact information, provider mutation, deployment, or release approval
was in scope.

## Automated verification

- Backend: 879 passed, 16 intentionally skipped; focused hierarchy, migration,
  authorization, compatibility, privacy-logging, and deletion-protection tests
  also pass.
- Frontend: 526 unit and route tests pass; lint, TypeScript, route generation,
  and the production build pass.
- Backend Ruff and mypy pass across 156 source files; OpenAPI export is current.
- Strict OpenSpec and scenario-preservation validation, Delorean structure/state
  checks, GC Design System/page-shell checks, and `git diff --check` pass.
- Post-archive strict validation passes for all 11 current capabilities. All
  272 promoted scenario headings are present in their matching current specs,
  and the eight affected capability purposes plus ADR-004 were reconciled with
  the implemented hierarchy and terminology.
- Local PostgreSQL reports revision `0032_partner_environment`, zero
  same-workspace Application/RP public-UUID collisions, and two active symmetric
  collision guards.
- A real GCDS 1.3.1 Chromium harness verifies the compact RP-configuration
  table's five columns, visible caption and matching accessible name, row-header
  scope, one state-appropriate action, native Tab focus, long French content,
  and no document overflow at 320 pixels (the 200-percent-zoom reflow
  equivalent). The check found and fixed the component's missing table name in
  Chromium by retaining its caption and mirroring it to the inner table.
- Three additional real-GCDS Chromium checks verify the six-step registration
  progress and semantic navigation, completed/current/pending states,
  `aria-current`, focused top-of-form error summary, ordered summary links,
  input and choice-group focus targets, inline placement and accessible error
  associations, native Tab focus, long French content, and zero document
  overflow at 320 pixels. Together the table and registration harnesses pass
  five checks.

## Signed-in browser checks

- Canonical `/workspaces/:workspaceUuid/applications/:applicationUuid` opens the
  compact Application hub and generates canonical focused destinations.
- Old `application-information` browser paths replace-redirect to the canonical
  Application route.
- A saved `/applications/:rpUuid/usage` link resolves through the authorized
  resource projection to the canonical nested Usage route.
- The header Partner work disclosure opens and closes on user activation and is
  keyboard operable.
- Desktop English and long-French pages showed no horizontal overflow; focused
  contact and RP-configuration collections kept actions inside their summaries.
- Contact forms request one first name and one last name while retaining
  bilingual responsibility fields. Screenshots contain fake local-only data and
  no contact values.

Representative captures:

- `application-hub-canonical-en-desktop.jpg`
- `application-hub-fr-desktop.jpg`
- `application-contacts-en-desktop.jpg`
- `rp-configurations-en-desktop.jpg`

## Reviews and remaining verification

Local code-pattern reviews covered accessibility, bilingual behavior,
security/privacy, IAM/resource ancestry, information management, contact
retention, audit minimization, and safe logging. Operational logs now use keyed
references instead of raw actor or hierarchy UUIDs, and Application deletion is
blocked by every retained RP configuration, including soft-deleted history.

The real-browser table and registration fixtures now cover the highest-risk
compact comparison, multi-step navigation, and error recovery at mobile/narrow
and zoom-equivalent width. Full signed-in Application-page mobile screenshots
remain outstanding because the in-app browser did not apply requested viewport
overrides. Formal assistive-technology speech output, exhaustive signed-in
visible-focus traversal, human French content review, secret scanning with
`gitleaks` (not installed), shared-target migration, and release readiness
remain pre-release checks. Repository-wide format/Markdown wrappers still
report unrelated pre-existing debt outside the changed artifacts; scoped
Markdown checks pass for this archive, the promoted current specs, and ADR-004.
