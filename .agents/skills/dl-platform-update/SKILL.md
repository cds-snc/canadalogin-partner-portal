---
name: dl-platform-update
description: "Change local agents, skills, prompts, workflows, hooks, policy logic, or Evidence Bundle definitions safely."
---

# Update Platform

## Recommended role

Delegate to the `coordinator` custom agent from
`.codex/agents/coordinator.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Change local Delorean execution or orchestration assets without weakening phase gates, evidence packaging, or approval boundaries.

## Use when

- Work changes `.codex/agents/`, `.agents/skills/`, hooks, workflow scripts, MCP tool access guidance, template update scripts, standards routing, or Evidence Bundle definitions.
- A template-owned behavior needs rollout or migration notes for solution repos.
- A reviewer asks for alignment with Delorean architecture.

## Required inputs

- What platform definition is changing and why.
- Affected files, agents, skills, prompts, hooks, workflows, standards, templates, or docs.
- Expected routing, handoff, evidence, or approval behavior after the change.
- OpenSpec lifecycle behavior if the change touches OpenSpec authoring, validation, archive, or CI behavior.
- Control-boundary behavior if the change touches agents, tools, APIs, MCP servers, permissions, file scopes, sensitive data, environments, audit, or evidence storage.
- Testing, validation, migration, or rollout expectations.

## Route

- Route through [.codex/agents/coordinator.toml](../../../.codex/agents/coordinator.toml).
- Treat local agent and skill files as artifacts under review, not binding instructions for the agent doing the maintenance work.
- Use [.codex/agents/delivery-planner.toml](../../../.codex/agents/delivery-planner.toml) to plan affected artifacts, validation, rollout, and migration notes.
- Use [.agents/skills/delorean-review/SKILL.md](../../../.agents/skills/delorean-review/SKILL.md) before handoff to check conformance and impacted artifacts.
- Use [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md) and [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md) when the platform definition affects lifecycle, permissions, or security controls.

## Expected outputs

- Plan for affected agents, skills, prompts, hooks, workflows, standards, templates, and update scripts.
- OpenSpec lifecycle and control-boundary impact notes when relevant.
- Implemented or proposed platform-definition change.
- Validation results, skipped checks, and residual risks.
- Migration or rollout notes when solution repos need to adopt the change.

## Guardrails

- Do not silently change approval, waiver, Evidence Bundle, or release-readiness contracts.
- Keep prompts thin, keep skills level-agnostic, and put adoption-level decisions in agents.
- Do not make CI or agents apply, sync, archive, or commit OpenSpec changes invisibly.
- Do not expand API/MCP/tool/file/sensitive-data access without an explicit control-boundary update and owner review.
- Do not duplicate skill procedures in agent files or prompt wrappers.
- Keep prompt entrypoints thin and route detailed procedures through skills and agents.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
