# Verification Note: Refine access, copy, and shared navigation

## Scope

This note verifies the local developer implementation of
`refine-access-copy-and-shared-navigation`. The reviewed scope includes the
selected-user and selected-workspace Access route splits, record-specific
assignment and invitation management, canonical RP-configuration copy,
separate Production review, the bounded progression adapters, direct Partner
workspaces navigation, the account disclosure, and the protected Account page.

Verification used localhost services and deterministic fake `local.example`
personas. Shared environments, production data, real secrets, deployment,
publishing, external-system mutation, approvals, waivers, and adapter removal
were outside the control boundary.

## Automated Results

- Strict OpenSpec validation and modified-requirement scenario preservation:
  passed for the active change.
- Scoped repository verification with explicit local CORS origins, methods,
  and headers: 11 checks passed and 0 failed.
- Frontend unit suite: 117 files and 553 tests passed.
- Backend suite: 900 tests passed and 16 skipped; the skips are existing
  optional-integration coverage.
- Changed backend authorization, invitation, copy policy, service, and API
  slice: 148 tests passed.
- TypeScript `tsc --noEmit`, frontend ESLint with zero warnings, scoped Ruff
  lint, and scoped Ruff format checks: passed.
- Vite production build: passed with only the existing non-blocking large-
  chunk advisory.
- OpenAPI export freshness check: passed for the new copy and focused access
  contracts.
- Real GCDS Chromium navigation suite: 5 tests passed. It verifies stable
  trigger text and `aria-expanded`, Escape and focus return, destination,
  outside, language, and responsive-mode dismissal, rapid reopen after native
  delayed focus-out, and the mobile root Menu/Close states.
- Responsive browser assertions cover 320, 768, 1024, and 1280 CSS pixels,
  200-percent rendered scale, visible focus, and long French labels without
  document-level horizontal overflow.
- GC Design System, UI page shell, changed Markdown/JSON format, Markdown, and
  `git diff --check` checks: passed.

The unscoped repository format adapter still traverses unrelated generated
cache/test-result files and legacy boilerplate documentation with existing
whitespace debt. The changed-artifact format check passes. ShellCheck,
gitleaks, Black, and Flake8 are not installed locally; the repository wrapper
records those skips. Ruff covers the changed Python files, and the repository
secret check does not print secret values.

## Browser Evidence

The full local app was exercised against isolated disposable Postgres and
Redis containers on alternate loopback ports so an existing SSH tunnel on
5432 and host Redis on 6379 remained untouched. The containers contained only
the repository's deterministic fake fixtures and were removed after capture.

- Desktop selected-user access showed one H1, safe identity/status context,
  three single-destination task cards, hierarchy breadcrumbs, and a visible
  return link.
- Intermediate-width workspace assignments showed a captioned semantic table,
  column and row headers, text roles/statuses, record-specific links containing
  distinct public assignment UUIDs, and no document-level horizontal overflow.
- Mobile French workspace Access showed the standard GCDS mobile Menu trigger,
  one-column task cards, equivalent long French labels, hierarchy breadcrumbs,
  visible return link, and equal document/client widths.
- The protected Account page exposed only name, fake email, localized
  organization, and canonical access. No provider subject, raw claim, policy
  subject, internal identifier, permission dump, token, or secret was present
  in the semantic page snapshot.
- The browser accessibility representation exposed one H1 per route,
  hierarchical headings, navigation landmarks, table/caption/header/rowheader
  relationships, and unique action names. Keyboard and focus behavior for the
  GCDS disclosure is covered by the real-component browser suite.

Representative local screenshots were captured to temporary files for the
developer handoff. They contain only deterministic fake identities and are not
committed as durable repository artifacts.

The CL Admin visual pass intentionally did not cross into partner-editor-only
RP-configuration routes. The copy form remains covered by its focused page,
route, contract, service, allowlist, environment-matrix, idempotency,
concurrency, and Production-review-separation tests.

## Targeted Standards Review

- GC Design System and branding: task cards remain single-destination choices;
  repeated records use `DataTable`/`GcdsTable`; navigation, form submission,
  notices, headings, breadcrumbs, header, and footer retain the standard GCDS
  shell.
- Accessibility: semantic tables, captions, row headers, unique action names,
  visible focus, Escape focus return, mobile disclosure state, form errors,
  responsive reflow, and long-content behavior pass. A formal assistive-
  technology session remains appropriate before shared release.
- Official languages: changed route metadata, headings, hints, statuses,
  errors, copy exclusions, account content, accessible names, and date display
  have English/French parity. User-entered values remain locale-neutral.
- Security and privacy: authorization is server-owned; direct routes recheck
  capability and ancestry; missing and out-of-scope records fail safely; copy
  logs contain identifiers and outcome metadata but no copied values, secrets,
  tokens, personal information, or raw provider data.
- IAM: the fixed CL Admin/RP Admin/RP User (Edit)/Read Only delegation matrix
  remains authoritative. Route visibility is not authority, and the protected
  Account page reuses normal session admission.
- Information management: assignment/invitation history is retained by the
  existing lifecycle model; copy records versioned allowlist lineage and a
  minimized audit event. No migration or new retention category is required.
- Applicable guidance: `STD-002`, `STD-004` through `STD-010`, `STD-012`,
  `STD-013`, `STD-017` through `STD-020`, `PAT-001`, `PAT-003`, `PAT-013`,
  `PAT-014`, `PAT-017`, `PAT-020`, `PAT-022`, `PAT-023`, `BAS-001`, and the
  affected `GC-WEB-002` through `GC-WEB-011` controls recorded in
  `standards-impact.md`.

No blocking implementation, OpenAPI, OpenSpec, GC Design System,
accessibility, bilingual, branding, privacy/security, IAM, or information-
management finding remains in local scope.

## Deferred Non-Local Readiness

- The shared target, access path, rollout monitoring, rollback path, and
  evidence owner are not named because no shared environment was authorized.
- The legacy progression adapter's shared-rollout owner, telemetry source and
  threshold, consumer confirmation, and removal date remain unassigned. Keep
  the adapter until a human release owner records those decisions.
- Production remains out of scope until explicit approval and release-
  readiness evidence exist.
- Before shared release, run the normal human content and assistive-technology
  review and any approved real-provider integration checks in a named target.

These deferred decisions do not block the verified local functional change or
application of its seven current-spec deltas.
