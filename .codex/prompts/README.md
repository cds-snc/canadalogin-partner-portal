# Codex Prompt Adapters

<!-- delorean-template:codex-generated from agent-configs/vscode/prompts/*.prompt.md; run scripts/delorean/sync-codex-adapters.sh --write -->

These Codex prompt adapters are generated from the VS Code prompt catalog. Edit the VS Code source files under `agent-configs/vscode/prompts/`, then run `scripts/delorean/sync-codex-adapters.sh --write`.

Use a prompt by asking Codex to follow the file, for example `Follow .codex/prompts/dl-dev-continue.md`. When Codex subagent tooling is available, pair the prompt with the recommended role in `.codex/agents/`; otherwise, read the role file and run the prompt in the current session.

## Prompt Catalog

| Prompt | Recommended role | Purpose |
|---|---|---|
| [dl-delivery-autopilot.md](dl-delivery-autopilot.md) | [Coordinator](../agents/coordinator.md) | Orchestrate planning, implementation, QA, and review across active OpenSpec changes until blocked, complete, or limits are reached. |
| [dl-dev-active-change.md](dl-dev-active-change.md) | [Coordinator](../agents/coordinator.md) | Continue ready implementation slices for one active change until blocked, complete, or the slice limit is reached. |
| [dl-dev-autopilot.md](dl-dev-autopilot.md) | [Coordinator](../agents/coordinator.md) | Scan active OpenSpec changes and continue ready local slices across the queue until blocked, complete, or limits are reached. |
| [dl-dev-change-api.md](dl-dev-change-api.md) | [Coordinator](../agents/coordinator.md) | Change an API or contract with compatibility, tests, and evidence. |
| [dl-dev-change-data.md](dl-dev-change-data.md) | [Coordinator](../agents/coordinator.md) | Change schema, migration, retention, backfill, or data lifecycle behavior. |
| [dl-dev-continue.md](dl-dev-continue.md) | [Coordinator](../agents/coordinator.md) | Continue the next safe task from an active Delorean/OpenSpec change. |
| [dl-dev-fix-bug.md](dl-dev-fix-bug.md) | [Builder General](../agents/builder-general.md) | Investigate a defect or failure and plan a traceable remediation. |
| [dl-docs-update.md](dl-docs-update.md) | [Coordinator](../agents/coordinator.md) | Update docs, standards, ADRs, OpenSpec artifacts, or local knowledge with traceability. |
| [dl-ops-hotfix.md](dl-ops-hotfix.md) | [Coordinator](../agents/coordinator.md) | Handle urgent containment, rollback, or hotfix work with evidence and approval boundaries intact. |
| [dl-plan-feature.md](dl-plan-feature.md) | [Coordinator](../agents/coordinator.md) | Deliver a scoped feature with OpenSpec tasks, tests, evidence, and handoff. |
| [dl-plan-refine.md](dl-plan-refine.md) | [Delivery Planner](../agents/delivery-planner.md) | Refine the technical design, slice plan, impacted artifacts, blockers, and design handoff for a Delorean change. |
| [dl-platform-update.md](dl-platform-update.md) | [Coordinator](../agents/coordinator.md) | Change local agents, skills, prompts, workflows, hooks, policy logic, or Evidence Bundle definitions safely. |
| [dl-qa-check.md](dl-qa-check.md) | [QA Support](../agents/qa-support.md) | Run a local quality loop before review or handoff. |
| [dl-qa-commit-ready.md](dl-qa-commit-ready.md) | [QA Support](../agents/qa-support.md) | Check staged changes, hook readiness, and commit-message readiness before committing. |
| [dl-qa-push-ready.md](dl-qa-push-ready.md) | [QA Support](../agents/qa-support.md) | Run pre-push readiness checks and confirm the branch is safe to push. |
| [dl-qa-review.md](dl-qa-review.md) | [QA Support](../agents/qa-support.md) | Review the whole scoped change across code, docs, specs, tests, standards, and evidence. |
| [dl-requirements-answer-questions.md](dl-requirements-answer-questions.md) | [Spec Author](../agents/spec-author.md) | List OpenSpec open questions, resolve answerable ones from repo context, and collect human decisions through a focused conversation. |
| [dl-requirements-archive.md](dl-requirements-archive.md) | [Release Readiness](../agents/release-readiness.md) | Archive a completed OpenSpec change into current specs after verification. |
| [dl-requirements-refine.md](dl-requirements-refine.md) | [Spec Author](../agents/spec-author.md) | Refine OpenSpec specs or active changes for requirements, scenarios, slices, tasks, validation, and handoff clarity. |
| [dl-requirements-shape.md](dl-requirements-shape.md) | [Spec Author](../agents/spec-author.md) | Clarify intent and decide whether work is ready for design, specification, or delivery planning. |
| [dl-requirements-start.md](dl-requirements-start.md) | [Spec Author](../agents/spec-author.md) | Start an active OpenSpec change package from a rough brief, requirements note, issue, or pasted discovery notes. |
| [dl-security-review.md](dl-security-review.md) | [QA Support](../agents/qa-support.md) | Review and remediate security or privacy risk before release. |
| [dl-ui-build-page.md](dl-ui-build-page.md) | [Coordinator](../agents/coordinator.md) | Build user-facing page, layout, form, or navigation work from an approved page pattern. |
| [dl-ui-refine.md](dl-ui-refine.md) | [Builder General](../agents/builder-general.md) | Refine or repair user-facing UI, page pattern decisions, route structure, GC Design System alignment, accessibility, bilingual behaviour, and UI evidence. |
| [dl-ui-review-accessibility.md](dl-ui-review-accessibility.md) | [QA Support](../agents/qa-support.md) | Review and remediate accessibility risk for user-facing changes. |

## Adapter Rules

- Do not edit these generated Codex adapters directly in the template.
- Do not add VS Code frontmatter or VS Code-specific tool names.
- Use `../agents/*.md` for Codex role links and `../../.agents/skills/*/SKILL.md` for generated skill links.
