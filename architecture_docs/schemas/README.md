# Schema Contracts

`docs/schemas/` contains shared architecture schema contracts.

Schema contracts support standards, patterns, controls, baselines, decision
records, and architecture review evidence shapes. They help agents and tools
select checks, collect evidence, identify exceptions, and point reviewers to the
right human-readable guidance.

Standards, patterns, controls, and baselines remain the source of truth. A
schema contract supports the document it references; it does not replace that
document.

Project-local Delorean process schema templates live in `delorean_template`;
project repos store their local instances under `delorean/schemas`. This repo
should not contain Delorean runtime process schemas, prompt and agent wiring,
gate definitions, waiver records, handoff records, re-entry records, generated
evidence bundles, or local validation scripts.

Local projects usually receive these architecture schema contracts through
generated `architecture_docs`.

## Catalog

Use [catalog.yml](catalog.yml) as the searchable schema contract index.

Use [selection-profiles.yml](selection-profiles.yml) for common starting points
when selecting standards, patterns, controls, baselines, and schema contracts.
Use [examples/](examples/) for short selection examples.

## Current Contracts

- [ARCH-SCHEMA-STD-001-DOCUMENT-IDENTIFIERS](standards/std-001-document-identifiers.schema.yaml)
- [ARCH-SCHEMA-STD-002-WORK-CONTEXTS](standards/std-002-work-contexts.schema.yaml)
- [ARCH-SCHEMA-STD-004-FRONTEND-REACT-TYPESCRIPT](standards/std-004-frontend-react-typescript.schema.yaml)
- [ARCH-SCHEMA-STD-005-FRONTEND-GC-DESIGN-SYSTEM](standards/std-005-frontend-gc-design-system.schema.yaml)
- [ARCH-SCHEMA-STD-006-GC-UI-PAGE-LAYOUT-RULES](standards/std-006-gc-ui-page-layout-rules.schema.yaml)
- [ARCH-SCHEMA-STD-007-UI-ACCESSIBILITY-BASICS](standards/std-007-ui-accessibility-basics.schema.yaml)
- [ARCH-SCHEMA-STD-008-BACKEND-FASTAPI](standards/std-008-backend-fastapi.schema.yaml)
- [ARCH-SCHEMA-STD-009-API-REST](standards/std-009-api-rest.schema.yaml)
- [ARCH-SCHEMA-STD-010-API-RESPONSE-ERROR-MODELS](standards/std-010-api-response-and-error-models.schema.yaml)
- [ARCH-SCHEMA-STD-011-LOGGING-OBSERVABILITY](standards/std-011-logging-and-observability.schema.yaml)
- [ARCH-SCHEMA-STD-012-TESTING-BASICS](standards/std-012-testing-basics.schema.yaml)
- [ARCH-SCHEMA-STD-013-SECURITY-PRIVACY-BASICS](standards/std-013-security-and-privacy-basics.schema.yaml)
- [ARCH-SCHEMA-STD-014-SECRETS-CONFIGURATION](standards/std-014-secrets-and-configuration.schema.yaml)
- [ARCH-SCHEMA-STD-015-CODE-QUALITY-LINTING-FORMATTING](standards/std-015-code-quality-linting-and-formatting.schema.yaml)
- [ARCH-SCHEMA-STD-016-CONTAINER-BUILD-DEPLOYMENT](standards/std-016-container-build-and-deployment.schema.yaml)
- [ARCH-SCHEMA-STD-017-GC-STANDARDS-REVIEW](standards/std-017-gc-standards-review.schema.yaml)
- [ARCH-SCHEMA-STD-018-FRONTEND-CSS-DESIGN-SYSTEM-BOUNDARY](standards/std-018-frontend-css-and-design-system-boundary.schema.yaml)
- [ARCH-SCHEMA-STD-019-GC-WEB-APPLICATION-BASELINE](standards/std-019-gc-web-application-baseline.schema.yaml)
- [ARCH-SCHEMA-STD-020-DATABASE-PERSISTENCE](standards/std-020-database-persistence.schema.yaml)
- [ARCH-SCHEMA-PAT-001-UI-PAGE-PATTERNS](patterns/pat-001-ui-page-patterns.schema.yaml)
- [ARCH-SCHEMA-PAT-002-API-QUERY-MUTATION](patterns/pat-002-api-query-and-mutation.schema.yaml)
- [ARCH-SCHEMA-PAT-003-FORM-PAGE](patterns/pat-003-form-page.schema.yaml)
- [ARCH-SCHEMA-PAT-004-PROTECTED-ROUTE](patterns/pat-004-protected-route.schema.yaml)
- [ARCH-SCHEMA-PAT-005-ROUTER-SERVICE-SCHEMA](patterns/pat-005-router-service-schema.schema.yaml)
- [ARCH-SCHEMA-PAT-006-CRUD-RESOURCE](patterns/pat-006-crud-resource.schema.yaml)
- [ARCH-SCHEMA-PAT-009-OIDC-BACKEND-SESSION](patterns/pat-009-oidc-backend-session.schema.yaml)
- [ARCH-SCHEMA-PAT-010-RBAC-POLICY-CHECK](patterns/pat-010-rbac-policy-check.schema.yaml)
- [ARCH-SCHEMA-PAT-012-ALEMBIC-POSTGRES-CHANGE](patterns/pat-012-alembic-postgres-change.schema.yaml)
- [ARCH-SCHEMA-PAT-013-GCDS-REACT-APP-SHELL](patterns/pat-013-gcds-react-app-shell.schema.yaml)
- [ARCH-SCHEMA-PAT-014-BILINGUAL-ROUTE-I18N](patterns/pat-014-bilingual-route-and-i18n.schema.yaml)
- [ARCH-SCHEMA-PAT-020-STATUS-FEEDBACK](patterns/pat-020-status-and-feedback.schema.yaml)
- [ARCH-SCHEMA-PAT-023-FRONTEND-DATA-TABLE](patterns/pat-023-frontend-data-table.schema.yaml)
- [ARCH-SCHEMA-PAT-024-FULL-STACK-FEATURE-SLICE](patterns/pat-024-full-stack-feature-slice.schema.yaml)
- [ARCH-SCHEMA-PAT-025-DEPENDENCY-SUBSTITUTION](patterns/pat-025-dependency-substitution.schema.yaml)
- [ARCH-SCHEMA-PAT-026-OUTBOUND-SERVICE-ADAPTER](patterns/pat-026-outbound-service-adapter.schema.yaml)
- [ARCH-SCHEMA-GC-WEB-003-ACCESSIBILITY](controls/gc-web-003-accessibility.schema.yaml)
- [ARCH-SCHEMA-GC-WEB-006-PRIVACY-PERSONAL-INFORMATION](controls/gc-web-006-privacy-and-personal-information.schema.yaml)
- [ARCH-SCHEMA-GC-WEB-007-SECURITY](controls/gc-web-007-security.schema.yaml)
- [ARCH-SCHEMA-BAS-001-GC-WEB-APPLICATION-BASELINE](baselines/bas-001-government-of-canada-web-application-baseline.schema.yaml)
- [ARCH-SCHEMA-DECISION-STANDARD-NON-ADOPTION-ADR](decisions/standard-non-adoption-adr.schema.yaml)

## Folders

- [standards/](standards/) stores schema contracts that support `STD`
  documents.
- [patterns/](patterns/) stores schema contracts that support `PAT` documents.
- [controls/](controls/) stores schema contracts that support `GC-WEB` or other
  control documents.
- [baselines/](baselines/) stores schema contracts that support `BAS`
  documents.
- [decisions/](decisions/) stores schema contracts that support ADR-style
  decisions about following, varying from, or not following guidance.
- [evidence/](evidence/) stores schema contracts that support architecture
  review evidence shapes, such as verification notes or baseline assessments.

## Creating Schema Contracts

Use [Schema Contract Authoring](../architecture/schema-contract-authoring.md)
and [TPL-014: Schema Contract Template](../templates/schemas/tpl-014-schema-contract-template.md)
when adding a schema contract.
