---
name: dl-requirements-shape
description: "Clarify intent and decide whether work is ready for design, specification, or delivery planning."
---

# Shape Idea

## Recommended role

Delegate to the `spec-author` custom agent from
`.codex/agents/spec-author.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Clarify the intent of a proposed change and decide whether it is ready for design, specification, or delivery planning.

Use `dl-requirements-start` when the user provides rough requirements and wants the first active OpenSpec change package created. Use `dl-requirements-answer-questions` when an existing OpenSpec package already has open questions that need human feedback.

## Use when

- A team has an idea, request, or problem statement.
- The scope is not clear enough for implementation.
- The next step may be an OpenSpec spec, OpenSpec change, design package, ADR, or backlog item.
- The work needs product framing before an active OpenSpec package should be created.

## Required inputs

- Short problem or opportunity statement.
- Known users, systems, or teams affected.
- Current links, notes, or evidence.
- OpenSpec lifecycle state when OpenSpec is already in scope.
- Permission profile, tool/API/MCP access, file scope, sensitive-data handling, and audit expectations when relevant.
- Any known approval, evidence, or traceability requirements.

## Route

- Read [README.md](../../../README.md) and [docs/repo-guidance/where-things-go.md](../../../docs/repo-guidance/where-things-go.md).
- Use `openspec/specs/` for current functional requirements and scenarios.
- Use `openspec/changes/<change-id>/` for proposed functional changes.
- Use [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md) when creating or updating an active OpenSpec change.
- The Spec Author applies [delorean/config.yaml](../../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
- Use [.agents/skills/delorean-question-resolution/SKILL.md](../../../.agents/skills/delorean-question-resolution/SKILL.md) before asking broad clarification questions. Resolve facts from repo guidance, OpenSpec, `architecture_docs`, existing code, tests, contracts, and approved docs; keep true human decisions as OpenSpec or design open questions.
- When change-state is in scope for a meaningful active OpenSpec change, create or update `delorean/evidence/<change-id>/change-state.yaml`.
- When gate tracking is in scope, use [delorean/gates/gate-catalog.yaml](../../../delorean/gates/gate-catalog.yaml) for gate definitions. Do not mark gates as `pass` unless evidence exists.
- Use [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md) when intent or design implies new API, MCP, tool, file-scope, environment, permission, or sensitive-data access.
- Use [docs/templates/openspec-template.md](../../../docs/templates/openspec-template.md) if an OpenSpec `spec.md` helper is needed.
- Use [docs/templates/design-package-template.md](../../../docs/templates/design-package-template.md) if a design package is needed.
- Use STD-017: Government of Canada Standards Review to decide which Government of Canada standards must shape the design.
- Use TPL-006: ADR Template if a durable decision is needed.
- Link to Delorean core for operating model guidance and `architecture_docs/`
  for reusable architecture guidance.

## Expected outputs

- A short intent summary.
- OpenSpec lifecycle state when relevant.
- Change-state path when a meaningful active change is in scope and change-state is required.
- Current Delorean phase when in scope.
- Applicable gates/checks and gate summary when in scope.
- Control boundary summary when relevant.
- Resolved questions, safe assumptions, and human decisions required when question resolution is used.
- Evidence Bundle path when `delorean-evidence` is invoked.
- Approval or waiver status when relevant.
- Re-entry phase and reason code when blocked and in scope.
- Recommended next document or work path.
- Open questions and blockers.
- Traceability links to source notes, issues, or evidence.

## Guardrails

- Do not treat unclear intent as delivery-ready.
- Do not use this skill as the normal path for creating the first active OpenSpec package from a usable brief; route that work to `dl-requirements-start`.
- Do not update current specs from proposed intent alone; keep proposed changes under `openspec/changes/<change-id>/`.
- Do not copy OpenSpec requirement text into `change-state.yaml`; link back to OpenSpec.
- Do not leave permission, API/MCP, file-scope, sensitive-data, or audit assumptions implicit.
- Do not treat best practice as a requirement unless it is backed by a standard, existing repo convention, OpenSpec artifact, or explicit human decision.
- Do not leave unresolved human decisions only in chat; record them in `proposal.md`, `design.md`, or `tasks.md` when an OpenSpec change is in scope.
- Do not change approval, evidence, or traceability expectations without making the change explicit.
- Keep local outputs small and link to source-of-truth guidance.
- In a copied solution repo, create or update solution-specific OpenSpec, docs, tests, contracts, and evidence when they are the right next artifact.
- Avoid solution-specific content only when explicitly maintaining the upstream template baseline.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
