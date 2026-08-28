# BAS-001: Government of Canada Web Application Baseline

Type: Baseline
Status: Active
Version: 2026.05
Governing Standard: [STD-019: Government of Canada Web Application Baseline Governance](../standards/std-019-government-of-canada-web-application-baseline.md)

## Read This When

Use this when assessing a Government of Canada web application against the
current reusable web application baseline profile.

Use the governing standard to decide when the baseline must be assessed, what
statuses are allowed, what evidence is required, and how deferred controls or
exceptions are handled.

## Scope

This baseline is an app-type profile. It does not define control details
directly. It references reusable controls from [docs/controls](../controls/).

Use this baseline for Government of Canada web applications unless a more
specific baseline applies, such as a future CDS public-facing service baseline,
internal administration baseline, API-only baseline, or prototype baseline.

Do not put project-specific evidence, release decisions, team names, local CI
commands, or one-off exceptions in this baseline. Record those in a baseline
assessment, verification note, PR, architecture note, or project-owned release
artifact.

## Control Profile

All controls in this profile are required to assess. A project may mark a
control as `not_applicable`, `deferred`, or `exception` using the status rules in
the governing standard.

| Control | Requirement | Applicability |
|---|---|---|
| [GC-WEB-001: Scope And Applicability](../controls/gc-web/gc-web-001-scope-and-applicability.md) | required to assess | All Government of Canada web applications. |
| [GC-WEB-002: Canada.ca Design, Federal Identity, And Page Shell](../controls/gc-web/gc-web-002-canada-ca-design-federal-identity-and-page-shell.md) | required to assess | Public-facing pages and service flows; record not applicable for API-only or non-public contexts when justified. |
| [GC-WEB-003: Accessibility](../controls/gc-web/gc-web-003-accessibility.md) | required to assess | User-facing UI, content, documents, media, and service workflows. |
| [GC-WEB-004: Official Languages And Plain Language](../controls/gc-web/gc-web-004-official-languages-and-plain-language.md) | required to assess | User-facing content and service interactions where official languages obligations apply. |
| [GC-WEB-005: Mobile And Responsive Behaviour](../controls/gc-web/gc-web-005-mobile-and-responsive-behaviour.md) | required to assess | User-facing UI and service workflows. |
| [GC-WEB-006: Privacy And Personal Information](../controls/gc-web/gc-web-006-privacy-and-personal-information.md) | required to assess | Any collection, use, disclosure, retention, logging, export, or deletion of personal information. |
| [GC-WEB-007: Security](../controls/gc-web/gc-web-007-security.md) | required to assess | All web applications, APIs, deployment paths, and operational contexts. |
| [GC-WEB-008: Identity And Access](../controls/gc-web/gc-web-008-identity-and-access.md) | required to assess | Restricted access, personal information, privileged actions, sessions, roles, or scopes. |
| [GC-WEB-009: Information Management, Records, And Audit](../controls/gc-web/gc-web-009-information-management-records-and-audit.md) | required to assess | Business records, transactional data, generated documents, uploads, exports, audit events, or data lifecycle concerns. |
| [GC-WEB-010: APIs, Interoperability, And Data Exchange](../controls/gc-web/gc-web-010-apis-interoperability-and-data-exchange.md) | required to assess | APIs, integrations, imports, exports, or data exchange paths. |
| [GC-WEB-011: Logging, Monitoring, Analytics, And Operational Readiness](../controls/gc-web/gc-web-011-logging-monitoring-analytics-and-operational-readiness.md) | required to assess | Production, shared-environment, operational, logging, analytics, support, or incident response concerns. |

## Machine-Readable Profile

Use [BAS-001 controls profile](bas-001-government-of-canada-web-application-baseline.controls.yml)
for automation and routing.

Use [the reusable control catalog](../controls/catalog.yml) for the shared
control registry.

## Reference Architectures

No reference architectures are approved for this baseline yet.

When a reference architecture is added, list it here and in
[docs/architecture/reference/catalog.yml](../architecture/reference/catalog.yml).
The reference architecture should include a baseline coverage map that explains
which controls are covered by the default architecture and which still need
project-specific evidence or ADRs.

Until a reference architecture is approved, projects using this baseline should
record material architecture choices in architecture notes or ADRs and collect
control evidence directly in the baseline assessment.

## Source Instruments

This baseline summarizes local delivery expectations. It does not replace legal,
policy, privacy, security, accessibility, official languages, or departmental
review.

Primary source instruments and guidance include:

- [Government of Canada web requirements](https://www.canada.ca/en/government/system/government-communications/web-requirements.html)
- [Canada.ca design applicability](https://design.canada.ca/specifications/usage-canadaca-design.html)
- [Canada.ca Content Style Guide](https://design.canada.ca/style-guide/)
- [CAN/ASC - EN 301 549:2024, 9. Web](https://accessible.canada.ca/creating-accessibility-standards/canasc-en-301-5492024-accessibility-requirements-ict-products-and-services/9-web)
- [Guideline on Service and Digital](https://www.canada.ca/en/government/system/digital-government/guideline-service-digital.html)
- [Information and data governance](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/information-management.html)
- [Government of Canada Standards on APIs](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/government-canada-standards-apis.html)
- [Address security and privacy risks](https://www.canada.ca/en/government/system/digital-government/government-canada-digital-standards/address-security-privacy-risks.html)

## Checks

- [ ] The baseline references reusable controls rather than duplicating control
      detail.
- [ ] Baseline changes preserve stable control IDs or record replacements.
- [ ] App-type applicability is clear for each referenced control.
- [ ] The machine-readable profile is updated when the baseline changes.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-BAS-001-GC-WEB-APPLICATION-BASELINE](../schemas/baselines/bas-001-government-of-canada-web-application-baseline.schema.yaml)
- Used for: helping agents and reviewers check baseline assessment shape,
  control statuses, evidence, deferred controls, exceptions, open risks, and
  release readiness.
- Notes: The schema contract supports this baseline. It does not replace this
  baseline as the source of truth.
