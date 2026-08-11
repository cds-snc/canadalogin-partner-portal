# Fix Bug

<!-- delorean-template:codex-generated from agent-configs/vscode/prompts/dl-dev-fix-bug.prompt.md; run scripts/delorean/sync-codex-adapters.sh --write -->

Codex prompt adapter generated from `agent-configs/vscode/prompts/dl-dev-fix-bug.prompt.md`.

Recommended role: [Builder General](../agents/builder-general.md). When Codex subagent tooling is available, invoke that role with this prompt. If it is unavailable, read the role file and follow this prompt in the current session.


## Purpose

Investigate a defect, failure, or incident follow-up and plan a traceable remediation.

## Use when

- Something is broken, flaky, unsafe, slow, or unclear.
- A test, workflow, user path, API, UI, or operational path needs diagnosis.
- A fix needs evidence that the problem is understood and addressed.

## Required inputs

- What failed or behaved unexpectedly.
- Steps to reproduce, logs, screenshots, traces, or examples.
- Expected behavior.
- Known affected users, systems, or environments.
- OpenSpec lifecycle state and active change ID or current spec reference when relevant.
- Whether the user is asking for bug-fix implementation only or explicit
  OpenSpec archive follow-through.
- Whether the defect is a technical bug against an existing requirement, a
  requirement bug, or a missing scenario discovered through testing.
- Permission profile, file scope, tools, APIs, MCP servers, sensitive-data handling, and audit expectations when relevant.
- Any required approval, evidence, or follow-up expectations.

## Route

- Check [docs/repo-guidance/where-things-go.md](../../docs/repo-guidance/where-things-go.md) for repo context.
- Check `docs/reference/` for task-specific reference.
- Use `tests/` to add or update checks where useful.
- Use TPL-006: ADR Template if the fix requires a durable decision.
- Use [docs/templates/evidence-bundle-template.md](../../docs/templates/evidence-bundle-template.md) to capture proof of remediation.
- Use [docs/reference/openspec-lifecycle.md](../../docs/reference/openspec-lifecycle.md) when remediation changes expected behavior or verifies an active OpenSpec change.
- At Level 2, keep OpenSpec requirements and scenarios current: add or update
  an active change when the fix changes expected behavior or reveals a missing
  scenario; reference the current spec when it already describes the expected
  behavior.
- During bug-fix implementation, keep proposed functional changes under
  `openspec/changes/<change-id>/`. Do not move or copy active deltas into
  `openspec/specs/**`; current specs update only through explicit
  `dl-requirements-archive` follow-through or a recorded intentional sync
  outside the implementation loop.
- If the user asks to archive, complete, promote, move a change spec, or move
  a spec into current specs, switch to `dl-requirements-archive` after
  confirming implementation and verification are complete.
- Use [docs/repo-guidance/control-boundaries.md](../../docs/repo-guidance/control-boundaries.md) before accessing logs, sensitive data, APIs, MCP servers, environments, or privileged tools.
- Use STD-017: Government of Canada Standards Review when the defect affects Government of Canada standards.
- Route implementation fixes to [.codex/agents/builder-general.md](../agents/builder-general.md), including frontend UI, GC Design System, accessibility, or bilingual content fixes. Builder General should use the relevant UI and standards skills inside the implementation loop.

## Expected outputs

- Problem summary and likely cause.
- Remediation plan or patch scope.
- OpenSpec lifecycle state and control boundary summary when relevant.
- Current spec or active OpenSpec delta expectation for the bug path.
- Current-spec promotion status: not performed, intentionally deferred, or
  routed to `dl-requirements-archive`.
- Verification steps and evidence to collect.
- Links to issue, logs, tests, decisions, and evidence.

## Guardrails

- Do not hide uncertainty; record unknowns and assumptions.
- Do not remove evidence, traceability, or approval steps to make the fix look simpler.
- Do not broaden file, API/MCP, environment, log, or sensitive-data access without an explicit control boundary.
- Keep remediation scoped to the problem unless a broader change is explicitly justified.
- Do not run `openspec archive`, use `--skip-specs`, hand-move a change folder
  to archive, or copy active change specs into `openspec/specs/**` from this
  bug-fix prompt.
- Do not call an active functional OpenSpec change complete when current spec
  promotion is still required; record archive as deferred or route to
  `dl-requirements-archive`.
- Link to `architecture_docs/` when reusable architecture guidance is relevant.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
