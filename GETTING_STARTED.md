# Getting Started

Use this guide after cloning or creating the CanadaLogin Partner Portal from
the Delorean template.

If the repository is already set up and you only need the commands to start,
update, stop, or reset it, use the
[Local Development command sheet](LOCAL_DEVELOPMENT.md).

## Quick Start

Assume local developer work unless a target environment is named: localhost
services, fake or test-only data, no real secrets, no production data, no
deployment, and no external system changes.

Prerequisites are Python 3.12, Node.js 20.19 or newer, `uv`, `corepack`, and a
Docker-compatible local runtime such as Colima or Docker Desktop.

From the repository root:

```sh
make help
make doctor
make setup
make setup-hooks
```

What those commands do:

- `make help` shows the command menu for the configured Delorean adoption
  level.
- `make doctor` reports local readiness without changing files.
- `make setup` installs frontend dependencies with `pnpm`, creates or reuses
  the root `.venv`, syncs backend development dependencies with `uv`, and
  installs the optional OpenSpec CLI.
- `make setup-hooks` opts into the repository's local Git hooks.

Create `backend/.env` from `backend/.env.sample` before starting the backend,
then replace the sample values with safe local configuration. Never commit the
resulting `.env` file or real secrets.

Start the full local application with PostgreSQL and Redis available through
your local container runtime:

```sh
make start-dev
```

The frontend listens on `http://127.0.0.1:3000` and the backend listens on
`http://127.0.0.1:8000` by default. Use `make frontend-dev` or `make dev` when
you only need one side of the application.

## Verify Changes

Run the default backend and frontend unit tests:

```sh
make all-test
```

Run the broader local Delorean quality loop:

```sh
scripts/delorean/run-local-verification.sh
```

Frontend Playwright tests are separate from `make all-test`:

```sh
cd frontend
corepack pnpm run test:e2e
```

Optional focused checks include `make all-lint`, `make typecheck`, and
`make frontend-build`. The verification guide documents required tools,
conditional checks, and valid skipped-check reasons.

## Codex And VS Code Support

This repository materializes both Delorean agent targets:

- Codex reads project instructions from `AGENTS.md`, portable and workflow
  skills from `.agents/skills/`, and project custom agents from
  `.codex/agents/`.
- VS Code and GitHub Copilot use `.github/copilot-instructions.md`,
  `.github/skills/`, `.github/agents/`, and `.github/prompts/`.

Refresh each target explicitly so the updater does not infer a broader target
set:

```sh
make update-agent-configs-dry-run AGENT_TOOL=codex
make update-agent-configs AGENT_TOOL=codex

make update-agent-configs-dry-run AGENT_TOOL=vscode
make update-agent-configs AGENT_TOOL=vscode
```

Always review `git status --short` and `git diff` after a template refresh.

## First Change

Create a local OpenSpec change package for a meaningful behavior or requirement
change:

```sh
make new-openspec-change CHANGE_ID=my-change CAPABILITY=my-capability TITLE="My Change"
```

For a rough brief or PRD, start with `$dl-requirements-start`. For an existing
active change, use `$dl-dev-continue` to ask for the next safe local task.

## Useful Next Reads

- [Local Development command sheet](LOCAL_DEVELOPMENT.md): concise commands
  for the everyday local application lifecycle.
- [README.md](README.md): application architecture, setup, and common
  commands.
- [Advanced getting started](docs/reference/advanced-getting-started.md):
  deeper setup, prompts, OpenSpec, architecture IDs, and update helpers.
- [First tester quickstart](docs/reference/first-tester-quickstart.md):
  end-to-end first-tester walkthrough.
- [Local verification](docs/reference/local-verification.md): checks, hooks,
  CI baseline, skips, and troubleshooting.
- [Update from template](docs/reference/update-from-template.md): refreshing
  template-owned files.
- [Where things go](docs/repo-guidance/where-things-go.md): repository map for
  prompts, agents, skills, documentation, tests, evidence, and tooling.
