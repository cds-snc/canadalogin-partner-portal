# STD-017: Government of Canada Standards Review

Type: Standard
Status: Active

## Read This When

Use this for work that creates, scaffolds, or changes UI, forms, content, APIs,
data, identity, security, privacy, information management, deployment, or
verification.

Use this standard before design, planning, implementation, and review work that may affect a Government of Canada service.

Use [STD-019: Government of Canada Web Application Baseline Governance](std-019-government-of-canada-web-application-baseline.md)
when the work creates, changes, reviews, or releases a Government of Canada web
application.

The goal is simple: make the right standard visible before code is written, not only after review finds a problem.

## Rules

### Standard

- Check standards during planning, not only during QA.
- Assess Government of Canada web applications against the web application
  baseline before first release and when meaningful service changes affect
  baseline controls.
- Use GC Design System components first for Government of Canada UI.
- Start user-facing pages from an approved page pattern and record the page pattern decision before implementation.
- Keep the language toggle in the approved header pattern when bilingual routes or content exist; do not add a duplicate toggle in main content.
- For services with multiple user goals, use a task-oriented entry page that branches to separate task pages or routes instead of putting every workflow on one page.
- Keep a functional home page or service home, and update the shared menu when adding pages so `Home` and the new page or parent task area are discoverable.
- Record primary task navigation paths before implementation; accessibility checks do not replace route design or discoverable navigation.
- Do not create custom UI when a GC Design System component or page template fits the need.
- Treat raw HTML controls and alert roles as custom UI exceptions when an approved component fits.
- Record a short exception when a design system component does not fit.
- Keep English and French needs visible for user-facing content.
- Keep accessibility visible in design, implementation, and verification.
- Keep security, privacy, identity, data, and logging expectations visible when those areas are affected.
- Record standards decisions when they affect architecture, delivery risk, or user-facing behavior.
- Record a standards impact block for meaningful Government of Canada service
  changes.
- Record the baseline gate result before releasing a Government of Canada web
  application.

### Frontend rule

When building or changing a Government of Canada frontend:

1. Start from GC Design System components and page templates.
2. For user-facing page work, record the page pattern decision before implementation.
3. When scaffolding a new React frontend, use STD-003, STD-004, STD-005,
   STD-006, PAT-001, and PAT-013 before writing page code.
4. Scaffold shared app shell components, a functional home or service home,
   route metadata, and header menu navigation before feature-specific pages.
5. Keep the header-provided language toggle in the top-right header area when bilingual routes or content exist.
6. Use a task-oriented service home or task hub when a project has multiple user goals.
7. Keep `Home` in the shared menu and add new pages or parent task areas when user-facing pages are created.
8. Record how each primary task is reached from `Home` or service home and how people return to the parent task area.
9. Confirm the app imports the GC Design System CSS.
10. Use React wrappers from `@gcds-core/components-react` when working in React.
11. Avoid custom buttons, inputs, selects, textareas, labels, fieldsets, legends, headers, footers, alerts, links, and navigation when a GC Design System component fits.
12. If custom UI is needed, add a short standards exception in the plan, implementation notes, or verification note.
13. Test the main path with keyboard-only navigation and at least one small-screen or zoomed view.

## Structure

### Standards Impact Block

Use this block in implementation plans, PR descriptions, architecture notes, or
verification notes when a change meaningfully affects a Government of Canada
service:

The values below are illustrative. Keep the area names and field names stable,
but adapt the decisions, evidence, and exceptions to the change. Areas that do
not apply should still be marked with `applies: false` and a short reason.

```yaml
standards_impact:
  ui:
    applies: true
    decision: Use GC Design System components and the approved page pattern.
    evidence: Desktop and mobile screenshots captured.
    exceptions: []
  accessibility:
    applies: true
    decision: Keyboard, focus, headings, labels, and errors reviewed.
    evidence: Accessibility checklist completed.
    exceptions: []
  official_languages:
    applies: true
    decision: English and French route/content parity maintained.
    evidence: Locale files and language toggle checked.
    exceptions: []
  security_privacy:
    applies: true
    decision: Safe errors, validation, and sensitive data handling reviewed.
    evidence: Tests cover expected failure paths.
    exceptions: []
  identity_access:
    applies: false
    decision: No login, logout, session, role, or scope change.
    evidence: Route remains under existing protected boundary.
    exceptions: []
  information_management:
    applies: true
    decision: Audit and retention expectations reviewed.
    evidence: Audit event shape documented.
    exceptions: []
  verification:
    applies: true
    decision: Local checks and review evidence captured.
    evidence: configured local tests, screenshots, or review notes.
    exceptions:
      - Playwright skipped because the change is docs-only.
  gc_web_application_baseline:
    applies: true
    decision: Applicable BAS-001 controls assessed under STD-019.
    evidence: Baseline assessment record completed.
    exceptions: []
```

Each area uses the same fields:

- `applies`: whether the area is in scope.
- `decision`: the standard, pattern, or reviewed posture.
- `evidence`: the test, screenshot, command, note, or review artifact.
- `exceptions`: recorded deviations, skipped checks, or follow-up decisions.

## Examples

### Standards impact check

Use this small check before implementation:

| Area | Ask this | Output expected |
|---|---|---|
| UI and branding | Does this touch a page, component, form, content, header, footer, navigation, button, link, or layout? | Name the GC Design System components or page template to use, including home/service-home behavior, primary task navigation paths, shared menu update, header language-toggle behavior, and task branching when there are multiple user goals. Record any custom UI exception. |
| Accessibility | Could a user interact with it, read it, submit it, navigate it, or receive status/error feedback? | Name keyboard, focus, labels, headings, status, contrast, zoom, and screen reader checks. |
| Official languages | Will users see text, labels, errors, `alt`, `title`, placeholders, URLs, dates, or numbers? | Name translation files, English/French parity checks, and `lang` expectations. |
| Security and privacy | Does it accept input, expose data, call an API, log data, or use configuration? | Name validation, authorization, safe error, logging, secret, and personal information checks. |
| Identity and access | Does it touch login, logout, sessions, OIDC, scopes, roles, or permissions? | Name session, cookie, RBAC, scope, and logout checks. |
| Information management | Does it create, update, store, archive, delete, or export business records? | Name metadata, audit, retention, soft delete, and disposition checks. |
| GC web application baseline | Is this a Government of Canada web application release or meaningful service change? | Complete the active baseline assessment record and record the baseline gate result under STD-019. |
| Verification | What proof will show the standard was followed? | Name tests, local commands, screenshots, or review notes. |

## Checks

### Review expectations

A standards review should answer:

- Were applicable local standards read before the change?
- Were GC Design System components used where they fit?
- Are custom UI choices explained?
- Are accessibility and bilingual content needs visible?
- Are security, privacy, identity, data, logging, and verification needs visible where applicable?
- Was STD-019 used for Government of Canada web application releases or meaningful service changes?
- Are tests, screenshots, command results, or review notes captured for meaningful user-facing changes?
- Is the standards impact block complete for meaningful service changes?

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-017-GC-STANDARDS-REVIEW](../schemas/standards/std-017-gc-standards-review.schema.yaml)
- Used for: helping agents and reviewers check standards impact coverage,
  evidence, exceptions, and ADR triggers for Government of Canada service work.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
