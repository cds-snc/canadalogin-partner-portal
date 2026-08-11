# Deliver Feature

<!-- delorean-template:codex-generated from agent-configs/vscode/prompts/dl-plan-feature.prompt.md; run scripts/delorean/sync-codex-adapters.sh --write -->

Codex prompt adapter generated from `agent-configs/vscode/prompts/dl-plan-feature.prompt.md`.

Recommended role: [Coordinator](../agents/coordinator.md). When Codex subagent tooling is available, invoke that role with this prompt. If it is unavailable, read the role file and follow this prompt in the current session.


## Purpose

Deliver feature work from a clear scope, known constraints, and traceable inputs.

## Use when

- A feature or change has enough shape to plan implementation.
- The team needs to identify docs, tests, contracts, and evidence to update.
- The work may affect API, UI, data, operations, or mixed areas.

## Required inputs

- Feature summary and goal.
- Source issue, OpenSpec change ID or scenario reference, spec, design package, or ADR.
- Expected user or system behavior.
- OpenSpec lifecycle state when OpenSpec is in scope.
- Permission profile, allowed file scope, tool/API/MCP access, sensitive-data handling, and audit expectations when relevant.
- Known risks, constraints, and review expectations.
- Any required evidence or approval path.

## Route

- Check [docs/repo-guidance/where-things-go.md](../../docs/repo-guidance/where-things-go.md) for local context.
- Use `openspec/specs/` for current functional requirements and scenarios.
- Use `openspec/changes/<change-id>/` for proposal, design, tasks, and spec deltas when planning or implementing a change.
- Put delivery sequencing, implementation tasks, and review or verification checklist items in active OpenSpec `tasks.md` by default.
- The Coordinator applies [delorean/config.yaml](../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
- When gate tracking is in scope, use [delorean/gates/gate-catalog.yaml](../../delorean/gates/gate-catalog.yaml) to list applicable gates/checks in the plan.
- When change-state is in scope, use `delorean/evidence/<change-id>/change-state.yaml` for current phase, gate/check status, control boundary status, evidence links, approval/waiver status, and re-entry. Do not use OpenSpec `tasks.md` as the only gate status record.
- When evidence packaging is in scope, use [.agents/skills/delorean-evidence/SKILL.md](../../.agents/skills/delorean-evidence/SKILL.md) to assemble or update the Evidence Bundle from existing evidence inputs.
- Use [docs/reference/openspec-lifecycle.md](../../docs/reference/openspec-lifecycle.md) to keep active changes in `openspec/changes/<change-id>/` until implementation and verification are complete.
- Use [docs/repo-guidance/control-boundaries.md](../../docs/repo-guidance/control-boundaries.md) before routing work to agents, skills, APIs, MCP servers, external tools, privileged commands, sensitive data, or generated evidence.
- Use [.agents/skills/delorean-question-resolution/SKILL.md](../../.agents/skills/delorean-question-resolution/SKILL.md) before asking broad planning questions or declaring blockers for design-readiness, standards impact, evidence needs, implementation-readiness, or affected artifacts that may be answerable from repo guidance, OpenSpec, architecture docs, code, tests, contracts, or approved docs.
- Use `openapi/` for API contracts when needed.
- Use STD-020: Database Persistence and PAT-012: Alembic PostgreSQL Change when relational persistence, models, repositories, migrations, seed data, or stored records are in scope.
- Use `tests/` for delivery checks.
- Use [docs/templates/evidence-bundle-template.md](../../docs/templates/evidence-bundle-template.md) to plan evidence.
- Use STD-017: Government of Canada Standards Review and TPL-003: Standards Impact Template when standards may apply.
- Use STD-019: Government of Canada Web Application Baseline Governance, BAS-001: Government of Canada Web Application Baseline, and TPL-011: GC Web Application Baseline Assessment Template when the work creates, changes, reviews, or releases a Government of Canada web application and affects UI, content, APIs, data, identity, security, privacy, information management, deployment, operations, or release evidence.
- Use `architecture_docs/baselines/catalog.yml` and `architecture_docs/controls/catalog.yml` to route baseline and `GC-WEB-*` control assessment.
- Route user-facing UI work through [dl-ui-build-page.md](dl-ui-build-page.md) before implementation when the work affects a new page, layout, navigation, form, multi-step flow, header, footer, menu, breadcrumb, or language toggle.
- For feature areas with multiple user goals, plan a service home or task hub that branches to separate routes instead of putting every workflow on one page.
- For new user-facing pages, plan the shared menu update in the same change so `Home` and the new page or parent task area are discoverable.
- Record primary task navigation paths before implementation. Do not rely on breadcrumbs, direct URLs, browser history, or unrelated pages as the main path to a task.
- Map visible and interactive UI needs to GC Design System components before implementation. Raw HTML buttons, form controls, textareas, labels, fieldsets, legends, links, alerts, headers, footers, and navigation need recorded custom UI exceptions.
- For bilingual routes or content, keep the language toggle in the approved header pattern and link to equivalent content in the other official language.
- Link to Delorean core for operating model guidance and `architecture_docs/`
  for reusable architecture standards, patterns, baselines, and controls.

## UI page routing

Use the UI page pattern flow before implementation when work touches:

- new user-facing pages
- layout changes
- navigation changes
- forms
- multi-step flows
- header changes
- footer changes
- menu changes
- breadcrumb changes
- language toggle changes

For those changes, record the page pattern decision first. Do not implement a user-facing page before the page pattern decision is recorded.

When there are multiple distinct tasks, the page pattern decision must name the entry page and destination routes. Do not create one page containing all forms, states, reports, and help content unless the decision records why the feature is genuinely one small task.

When creating a user-facing page, the implementation plan must update the shared navigation menu unless the decision records why the page is intentionally excluded from primary navigation. The menu should keep `Home` visible and link to the new page or its parent task area.

The page pattern decision must also name the navigation path from `Home` or service home to each primary task and the GC Design System component planned for each visible or interactive UI need.

## Expected outputs

- Planning summary with files or areas likely to change.
- Active OpenSpec `tasks.md` updates for implementation, review, and verification checklist items when an active change is in scope.
- OpenSpec lifecycle state, validation command, and archive expectation when relevant.
- Change-state path when in scope.
- Current Delorean phase when in scope.
- Applicable gates/checks when in scope.
- Gate summary when in scope.
- Control boundary summary when relevant.
- Resolved questions, safe assumptions, and human decisions required when question resolution is used.
- Baseline applicability, affected `GC-WEB-*` controls, and baseline assessment evidence needs when relevant.
- Test and evidence plan.
- Evidence Bundle path when `delorean-evidence` is invoked.
- Approval or waiver status when relevant.
- Re-entry phase and reason code when blocked and in scope.
- Standards impact block, including GC Design System component plan or custom UI exceptions when UI is affected.
- Baseline assessment summary, including deferred controls, exceptions, reference architecture relation, and ADR needs when BAS-001 applies.
- Page pattern decision, selected approved page pattern, approved template, required page shell, home page or service home, shared menu update, primary task navigation paths, GC component mapping, design-system check, screenshots, accessibility result, and exception list when user-facing UI is affected.
- Task branching or single-page rationale when user-facing UI has more than one user goal.
- Open questions and dependencies.
- Traceability links from work item to spec, decision, tests, and evidence.
- Implementation handoff status: `ready`, `waiting_for_confirmation`, or `blocked`.
- Builder handoff block for [.codex/agents/builder-general.md](../agents/builder-general.md) when implementation is ready or waiting only for user confirmation.

## Builder handoff block

When planning finishes, include this block in the final output:

```text
Implementation handoff status: <ready | waiting_for_confirmation | blocked>
Receiving agent: .codex/agents/builder-general.md

Builder handoff:
- Source request:
- Source change, issue, or OpenSpec path:
- Business rules or scenarios:
- First implementation slice:
- Likely impacted files or folders:
- Required docs, specs, contracts, tests, and evidence updates:
- OpenSpec lifecycle state and archive expectation:
- Control boundary, sensitive-data handling, and audit expectations:
- Standards impact and GC Design System component plan or custom UI exceptions:
- UI page pattern decision, approved template, page shell, and design-system check:
- Task branching or page route plan:
- Verification commands:
- Known risks or constraints:
- Open blockers:
```

If implementation is ready and the user has asked to continue into implementation, hand off to Builder General and start the first implementation slice. If implementation is waiting for confirmation, say exactly what confirmation is needed and name Builder General as the next route. If implementation is blocked, name the blocker and route back to the right phase.

## Automated handoff behavior

When this prompt runs through [.codex/agents/coordinator.md](../agents/coordinator.md) in Codex, prefer direct subagent delegation to [.codex/agents/builder-general.md](../agents/builder-general.md) when the implementation handoff status is `ready` and the user has asked to continue.

Use the visible `Build It` handoff as the fallback when the user should explicitly choose the next phase or when subagent orchestration is unavailable. Builder General should then run the implementation and testing loop, including relevant UI, API, data, tooling, or mixed checks, without requiring separate domain-specific implementation handoffs. Ask the user directly before handoff when confirmation, approval-sensitive decisions, evidence expectations, source-of-truth ownership, or blockers are unclear.

## Guardrails

- Do not start implementation from an untraceable request.
- Do not move active OpenSpec deltas into `openspec/specs/` before implementation and verification are complete.
- Do not copy OpenSpec requirement text into `change-state.yaml`; link back to OpenSpec.
- Do not route work outside the approved permission profile, file scope, API/MCP allowlists, or sensitive-data handling rules.
- Do not weaken existing review, approval, evidence, or traceability expectations.
- Do not implement a user-facing page from a blank custom layout unless a human approves an exception.
- Do not treat best practice as a requirement unless it is backed by a standard, existing repo convention, OpenSpec artifact, or explicit human decision.
- Do not leave unresolved human decisions only in chat; record them in `proposal.md`, `design.md`, or `tasks.md` when an OpenSpec change is in scope.
- Keep local wrappers thin; use `architecture_docs/` for reusable architecture
  guidance and Delorean core for operating model guidance.
- Keep the plan generic enough for API, UI, data, tooling, or mixed work.

## Missing Details And Safe Defaults

When details are missing, do not stop at broad questions. Recommend the safe local path first, list one or two alternatives when useful, and continue under local developer / localhost assumptions when safe. Ask only for details needed before shared-environment work, production work, real secrets, approval, waivers, deployment, destructive changes, or wider tool/API/MCP/file access.
