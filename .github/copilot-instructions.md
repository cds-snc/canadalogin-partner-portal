# Copilot Instructions

These are the generated GitHub Copilot instructions for a solution repo. The
upstream template's root `AGENTS.md` is template-maintainer guidance and is not
copied into generated solution repos.

If a solution repo later adds its own local agent instruction file, follow that
local file together with active system, developer, and user instructions.

This repo is not Delorean core.

It may be either the upstream Delorean starter template or a solution repo created from the template. If the repo has been copied or created for a real or test solution, treat it as the solution repo and allow solution-specific OpenSpec, docs, code, tests, contracts, and evidence in the normal local paths.

Only treat the repo as a pristine template baseline when the user explicitly says they are maintaining, testing, or publishing the template itself.

Keep changes small and practical. Prefer links, thin wrappers, starter examples, and local setup files.

Do not copy large Delorean core or `delorean_architecture` source documents
into this repo. Keep traceability, evidence, approvals, and local verification
intact.

Shared architecture guidance from `delorean_architecture` is copied into
generated solution repos under `architecture_docs/`. Reference it by stable
document ID and title, and use
[docs/repo-guidance/architecture-docs.md](../docs/repo-guidance/architecture-docs.md)
only when a file lookup is needed. This includes `STD-*` standards, `PAT-*`
patterns, `BAS-*` baselines, `GC-WEB-*` controls, `TPL-*` templates, reference
architecture catalogs, and ADR catalogs.

Read [delorean/config.yaml](../delorean/config.yaml) before deciding how much
Delorean process to apply. Skills are level-agnostic; agents use the configured
adoption level to decide which skills to invoke and which outputs are required.
At Level 2, keep work focused on implementation, OpenSpec support, architecture
guidance, testing, local verification, and lightweight developer readiness.

For OpenSpec work, use [docs/reference/openspec-lifecycle.md](../docs/reference/openspec-lifecycle.md). Active changes stay under `openspec/changes/<change-id>/` until implementation and verification are complete; archive completed changes during lightweight developer readiness at Level 2 or release-readiness at higher levels.

For meaningful active changes, check `delorean/evidence/<change-id>/change-state.yaml` when it exists and update it when phase, gate/check, control-boundary, evidence, approval, waiver, or re-entry status changes. Use `delorean/gates/gate-catalog.yaml` for gate definitions. Do not treat the change-state file as the source for requirements; link back to OpenSpec.

When a meaningful active change exists, prefer this working set:

- `openspec/changes/<change-id>/proposal.md`
- `openspec/changes/<change-id>/design.md`
- `openspec/changes/<change-id>/tasks.md`
- `openspec/changes/<change-id>/specs/**/spec.md`
- `delorean/evidence/<change-id>/change-state.yaml`
- `delorean/gates/gate-catalog.yaml`
- relevant implementation, test, contract, design, and evidence files

Use OpenSpec for expected behaviour and tasks.
Use change-state for current phase, gates, evidence, approvals, waivers, blockers, and re-entry.

For agent, skill, API, MCP, external tool, privileged command, sensitive-data, or generated-evidence work, use [docs/repo-guidance/control-boundaries.md](../docs/repo-guidance/control-boundaries.md) before expanding access or scope.

When routing needs a user choice, use the Coordinator route selector in chat or
the visible GitHub Copilot handoffs, then invoke the selected subagent when
available. Ask directly when required inputs, approval-sensitive decisions, or
source-of-truth ownership are unclear.

For Government of Canada UI, read STD-017: Government of Canada Standards Review and STD-005: Frontend GC Design System before coding. Use GC Design System components first, record primary task navigation paths, and document any custom UI exception before using raw HTML controls or custom navigation.

For Government of Canada web application releases or meaningful service
changes, use STD-019: Government of Canada Web Application Baseline Governance,
BAS-001: Government of Canada Web Application Baseline, and the generated
`architecture_docs/controls/` and `architecture_docs/baselines/` catalogs.
Record local baseline assessment evidence, deferred controls, and exceptions in
solution evidence instead of editing reusable baseline or control docs.

For user-facing page, layout, navigation, form, multi-step flow, header, footer, menu, breadcrumb, language toggle, or raw HTML control work, use STD-006: GC UI Page Layout Rules and [.github/prompts/dl-ui-build-page.prompt.md](prompts/dl-ui-build-page.prompt.md). Record the page pattern decision before implementation.

For relational persistence, database models, repositories, migrations, seed data, retention, deletion, or stored business records, use STD-020: Database Persistence and PAT-012: Alembic PostgreSQL Change through the generated architecture catalogs.
