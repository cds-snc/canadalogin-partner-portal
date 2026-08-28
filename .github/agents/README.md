# VS Code Agents

This folder is the upstream source for VS Code and GitHub Copilot custom agent
files. These files are materialized to `.github/agents/` in generated solution
repos; they are not active from this source folder in the template checkout.

Keep agent files thin. Agents own role, routing, handoff, and output contracts.
Detailed procedures, long reference lists, and task-specific standards loading
belong in skills, repo guidance, or generated `architecture_docs/` catalogs.

When work is about designing or improving these files, treat them as artifacts
under review, not binding instructions for the current maintenance agent. Follow
the active system, developer, user, and root repo instructions first.

## Common Rules

Every agent should:

- read `delorean/config.yaml` before deciding how much Delorean process to
  apply;
- default to local developer / localhost work when no environment is named:
  fake or test-only data, no real secrets, no external system changes, no
  deployment, and no production action;
- stop or ask before shared-environment changes, production work, real secrets,
  approvals, waivers, destructive actions, or wider file/tool/API/MCP access;
- identify the control boundary before agent, skill, API, MCP, external tool,
  privileged command, sensitive-data, or generated-evidence work;
- use `docs/repo-guidance/architecture-docs.md` plus the generated
  `architecture_docs/**/catalog.yml` files to resolve `STD-*`, `PAT-*`,
  `BAS-*`, `GC-WEB-*`, `TPL-*`, reference architecture, and ADR guidance;
- keep active OpenSpec changes under `openspec/changes/<change-id>/` until
  implementation and verification are complete;
- use active OpenSpec `tasks.md` for implementation, review, verification, and
  archive-readiness checklist items by default;
- never approve work, create waivers, or accept remaining risk on behalf of a
  human.

At adoption Level 2, keep work centered on implementation, OpenSpec support,
architecture guidance, testing, and local verification. Change-state, gate
updates, Evidence Bundles, approval records, waiver records, formal release
readiness, and subagent loops are optional unless the user asks for them.

At Level 3 or 4, follow the outputs required by `delorean/config.yaml`.

## Common Working Set

Load only what is needed for the task. The usual starting set is:

- `README.md`
- `delorean/config.yaml`
- `docs/repo-guidance/adoption-levels.md`
- `docs/repo-guidance/where-things-go.md`
- `docs/repo-guidance/ownership-and-updates.md`
- `docs/repo-guidance/architecture-docs.md`
- `docs/repo-guidance/control-boundaries.md`
- `docs/reference/openspec-lifecycle.md`
- `docs/reference/local-verification.md`
- `openspec/specs/`
- `openspec/changes/`
- `openapi/`, `tests/`, `frontend/`, `backend/`, and `docs/` when impacted
- `delorean/evidence/<change-id>/change-state.yaml` and
  `delorean/gates/gate-catalog.yaml` only when the adoption level or user
  request makes them relevant

Use document IDs first in prose. Resolve to file paths only when a tool needs
to load the source.

## Phase Routing

| Delorean phase | Primary agent |
|---|---|
| Spec | [spec-author.agent.md](spec-author.agent.md) |
| Plan | [delivery-planner.agent.md](delivery-planner.agent.md) |
| Implement | [builder-general.agent.md](builder-general.agent.md) |
| Verify | [qa-support.agent.md](qa-support.agent.md) |
| Release-ready | [release-readiness.agent.md](release-readiness.agent.md) |

The Coordinator is the main starting agent. Builder General remains the single
starter implementation agent for UI, API, data, tooling, backend, and mixed
work. Add specialized builders only when a solution repo intentionally adopts
that shape because repeated work needs a materially different path.

## Skill Routing

Agents decide the route. Skills provide the reusable procedure.

Use stable IDs in new prose when a literal generated path is unnecessary:

- `skill:delorean-planning`
- `skill:delorean-question-resolution`
- `skill:delorean-openspec`
- `skill:delorean-design`
- `skill:delorean-ui`
- `skill:delorean-implementation`
- `skill:delorean-testing`
- `skill:delorean-review`
- `skill:delorean-evidence`
- `skill:aws-topology-diagrams`
- `skill:c4-architecture-diagrams`
- `skill:gc-standards`
- `skill:select-ui-page-pattern`
- `skill:review-gc-design-system-alignment`
- `skill:gc-review-*`

Agents should pass context into skills rather than copying skill procedures into
the agent body. Useful context includes the source request, change ID, active
OpenSpec path, impacted files, current phase, work context, control boundary,
verification state, approval or waiver status, and evidence path when relevant.

## Automation

When `agent/runSubagent` is available, the Coordinator may invoke phase agents
directly. Builder General and QA Support should loop internally for scoped
implementation defects until verification passes or a blocker requires a human
decision, approval, waiver, wider boundary, or scope change.

When the user should choose the next phase, the Coordinator asks for one route:

```text
Choose next step:
A = pick for me
S = clarify scope
P = plan work
I = build it
V = verify it
R = release check
Q = ask or paste prompt
```

Use frontmatter handoffs as the visible fallback when subagent invocation is
unavailable or when the user should explicitly switch phases.

## Maintenance Rules

- Edit these source files under `agent-configs/vscode/agents/`.
- Generated VS Code solution repos receive them under `.github/agents/`.
- Keep `tools`, `agents`, and `handoffs` in each frontmatter block aligned with
  VS Code custom-agent behavior.
- If a skill is added or removed from an agent, update the affected agent, the
  skills README when needed, and `scripts/delorean/run-structure-checks.sh`
  when checks depend on it.
- Do not update agents merely because `delorean_architecture` adds a new
  standard, pattern, baseline, control, template, reference architecture, or
  ADR. Update agents only when routing, required outputs, handoff behavior, or
  working set changes.
