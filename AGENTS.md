# CanadaLogin Partner Portal - Agent Guide

This file is intentionally thin. Durable project architecture and development
rules live in solution-owned documentation so they survive changes to agent
tooling, including Delorean materialization.

## Start Here

Before meaningful changes, read:

- [Repository overview](README.md)
- [Codebase architecture](docs/architecture/codebase.md)
- [Architecture decisions](docs/architecture/adrs/README.md)
- [Development conventions](docs/repo-guidance/development-conventions.md)

Accepted ADRs are binding project decisions. Proposed ADRs identify a direction
or unresolved choice and must not be treated as accepted implementation rules.

## Working Guidance

Use accepted ADRs first, then the current implementation, tests, and executable
configuration, followed by the codebase architecture and development
conventions.

The existing `.github/skills/backend-developer/` and
`.github/skills/frontend-developer/` material predates this documentation
migration. It remains legacy reference material until reconciled and is not a
durable source of truth.

## Document Ownership

- Keep solution-specific architecture notes and ADRs in `docs/architecture/`.
- Keep repository implementation and verification guidance in
  `docs/repo-guidance/`.
- Keep generated Delorean standards and patterns in `architecture_docs/` after
  materialization; do not add local decisions there.
- Keep product behaviour and proposed functional changes in OpenSpec after its
  solution folders are materialized.

Never commit secrets, credentials, tokens, or real `.env` files.
