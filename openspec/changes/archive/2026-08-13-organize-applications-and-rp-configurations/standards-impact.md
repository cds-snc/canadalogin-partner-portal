# Standards impact: Applications and RP configurations

## Affected standards

- `STD-002: Work Contexts`
- `STD-004: Frontend React and TypeScript`
- `STD-005: Frontend GC Design System`
- `STD-006: GC UI Page Layout Rules`
- `STD-007: UI Accessibility Basics`
- `STD-008: Backend FastAPI`
- `STD-009: REST API`
- `STD-010: API Response and Error Models`
- `STD-012: Testing Basics`
- `STD-013: Security and Privacy Basics`
- `STD-017: Government of Canada Standards Review`
- `STD-018: Frontend CSS and Design-System Boundary`
- `STD-019: Government of Canada Web Application Baseline Governance`
- `STD-020: Database Persistence`
- `PAT-001`, `PAT-012`, `PAT-013`, `PAT-014`, `PAT-017`, `PAT-019`,
  `PAT-020`, `PAT-022`, and `PAT-023`
- `BAS-001: Government of Canada Web Application Baseline`
- `GC-WEB-002`, `GC-WEB-003`, `GC-WEB-004`, `GC-WEB-005`, `GC-WEB-006`,
  `GC-WEB-007`, `GC-WEB-008`, `GC-WEB-009`, and `GC-WEB-010`

## Impact

- Page structure moves from a long mixed-purpose route to a GC Design System
  task hub plus focused pages with semantic lists, compact comparison tables,
  forms, statuses, parent links, and bilingual route metadata.
- Navigation removes one duplicate product destination and must keep keyboard-
  controlled disclosure, visible focus, direct-entry recovery, and responsive
  reflow.
- Registration navigation keeps `GcdsStepper` as a progress indicator and uses
  a separate semantic landmark for completed-step links. Current and blocked
  states, focus order, dirty-input warnings, and direct-route recovery must not
  imply that prerequisites can be skipped or silently discard input.
- Registration validation applies `GcdsErrorSummary` plus matching
  question-level error feedback across every step. Summary focus, linked
  question targets, specific correction text, programmatic association, and
  persistent unrelated errors support WCAG 2.2 success criteria 2.4.3, 3.3.1,
  and 3.3.3 together with `STD-006`, `STD-007`, and `PAT-019`.
- English and French step labels, navigation states, summary headings, error
  links, inline corrections, and accessible names remain equivalent; user-
  entered locale-neutral values are not translated.
- Contact-schema migration changes personal-information collection and must
  preserve legacy values without guessing, minimize new collection, and keep
  values out of logs, analytics, URLs, fixtures, and evidence.
- RP-configuration and parent-link migrations use expand/backfill/contract,
  explicit orphan mapping, required-name and Partner-environment checks,
  rollback-aware migrations, and database-backed verification. Existing
  Partner environments are not inferred from names, URLs, provider metadata,
  or CanadaLogin targets.
- API changes remain typed, versioned, server-authorized, ancestry-scoped, and
  compatible until consumers migrate. Safe errors do not distinguish missing
  from out-of-scope resources.
- Business-critical changes to contacts, parent assignment, configuration
  identity, lifecycle, progression, review, and secrets retain minimized audit
  events and record history.

At Delorean Level 2, affected baseline controls are identified here and
verified during implementation. A formal baseline assessment or Evidence
Bundle is deferred unless release-readiness work requests it.

## Exceptions

The registration flow has one approved, page-scoped design-system exception:
a semantic `<nav>` and ordered list provide status-aware links to other
completed routes. `GcdsLink` supplies each available link; current and blocked
items are non-interactive text. `GcdsStepper` remains the progress indicator,
and `GcdsSideNav` is not used because this is transient transaction state, not
persistent section information architecture. The exception requires native
keyboard behavior, `aria-current="step"`, explicit unavailable text, visible
focus, logical order, responsive reflow, bilingual parity, and focused
assistive-technology review.

Existing database table and versioned API names remain temporary compatibility
implementation details; that is a staged migration choice, not a user-facing
vocabulary exception.

## Verification

- Strict OpenSpec and scenario-preservation validation.
- Alembic upgrade/downgrade, backfill, required-name, Partner-environment,
  orphan, and row-count tests.
- Backend contract, authorization, ancestry mismatch, safe-error, audit, and
  privacy tests.
- Frontend unit, route, form, disclosure, semantic-list, GCDS-table,
  registration-step-navigation, responsive, and bilingual tests.
- Real-GCDS-component integration checks for error-summary focus, ordered link
  targets, matching summary and inline messages, control/group association,
  selective error clearing, Review recovery without cross-route links to
  unrendered controls, and distinction between validation and non-field
  failures.
- OpenAPI export and frontend contract/type verification.
- Desktop/mobile/zoom screenshots, keyboard review, automated accessibility
  scan, and focused screen-reader checks of table caption/header/row actions,
  compact Readiness semantics, registration step navigation, and form error
  recovery.
- Security, privacy/personal-information, IAM, and information-management
  review before release readiness.

## Follow-up

- A separately approved rollout plan must name any shared target, legacy-data
  mapping owner, compatibility sunset, rollback path, and operational evidence.
- A later reporting or governance requirement may replace the locale-neutral
  Partner environment label with a controlled vocabulary. This change records
  the partner's own label without assuming that its environments map one-to-
  one to CanadaLogin environments.
- Database table and API route renames may be proposed after compatibility
  consumers are retired.
