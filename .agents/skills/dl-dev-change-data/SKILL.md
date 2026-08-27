---
name: dl-dev-change-data
description: "Change schema, migration, retention, backfill, or data lifecycle behavior."
---

# Change Data

## Recommended role

Delegate to the `coordinator` custom agent from
`.codex/agents/coordinator.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Change data behavior with explicit sequencing, rollback, records, tests, and evidence expectations.

## Use when

- Work touches schemas, models, migrations, repositories, backfills, retention, disposition, deletion, or audit trails.
- Data lifecycle or information-management risk needs explicit review.
- A migration or data change may affect API behavior, privacy, operations, or rollback.

## Required inputs

- Data change summary and affected records, tables, models, or repositories.
- OpenSpec change, scenario, issue, ADR, or architecture note.
- Known data classification, retention expectations, rollback constraints, and operational risk.
- OpenSpec lifecycle state and active change ID or current spec reference when relevant.
- Permission profile, environment scope, data access, sensitive-data handling, and audit expectations.
- Existing migration, backup, test, or evidence inputs when available.

## Route

- Route through [.codex/agents/coordinator.toml](../../../.codex/agents/coordinator.toml).
- Use [.codex/agents/delivery-planner.toml](../../../.codex/agents/delivery-planner.toml) to produce sequencing, validation, rollback, and evidence plans.
- Use [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md) when migration behavior is tracked through an active OpenSpec change.
- The Coordinator applies [delorean/config.yaml](../../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
- Use [delorean/gates/gate-catalog.yaml](../../../delorean/gates/gate-catalog.yaml) and `delorean/evidence/<change-id>/change-state.yaml` when gate tracking or change-state is in scope for an active change.
- Use [.agents/skills/delorean-evidence/SKILL.md](../../../.agents/skills/delorean-evidence/SKILL.md) when data evidence inputs need to be assembled into an Evidence Bundle.
- Use [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md) before accessing sensitive data, environments, APIs, MCP servers, backups, or migration tooling.
- Use STD-020: Database Persistence when work adds or changes relational persistence, models, repositories, migrations, seed data, or stored business records.
- Use PAT-012: Alembic PostgreSQL Change when PostgreSQL schema changes or Alembic migrations are in scope.
- Use [.agents/skills/gc-review-im/SKILL.md](../../../.agents/skills/gc-review-im/SKILL.md) for information-management and records findings.
- Use [.agents/skills/gc-review-security/SKILL.md](../../../.agents/skills/gc-review-security/SKILL.md) when personal information, access control, logging, or trust boundaries are affected.

## Expected outputs

- Plan package with migration or data sequencing, rollback, and verification strategy.
- OpenSpec lifecycle state and archive expectation when relevant.
- Change-state path when in scope.
- Current Delorean phase when in scope.
- Applicable gates/checks when in scope.
- Gate summary when in scope.
- Control boundary summary, data classification, sensitive-data handling, and audit evidence needs.
- Impacted artifact map for OpenSpec, OpenAPI, docs, tests, records, and evidence.
- Database persistence checks, migration review needs, and seed-data or rollback expectations when relevant.
- Evidence Bundle path when `delorean-evidence` is invoked.
- Approval or waiver status when relevant.
- Re-entry phase and reason code when blocked and in scope.
- Remediation or implementation handoff when code or migration work is ready.
- Waiver, approval, or specialist-review needs when residual data risk remains.

## Guardrails

- Do not start irreversible data changes without explicit human approval.
- Do not access production or sensitive data without an approved control boundary.
- Do not treat hard deletion, retention, or records decisions as implementation-only details.
- Do not copy OpenSpec requirement text into `change-state.yaml`; link back to OpenSpec.
- Preserve traceability from scenario or requirement through migration tests and evidence.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
