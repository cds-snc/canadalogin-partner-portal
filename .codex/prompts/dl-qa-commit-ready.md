# Commit Ready

<!-- delorean-template:codex-generated from agent-configs/vscode/prompts/dl-qa-commit-ready.prompt.md; run scripts/delorean/sync-codex-adapters.sh --write -->

Codex prompt adapter generated from `agent-configs/vscode/prompts/dl-qa-commit-ready.prompt.md`.

Recommended role: [QA Support](../agents/qa-support.md). When Codex subagent tooling is available, invoke that role with this prompt. If it is unavailable, read the role file and follow this prompt in the current session.


## Purpose

Check whether the current local work is ready for `git commit`, fix or route
hook findings when they are in scope, and create the commit only when the user
explicitly asks for a commit and provides or confirms the message.

## Use when

- The user says commit, make this commit-ready, check before commit, or fix
  pre-commit failures.
- A change is implemented and needs the staged-file quality loop before a local
  commit.
- The commit message needs traceability or shape checking before running
  `git commit`.

## Required inputs

- Intended commit scope.
- Candidate commit message, when the user wants the agent to create the commit.
- Related issue, OpenSpec change, scenario, business-rule, or PR reference when
  available.
- Checks already run, hook failures already seen, and known skipped checks.

If details are missing, inspect the local Git state first and continue with the
safe local developer / localhost default. Ask only before staging unrelated
files, creating a commit without a confirmed message, bypassing hooks, using
real secrets, destructive actions, pushing, or widening the permission boundary.

## Route

1. Read [docs/reference/local-verification.md](../../docs/reference/local-verification.md), especially the hook behavior.
2. Use [docs/repo-guidance/control-boundaries.md](../../docs/repo-guidance/control-boundaries.md) when the commit would involve generated evidence, privileged commands, sensitive data, or wider tool access.
3. Inspect `git status --short` and the staged file list before deciding what is in the commit.
4. Prefer checking staged changes. If nothing is staged, report that clearly before staging anything.
5. Run the configured pre-commit hook when available, or run the same local check adapters described in the hook documentation.
6. Check the candidate commit message against the documented `commit-msg` rules when a message is available.
7. For formatter-only failures, use `make fix` only when repair is in scope, then review the diff and stage only intended files.
8. Commit only when the user explicitly requested a commit and the commit message is confirmed. Do not push from this prompt.

## Expected outputs

- Commit readiness status: ready, fixed and ready, blocked, or committed.
- Current branch and staged-file summary.
- Hook or hook-equivalent commands run and results.
- Commit-message traceability status, including warning or strict-mode blocker.
- Files changed by any auto-fix and whether they were staged.
- Skipped checks and reasons.
- Commit hash when a commit was created.
- Remaining risks or exact remediation needed before retrying `git commit`.

## Guardrails

- Do not stage unrelated files.
- Do not commit unstaged work unless the user clearly asked for that scope.
- Do not use `git commit --no-verify` unless a human explicitly accepts the bypass and the reason is recorded.
- Do not push, deploy, use production, read real secrets, or touch shared environments.
- Do not report hook readiness if the hook or equivalent checks were not run or directly assessed.
