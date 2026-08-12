---
name: dl-qa-push-ready
description: "Run pre-push readiness checks and confirm the branch is safe to push."
---

# Push Ready

## Recommended role

Delegate to the `qa-support` custom agent from
`.codex/agents/qa-support.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Check whether the current branch is ready for `git push`, run the same local
quality loop as the pre-push hook, fix or route findings when they are in scope,
and push only after the user explicitly asks for the external update and the
target remote and branch are clear.

## Use when

- The user says push, make this push-ready, check before push, or fix pre-push
  failures.
- Local commits exist and the branch needs full verification before updating a
  remote.
- A backend API or OpenAPI change may require the OpenAPI freshness check before
  push.

## Required inputs

- Target remote and branch when the user wants the agent to push.
- Branch, commits, pull request, or change scope.
- Checks already run, hook failures already seen, and known skipped checks.
- OpenSpec change ID, current spec reference, or evidence expectations when
  relevant.

If details are missing, inspect local Git state first. Ask before pushing to a
remote, force-pushing, bypassing hooks, deploying, using production, reading
real secrets, or widening the permission boundary.

## Route

1. Read [docs/reference/local-verification.md](../../../docs/reference/local-verification.md), especially the pre-push hook behavior.
2. Use [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md) because `git push` changes an external system.
3. Inspect `git status --short --branch`, remotes, upstream state, and commits that would be pushed.
4. Confirm the working tree state. Treat uncommitted changes as a push-readiness risk unless the user explicitly wants to push only existing commits.
5. Run [scripts/delorean/run-local-verification.sh](../../../scripts/delorean/run-local-verification.sh).
6. Run [scripts/delorean/run-openapi-checks.sh](../../../scripts/delorean/run-openapi-checks.sh) when backend API or OpenAPI files may be involved, or run the configured pre-push hook when available.
7. For failures, fix only in-scope issues, rerun the relevant checks, and keep the branch unpushed until the result is clear.
8. Push only when the user explicitly requested it, the remote and branch are known, and the push is inside the approved permission profile.

## Expected outputs

- Push readiness status: ready, fixed and ready, blocked, or pushed.
- Current branch, upstream or target remote, and commits pending push.
- Local verification and OpenAPI check results.
- Uncommitted or untracked local work that is not included in the push.
- Skipped checks and reasons.
- Push target and result when a push was performed.
- Remaining risks or exact remediation needed before retrying `git push`.

## Guardrails

- Do not push without explicit user intent and a clear remote and branch.
- Do not force-push, delete remote branches, or bypass hooks without explicit human approval and recorded reason.
- Do not use `git push --no-verify` unless a human explicitly accepts the bypass and the reason is recorded.
- Do not deploy, use production, read real secrets, or touch unrelated external systems.
- Do not report push readiness if the pre-push checks were not run or directly assessed.

