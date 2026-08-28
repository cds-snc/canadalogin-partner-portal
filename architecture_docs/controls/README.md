# Controls

`docs/controls/` contains reusable control documents.

Controls are atomic requirements or review expectations. Baselines compose
controls into app-type profiles. A control can be reused by more than one
baseline.

Use this split when one control should apply to multiple application types or
when CDS, departmental, program, security, privacy, or platform controls need to
sit beside Government of Canada controls without pretending they come from the
same source.

## Control Namespaces

| Namespace | Source | Purpose |
|---|---|---|
| `GC-WEB` | Government of Canada | Reusable controls for Government of Canada web applications. |
| `CDS-WEB` | Canadian Digital Service or local CDS delivery expectations | Reserved namespace for CDS-specific web application controls. |

Add new namespaces only when the source or ownership is meaningfully different.

## Control Index

Use [catalog.yml](catalog.yml) as the machine-readable control registry.

When a control needs machine-readable support, use the schema-backed standards
model in
[docs/architecture/schema-backed-standards.md](../architecture/schema-backed-standards.md).
A control schema contract can help agents and reviewers record applicability,
control status, evidence expectations, exceptions, and related standards. Actual
project evidence bundles, gate waivers, and approval records belong in
`delorean_template`; project repos store their local records and generated
evidence.

Catalog entries may include `schema_refs` when a related schema contract exists.
Do not add `schema_refs` to every control by default.

```yaml
schema_refs:
  - id: ARCH-SCHEMA-GC-WEB-003-ACCESSIBILITY
    path: docs/schemas/controls/gc-web-003-accessibility.schema.yaml
    used_for:
      - checking selected assessment evidence
      - recording control exceptions or ADR triggers
```

| ID | Control | Source |
|---|---|---|
| GC-WEB-001 | [Scope And Applicability](gc-web/gc-web-001-scope-and-applicability.md) | Government of Canada |
| GC-WEB-002 | [Canada.ca Design, Federal Identity, And Page Shell](gc-web/gc-web-002-canada-ca-design-federal-identity-and-page-shell.md) | Government of Canada |
| GC-WEB-003 | [Accessibility](gc-web/gc-web-003-accessibility.md) | Government of Canada |
| GC-WEB-004 | [Official Languages And Plain Language](gc-web/gc-web-004-official-languages-and-plain-language.md) | Government of Canada |
| GC-WEB-005 | [Mobile And Responsive Behaviour](gc-web/gc-web-005-mobile-and-responsive-behaviour.md) | Government of Canada |
| GC-WEB-006 | [Privacy And Personal Information](gc-web/gc-web-006-privacy-and-personal-information.md) | Government of Canada |
| GC-WEB-007 | [Security](gc-web/gc-web-007-security.md) | Government of Canada |
| GC-WEB-008 | [Identity And Access](gc-web/gc-web-008-identity-and-access.md) | Government of Canada |
| GC-WEB-009 | [Information Management, Records, And Audit](gc-web/gc-web-009-information-management-records-and-audit.md) | Government of Canada |
| GC-WEB-010 | [APIs, Interoperability, And Data Exchange](gc-web/gc-web-010-apis-interoperability-and-data-exchange.md) | Government of Canada |
| GC-WEB-011 | [Logging, Monitoring, Analytics, And Operational Readiness](gc-web/gc-web-011-logging-monitoring-analytics-and-operational-readiness.md) | Government of Canada |

## Adding Controls

Use [TPL-012: Control Template](../templates/controls/tpl-012-control-template.md)
for new controls.

Keep controls reusable:

- describe the required outcome
- name the source or owner
- avoid project-specific release evidence
- avoid one-off exceptions
- link related standards, patterns, and source instruments
- add the control to `docs/controls/catalog.yml`
- reference the control from one or more baselines
