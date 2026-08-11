# DL Archive OpenSpec

<!-- delorean-template:codex-generated from agent-configs/vscode/prompts/dl-requirements-archive.prompt.md; run scripts/delorean/sync-codex-adapters.sh --write -->

Codex prompt adapter generated from `agent-configs/vscode/prompts/dl-requirements-archive.prompt.md`.

Recommended role: [Release Readiness](../agents/release-readiness.md). When Codex subagent tooling is available, invoke that role with this prompt. If it is unavailable, read the role file and follow this prompt in the current session.


## Purpose

Archive a completed active OpenSpec change so implemented behavior is reflected
in `openspec/specs/**` and the completed change package moves under
`openspec/changes/archive/`.

Use this prompt when the goal is archive follow-through. Use
`dl-requirements-refine` when requirements, scenarios, slices, tasks, or
validation errors still need cleanup before archive.

## Required inputs

- OpenSpec change ID.
- Verification summary or the checks already run.
- Active `tasks.md` status, especially implementation, review, verification,
  and archive-readiness checklist items.
- Known skipped checks, findings, risks, or blockers.
- Change-state path when it exists or is in scope.

## Route

1. Read [docs/reference/openspec-lifecycle.md](../../docs/reference/openspec-lifecycle.md).
2. Use [.agents/skills/delorean-openspec/SKILL.md](../../.agents/skills/delorean-openspec/SKILL.md) for archive follow-through.
3. Release Readiness applies [delorean/config.yaml](../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, or formal release-readiness artifacts.
4. Read `openspec/changes/<change-id>/proposal.md`, `design.md`, `tasks.md`,
   and each spec delta under `openspec/changes/<change-id>/specs/`.
5. Read `delorean/evidence/<change-id>/change-state.yaml` when it exists or is
   in scope.
6. Use STD-002: Work Contexts and assume local developer / localhost when no
   environment is named.
7. Use [docs/repo-guidance/control-boundaries.md](../../docs/repo-guidance/control-boundaries.md)
   when tools, APIs, MCP servers, file scopes, sensitive data, environments, or
   generated evidence are in scope.

## Archive procedure

Before archive:

- confirm implementation, review, and verification checklist items are complete
  or identify the exact blocker;
- confirm no human approval, waiver, production, real-secret, shared
  environment, or external-system decision is being assumed;
- run `make validate-openspec-change CHANGE_ID=<change-id>` when the official
  OpenSpec CLI path is enabled, or record why validation is skipped; this also
  runs the local modified-requirement scenario preservation preflight;
- inspect the spec deltas so functional changes are not archived with
  `--skip-specs`.
- for each `## MODIFIED Requirements` delta, compare the target current
  requirement with the delta and confirm the delta includes every existing
  scenario that should remain; OpenSpec archive treats modified requirements as
  replacements, so omitted scenarios can be removed instead of appended. If a
  scenario is intentionally removed, record
  `allow-scenario-removal: <scenario-id>` in the delta and explain the reason
  in the change package.

When archive is ready, run:

```sh
openspec archive <change-id> --yes
```

After archive, inspect the branch diff and confirm:

- `openspec/specs/**` was created or updated for each affected capability;
- existing scenarios under modified requirements are still present unless the
  change intentionally removed them and recorded that reason;
- `openspec/changes/<change-id>/` no longer exists;
- `openspec/changes/archive/<date>-<change-id>/` exists;
- `delorean/evidence/<change-id>/change-state.yaml` archive fields are updated
  when change-state exists or is in scope.

## Expected outputs

- OpenSpec change path and lifecycle state before archive.
- Readiness decision: archived, blocked, or intentionally deferred.
- Validation command and result or skipped reason.
- Archive command run, if any.
- Current spec freshness status after archive.
- Scenario preservation status for modified requirements.
- Archived package path after archive.
- Change-state archive update status when in scope.
- Remaining blockers, skipped checks, and risks.

## Guardrails

- Do not archive if implementation or verification is incomplete.
- Do not use `--skip-specs` for a functional change with spec deltas.
- Do not add scenarios to an existing requirement with a partial
  `## MODIFIED Requirements` body; include the full target requirement with the
  existing scenarios to preserve plus the new scenarios, or archive will replace
  the requirement body.
- Do not hand-move a change folder to archive and call it complete.
- Do not let CI, hooks, or hidden automation apply, sync, archive, or commit
  OpenSpec changes invisibly.
- Do not approve release readiness, waivers, exceptions, remaining risk,
  production actions, sensitive-data access, or external-system changes on
  behalf of a human.
