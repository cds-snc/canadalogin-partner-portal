# References

Use this manifest to load information-management references without duplicating the checklist in `SKILL.md`.

## Always Load

- STD-017: Government of Canada Standards Review: broad GC standards impact check.
- STD-013: Security and Privacy Basics: privacy and data-handling starter standard.
- STD-011: Logging and Observability: logging and audit context.
- STD-020: Database Persistence: database model, repository, migration, seed-data, soft-delete, ownership, and stored-record standard.

## Load For Data Models Or APIs

- `backend/`: models, schemas, repositories, services, migrations, and tests.
- `openapi/`: API contracts and exposed record shapes.
- `openspec/specs/` and `openspec/changes/`: business requirements and scenarios.
- `tests/`: lifecycle and data-access tests.
- PAT-012: Alembic PostgreSQL Change: PostgreSQL schema change and Alembic migration pattern.

## Review Checklist

- Record identification: distinguish business records from temporary technical data.
- Metadata: creator, created date, modified date, language, classification, owner or source, and record identifier where applicable.
- Retention: retention schedule, disposition date/code, archival marker, or documented follow-up for business records.
- Deletion: avoid hard deletes for records unless explicitly required and approved; prefer soft delete, archive, or lifecycle status.
- Auditability: status changes, deletion/archival actions, and sensitive record access are logged with actor, time, resource, action, and outcome.
- Searchability: fields needed for ATIP, reporting, or records discovery have meaningful names and indexes where appropriate.
- Bilingual data: user-facing text fields identify language or support bilingual values where required.
- Privacy: collection and retention are minimized and aligned with the stated service need.

## External Official References

- [Guideline on Service and Digital](https://www.canada.ca/en/government/system/digital-government/guideline-service-digital.html): service, information, data, IT, and cyber security guidance; verify current instruments when compliance matters.
- [Library and Archives of Canada Act](https://laws.justice.gc.ca/eng/acts/L-7.7/): current Justice Laws source.
- [Privacy Act](https://laws.justice.gc.ca/eng/acts/P-21/): current Justice Laws source.

## External Skill Source

- [dougkeefe/gc-code-skills gc-review-im](https://github.com/dougkeefe/gc-code-skills/tree/main/skills/gc-review-im): public skill this local wrapper is adapted from.
