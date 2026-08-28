# Adoption Levels

Use `delorean/config.yaml` to decide how much Delorean process an agent should
apply in a solution repo.

The template baseline and local tooling default to Level 2 when no explicit
level is set. `make help` shows the command set for the configured level,
including common template and architecture guidance update helpers; override it
with `make help LEVEL=3`, `make help LEVEL=4`, or `make help-all` when a fuller
command list is needed.

Adoption level controls agent orchestration and required outputs. Skills stay
level-agnostic: a skill performs a focused task, and the agent decides whether
to invoke it based on the adoption level, task risk, and changed artifacts.

## Current Levels

| Level | Profile | Use |
|---|---|---|
| 2 | `agent-assisted-development` | Core agent-assisted development. Developers use OpenSpec, standards and patterns, planning, implementation tasks, local checks, testing, QA review, and developer readiness without required formal Delorean automation or evidence packaging. |
| 3 | `lightweight-delorean` | Lightweight Delorean. Teams add phase routing, change-state, gates/check tracking, guided handoffs, and lightweight evidence summaries while keeping formal release evidence optional. |
| 4 | `full-delorean` | Full Delorean. Teams use the full local workflow, including phase routing, change-state, gates, Evidence Bundles, approvals, waivers, baseline assessment, and release-readiness packaging. |

## Level 2 Rules

Level 2 is for learning and focused development work. It is less formal, not
less disciplined: the core planning, standards, testing, review, and developer
readiness blocks still apply.

Agents should:

- read `delorean/config.yaml` before deciding how much process to apply;
- use `architecture_docs/standards/catalog.yml`,
  `architecture_docs/patterns/catalog.yml`, and when applicable
  `architecture_docs/baselines/catalog.yml` and
  `architecture_docs/controls/catalog.yml` to choose relevant guidance;
- record applicable `STD-*`, `PAT-*`, `BAS-*`, `GC-WEB-*`, and `TPL-*` IDs in
  the OpenSpec design or tasks when those standards or patterns shape the work;
- use OpenSpec for behavior changes, but keep it lightweight;
- treat OpenSpec current specs as the living source for implemented functional
  requirements and scenarios;
- keep requirements and scenarios current for small requirement changes,
  requirement bugs, and bug fixes that reveal missing scenario coverage;
- keep `proposal.md`, `design.md`, and `tasks.md` current for meaningful
  changes;
- archive completed functional OpenSpec changes before calling the work
  developer-ready or merge-ready, so `openspec/specs/` reflects the implemented
  behavior;
- route implementation-ready work to Builder General;
- route testing and verification work to QA Support;
- use lightweight developer readiness for review, merge/archive readiness, and
  completed-change summaries;
- run or recommend relevant local checks;
- summarize tests, skipped checks, and remaining risk clearly;
- treat the GC web application baseline assessment gate as advisory unless the
  user asks for release-readiness or full evidence artifacts.

Agents should not require these Level 3 or Level 4 artifacts unless the user
explicitly asks for them:

- `delorean/evidence/<change-id>/change-state.yaml`;
- gate status updates;
- Evidence Bundle assembly or updates;
- approval or waiver records;
- formal release-readiness packaging;

Level 2 can still use any focused skill when it fits the task. The level changes
which outputs are required, not what skills are capable of doing.

## Level 3 Rules

Level 3 is the lightweight Delorean path. It adds workflow automation and
traceability without requiring the full formal release package by default.

Agents should:

- use the full phase model when it helps move work through Spec, Plan,
  Implement, Verify, and developer readiness;
- create or maintain `delorean/evidence/<change-id>/change-state.yaml` for
  meaningful changes;
- track applicable gates and checks;
- capture lightweight evidence summaries for meaningful changes, including
  skipped checks and remaining risk;
- keep formal Evidence Bundles, approval packages, waivers, and release
  packaging focused on cases where they are requested or required by risk,
  baseline status, or release context.

## Level 4 Rules

Level 4 is full Delorean. Agents should use the full local workflow, including
formal gates, Evidence Bundles, approval and waiver records when applicable,
baseline assessment, and release-readiness packaging.

## Agent Responsibilities

Coordinator:

- Level 2: route directly to Builder General or QA Support for most work.
- Level 3: use the phase model, change-state, gates/check tracking, and guided
  handoffs when work needs them.
- Level 4: use the full phase model and formal release-readiness path when work
  needs them.

Builder General:

- Level 2: implement, update relevant OpenSpec or docs when useful, run local
  checks, and hand off to QA when verification is needed.
- Level 3: also maintain change-state, gates/check status, lightweight evidence
  summaries, and phase handoffs when those features are required.
- Level 4: also maintain formal gate, Evidence Bundle, approval, waiver, and
  release-readiness inputs when required.

QA Support:

- Level 2: verify behavior, review scoped changes, and provide a concise
  verification or developer-readiness summary.
- Level 3: also update gate/check status and lightweight evidence summaries
  when required.
- Level 4: also update gate status and release-readiness inputs when required,
  and use `delorean-evidence` when evidence inputs need to become an Evidence
  Bundle.

Release Readiness:

- Level 2: lightweight developer readiness. Confirm local checks, review
  findings, OpenSpec validation/archive status, and remaining risk without
  requiring formal gates, Evidence Bundles, approval packages, or waiver
  records unless explicitly requested.
- Level 3: optional.
- Level 4: enabled.

## Scaffolding

Use the scaffold helper's `--level` option to create a repo at the intended
adoption level. Level 2 keeps the starter focused on development, review,
OpenSpec, architecture guidance, lightweight developer readiness, and testing.
Level 3 keeps lightweight Delorean automation and evidence summaries. Level 4
keeps the full Delorean automation, formal evidence, approval, waiver, baseline,
and release-readiness support.

Level 2 scaffolds also default to the core VS Code prompt set:

- `dl-requirements-start`
- `dl-requirements-refine`
- `dl-requirements-answer-questions`
- `dl-requirements-archive`
- `dl-ui-build-page`
- `dl-ui-refine`
- `dl-ui-review-accessibility`
- `dl-dev-continue`
- `dl-dev-active-change`
- `dl-dev-fix-bug`
- `dl-qa-commit-ready`
- `dl-qa-push-ready`
- `dl-qa-check`
- `dl-qa-review`

Use `--include-level2-nice-to-have-prompts` or
`--level2-prompt-set full` when a Level 2 repo should receive the fuller prompt
catalog.
