# Standards impact: Access, configuration copy, and shared navigation

## Applicable guidance

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
- `PAT-001`, `PAT-003`, `PAT-013`, `PAT-014`, `PAT-017`, `PAT-020`,
  `PAT-022`, and `PAT-023`
- `BAS-001: Government of Canada Web Application Baseline`
- `GC-WEB-002: Canada.ca Design, Federal Identity, And Page Shell`
- `GC-WEB-003: Accessibility`
- `GC-WEB-004: Official Languages And Plain Language`
- `GC-WEB-005: Mobile And Responsive Behaviour`
- `GC-WEB-006: Privacy And Personal Information`
- `GC-WEB-007: Security`
- `GC-WEB-008: Identity And Access`
- `GC-WEB-009: Information Management, Records, And Audit`
- `GC-WEB-010: APIs, Interoperability, And Data Exchange`
- `GC-WEB-011: Logging, Monitoring, Analytics, And Operational Readiness`

## Impact

- Long mixed-purpose access pages become basic task hubs plus focused routes.
  Comparable assignments and invitations use semantic tables rather than
  repeated cards, supporting scanning, responsive presentation, and
  programmatic relationships.
- Record navigation uses real links and preserves the exact public record
  destination. Backend capability and ancestry checks remain authoritative;
  the browser never derives authority from route visibility or list state.
- Focused access mutations preserve the canonical role/delegation and
  invitation-lifecycle specifications. Safe errors do not disclose cross-
  workspace identities or invitations.
- RP configuration copy uses an explicit source, target identity, Partner
  environment, and CanadaLogin environment. The service copies only reviewed
  reusable non-secret answers, leaves environment-specific and secret fields
  empty, and keeps Production review as a separate intention.
- Copy lineage, idempotency, and minimized audit metadata support
  traceability without logging copied answers, secrets, or unnecessary
  personal information.
- The shared top navigation follows the GCDS distinction between standalone
  links and groups. The one-item Partner disclosure becomes a direct link;
  nested labels stay stable; and responsive, keyboard, focus, and dismissal
  behavior is verified with real components.
- English and French route labels, headings, table content, copy/review
  language, menu labels, error feedback, and accessible names remain
  equivalent. User-entered names remain locale-neutral values.
- The access pages contain personal information such as name and invited email
  only where required for the authorized task. Those values remain out of
  route identity, analytics, logs, screenshots intended for durable evidence,
  and real-data fixtures.

At Delorean Level 2, affected baseline controls are identified here and
verified during implementation. A formal baseline assessment or Evidence
Bundle is deferred unless later release-readiness work requests it.

## Design-system alignment

- `GcdsCard` remains limited to single-destination tasks.
- `DataTable`/`GcdsTable` supplies comparison-table semantics.
- `GcdsLink` owns navigation; `GcdsButton` owns submission and mutation.
- `GcdsErrorSummary` and matching question-level feedback support forms.
- `GcdsTopNav`, `GcdsNavLink`, and supported `GcdsNavGroup` content remain the
  shared navigation foundation.
- Any state coordinator needed to work around installed-component timing or
  breakpoint behavior must be a documented narrow exception that preserves
  the component's semantics and styling boundary.

## Verification

- Strict OpenSpec validation and scenario-preservation preflight.
- Frontend route, table, form, translation, navigation, and compatibility
  tests with real-link destination assertions.
- Backend service/API tests for authorization, ancestry, safe not-found,
  delegation, copy allowlist/exclusions, source immutability, idempotency,
  audit minimization, and explicit Production-review separation.
- OpenAPI export and frontend contract/type verification.
- Real-component browser tests for menu states, focus, Escape, outside
  activation, route selection, language transition, quick close/reopen, and
  responsive-mode changes.
- Automated accessibility scan plus focused keyboard and screen-reader review
  of hubs, tables, action names, forms, errors, disclosure state, and focus
  return.
- Desktop, mobile, intermediate-width, 200-percent-zoom, and long-French UI
  evidence using only fake/test data.
- Focused security/privacy, IAM, bilingual, accessibility, branding, and
  information-management review before release readiness.

## Follow-up

- A shared rollout must name the target, compatibility sunset, monitoring,
  rollback path, and evidence owner.
- If Partner environments later become managed records rather than free-text
  labels, propose that as a separate domain/data change.
- If Partner work gains a second coherent top-level destination, revisit the
  direct-link decision and use a supported group only after recording the new
  information hierarchy.
