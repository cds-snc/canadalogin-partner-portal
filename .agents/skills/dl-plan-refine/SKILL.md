---
name: dl-plan-refine
description: "Refine the technical design, slice plan, impacted artifacts, blockers, and design handoff for a Delorean change."
---

# DL Refine Design

## Recommended role

Delegate to the `delivery-planner` custom agent from
`.codex/agents/delivery-planner.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Refine the design for a change so implementation and verification have a clear path.

## Use when

- `design.md` is too thin.
- The agent is guessing the architecture.
- The next implementation slice is unclear.
- UI, API, data, security, accessibility, or operations impacts are not mapped.
- An ADR or design package may be needed.
- Verification found a design gap.

## Required inputs

- Change ID or OpenSpec path.
- What feels wrong or unclear.
- Known constraints.
- Impacted UI, API, data, security, accessibility, operations, tests, docs, contracts, or evidence.
- Current implementation status if work has already started.

## Route

1. Read the active OpenSpec package.
2. The assigned agent applies [delorean/config.yaml](../../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
3. Read `change-state.yaml` when it exists and change-state is in scope.
4. Use `.agents/skills/delorean-question-resolution/SKILL.md` before asking broad design questions or declaring blockers that may be resolved from repo guidance, OpenSpec, architecture docs, code, tests, contracts, or approved docs.
5. Use `.agents/skills/delorean-design/SKILL.md`.
6. Use `.agents/skills/delorean-openspec/SKILL.md` when requirements, scenarios, or slices also need repair.
7. Use `.agents/skills/delorean-ui/SKILL.md` when the design affects user-facing UI.
8. Update `design.md`, `tasks.md`, and change-state only when each artifact is in scope.

## Expected output

- Change-state path when in scope:
- Current Delorean phase when in scope:
- OpenSpec lifecycle state:
- Design issue fixed:
- Design files changed:
- Slice plan:
- Impacted artifacts:
- ADR needed:
- Resolved questions and human decisions required:
- Tasks updated:
- Gates updated when in scope:
- Blockers:
- Next recommended task:

## Guardrails

- Do not put code-level design detail in OpenSpec requirements.
- Do not start implementation when design blockers remain.
- Do not treat best practice as a requirement unless it is backed by a standard, existing repo convention, OpenSpec artifact, or explicit human decision.
- Do not leave human-only decisions only in chat; record them as open questions in `design.md` or `tasks.md` when an OpenSpec change is in scope.
- Do not create ADRs for temporary or minor choices.
- Do not approve waivers, risk acceptance, production actions, or release readiness.
