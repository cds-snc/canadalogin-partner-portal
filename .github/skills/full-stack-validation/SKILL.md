---
name: full-stack-validation
description: "Use when validating or repairing this repository end to end. Run make ft-test, make ft-lint, make ft-build, make bk-test, make bk-lint, and make bk-typecheck, fix the root causes of failures, and rerun the full validation set."
argument-hint: "Run all frontend and backend checks, fix failures, and report the final results."
user-invocable: true
---

# Full-Stack Validation

Run the repository's required frontend and backend checks, repair failures, and verify the repaired work. This skill may edit source, tests, configuration, or documentation when needed, but it must not commit, create branches, push, reset, or discard existing user changes.

## Required Checks

Run these exact commands from the repository root, in this order:

1. `make ft-test`
2. `make ft-lint`
3. `make ft-build`
4. `make bk-test`
5. `make bk-lint`
6. `make bk-typecheck`

Run each target as its own command so every check gets a clear result. Do not replace the requested targets with a narrower command during the initial pass.

## Workflow

1. Establish the working context:
   - Run `git rev-parse --show-toplevel` and work from that directory.
   - Read `AGENTS.md` and the applicable frontend or backend skill before editing that layer.
   - Run `git status --short` and preserve all existing user changes. Never use destructive reset or checkout commands.
   - Confirm the required toolchains are available. Install dependencies only when missing and only with the repository's existing install targets.
2. Run all six required checks in the order above, recording each exit status and the useful failure output.
3. Triage failures by the owning layer:
   - Frontend tests, lint, and build: inspect the affected page, feature hook, shared wrapper, test, or TypeScript/configuration error. Follow the frontend GCDS and feature architecture rules.
   - Backend tests, lint, and typecheck: inspect the affected route, service, repository, schema, model, migration, or typing boundary. Follow the backend layering and exception rules.
   - Dependency, environment, database, or service failures: distinguish infrastructure problems from code defects and do not rewrite application behavior to hide an environment problem.
4. Repair the root cause:
   - Make the smallest coherent edit that addresses the failure.
   - Preserve existing APIs, localization, access control, validation contracts, and user changes unless the failure requires a contract change.
   - Update or add focused tests for behavior changes. Do not weaken assertions, disable lint/type checks, skip tests, or change tests merely to make a broken implementation pass.
   - Do not manually edit generated route or lock files unless the repository workflow explicitly requires it.
5. After each repair, rerun the narrowest failed target. If it passes, continue with the remaining initial checks. If the same failure persists after three focused repair attempts, stop changing that slice and report the unresolved failure and evidence.
6. Once the failures are repaired, rerun all six required commands in the exact order. Treat the final pass as authoritative; do not report a check as passing based only on an earlier run.
7. Review the final diff for accidental changes and run `git diff --check` when applicable. Do not commit or push the result.

## Failure Handling

- Fix code and configuration defects directly when they are within the repository.
- If a check cannot run because of missing credentials, unavailable services, missing system tools, or another external blocker, report the blocker precisely and do not fabricate a pass.
- If a pre-existing unrelated failure prevents completion, leave it intact, identify it separately, and continue validating the requested slice where possible.
- If a formatter or auto-fix changes files outside the requested repair, inspect the diff and revert only those unrelated changes you created during this run. Never revert changes that predate the skill invocation.

## Output Format

Return concise GitHub-flavored Markdown:

## Checks

- `make ft-test` - PASS or FAIL
- `make ft-lint` - PASS or FAIL
- `make ft-build` - PASS or FAIL
- `make bk-test` - PASS or FAIL
- `make bk-lint` - PASS or FAIL
- `make bk-typecheck` - PASS or FAIL

## Changes

- Summarize each repair in behavior-focused point form.

## Remaining Issues

- List unresolved failures, external blockers, or test gaps. Write `None` when all checks pass.

Do not claim a check passed unless its final command exited successfully. Mention the files changed only when that helps explain a repair, and do not include secrets or environment values in the report.
