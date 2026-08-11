# DL Refine OpenSpec

<!-- delorean-template:codex-generated from agent-configs/vscode/prompts/dl-requirements-refine.prompt.md; run scripts/delorean/sync-codex-adapters.sh --write -->

Codex prompt adapter generated from `agent-configs/vscode/prompts/dl-requirements-refine.prompt.md`.

Recommended role: [Spec Author](../agents/spec-author.md). When Codex subagent tooling is available, invoke that role with this prompt. If it is unavailable, read the role file and follow this prompt in the current session.


## Purpose

Refine OpenSpec current specs or active changes so requirements, scenarios, slices, tasks, validation status, and handoff state are clear.

Use OpenSpec for expected behaviour and tasks. When the assigned agent determines Delorean process artifacts are in scope, use Delorean change-state for current phase, gates, blockers, evidence links, approval or waiver status, and re-entry.

Use `dl-requirements-answer-questions` instead when the main task is to list
existing OpenSpec open questions and collect the human decisions needed to
answer them.

Use `dl-requirements-archive` instead when the main task is to archive a
completed change into current specs after implementation and verification.

## Modes

Choose one mode and state it in the output:

```text
mode:
- clarify-spec
- expand-requirements
- add-scenarios
- split-slices
- fix-slices
- fix-validation
- prepare-implementation
- prepare-verification
- prepare-archive
- pick-next-task
```

- `clarify-spec`
- `expand-requirements`
- `add-scenarios`
- `split-slices`
- `fix-slices`
- `fix-validation`
- `prepare-implementation`
- `prepare-verification`
- `prepare-archive`
- `pick-next-task`

## Required inputs

- OpenSpec spec path, change ID, capability, issue, source request, or scenario.
- Mode, if the user named one.
- Refinement goal in plain language.
- Known acceptance criteria and impacted capabilities.
- Existing design notes, tests, evidence, implementation notes, or validation errors when available.

## Route

1. Use [.agents/skills/delorean-openspec/SKILL.md](../../.agents/skills/delorean-openspec/SKILL.md).
2. Use [.agents/skills/delorean-question-resolution/SKILL.md](../../.agents/skills/delorean-question-resolution/SKILL.md) when unclear requirements, scenarios, slices, validation, design, standards, or evidence questions may be answered from repo guidance, OpenSpec, architecture docs, code, tests, contracts, or approved docs before asking the user.
3. Read [docs/repo-guidance/openspec-and-delorean.md](../../docs/repo-guidance/openspec-and-delorean.md).
4. Read [docs/reference/openspec-lifecycle.md](../../docs/reference/openspec-lifecycle.md).
5. The assigned agent applies [delorean/config.yaml](../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
6. Read `delorean/evidence/<change-id>/change-state.yaml` and [delorean/gates/gate-catalog.yaml](../../delorean/gates/gate-catalog.yaml) when they exist and are in scope.
7. Use STD-002: Work Contexts and assume local developer / localhost when no environment is named.
8. Keep OpenSpec close to its normal shape:
   - requirements and scenarios stay in `spec.md`
   - proposal stays in `proposal.md`
   - design notes and slice plans stay in `design.md`
   - implementation, review, verification, evidence, and archive-readiness checklists stay in `tasks.md`
9. Treat slices as Delorean planning units inside `design.md` and `tasks.md`; do not create a new OpenSpec folder structure for slices.
10. Do not copy OpenSpec requirement text into change-state. Link to OpenSpec paths instead.
11. Do not archive active changes during refinement unless the user explicitly asks for developer-readiness or release-readiness archive and verification is complete. Prefer `dl-requirements-archive` when the immediate goal is archive follow-through.

## Mode guidance

### clarify-spec

Tighten vague requirements or scenarios so the behaviour is testable.

### expand-requirements

Add missing behavioural requirements to `spec.md` without adding implementation detail.

### add-scenarios

Add clear GIVEN / WHEN / THEN scenarios for the main path and important edge cases.

Use this mode for Level 2 bug fixes when the existing current spec describes
the requirement but did not capture the failing path as a scenario.

### split-slices

Break a broad change into small implementation slices in `design.md` and matching checklist items in `tasks.md`.

### fix-slices

Repair slices that are too broad, too vague, missing verification, or not tied to requirements or scenarios.

### fix-validation

Use the validation errors to update only the affected OpenSpec files.

### prepare-implementation

Confirm the next local-first implementation slice, required tasks, configured gate expectations, and blockers.

### prepare-verification

Confirm validation, review, test, evidence, and skipped-check tasks.

### prepare-archive

Confirm implementation and verification are complete before archive. Do not archive unless developer-readiness or release-readiness archive is explicitly requested.

For Level 2 functional changes, also confirm the archived result will keep
`openspec/specs/` accurate before the work is treated as developer-ready or
merge-ready.

When preparing a delta that adds scenarios to an existing requirement, do not
write a partial `## MODIFIED Requirements` body. OpenSpec archive replaces the
modified requirement body, so preserve existing scenarios by carrying forward
the full target requirement with the scenarios that should remain plus the new
or changed scenarios.

### pick-next-task

Read `tasks.md` and change-state when in scope, then recommend the next small task that can move the change forward.

## Expected output

```text
Expected output:
- Change-state path when in scope:
- OpenSpec change path:
- Mode used:
- Lifecycle state:
- Current Delorean phase when in scope:
- Requirement changes:
- Scenario changes:
- Slice changes:
- Task changes:
- Resolved questions and human decisions required:
- Gate changes when in scope:
- Validation result or skipped reason:
- Ready for next phase:
- Next recommended task:
```

## Guardrails

- OpenSpec is not a substitute for tests, evidence, approvals, waivers, or release readiness.
- Do not move active OpenSpec deltas into `openspec/specs/` before implementation and verification are complete.
- Do not create slice folders or a custom OpenSpec structure for slices.
- Do not mark gates as passed unless evidence exists.
- Do not mark approval, waiver, risk acceptance, production action, sensitive-data access, or release readiness as approved on behalf of a human.
- Do not treat best practice as a requirement unless it is backed by a standard, existing repo convention, OpenSpec artifact, or explicit human decision.
- Do not leave human-only decisions only in chat; record them as open questions in the relevant OpenSpec or design artifacts.
- Use local-safe assumptions when possible, but stop before production, real secrets, real data, external systems, destructive changes, approval, waivers, or wider permission boundaries.
