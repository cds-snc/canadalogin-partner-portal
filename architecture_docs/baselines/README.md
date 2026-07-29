# Baselines

`docs/baselines/` contains reusable baseline profiles.

Baselines compose reusable controls into app-type profiles that a project must
assess. Standards define when and how a baseline is applied, what evidence is
required, and how exceptions or deferred controls are handled.

## Baseline Index

Use [catalog.yml](catalog.yml) as the machine-readable baseline profile index.

When a baseline needs machine-readable support, use the schema-backed standards
model in
[docs/architecture/schema-backed-standards.md](../architecture/schema-backed-standards.md).
A baseline schema contract can help agents and reviewers record baseline profile
fields, referenced controls, assessment statuses, and review evidence. Local
gate behavior, waiver records, generated evidence bundles, and validation
scripts belong in `delorean_template`; project repos store their local records
and generated evidence.

Catalog entries may include `schema_refs` when a related schema contract exists.
Do not add `schema_refs` to every baseline by default.

```yaml
schema_refs:
  - id: ARCH-SCHEMA-BAS-001-GC-WEB-APPLICATION-BASELINE
    path: docs/schemas/baselines/bas-001-government-of-canada-web-application-baseline.schema.yaml
    used_for:
      - checking selected baseline assessment evidence
      - recording baseline exceptions or ADR triggers
```

| ID | Baseline | When to use it |
|---|---|---|
| BAS-001 | [Government of Canada Web Application Baseline](bas-001-government-of-canada-web-application-baseline.md) | Use when assessing a Government of Canada web application against reusable web application baseline controls. |

Machine-readable baseline profiles live beside their baseline documents:

- [BAS-001 controls profile](bas-001-government-of-canada-web-application-baseline.controls.yml)

Reusable control details live under [docs/controls](../controls/).

## Adding Baselines

Create a new baseline when the app type changes the control profile, such as a
CDS public-facing service, internal administration app, API-only service,
prototype, or data-heavy case-management app.

Use [TPL-013: Baseline Profile Template](../templates/baselines/tpl-013-baseline-profile-template.md)
for new baseline profiles.

A baseline should reference controls from [docs/controls](../controls/) instead
of duplicating their detail. For example, a future CDS public-facing service
baseline can include `GC-WEB-*` controls plus `CDS-WEB-*` controls.
