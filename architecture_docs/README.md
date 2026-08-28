# Docs

Use these folders to find shared architecture guidance.

- [standards/catalog.yml](standards/catalog.yml) maps standards to categories, task triggers, and related standards for search and agent routing.
- [patterns/catalog.yml](patterns/catalog.yml) maps patterns to problems, fit criteria, related standards, and related patterns.
- [controls/catalog.yml](controls/catalog.yml) maps reusable controls to source namespaces, categories, related standards, and baseline use.
- [baselines/catalog.yml](baselines/catalog.yml) maps baseline profiles to application types and referenced control profiles.
- [schemas/catalog.yml](schemas/catalog.yml) maps architecture schema contracts
  to owner documents, categories, search keywords, stack profiles, and artifact
  types.
- [schemas/selection-profiles.yml](schemas/selection-profiles.yml) maps common
  work types to candidate standards, patterns, controls, baselines, and schema
  contracts.
- [schemas/examples/](schemas/examples/) shows selection examples for common
  agent tasks.
- [architecture/reference/catalog.yml](architecture/reference/catalog.yml) maps reference architectures to applicable baselines when published.
- [architecture/adrs/catalog.yml](architecture/adrs/catalog.yml) maps architecture decision records when published.
- [standards/std-001-document-identifiers.md](standards/std-001-document-identifiers.md) defines the stable document ID convention.
- [standards/](standards/) — Shared architecture and engineering standards.
- [controls/](controls/) — Reusable controls that can be referenced by multiple baselines.
- [baselines/](baselines/) — App-type baseline profiles that compose controls for assessment.
- [schemas/](schemas/) — Shared architecture schema contracts for standards, patterns, controls, baselines, decisions, and review evidence shapes.
- [patterns/](patterns/) — Reusable implementation and design patterns.
- [patterns/full-stack/](patterns/full-stack/) — Cross-layer feature-delivery
  and dependency-substitution patterns.
- [patterns/design/](patterns/design/) — UI structure and page-pattern guidance.
- [architecture/](architecture/) — Architecture notes, diagrams, and decision guidance.
- [templates/](templates/) — Reusable templates for standards, patterns, architecture decisions, design reviews, and verification notes.

Schema-backed standards are described in
[architecture/schema-backed-standards.md](architecture/schema-backed-standards.md).
Use [architecture/schema-selection.md](architecture/schema-selection.md) to
select standards, patterns, controls, baselines, and related schema contracts.
This repo owns shared schema contracts for standards, patterns, controls,
baselines, decisions, and architecture review evidence shapes.

`delorean_template` owns project-local Delorean process schemas under
`delorean/schemas`, prompt and agent wiring, evidence bundles, gates, waiver
records, handoff and re-entry records, and local validation scripts.

Project repos may use both: generated `architecture_docs` for shared standards
and schema contracts, and `delorean/schemas` for local Delorean process
contracts.

The docs in this repo should stay reusable across projects. Put project-specific implementation details, generated outputs, and environment-specific evidence in the project repo that owns them.

## Optional validation

Run this lightweight check after editing catalogs or schema contracts:

```sh
python scripts/check-catalog-links.py
```

It checks catalog links and basic schema metadata. It does not prove that all
standards are followed.
