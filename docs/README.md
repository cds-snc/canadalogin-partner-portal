# Partner Portal Documentation

This folder contains solution-owned product, architecture, design, and delivery
documentation for the CanadaLogin Partner Portal.

## Start Here

- [Solution architecture](architecture/README.md) describes the current
  codebase and durable cross-cutting decisions.
- [Development conventions](repo-guidance/development-conventions.md) contains
  repository-specific implementation and verification guidance.
- [Planning material](plans/) contains product, MVP, infrastructure, and
  historical design inputs. Planning documents are not automatically the
  current implementation source of truth.

## Delorean Document Boundary

When Delorean is added, reusable generated standards, patterns, controls,
baselines, and templates belong in `architecture_docs/`. That directory may be
refreshed from Delorean.

Solution-specific architecture notes and ADRs remain under
`docs/architecture/`. Product behaviour and proposed functional changes belong
in OpenSpec once its solution folders are materialized.
