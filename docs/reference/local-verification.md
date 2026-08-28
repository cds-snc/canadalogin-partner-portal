# Local Verification

This repo includes a small local verification baseline. It catches common issues before review without assuming a solution technology stack, secrets, or paid tools.

## Active Workflow

`template-validation.yml` is the only starter workflow meant to run by
default. In the upstream template, its source is
`repo-configs/github/workflows/template-validation.yml`; scaffolded solution
repos receive it at `.github/workflows/template-validation.yml`. It uses
read-only repository permissions, installs locked frontend and backend
development dependencies when those stacks exist, and calls
[scripts/delorean/run-ci-verification.sh](../../scripts/delorean/run-ci-verification.sh).

The active workflow is intentionally light and safe for a generic template. It does not use secrets, deployment environments, external reporting, paid tools, Slack, S3, release bots, or organization-specific labels.

Generated VS Code repos also receive `.vscode/extensions.json` with conservative extension recommendations, `.vscode/launch.json` with starter app, pytest, Vitest, and browser debug configurations, `.vscode/settings.json` with terminal command auto-approval defaults, and `.vscode/tasks.json` with shortcuts for routine Delorean checks, active change picking, OpenSpec validation, and app starts. In the upstream template source, those files live under `agent-configs/vscode/vscode/extensions.json`, `agent-configs/vscode/vscode/launch.json`, `agent-configs/vscode/vscode/settings.json`, and `agent-configs/vscode/vscode/tasks.json`. Extension recommendations, debug configurations, command auto-approval, and VS Code task shortcuts are not part of local verification or default CI.

Generated Codex repos receive root `AGENTS.md` from
`agent-configs/codex/AGENTS.md`, shared and workflow skills under
`.agents/skills/`, and project custom-agent TOML under `.codex/agents/`.
The structure check validates required skill frontmatter, custom-agent TOML,
workflow links, and required files. It also rejects deprecated
`.codex/prompts/` directories and Markdown custom-agent adapters.

Use `make doctor` for a non-mutating setup diagnostic before installing dependencies or starting services. It reports missing local tools, dependency readiness, OpenSpec and change-state status, Docker reachability, and optional scanner availability without changing files.

When [frontend/pnpm-lock.yaml](../../frontend/pnpm-lock.yaml) exists, the
active workflow enables the `pnpm` version declared by the frontend package
and installs dependencies with
`pnpm install --frozen-lockfile --ignore-scripts`. When
[backend/uv.lock](../../backend/uv.lock) and
[backend/pyproject.toml](../../backend/pyproject.toml) exist, it creates the
repo virtual environment with Python 3.12 and syncs backend development
dependencies from the lockfile with `uv`. These lockfile-backed installs keep
CI verification repeatable.

For pull requests, the CI wrapper compares the base and head revisions.
Format whitespace checks inspect changed patch lines, while Markdown and
ShellCheck adapters inspect changed files, Prettier formatting inspects changed
frontend source files, and Ruff formatting inspects changed backend Python
files. Repository structure, Delorean state, semantic lint, type, GC Design
System, page-shell, secret, test, and contract checks remain repository-wide.
This prevents unrelated inherited formatting debt from blocking a change
without weakening behavioural verification. A manual run without a comparison
base performs the full-repository content audit.

The workflow runs:

- repo structure checks, including the starter OpenSpec layout under `openspec/specs/` and `openspec/changes/`, the Delorean gate catalog, and the Delorean change-state template
- Delorean change-state checks for existing `delorean/evidence/*/change-state.yaml` files
- format checks
- Markdown checks
- shell script checks
- lint, type, and stack format checks when configured
- frontend GC Design System checks when the frontend starter exists
- UI page shell checks when the frontend starter exists
- secret checks
- fast tests when a known test target exists
- optional container checks when a Docker-compatible local container runtime is available

## Code Quality Checks

Formatting, Markdown checks, shell checks, lint checks, secret checks, and fast tests are part of the starter local quality loop.

Linting rules live in stack-native config files, not in shell scripts:

- Frontend linting lives in [frontend/eslint.config.js](../../frontend/eslint.config.js).
- Frontend formatting lives in [frontend/.prettierrc](../../frontend/.prettierrc) and [frontend/.prettierignore](../../frontend/.prettierignore).
- Frontend type checks use the TypeScript config files under `frontend/`.
- Backend formatting, linting, and test configuration use the root
  [Makefile](../../Makefile) and
  [backend/pyproject.toml](../../backend/pyproject.toml).

The shell scripts under `scripts/delorean/` are adapters for hooks and CI.
They detect configured commands and call project commands such as frontend
lint, type, format, and test scripts, plus `make lint-python`,
`make fmt-ci-python`, `make typecheck`, and `make run-pytest`. Frontend
dependencies come from the committed `pnpm` lockfile. Backend Python checks use
the repo `.venv` by default; run `make install-dev-python` to create it with
Python 3.12 and sync
the committed `uv` lockfile.

Backend Ruff lint is non-mutating. Production source keeps the complete Ruff
rule set. Tests retain an explicit style-only baseline: import-order rule
`I001` is not enforced for test files, and `W191` is excluded only for the
legacy `test_department_seed.py` file. All other Ruff rules still run across
the full test suite. PR validation applies Prettier and Ruff formatting to
changed frontend and backend source files; a manual full-repository run
continues to report the inherited formatting backlog until a dedicated cleanup
is approved.

`run-frontend-standards-checks.sh` is a lightweight GC Design System guard. When `frontend/` exists, it checks that GC Design System packages are present, GC Design System CSS is imported, and frontend UI source uses GC Design System components. It fails by default when frontend UI source contains possible custom links, buttons, inputs, selects, textareas, labels, fieldsets, legends, alerts, headers, footers, or navigation. Use GC Design System components where they fit, or record the custom UI exception in the page pattern decision. Set `GCDS_CUSTOM_UI_POLICY=warn` only for a temporary migration or reviewed exception path.

`run-ui-page-shell-checks.sh` is a lightweight page shell checker. When `frontend/` exists, it checks frontend UI source for page shell markers such as header, header language toggle, footer, main content skip target, skip link, main landmark, H1, date modified, shared navigation menu, and a Home navigation entry. It is a starter guard and should be paired with the page pattern decision, design-system checklist, screenshots, accessibility result, and human review.

For formatter-only failures, use the root auto-fix command:

```bash
make fix
```

`make fix` calls [scripts/delorean/run-autofix.sh](../../scripts/delorean/run-autofix.sh). It runs configured safe fixers, including frontend `npm run fix` when available, backend Ruff formatting and lint fixes through `make fmt-python`, and basic trailing-whitespace or final-newline cleanup for text files covered by the format checks. It does not stage files. Review and stage rewritten files before committing.

To limit the scope:

```bash
DELOREAN_FIX_SCOPE=backend make fix
DELOREAN_FIX_SCOPE=frontend make fix
DELOREAN_FIX_SCOPE=format make fix
```

This template does not require every future repo to keep both `frontend/` and `backend/`. When a solution repo chooses its stack, keep local commands aligned with STD-015: Code Quality, Linting, and Formatting.

For the complete first-tester setup path, run `make setup`. It installs or verifies Node.js, installs frontend dependencies with `pnpm`, creates or reuses the repo-root `.venv` with Python 3.12, syncs backend development dependencies with `uv`, and installs the optional official OpenSpec CLI. For frontend-only setup, run `make install-frontend-deps`. This repo tracks [frontend/pnpm-lock.yaml](../../frontend/pnpm-lock.yaml), so use `pnpm install` only when intentionally changing dependencies and updating the lockfile.

## Archived Workflows

Archived workflow examples are intentionally inactive. In the upstream template, their source lives under `repo-configs/github/workflows-archive/`; scaffolded solution repos receive them under `.github/workflows-archive/` unless the adoption profile prunes them. Keep workflows there when they need organization secrets, external reporting, S3, Sentinel, Backstage, labels, release automation, deployment environments, or special permissions.

The archived `.example.yml` files show optional patterns a solution repo may adopt later:

- `frontend-lint.example.yml`: frontend lint, typecheck, and format checks using [frontend/package.json](../../frontend/package.json) scripts through the lint adapter.
- `backend-lint.example.yml`: backend lint, format, and fast tests using [Makefile](../../Makefile) targets through local adapters.
- `codeql.example.yml`: a basic CodeQL starter for GitHub Actions, JavaScript/TypeScript, and Python.
- `backend-container-build.example.yml`: backend container image build without pushing.
- `backend-container-scan.example.yml`: placeholder for an approved image scanner.
- `aws-ecr-publish.example.yml`: placeholder shape for ECR publishing with OIDC or approved AWS credentials.

To opt into an archived workflow later, review its secrets, permissions, action versions, and repo-specific assumptions. Then move it into `.github/workflows/` and update this guide.

Archived workflows are examples only. Active workflows remain safe and secret-free for the generic template.

## Action Version Policy

Active workflows should follow the repo's chosen action version policy. A solution repo may use pinned SHAs or approved major tags, but should not mix policies silently.

This template pins the active checkout action to an immutable SHA with a nearby version comment. Archived examples may use approved major tags for readability until a solution repo reviews and enables them. Local checks should live in scripts so the same checks can run locally and in CI.

## Install Hooks

Local hooks are opt-in. Run once after creating or cloning a repo:

```bash
make setup-hooks
```

This sets `core.hooksPath` to the hook folder that exists locally and makes the hook and helper scripts executable. In generated solution repos that path is `.github/hooks`; in the upstream template source it is `agent-configs/shared/hooks`.

To stop using the template hooks locally:

```bash
make uninstall-hooks
```

This unsets the local `core.hooksPath`. The upstream template keeps hook source files under `agent-configs/shared/hooks/` and materializes them to `.github/hooks/` in generated solution repos; it does not use a second `.githooks/` source.

## Hooks

| Hook | What It Checks |
|---|---|
| `pre-commit` | lightweight checks based on staged or changed files; calls format, Markdown, ShellCheck, frontend lint/format, backend lint/format, or secret adapters when relevant |
| `commit-msg` | non-empty commit message, long summary warning, and configurable traceability check |
| `pre-push` | full local verification, plus an OpenAPI freshness check when backend API or OpenAPI files changed |

`pre-commit` is meant to stay fast. It does not run slow tests by default.
It passes only the staged or changed shell files to the ShellCheck adapter, so
unrelated repository shell debt is not rechecked during a focused commit.

Hooks do not auto-rewrite files by default. When a hook fails for a formatter-only issue, run `make fix`, review the changed files, stage them, and retry the commit or push.

`pre-push` is stronger but still avoids deployment checks, slow end-to-end tests, browser Storybook tests, and load tests by default.

Use `dl-qa-commit-ready` when a developer wants an agent to check staged files,
run the commit hook path, and validate a candidate commit message before a local
commit. Use `dl-qa-push-ready` when a branch should run the full pre-push
quality loop before updating a remote. The push-ready prompt should ask before
`git push` because pushing changes an external system.

OpenAPI checks are not part of `pre-commit`. The starter commits a minimal
contract at `openapi/openapi.json` for the backend health endpoint. Use
`make export-openapi` after backend route or response model changes, then
review the generated diff before committing it.

## Traceability Mode

`commit-msg` reads `DELOREAN_TRACEABILITY_MODE`. The default is `warn` so a new repo is guided but not blocked.

Supported modes:

- `off`: skip traceability checks.
- `warn`: warn when no reference is found, but allow the commit.
- `strict`: fail when no reference is found.

The hook recognizes:

- `ISSUE-123`
- `SCN-123`
- `BR-123`
- `#123`

Example:

```bash
DELOREAN_TRACEABILITY_MODE=strict git commit
```

## Helper Scripts

Run the full local loop directly:

```bash
scripts/delorean/run-local-verification.sh
```

CI should call the comparison-aware wrapper:

```bash
DELOREAN_BASE_SHA=<base-sha> \
DELOREAN_HEAD_SHA=<head-sha> \
scripts/delorean/run-ci-verification.sh
```

`run-ci-verification.sh` obtains the changed-file list from the supplied Git
range and delegates to the same local wrapper. It scopes content-only checks
to the pull-request change while keeping repository-wide checks intact. If no
base SHA is supplied, it deliberately runs the full-repository loop.

The wrapper calls:

- `run-structure-checks.sh`
- `run-delorean-state-checks.sh`
- `run-format-checks.sh`
- `run-markdown-checks.sh`
- `run-shellcheck.sh`
- `run-lint.sh`
- `run-frontend-standards-checks.sh`
- `run-ui-page-shell-checks.sh`
- `run-secret-checks.sh`
- `run-fast-tests.sh`
- `run-container-checks.sh`

When `run-local-verification.sh` receives file arguments, it passes matching
Markdown and shell files to their adapters. Format checks can additionally use
`DELOREAN_FORMAT_DIFF_BASE` and `DELOREAN_FORMAT_DIFF_HEAD` to apply
`git diff --check` to changed patch lines. Running it without file arguments
retains the normal full-repository content scan.

`run-autofix.sh` is intentionally separate from the verification wrapper. It runs through `make fix` only when a developer asks for repair.

`run-structure-checks.sh` confirms the required starter folders and files are present. For OpenSpec, it checks the official-compatible starter layout:

- `openspec/specs/`
- [openspec/specs/README.md](../../openspec/specs/README.md)
- `openspec/changes/`
- [openspec/changes/README.md](../../openspec/changes/README.md)

When the script runs in the upstream template source tree, it also checks the
small OpenSpec example fixture used by template smoke tests. Generated solution
repos may start without live OpenSpec specs or changes.

For Delorean gate and state support, it also checks:

- [delorean/gates/gate-catalog.yaml](../../delorean/gates/gate-catalog.yaml)
- [delorean/templates/change-state-template.yaml](../../delorean/templates/change-state-template.yaml)

When the script runs in the template source tree, it expects
`getting-started/scaffold-solution-repo.sh` and does not require
architecture-owned docs. Generated solution repos exclude `getting-started/`, so
the same script requires the architecture guidance copied from
`delorean_architecture` under `architecture_docs/`, including generated
standards, patterns, controls, baselines, architecture, ADR/reference
architecture catalogs, and reusable template indexes.

The pristine template does not require a real `delorean/evidence/<change-id>/change-state.yaml` file. Real change-state files belong in solution evidence folders after a solution starts meaningful work.

`run-delorean-state-checks.sh` does not require a YAML parser. It only checks `delorean/evidence/*/change-state.yaml` files that already exist. If none exist, it prints a skip message and passes. For each existing file, it checks for basic required keys, confirms the `change.id` matches the folder name, checks the active OpenSpec path when `inScope: true` is recorded for an active change, and checks the archive path when the OpenSpec lifecycle state is `archived`.

The structure check does not require the official OpenSpec CLI and does not run OpenSpec validation. Use [docs/reference/using-official-openspec.md](using-official-openspec.md) and [docs/reference/openspec-lifecycle.md](openspec-lifecycle.md) when a solution repo opts into the CLI.

When a solution repo opts into the official OpenSpec CLI, use:

```bash
make install-openspec-cli
make check-openspec-cli
make validate-openspec-change CHANGE_ID=my-change
```

`make validate-openspec-change` wraps the official strict validation and a
local scenario-preservation preflight for `## MODIFIED Requirements` deltas, so
archive does not drop existing scenarios when a change intended to append new
ones.

A solution repo may make OpenSpec validation stricter later, such as requiring the CLI in CI or checking OpenSpec changes before merge.

CI and hooks should validate OpenSpec artifacts, but they should not apply, sync, archive, or commit generated OpenSpec changes back to the branch. Those authoring, developer-readiness, and release-readiness changes should be visible in the branch or pull request diff.

`run-openapi-checks.sh` is an adapter for API contract freshness. It detects
backend API or OpenAPI contract changes, then calls `make check-openapi` when
`openapi/openapi.json` exists. If the committed contract is removed or missing
while OpenAPI files are changing, the check fails clearly. Use
`make export-openapi` to refresh the committed contract.

`update-architecture-docs.sh` is a targeted generated-doc refresh helper. It
fetches `delorean_architecture`, replaces the generated `architecture_docs/`
folder from that repo's `docs/` folder, and does not update broader
template-owned files. Use `make update-architecture-docs-dry-run` before
applying the refresh.

## AWS Topology PlantUML Render Matrix

AWS topology diagram checks are optional manual verification for diagram source
files. The default local verification wrapper does not install PlantUML,
Graphviz, ELK, or other renderers. Use these examples only when PlantUML and
the required local renderers are already available.

| Render pass | Example command | Purpose |
|---|---|---|
| Default DOT | `java -jar plantuml.jar -tpng diagram.puml` | Baseline PlantUML topology render, normally using Graphviz/DOT for supported graph-layout diagrams. |
| Smetana | `java -jar plantuml.jar -Playout=smetana -tpng diagram.puml` | First alternate render engine while keeping the diagram source model unchanged. |
| ELK | `java -jar plantuml.jar -Playout=elk -tpng diagram.puml` | Experimental render pass; inspect before accepting and reject if it produces an exception, diagnostic image, or server error page. |

Compare render outputs with these questions:

- Are same-level peer groups visually peer-like?
- Are AWS boundaries correct?
- Are edge, global, platform, and SaaS services outside false VPC or subnet
  containment?
- Is the main topology wider or taller as intended for the target artifact?
- Are large boxes mostly empty?
- Are labels readable?
- Are relationships visually dominating the topology?
- Did any engine produce an exception, diagnostic image, or server error page?
- Did hidden links change the implied architecture?

Accept a PlantUML topology render only when:

- The diagram answers one clear topology question.
- Major boundaries are correct.
- Same-level peer groups remain visually peer-like.
- Runtime, OAuth, callback, and data-flow stories are absent unless explicitly
  requested.
- Hidden links are rare, commented, and within budget.
- Large boxes do not contain obvious empty corridors.
- Output is readable at the target format.

Reject and simplify, split, or fall back when:

- peers stack into towers;
- layout hints exceed the hidden-link budget;
- icons dominate comprehension;
- relationships dominate topology;
- exact alignment is required;
- correct AWS boundaries are sacrificed for layout.

Do not install PlantUML, Graphviz, ELK, or other packages just to satisfy this
manual matrix. Do not fetch external resources or run cloud commands as part of
diagram rendering.

## Agent Tool Approvals

Use [docs/repo-guidance/agent-tool-permissions.md](../repo-guidance/agent-tool-permissions.md) as the starter recommendation for AI tools that support durable command-prefix approvals, including Codex command rules and GitHub Copilot VS Code auto-approval settings.

Routine repo discovery, read-only Git inspection, and the committed local verification adapters are reasonable defaults for durable approval. Dependency installs, formatting writes, generated contract writes, container commands, publish, deploy, destructive cleanup, and secret-bearing commands should stay intentionally approved.

Use [docs/repo-guidance/control-boundaries.md](../repo-guidance/control-boundaries.md) before expanding durable approvals, API access, MCP servers, file scopes, sensitive-data access, environment access, or audit-sensitive tooling.

## Local Skips

- Frontend lint, type, format, and test commands run only when [frontend/package.json](../../frontend/package.json) has the matching script and `frontend/node_modules` is installed.
- Frontend GC Design System checks run when `frontend/src` and `frontend/package.json` exist. They are heuristic checks and should be paired with human review. Potential custom links, buttons, inputs, selects, textareas, labels, fieldsets, legends, alerts, headers, footers, and navigation fail by default unless the check is explicitly run with `GCDS_CUSTOM_UI_POLICY=warn` for a temporary migration or reviewed exception path.
- UI page shell checks run when `frontend/src` and `frontend/package.json` exist. They are source-marker checks and should be paired with the recorded page pattern decision and screenshots.
- Backend lint and format commands run through [Makefile](../../Makefile) targets when the needed Python tools are installed.
- Backend tests run through `make run-pytest` when `backend/tests` exists and pytest is installed.
- ShellCheck runs when `shellcheck` is installed. If it is not installed locally, set `USE_DOCKER_SHELLCHECK=1` to use Docker.
- If ShellCheck and Docker are both unavailable locally, shell checks print a skip message and pass. In CI, missing ShellCheck support fails clearly.
- Markdown checks use `markdownlint` only when a `.markdownlint.json` config exists. Otherwise, a small built-in check runs.
- Secret checks always fail if a real `.env` file or certificate/private key file is tracked. Optional secret content scanning runs when a scanner such as `gitleaks` is installed.
- OpenAPI checks run when backend API or OpenAPI files change and
  `openapi/openapi.json` exists. If a committed contract exists, backend
  dependencies must be installed so `make check-openapi` can import the FastAPI
  app.
- Container checks are disabled by default for this starter, even when [backend/Dockerfile](../../backend/Dockerfile) exists. Run `make container-checks`, set `DELOREAN_RUN_CONTAINER_CHECKS=1`, or set `DELOREAN_CONTAINER_CHECK_MODE=auto` to opt in.
- In CI, container checks also skip by default unless `DELOREAN_CONTAINER_CHECKS_REQUIRED=true`, `DELOREAN_CONTAINER_CHECKS_REQUIRED=1`, or `DELOREAN_CONTAINER_CHECK_MODE=required` is set.
- In local mode, missing optional tools print a clear skip message. In CI mode, configured commands fail when their required tools or dependencies are missing.

Do not commit `frontend/node_modules/`. Reinstall frontend dependencies after cloning or creating a new solution repo from this template.

## Optional Container Checks

`run-container-checks.sh` is an adapter for local container checks. It is opt-in by default for this starter. Use:

```bash
make container-checks
```

The adapter uses [Makefile](../../Makefile) targets when they exist:

- `make build-backend-container`
- `make test-backend-container`
- `make scan-backend-container`

These checks are optional in the generic template because not every developer has a Docker-compatible local container runtime, not every solution keeps the starter backend, and image scanning tools may need local setup. A solution repo that deploys backend containers can make them part of pre-push or CI by setting `DELOREAN_RUN_CONTAINER_CHECKS=1`, `DELOREAN_CONTAINER_CHECK_MODE=auto`, or `DELOREAN_CONTAINER_CHECK_MODE=required` in the relevant environment.

First testers and local developers can use Colima with the Docker CLI, Docker Desktop if approved by the organization, or another approved Docker-compatible runtime. The adapter checks for the Docker CLI and `docker info`. If Colima is installed but not running, it suggests `colima start`; it does not auto-start Colima.

Local frontend servers, local backend development servers, and local backend container host ports bind to `127.0.0.1` by default. Do not expose local services on all network interfaces unless a developer intentionally opts in for a specific local test.

A solution repo should consider making container checks mandatory before release, when [backend/Dockerfile](../../backend/Dockerfile) changes, when runtime dependencies change, or when backend container deployment is part of the release path.

For meaningful backend changes, record container build, health check, image scan, skipped-check, and bypass reason details in [docs/templates/evidence-bundle-template.md](../templates/evidence-bundle-template.md) or PR notes.

## CI Behavior

`template-validation.yml` installs frontend dependencies from
[frontend/pnpm-lock.yaml](../../frontend/pnpm-lock.yaml) with a frozen
lockfile, and syncs backend development dependencies from
[backend/uv.lock](../../backend/uv.lock) with `uv`. It then runs
[scripts/delorean/run-ci-verification.sh](../../scripts/delorean/run-ci-verification.sh)
with the event base and head revisions.

On pull requests, the CI wrapper applies format whitespace checks to changed
patch lines, runs Markdown and ShellCheck adapters only for changed files, and
applies Prettier and Ruff formatting to changed frontend and backend source
files. Structure, state, semantic lint, type, standards, secret, fast-test, and
optional container adapters keep their repository-wide behaviour.
Protected-branch pushes use the event's previous revision as their comparison
base. Manual runs without a usable base perform a full-repository audit.

The workflow also calls the OpenAPI adapter. It checks freshness when backend
API or OpenAPI files changed and a committed contract exists.

Real solution repos should make CI stricter based on their actual technology
and risk. For example, a frontend repo should install locked frontend
dependencies and run lint, typecheck, format checks, and fast tests. A backend
repo should install locked backend development dependencies and run Ruff,
pytest, type checks, and relevant contract checks.

## Future checks for solution repos

This template starts with safe generic checks only. As a solution repo matures, add checks intentionally based on its technology, artifacts, and risk.

- OpenSpec CLI validation when the repo intentionally opts in.
- Business-rule, scenario, test, and evidence coverage checks.
- Stricter OpenAPI or contract checks.
- Artifact-alignment checks.
- Build, typecheck, and lint checks.
- Unit, integration, contract, and end-to-end tests.
- Security checks.
- Secrets and configuration checks, including secret scanning or push protection when configured.
- Optional container build, health, and image scan checks when a solution repo deploys containers.
- Accessibility checks.
- Architecture boundary checks.
- Evidence publication or evidence completeness checks.

## Bypass

Use bypass only when a hook is wrong for the moment, blocked by missing local tooling, or the change is low risk and mechanical.

```bash
git commit --no-verify
git push --no-verify
```

Do not use bypass to avoid evidence, approval, or traceability expectations. For meaningful changes, record any skipped checks and the reason in the evidence bundle or handoff notes.

If a meaningful change bypasses or skips linting, secret checks, tests, or CI checks, record the command, result, and reason in [docs/templates/evidence-bundle-template.md](../templates/evidence-bundle-template.md) or the PR notes.
