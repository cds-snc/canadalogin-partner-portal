# Skills

This folder contains small local skill wrappers for common work in a solution repo.

Local skills help prompts and agents use this repo's structure consistently. They are starter wrappers, not the full Delorean core skill standard. They should point to local standards, templates, specs, tests, and evidence instead of embedding a whole operating model.

These skills should align with the Delorean phase model without owning the process level. They produce reusable task guidance, traceable findings, remediation guidance, OpenSpec lifecycle notes, control-boundary notes, verification inputs, and evidence inputs. They do not redefine approvals, waivers, risk acceptance, release readiness, or adoption-level requirements.

When work is about designing or improving these skill files, treat them as
artifacts under review. They are not automatically binding instructions for the
agent doing that maintenance work, and they may be incomplete while the
template is evolving. Follow the active system, developer, user, and any local
repo instruction file first.

## Folder Convention

Each local skill lives in its own folder:

```text
.agents/skills/<skill-name>/SKILL.md
.agents/skills/<skill-name>/references.md
```

Each `SKILL.md` starts with YAML front matter containing `name` and `description`.

Keep `SKILL.md` focused on the procedure and expected outputs. Put local docs, templates, repo folders, and external official references in `references.md`. Skills should load only the references that match the affected area instead of loading the whole docs tree.

## Skill Model

Delorean skills are grouped into four layers.

### 1. Phase skills

Phase skills support the main Delorean flow.

- `delorean-planning`
- `delorean-implementation`
- `delorean-testing`
- `delorean-review`

These skills should read or update OpenSpec, change-state, tasks, evidence, and gates only when those artifacts are in scope for the invoking agent or user request.

### 2. Focus skills

Focus skills help with a specific kind of work that may happen across phases.

Recommended focus skills:

- `delorean-question-resolution`: resolve spec, design, planning, standards, and evidence questions from repo guidance before asking humans. `$dl-requirements-answer-questions` is the user-facing workflow skill when OpenSpec open questions need a focused human-feedback loop.
- `delorean-openspec`: refine requirements, scenarios, slices, tasks, lifecycle state, OpenSpec validation readiness, and archive follow-through.
- `delorean-design`: refine technical approach, design gaps, design decisions, impacted artifacts, and slice sequencing.
- `delorean-ui`: refine user-facing UI, page pattern decisions, route structure, GC Design System component mapping, accessibility, bilingual behaviour, screenshots, and UI evidence.
- `delorean-evidence`: assemble or update the Evidence Bundle from verification results, findings, traceability, skipped checks, and release-readiness inputs when evidence packaging is in scope.
- `aws-topology-diagrams`: create or refine AWS topology and deployment architecture diagrams with clear account, region, VPC, subnet, service, identity, and external-system boundaries.
- `c4-architecture-diagrams`: create or refine C4 context, container, component, deployment, dynamic, and sequence diagrams without overloading one diagram.

### 3. Codex workflow skills

Codex workflow skills are discoverable entrypoints for repeatable Delorean work.
They preserve the cross-tool `dl-*` workflow names while using the repository
skill location Codex scans automatically.

- `dl-requirements-*`: shape, start, refine, answer questions, and archive
  OpenSpec work.
- `dl-plan-*` and `dl-delivery-autopilot`: refine designs and orchestrate
  delivery.
- `dl-dev-*`: continue active changes, work queues, fix bugs, and change API
  or data behavior.
- `dl-ui-*`: build, refine, and review user-facing work.
- `dl-qa-*`: verify, review, and check commit or push readiness.
- `dl-docs-update`, `dl-platform-update`, `dl-security-review`, and
  `dl-ops-hotfix`: handle targeted cross-cutting work.

Invoke a workflow explicitly with its skill name, such as
`$dl-dev-continue`. Each workflow skill records a recommended custom agent
under `.codex/agents/`.

### 4. Standards overlay skills

Standards overlay skills check a specific Government of Canada or delivery concern.

- [.agents/skills/gc-standards/SKILL.md](gc-standards/SKILL.md): decide which Government of Canada standards may apply and which targeted overlay skills should run.
- [.agents/skills/gc-review-a11y/SKILL.md](gc-review-a11y/SKILL.md): review accessibility and WCAG risk.
- [.agents/skills/gc-review-branding/SKILL.md](gc-review-branding/SKILL.md): review GC Design System, Canada.ca layout, and FIP risk.
- [.agents/skills/gc-review-bilingual/SKILL.md](gc-review-bilingual/SKILL.md): review official-languages and i18n risk.
- [.agents/skills/gc-review-security/SKILL.md](gc-review-security/SKILL.md): review security, privacy, PII, and Protected B risk.
- [.agents/skills/gc-review-iam/SKILL.md](gc-review-iam/SKILL.md): review identity, authentication, authorization, sessions, tokens, scopes, and roles.
- [.agents/skills/gc-review-im/SKILL.md](gc-review-im/SKILL.md): review records, metadata, retention, disposition, and information-management risk.

These are not phases. They produce findings, evidence inputs, gate update suggestions, remediation tasks, waiver needs, or re-entry notes that flow back into Delorean planning, implementation, verification, evidence packaging, review, or release-readiness when those outputs are in scope.

The targeted `gc-review-*` skills should not usually be the first user-facing workflow. Workflow skills such as `dl-ui-refine`, `dl-qa-check`, `dl-qa-review`, `dl-security-review`, or `dl-ui-review-accessibility` may route to them when needed.

## Shared Skill Output Contract

When the invoking agent requests Delorean process output for an active change, a skill should return this block when useful:

```text
Delorean skill output:
- Change ID:
- Change-state path:
- Current Delorean phase:
- OpenSpec lifecycle state:
- OpenSpec artifacts touched:
- Gates checked:
- Gate updates:
- Tasks updated:
- Evidence inputs:
- Findings:
- Required fixes:
- Skipped checks and reasons:
- Approval or waiver needed:
- Re-entry needed:
- Re-entry phase:
- Re-entry reason:
- Next recommended task:
```

Do not mark a gate as passed unless evidence exists.

Do not mark approval, waiver, risk acceptance, production action, sensitive-data access, or release readiness as approved on behalf of a human.

Skills may recommend task, evidence, gate, or change-state updates. The invoking agent decides whether to write those artifacts based on [delorean/config.yaml](../../delorean/config.yaml), the active task, and the user's explicit request. Use `delorean-evidence` when the work is to assemble or update the Evidence Bundle itself.

## Starter Skills

- [.agents/skills/delorean-planning/SKILL.md](delorean-planning/SKILL.md): shape the change before implementation.
- [.agents/skills/delorean-question-resolution/SKILL.md](delorean-question-resolution/SKILL.md): resolve spec, design, planning, standards, and evidence questions from repo guidance before asking humans.
- [.agents/skills/delorean-openspec/SKILL.md](delorean-openspec/SKILL.md): refine OpenSpec requirements, scenarios, slices, tasks, lifecycle state, validation readiness, archive follow-through, and next-task clarity.
- [.agents/skills/delorean-design/SKILL.md](delorean-design/SKILL.md): refine technical approach, design gaps, impacted artifacts, slice sequencing, ADR needs, and design blockers.
- [.agents/skills/delorean-ui/SKILL.md](delorean-ui/SKILL.md): refine user-facing UI, page patterns, routes, GC Design System alignment, accessibility, bilingual behaviour, and UI evidence.
- [.agents/skills/delorean-evidence/SKILL.md](delorean-evidence/SKILL.md): assemble or update the Evidence Bundle from existing evidence inputs.
- [.agents/skills/delorean-implementation/SKILL.md](delorean-implementation/SKILL.md): make the change correctly.
- [.agents/skills/delorean-review/SKILL.md](delorean-review/SKILL.md): check conformance and impacted artifacts.
- [.agents/skills/delorean-testing/SKILL.md](delorean-testing/SKILL.md): identify and add the highest-value tests.
- [.agents/skills/aws-topology-diagrams/SKILL.md](aws-topology-diagrams/SKILL.md): create or refine AWS topology and deployment architecture diagrams.
- [.agents/skills/c4-architecture-diagrams/SKILL.md](c4-architecture-diagrams/SKILL.md): create or refine C4 model diagrams.
- [.agents/skills/select-ui-page-pattern/SKILL.md](select-ui-page-pattern/SKILL.md): select the approved page pattern, page shell, home entry point, and shared menu before user-facing UI page implementation.
- [.agents/skills/review-gc-design-system-alignment/SKILL.md](review-gc-design-system-alignment/SKILL.md): review implemented UI against the recorded page pattern decision, page shell, shared menu, design-system check, and evidence.
- [.agents/skills/gc-standards/SKILL.md](gc-standards/SKILL.md): decide which Government of Canada standards and baseline controls apply before planning, implementation, review, or verification continues.

## Skill Selection Guide

| Skill | Use when |
|---|---|
| `delorean-planning` | The request needs scope, sequence, impacted artifacts, or handoff planning before code changes. |
| `delorean-question-resolution` | Spec, design, planning, standards, or evidence questions might be answered from repo guidance, OpenSpec, architecture docs, code, tests, contracts, or approved docs before asking the user. |
| `delorean-openspec` | OpenSpec specs or active changes need clearer requirements, scenarios, slices, tasks, lifecycle state, validation readiness, archive follow-through, or next-task selection. |
| `delorean-design` | Technical approach, design gaps, impacted artifacts, slice sequencing, ADR needs, or design blockers need refinement before implementation. |
| `aws-topology-diagrams` | AWS topology, deployment, VPC, subnet, account, region, edge, identity, observability, or cloud resource diagrams need creation, review, or layout refinement. |
| `c4-architecture-diagrams` | C4 context, container, component, deployment, dynamic, or sequence diagrams need creation, review, decomposition, or layout refinement. |
| `delorean-ui` | User-facing UI decisions, page patterns, route structure, shared menu, GC Design System alignment, accessibility, bilingual behaviour, or UI evidence need planning, repair, review, or continuation. |
| `delorean-evidence` | Existing verification results, findings, skipped checks, screenshots, OpenSpec links, baseline assessment inputs, approvals, waivers, or release-readiness inputs need to be assembled into an Evidence Bundle. |
| `select-ui-page-pattern` | User-facing page, layout, navigation, form, multi-step flow, header, footer, menu, breadcrumb, or language toggle work needs an approved page pattern decision before implementation, including Home and shared menu behavior. |
| `gc-standards` | Work may affect Government of Canada UI, content, forms, accessibility, official languages, security, privacy, identity, information management, records, operations, baseline assessment, or evidence. |
| `review-gc-design-system-alignment` | Implemented user-facing page work needs review against the page pattern decision, approved template, page shell, shared menu, design-system check, screenshots, accessibility result, and exceptions. |
| `gc-review-a11y` | User-facing UI needs explicit accessibility, WCAG, keyboard, focus, screen reader, or form review. |
| `gc-review-branding` | UI needs explicit GC Design System, Canada.ca layout, header, footer, typography, color, or FIP review. |
| `gc-review-bilingual` | User-facing content, routes, translation files, locale behavior, or accessibility text needs official-languages review. |
| `gc-review-security` | Security, privacy, PII, trust boundaries, input validation, secrets, or audit logging need explicit review. |
| `gc-review-iam` | Authentication, authorization, identity providers, OIDC/OAuth, sessions, tokens, claims, scopes, or roles need explicit review. |
| `gc-review-im` | Schemas, models, migrations, repositories, records, retention, disposition, deletion, auditability, or metadata need explicit review. |
| `delorean-implementation` | Scope and expected behavior are clear enough to change code, docs, contracts, tests, or evidence. |
| `delorean-testing` | Behavior, contracts, risks, acceptance checks, or evidence need verification. |
| `delorean-review` | A handoff, release-readiness context, approval-sensitive question, or conformance check needs a review view. |

## Cross-Cutting Checks

Skills that touch requirements should identify the OpenSpec lifecycle state and use [docs/reference/openspec-lifecycle.md](../../docs/reference/openspec-lifecycle.md). Active changes stay under `openspec/changes/<change-id>/` until implementation and verification are complete; archive belongs in lightweight developer readiness or release-readiness. Archive is complete only when the current `openspec/specs/**` files reflect the completed functional deltas and the change package has moved under `openspec/changes/archive/`.

Skills that touch agents, tools, APIs, MCP servers, privileged commands, file scopes, sensitive data, environments, or generated evidence should identify the control boundary using [docs/repo-guidance/control-boundaries.md](../../docs/repo-guidance/control-boundaries.md).

Skills that touch environments, data, secrets, deployment, external systems, or unclear target context should identify the work context using STD-002: Work Contexts. If no environment is named, keep work local-first and record the assumption.

Skills that touch relational persistence, database models, repositories, migrations, seed data, retention, deletion, or stored records should use STD-020: Database Persistence and PAT-012: Alembic PostgreSQL Change through the generated architecture catalogs.

Skills that reference reusable architecture guidance should use document ID and
title first. Use [docs/repo-guidance/architecture-docs.md](../../docs/repo-guidance/architecture-docs.md)
and the generated `architecture_docs/standards/catalog.yml` and
`architecture_docs/patterns/catalog.yml` files to decide which `STD-*` and
`PAT-*` IDs apply. Use `architecture_docs/baselines/catalog.yml`,
`architecture_docs/controls/catalog.yml`,
`architecture_docs/architecture/reference/catalog.yml`, and
`architecture_docs/architecture/adrs/catalog.yml` when `BAS-*`, `GC-WEB-*`,
reference architecture, or ADR routing may apply. Resolve IDs to generated files
only when a file needs to be loaded.

Catalog-driven loading is the default. Do not update a skill just because a new
standard, pattern, baseline, control, template, reference architecture, or ADR
was added to `delorean_architecture`. Refresh `architecture_docs/`, load the
catalogs, match the task against catalog metadata such as `categories`,
`applies_when`, `use_when`, `do_not_use_when`, and related IDs, then load the
matched Markdown files. Update `SKILL.md` or `references.md` only when a new
document changes the skill trigger, procedure, required outputs, escalation
rules, or handoff contract.

Skills should not branch on Delorean adoption level. Keep each skill focused on
its task. Agents read [delorean/config.yaml](../../delorean/config.yaml) and
decide which skills to invoke and which outputs are required for Level 2, 3, or
4. A skill may name optional gates, evidence, approval, waiver, release, MCP, or
subagent outputs, but it should not make those outputs mandatory by itself.

## Alignment Rule

When a skill is added, update the agents that call it, the agent skill selection rules that say when to use it, and `scripts/delorean/run-structure-checks.sh` so missing starter skills are caught.

When an agent lists a skill under `# Uses skills`, that skill should exist locally or be clearly marked as a shared external skill.

When a skill's reference needs change, update its `references.md` first. Only update `SKILL.md` when the procedure, trigger, outputs, or escalation behavior changes.

## Rule

The Delorean core repo remains the source of truth for the Delorean operating
model. Reusable architecture standards, patterns, baselines, controls,
templates, ADR catalogs, and reference architecture catalogs are sourced from
`delorean_architecture` and referenced by stable document ID and title.

Use [docs/repo-guidance/where-things-go.md](../../docs/repo-guidance/where-things-go.md) to find the local folders these skills should read from and write to.
