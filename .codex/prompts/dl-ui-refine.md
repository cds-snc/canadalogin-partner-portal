# DL Refine UI

<!-- delorean-template:codex-generated from agent-configs/vscode/prompts/dl-ui-refine.prompt.md; run scripts/delorean/sync-codex-adapters.sh --write -->

Codex prompt adapter generated from `agent-configs/vscode/prompts/dl-ui-refine.prompt.md`.

Recommended role: [Builder General](../agents/builder-general.md). When Codex subagent tooling is available, invoke that role with this prompt. If it is unavailable, read the role file and follow this prompt in the current session.


## Purpose

Refine user-facing UI work without starting from scratch.

## Use when

- The UI is not aligned with the intended page pattern.
- The route or page structure is unclear.
- The shared menu or Home path is wrong.
- GC Design System components were missed.
- Accessibility or bilingual issues need repair.
- A UI page was implemented but needs review or fixes.
- UI evidence is missing.

## Required inputs

- Change ID, route, page, issue, scenario, or task.
- What feels wrong or incomplete.
- Current UI files or screenshots when available.
- Page pattern decision when available.
- Accessibility, bilingual, design-system, or review findings when available.

## Mode

Use one:

- `select-page-pattern`
- `refine-ui-design`
- `fix-ui-implementation`
- `review-ui`
- `prepare-ui-evidence`
- `fix-accessibility`
- `fix-bilingual`
- `continue-ui-task`

If no mode is provided, infer the safest mode from the request and state it.

## Route

1. The assigned agent applies [delorean/config.yaml](../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
2. Read active OpenSpec and change-state when available and in scope.
3. Use `.agents/skills/delorean-ui/SKILL.md`.
4. Use `select-ui-page-pattern` when page structure or route design is affected.
5. Use `review-gc-design-system-alignment` when implemented UI needs review.
6. Use targeted `gc-review-*` skills when accessibility, bilingual, branding, security, IAM, or IM issues apply.
7. Update `tasks.md`, change-state, and evidence inputs when relevant and in scope. Use `delorean-evidence` only when evidence inputs need to be assembled into an Evidence Bundle.

## Expected output

- Change-state path when in scope:
- Current Delorean phase when in scope:
- Mode:
- Page or route:
- UI issue fixed or refined:
- Page pattern decision status:
- Route map:
- Shared menu update:
- GC Design System component mapping:
- Accessibility status:
- Bilingual status:
- Files changed:
- Tasks updated:
- Gates updated when in scope:
- Evidence inputs needed:
- Next recommended UI task:

## Guardrails

- Do not implement page structure changes without a page pattern decision.
- Do not replace fitting GC Design System components with raw HTML unless an exception is recorded.
- Do not rely on breadcrumbs, direct URLs, or browser history as the main task path.
- Do not invent approval for custom UI exceptions.
