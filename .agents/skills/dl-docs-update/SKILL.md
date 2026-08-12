---
name: dl-docs-update
description: "Update docs, standards, ADRs, OpenSpec artifacts, or local knowledge with traceability."
---

# Update Docs

## Recommended role

Delegate to the `coordinator` custom agent from
`.codex/agents/coordinator.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Update local knowledge while preserving source-of-truth ownership, links, and downstream agent or skill references.

## Use when

- Docs, standards, ADRs, OpenSpec artifacts, examples, templates, or references need to change.
- Humans are being asked to read too much and docs need consolidation or clearer audience routing.
- A local knowledge change may affect prompts, agents, skills, workflows, tests, or evidence.

## Required inputs

- What knowledge is wrong, missing, stale, duplicated, or unclear.
- Source request, issue, core guidance, official reference, or reviewer feedback.
- Affected docs, standards, templates, agents, skills, prompts, examples, or update scripts.
- OpenSpec lifecycle or control-boundary behavior affected by the knowledge update, if any.
- Expected reviewer or owner for the knowledge change.

## Route

- Route through [.codex/agents/coordinator.toml](../../../.codex/agents/coordinator.toml).
- Use [docs/repo-guidance/docs-audience.md](../../../docs/repo-guidance/docs-audience.md) when moving or consolidating Markdown.
- Use [docs/repo-guidance/ownership-and-updates.md](../../../docs/repo-guidance/ownership-and-updates.md) to confirm ownership and refresh model.
- Use [.codex/agents/spec-author.toml](../../../.codex/agents/spec-author.toml) when OpenSpec behavior or design readiness changes.
- Use `$dl-platform-update` when the change modifies agents, skills, prompts, workflows, hooks, policy logic, or Evidence Bundle contracts.
- Use [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md) and [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md) when those guidance areas are affected.

## Expected outputs

- Updated or proposed docs/knowledge change with affected links named.
- OpenSpec lifecycle and control-boundary impact notes when relevant.
- Impacted agents, skills, prompts, workflows, tests, or evidence references.
- Reviewer or owner notes and remaining open questions.
- Verification notes, including link checks or local checks when useful.

## Guardrails

- Do not copy large Delorean core or `delorean_architecture` source documents
  into this repo.
- Keep local docs thin and practical.
- Update related references when paths, standards, prompts, agents, skills, hooks, workflows, templates, or evidence paths change.
- Do not change lifecycle, permission, API/MCP, sensitive-data, or audit expectations without updating the owning guidance and affected agents/skills.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
