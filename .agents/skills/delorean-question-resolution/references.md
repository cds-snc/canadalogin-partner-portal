# References for delorean-question-resolution

Always load when this skill is used:

- `docs/repo-guidance/control-boundaries.md`
- `docs/repo-guidance/openspec-and-delorean.md`
- `docs/reference/openspec-lifecycle.md`
- `docs/repo-guidance/architecture-docs.md`
- STD-002: Work Contexts

Load when OpenSpec is affected:

- `openspec/changes/<change-id>/proposal.md`
- `openspec/changes/<change-id>/design.md`
- `openspec/changes/<change-id>/tasks.md`
- `openspec/changes/<change-id>/specs/**/spec.md`
- `openspec/specs/**/spec.md`
- `docs/templates/openspec-change-package-template.md`
- `docs/templates/openspec-template.md`

Load when design, architecture, or planning is affected:

- `docs/templates/design-package-template.md`
- `docs/design/README.md`
- `architecture_docs/standards/catalog.yml`
- `architecture_docs/patterns/catalog.yml`
- `architecture_docs/architecture/reference/catalog.yml`
- `architecture_docs/architecture/adrs/catalog.yml`
- TPL-006: ADR Template

Load when Government of Canada standards may apply:

- `architecture_docs/baselines/catalog.yml`
- `architecture_docs/controls/catalog.yml`
- `architecture_docs/baselines/bas-001-government-of-canada-web-application-baseline.controls.yml`
- STD-017: Government of Canada Standards Review
- STD-019: Government of Canada Web Application Baseline Governance
- BAS-001: Government of Canada Web Application Baseline
- TPL-003: Standards Impact Template
- TPL-011: GC Web Application Baseline Assessment Template

Load when evidence, gates, approvals, or waivers are affected:

- `delorean/gates/gate-catalog.yaml`
- `delorean/templates/change-state-template.yaml`
- `delorean/evidence/<change-id>/change-state.yaml`
- `docs/templates/evidence-bundle-template.md`
- `delorean/templates/approval-response-template.md`
- `delorean/templates/waiver-template.md`

Load when code, tests, contracts, or implementation-readiness is affected:

- `docs/reference/local-verification.md`
- `tests/README.md`
- `openapi/README.md`
- domain-specific README files and local tests for the affected area
