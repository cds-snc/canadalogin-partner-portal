# OpenSpec Change Package Starter

Use this when an agent or developer needs to create a new active OpenSpec change without guessing the full solution design.

Default to a local-only change unless the request clearly names a shared environment or production. Record assumptions and suggested options instead of asking broad questions.

Folder shape:

```text
openspec/changes/<change-id>/
  proposal.md
  design.md
  tasks.md
  specs/<capability>/spec.md
```

Delorean companion record when configured by adoption level or requested:

```text
delorean/evidence/<change-id>/
  change-state.yaml
  evidence-bundle.md
  approval-response.md when needed
  waiver.md when needed
```

When the change creates, changes, reviews, or releases a Government of Canada
web application, use STD-019: Government of Canada Web Application Baseline
Governance, BAS-001: Government of Canada Web Application Baseline, and
TPL-011: GC Web Application Baseline Assessment Template as needed. Record
local assessment status in solution evidence, not in the reusable baseline docs.

## proposal.md

```markdown
# Proposal: <Title>

## Summary

<One or two plain-language sentences describing the change.>

## Problem or opportunity

<What problem this solves or what outcome it supports.>

## Work context

- Local developer / localhost: yes by default.
- Shared non-production environment: not used yet unless a target is named.
- Production: not in scope unless explicitly approved.

## Safe assumptions

- Build and verify locally first.
- Use fake, fixture, or test-only data.
- Do not use real secrets or production identifiers.
- Keep external integrations stubbed or described until a target environment is named.
- Name reusable artifacts for the real domain concept or intended environment path, not for localhost. Keep local-only names for disposable fixtures, local config values, and examples that will not be promoted.

## Naming for reuse

- Reusable code, API, database, queue, feature flag, service, environment variable, documentation, and evidence identifiers:
- Disposable local fixture or example identifiers:
- Environment-specific values that stay in config, `.env.local`, fixtures, or deployment parameters:
- Names that must wait for a named shared environment or production decision:

## Suggested options

Recommended option:

- <Option A: safe local path.>

Other options:

- <Option B: shared non-production path after target/access are known.>
- <Option C: production-readiness path after approval/rollback/evidence are known.>

## Resolved questions

| Question | Answer | Source | Classification | Confidence |
|---|---|---|---|---|
| <Question answered from repo guidance, standards, docs, tests, or safe assumptions.> | <Answer.> | <Source path or document ID.> | fact \| safe_assumption | high \| medium \| low |

## Open questions

| Question | Owner | Blocks | Needed before |
|---|---|---|---|
| <Human decision required.> | <Owner or role.> | <local work \| non-local work \| release-readiness> | <phase or event> |

## Scope

- <In scope item 1>
- <In scope item 2>

## Out of scope

- Production deployment unless explicitly approved.
- Real secrets, real production data, or external system changes unless explicitly approved.

## Requirements or scenarios affected

- Current spec:
- Delta spec:
- Requirement:
- Scenario:

## Risks

- <Risk and mitigation.>

## Links

- Work context standard: STD-002: Work Contexts
- OpenSpec lifecycle: [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md)
- Evidence template: [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md)
```

## design.md

```markdown
# Design: <Title>

## Technical approach

<Describe the simplest local-first approach.>

## Work context impact

Local developer / localhost:

- <How this works locally.>
- <Which names must stay durable because the artifact may be reused outside localhost.>

Shared non-production environment:

- <What must be named or configured before using dev/test/staging/sandbox.>

Production:

- <What must be approved, monitored, rolled back, and evidenced before production work.>

## Impacted artifacts

- OpenSpec delta:
- Current spec after archive:
- API or OpenAPI contract:
- Frontend:
- Backend:
- Tests:
- Evidence:
- Baseline assessment:
- Affected `GC-WEB-*` controls:

## Standards and patterns impact

Applicable guidance:

- `STD-*`:
- `PAT-*`:
- `BAS-*`:
- `GC-WEB-*`:
- `TPL-*`:

Selected page or implementation pattern, when applicable:

- Pattern:
- Reason:
- Custom UI or implementation exceptions:
- Evidence to collect:

## Suggested implementation path

Recommended first slice:

- <Small local-first slice.>

Possible later slices:

- <Shared non-production slice.>
- <Production readiness slice.>

## Resolved questions

| Question | Answer | Source | Classification | Confidence |
|---|---|---|---|---|
| <Design or standards question answered from repo guidance, standards, docs, tests, or safe assumptions.> | <Answer.> | <Source path or document ID.> | fact \| safe_assumption | high \| medium \| low |

## Security, privacy, accessibility, and operations notes

- Security:
- Privacy:
- Accessibility:
- Operations:
- GC web application baseline:

## Open questions that block non-local work

- <Question, owner, and when it must be answered.>
```

Human-only decisions should also appear as follow-up tasks in `tasks.md` when
they affect implementation, verification, evidence, approvals, waivers, or
release-readiness.

## tasks.md

```markdown
# Tasks: <Title>

## OpenSpec setup

- [ ] Review the proposal, design, tasks, and spec delta.
- [ ] Resolve discoverable questions from repo guidance, OpenSpec, architecture docs, code, tests, contracts, and approved docs before asking humans.
- [ ] Record safe assumptions and human decisions required in `proposal.md`, `design.md`, or this checklist.
- [ ] Confirm the work context: local-only, shared non-production, or production.
- [ ] Classify new names as reusable artifacts, disposable local fixtures, or environment-specific config values.
- [ ] Classify the work as a new requirement, requirement adjustment, requirement bug, technical bug against an existing requirement, or non-functional change.
- [ ] Add or update requirement and scenario deltas for every behavior change or missing regression scenario.
- [ ] Identify applicable `STD-*`, `PAT-*`, `BAS-*`, `GC-WEB-*`, and `TPL-*` guidance.
- [ ] Record standards and patterns impact in `design.md` when guidance shapes the work.
- [ ] Record the selected UI page pattern and any custom UI exceptions when user-facing UI changes.
- [ ] Create or update `delorean/evidence/<change-id>/change-state.yaml` when configured by adoption level or requested.
- [ ] Confirm relevant gates from `delorean/gates/gate-catalog.yaml` when gate tracking is in scope.
- [ ] Keep the proposal, design, tasks, and spec delta current if scope or expected behavior changes.
- [ ] Update current specs only during lightweight developer readiness or release-readiness archive, and do not call a functional change complete while current specs are stale.

## Local implementation

- [ ] Build the smallest local-first slice.
- [ ] Use fake, fixture, or test-only data.
- [ ] Keep real secrets and production identifiers out of code, tests, logs, prompts, and evidence.
- [ ] Use durable domain or environment-path names for artifacts that may be reused outside localhost; keep `local`, `test`, `fake`, or `demo` names only for disposable fixtures, local config values, and examples that will not be promoted.

## Shared non-production readiness

- [ ] Name the target environment before deployment or changes.
- [ ] Confirm access path, secret source, data rules, and rollback or cleanup path.

## Production readiness

- [ ] Keep production out of scope until there is explicit human approval.
- [ ] Record approval, change owner, rollback, monitoring, and evidence expectations before production work.

## Review and verification

- [ ] Add or update tests for the scenarios.
- [ ] Confirm tests map to the updated OpenSpec scenarios or to the existing current spec for a technical bug.
- [ ] Validate the active change with `openspec validate <change-id> --strict` when the official CLI is enabled.
- [ ] Run relevant local checks.
- [ ] Run holistic QA review after implementation tasks are complete; resolve
  findings or record them as non-blocking before moving to developer readiness,
  release-readiness, or the next change.
- [ ] Run relevant standards, design-system, page-shell, accessibility, or API checks.
- [ ] Record skipped checks and reasons.
- [ ] Assess BAS-001 and affected `GC-WEB-*` controls when the change is a meaningful Government of Canada web application release or service change.
- [ ] Update gate statuses in `delorean/evidence/<change-id>/change-state.yaml` when change-state and gate tracking are in scope.

## Evidence and approval

- [ ] Record verification in an Evidence Bundle when needed.
- [ ] Link Evidence Bundle coverage back to the OpenSpec scenario.
- [ ] Link baseline assessment evidence, deferred controls, exceptions, reference architecture decisions, and ADRs when BAS-001 applies.
- [ ] Link final evidence back to OpenSpec requirements and scenarios.
- [ ] Route approval or waiver decisions through Delorean templates when needed.

## Archive follow-through

- [ ] Confirm implementation, review, and verification are complete before archive.
- [ ] Archive with `openspec archive <change-id> --yes` when the official CLI is enabled; do not use `--skip-specs` for functional deltas.
- [ ] For each `## MODIFIED Requirements` delta, confirm the full target requirement includes existing scenarios to preserve plus the new or changed scenarios.
- [ ] Confirm `openspec/specs/<capability>/spec.md` was created or updated from the delta.
- [ ] Confirm existing scenarios under modified requirements remain present unless the change intentionally removed them.
- [ ] Confirm the current spec now matches the implemented and verified behavior.
- [ ] Confirm the completed package moved to `openspec/changes/archive/<date>-<change-id>/` and the active change folder was removed.
- [ ] Update `delorean/evidence/<change-id>/change-state.yaml` archive fields when change-state is in scope, or record why archive is deferred.
```

## specs/<capability>/spec.md

```markdown
# Delta for <Capability>

## ADDED Requirements

### Requirement: <business-rule-id when useful> <name>

<Short, testable requirement.>

#### Scenario: <scenario-id when useful> <name>

- GIVEN <starting point>
- WHEN <action or event>
- THEN <expected result>
```

For `## MODIFIED Requirements`, include the full replacement requirement body.
If the change appends a scenario to an existing requirement, carry forward every
existing scenario that should remain and add the new scenario in the same
requirement block.

If a scenario is intentionally removed from a modified requirement, record it in
the delta with `allow-scenario-removal: <scenario-id>` and explain the reason in
the proposal, design, or tasks.
