# Using Official OpenSpec

## Purpose

Use this guide when a solution repo wants to use the official OpenSpec CLI or `/opsx:*` commands.

OpenSpec is optional starter tooling for the Spec and Plan phases. This template stays compatible with OpenSpec, but it does not require every developer to install the CLI on day one.

## When to use it

Use official OpenSpec when the team wants help creating or updating:

- functional specs in `openspec/specs/`,
- proposed changes in `openspec/changes/`,
- `proposal.md`, `design.md`, `tasks.md`, and spec deltas.

Do not use OpenSpec as a replacement for tests, Delorean Evidence Bundles, human approval, waivers, or release readiness.

Use [openspec-lifecycle.md](openspec-lifecycle.md) for Delorean's active-change, validation, archive, and no-CI-mutation rules.

If the official CLI is not installed or does not finish setup, use the local helper in this template instead of stopping:

```sh
make new-openspec-change CHANGE_ID=my-change CAPABILITY=my-capability TITLE="My Change"
```

This creates the active change package with safe local assumptions. Review the files before implementation.

## Prerequisites

- Confirm the current OpenSpec CLI requirements in the [official installation guide](https://github.com/Fission-AI/OpenSpec/blob/main/docs/installation.md) before installing.
- Use Node.js 20.19.0 or higher.
- Make sure the repo has a clean working tree or a clear review point before running commands that generate files.
- Review generated files before committing them.
- Keep OpenSpec artifacts plain, small, and reviewable.

## Install or update the CLI

Use the template Make target:

```sh
make install-openspec-cli
```

Verify that the CLI is on `PATH`:

```sh
make check-openspec-cli
```

The target installs this package by default:

```sh
npm install -g @fission-ai/openspec@latest
```

This installs the CLI globally for a developer machine. Override `OPENSPEC_NPM_PACKAGE`
when a solution repo needs a pinned version:

```sh
make install-openspec-cli OPENSPEC_NPM_PACKAGE=@fission-ai/openspec@<version>
```

Do not add the CLI as a repo dependency unless the solution repo intentionally decides to.

For the complete first-tester setup path, including Node.js, frontend dependencies, backend development dependencies, and the OpenSpec CLI, run:

```sh
make setup
```

For the fuller local Delorean bootstrap, including everything from `make setup` plus Delorean readiness checks, run:

```sh
make setup-delorean
```

By default these setup targets install the latest Node.js LTS through `nvm` when `nvm` is available. Use `make setup NODE_VERSION=node` for the latest current Node.js release, or `make setup NODE_VERSION=20.19.0` for the minimum OpenSpec-compatible version.

This is local developer setup. `make setup` may update local app tooling. `make setup-delorean` runs local readiness checks after setup, but neither target must use production data, production secrets, external environments, approvals, waivers, or release evidence.

## Initialize or refresh OpenSpec files

This template already has starter OpenSpec folders. Run initialization only when the solution repo is ready to adopt official OpenSpec tool files.

Example commands:

```sh
openspec init
openspec update
```

After running either command:

- review all generated or changed files,
- keep useful OpenSpec files,
- avoid overwriting Delorean prompts, skills, agents, standards, evidence, approval, or workflow guidance without review.

## Propose a change

Example command for supported AI tools:

```text
/opsx:propose <idea>
```

Use this to create or update a proposed change under `openspec/changes/`. Review the proposal, design, tasks, and spec delta before implementation starts. Keep delivery sequencing, implementation tasks, and review or verification checklist items in `tasks.md` by default.

When the request does not name an environment, use the local developer / localhost default from STD-002: Work Contexts: fake or test-only data, no real secrets, no deployment, no external system changes, and no production action.

## Apply a change

Example command:

```text
/opsx:apply
```

Use this only after the change artifacts are clear enough to implement. Keep implementation aligned with local standards, tests, OpenAPI contracts, and impacted docs.

`/opsx:apply` means implementation. It is not human approval and should not be run by CI.

Keep the active change under `openspec/changes/<change-id>/` while implementation and verification are in progress. Do not move spec deltas into `openspec/specs/` during implementation.

Check off completed implementation items in `tasks.md` as work completes. Do not mark approval, waiver, or release-readiness items complete unless a human decision record or release-readiness result exists.

## Validate an active change

Example command:

```sh
make validate-openspec-change CHANGE_ID=<change-id>
```

This wraps `openspec validate <change-id> --strict`. Run it during verification when the official OpenSpec CLI is enabled and an active change is in scope.

The target also runs
`scripts/delorean/check-openspec-scenario-preservation.js`. That local preflight
checks `## MODIFIED Requirements` deltas against current specs so scenario-only
updates do not accidentally drop existing scenarios during archive.

Verification should update or flag review and verification checklist items in the active change's `tasks.md`, while detailed results and skipped-check reasons stay in Delorean evidence.

## Archive a completed change

Example command:

```sh
openspec archive <change-id> --yes
```

Before archiving:

- run the relevant local checks,
- use `delorean-evidence` to update the Evidence Bundle when evidence packaging is in scope,
- confirm approval or waiver state where needed,
- review any changes merged into `openspec/specs/`, including modified
  requirements.

Archive belongs after implementation and verification are complete. At Level 2,
it can be part of lightweight developer readiness after local review and checks.
That Level 2 archive step is how current requirements and scenarios stay
accurate without requiring Level 3/4 gates or formal evidence packaging.
At Level 3, follow the configured lightweight Delorean readiness expectations.
At Level 4, follow the configured full release-readiness expectations. Archive
folds the completed spec deltas into `openspec/specs/` and moves the change
package under `openspec/changes/archive/`.

Do not use `--skip-specs` for functional changes with spec deltas. Use it only
when the completed change intentionally has no current functional spec update,
such as a docs-only, tooling-only, or infrastructure-only change, and record
that reason.

For `## MODIFIED Requirements`, archive replaces the current requirement body.
When the intent is to append a scenario to an existing requirement, include the
full target requirement in the delta: current requirement text, every existing
scenario that should remain, and the new or changed scenario.

If a scenario is intentionally removed from a modified requirement, record the
removal in the delta with `allow-scenario-removal: <scenario-id>` and explain
the reason in the change package.

After archiving, inspect the diff before committing or handing off:

- `openspec/specs/<capability>/spec.md` was created or updated for each
  archived delta;
- existing scenarios under modified requirements remain present unless they
  were intentionally removed and that reason is recorded;
- `openspec/changes/<change-id>/` was removed;
- `openspec/changes/archive/<date>-<change-id>/` exists; and
- `delorean/evidence/<change-id>/change-state.yaml` records the archive result
  when change-state is in scope.

If the change moved to archive but `openspec/specs/**` did not update when a
functional delta was expected, treat the archive as incomplete and repair the
OpenSpec state before release-readiness or merge.

Separate sync is not the default Delorean path. Use it only when the team intentionally needs current specs updated before archive, and record the reason.

CI should validate OpenSpec artifacts, but should not apply, sync, archive, or commit generated OpenSpec changes back to the branch.

## How this fits Delorean

OpenSpec helps with Spec and Plan artifacts. Delorean still owns:

- local standards,
- implementation guidance,
- verification,
- evidence,
- approval,
- waivers,
- re-entry,
- release readiness.

Do not treat OpenSpec output as automatic approval. Human approval and Delorean evidence still need to be recorded through the local templates and approval reference.

## Troubleshooting

If `openspec` is not found, install or update the CLI only if the solution repo has chosen to use it.

If initialization creates unexpected files, stop and review the diff before continuing.

If an OpenSpec change is unclear, return to Spec or Plan instead of pushing through implementation.

If the CLI is not installed in CI, that is expected for this template. Local verification and active template workflows should not fail just because OpenSpec is absent.
