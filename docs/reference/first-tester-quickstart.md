# First Tester Quickstart

## Purpose

Use this guide to test the starter template path end to end.

This is a starter template, not a production app. The goal is to confirm that the React, FastAPI, container, OpenSpec, Delorean evidence, and local verification pieces are usable for a first tester.

For a live demo or first orientation, start with the shorter
[GETTING_STARTED.md](../../GETTING_STARTED.md) path. Use this guide when you
want the fuller end-to-end tester pass.

## What you will test

- React and TypeScript frontend starter in [frontend/](../../frontend/).
- FastAPI backend starter in [backend/](../../backend/).
- Optional backend container build and health check.
- OpenSpec starter layout and local change helper under [openspec/](../../openspec/).
- Delorean Evidence Bundle for verification and review.
- Local verification through [scripts/delorean/run-local-verification.sh](../../scripts/delorean/run-local-verification.sh).

Approval remains human-owned. The template can prepare evidence and approval context, but it does not approve work.

## Which prompt should I use?

Start with these main prompts for most tester work:

| Prompt | Use when |
|---|---|
| `dl-requirements-shape` | The idea is not clear enough for a spec, design, or task yet. |
| `dl-requirements-start` | A rough brief, requirements note, or issue should become the first active OpenSpec change package. |
| `dl-requirements-refine` | Requirements, scenarios, OpenSpec slices, tasks, validation, or lifecycle state need repair. |
| `dl-requirements-answer-questions` | OpenSpec proposal, design, task, or spec-delta open questions need repo resolution and focused human feedback. |
| `dl-requirements-archive` | A completed OpenSpec change should be archived into current specs after verification. |
| `dl-plan-refine` | The technical approach, impacted artifacts, design gaps, or slice plan need refinement. |
| `dl-ui-refine` | UI page pattern, route structure, navigation, GC Design System alignment, accessibility, bilingual behaviour, or UI evidence needs work. |
| `dl-plan-feature` | A scoped feature needs a full plan before implementation. |
| `dl-delivery-autopilot` | Active changes should progress across planning, implementation, QA, and review until blocked, complete, or limits are reached. |
| `dl-dev-continue` | An active change already exists and you want the next safe task. |
| `dl-dev-active-change` | One named or active change should continue ready local slices until blocked, complete, or the slice limit is reached. |
| `dl-dev-autopilot` | The repo queue should scan active OpenSpec changes and continue implementation-ready local slices across changes until blocked, complete, or limits are reached. |
| `dl-qa-commit-ready` | Staged work needs pre-commit and commit-message checks before a local commit. |
| `dl-qa-push-ready` | Local commits need full pre-push checks before updating a remote branch. |
| `dl-qa-check` | Implementation needs local verification, evidence, and issue capture. |
| `dl-qa-review` | A broad review is needed before developer readiness, release-readiness, or handoff. |

Examples:

- Refining OpenSpec: "Refine the OpenSpec slices for `<change-id>`."
- Answering OpenSpec questions: "List the open questions in `<change-id>` and ask me for the human decisions."
- Archiving OpenSpec: "Archive completed OpenSpec change `<change-id>`."
- Refining UI: "Refine the UI for `<change-id>`."
- Refining design: "Refine the design for `<change-id>`."
- Continuing next task: "Continue the next safe task for `<change-id>`."
- Continuing one change: "Run dev active change for `<change-id>` with a 3-slice limit."
- Continuing the queue: "Run dev autopilot across active changes with a 3-slice and 2-change limit."
- Commit readiness: "Make the staged changes commit-ready and commit with `<message>`."
- Push readiness: "Check this branch before push."

Use the prompt README for the full prompt picker, including advanced and targeted prompts. In generated VS Code solution repos it is `.github/prompts/README.md`; in the upstream template source it is `agent-configs/vscode/prompts/README.md`.

## Before you start

- Use Node.js 20.19.0 or higher for frontend tooling and the official OpenSpec CLI.
- Use Python 3.12 for the starter backend. The generated repo includes `.python-version`, and `make setup` creates or reuses `.venv` with Python 3.12.
- For containers, use a Docker-compatible local container runtime.
- On macOS, Colima with the Docker CLI is a supported option.
- Docker Desktop may be used only if approved by the organization.
- Do not commit `frontend/node_modules/`, real `.env` files, local certificates, caches, or generated outputs.

For Colima setup, see [container-local-build-and-run.md](container-local-build-and-run.md).

## 1. Install local dependencies

From the repo root:

```bash
make doctor
make setup
```

`make doctor` reports the current local readiness without changing files, installing dependencies, or starting services. `make setup` creates missing local `.env` files from safe examples, installs or verifies Node.js, installs the frontend dependencies, creates or reuses `.venv` with Python 3.12, installs backend development dependencies, and installs the official OpenSpec CLI. It finishes with the app ready to start through `make dev`.

For the fuller local Delorean bootstrap, including everything from `make setup` plus Delorean readiness checks:

```bash
make setup-delorean
```

By default these setup targets install the latest Node.js LTS through `nvm` when `nvm` is available. Use `make setup NODE_VERSION=node` for the latest current Node.js release, or `make setup NODE_VERSION=20.19.0` for the minimum OpenSpec-compatible version. Backend setup uses `python3.12` by default; set `PYTHON_BOOTSTRAP` or `PYTHON` only when the solution intentionally supports another interpreter path.

This is local developer setup only. `make setup` may create local env files from examples and install local app tooling. `make setup-delorean` runs local readiness checks after setup, but neither target must use production data, production secrets, external deployment targets, approval records, waivers, or release evidence.

If you do not want to install the optional OpenSpec CLI yet, run the app dependency targets instead:

```bash
make install-frontend-deps
make install-dev-python
```

The frontend target uses `npm ci` from [frontend/package-lock.json](../../frontend/package-lock.json) for repeatable installs.

The backend target creates or reuses `.venv` with Python 3.12 and installs development dependencies from [backend/requirements-dev.txt](../../backend/requirements-dev.txt).

The starter includes a local PostgreSQL example path. To exercise it end to end,
run `make db-up`, `make db-upgrade`, `make start-backend`, and then open the
frontend `Data example` page.

## 2. Create or inspect an OpenSpec starter change

If the solution repo has opted into the official OpenSpec CLI, confirm it is available:

```bash
make check-openspec-cli
```

Generated solution repos start without live example OpenSpec specs or changes.
Create a disposable local change if you want to test the OpenSpec path:

```bash
make new-openspec-change CHANGE_ID=first-local-check CAPABILITY=starter-capability TITLE="First Local Check"
```

The upstream template source keeps a small OpenSpec fixture for template smoke
testing, but the scaffold removes those example folders from generated solution
repos.

Use `make pick-openspec-change` to pick from active change folders, or
`make validate-active-openspec-change` to pick and validate an active change
without typing the change ID manually. Generated VS Code repos include matching
OpenSpec picker tasks.

OpenSpec specs are the current requirements and scenarios. OpenSpec changes are proposed work with proposal, design, tasks, and spec deltas. Use `tasks.md` for implementation, review, and verification checklist items.

OpenSpec does not replace tests, evidence, approval, waivers, or release readiness.

## 3. Run local verification

Run:

```bash
scripts/delorean/run-local-verification.sh
```

This runs structure checks, formatting checks, Markdown checks, shell checks when available, frontend checks, backend checks, secret checks, fast tests, and optional container checks.

If an optional tool is missing locally, the script should either skip clearly or explain what is needed. Record meaningful skipped checks in the Evidence Bundle when evidence packaging is in scope; at Level 2, include them in the verification summary.

## 4. Run the frontend and backend

Start the frontend and backend together from the repo root:

```bash
make dev
```

The frontend is available at `http://127.0.0.1:3000` and the backend health endpoint is available at `http://127.0.0.1:8000/health`.

Stop both services with Ctrl-C.

The dev servers bind to `127.0.0.1` by default. Do not expose them on all network interfaces unless you intentionally need that for a local test.

Use `make start-frontend` or `make start-backend` when you only need one service. Generated VS Code repos also include launch configurations for the starter app, pytest, Vitest, and browser debugging. See [frontend/README.md](../../frontend/README.md), [frontend/DEV_SETUP.md](../../frontend/DEV_SETUP.md), and [backend/README.md](../../backend/README.md) for service-specific commands and setup notes.

## 5. Run backend tests

Run backend tests:

```bash
make run-pytest
```

The backend does not require AWS, Redis, a database, an identity provider, external APIs, or secrets for the starter health check.

See [backend/README.md](../../backend/README.md) for backend commands and notes.

## 6. Build and run the backend container

Confirm your Docker-compatible local container runtime is running. For Colima:

```bash
colima start
docker info
docker run --rm hello-world
```

Build and run the backend container:

```bash
make build-backend-container
make run-backend-container
make test-backend-container
```

The container host port binds to `127.0.0.1` by default. Stop it when done:

```bash
make stop-backend-container
```

Container scans are optional in this generic template and may skip if no scanner is installed or configured.

## 7. Try a small Delorean change

Use a tiny change so the first test stays low risk:

1. Create a throwaway local OpenSpec package with `make new-openspec-change` if one does not already exist.
2. Update a sentence in that change package's `proposal.md` or `tasks.md`.
3. Make a small docs-only change or a code-comment-only change.
4. Run local verification again:

```bash
scripts/delorean/run-local-verification.sh
```

Use the five Delorean phases from the generated VS Code agent README at `.github/agents/README.md`, or from the upstream template source at `agent-configs/vscode/agents/README.md`: Spec, Plan, Implement, Verify, Release-ready.

## Test VS Code Agent Routing

When testing VS Code agent routing, the Coordinator should use a one-character
route selector in chat: `A` auto route, `S` clarify spec, `P` plan delivery,
`I` implementation, `V` verify/test, `R` release readiness, or `Q` ask a
question or paste the next prompt. The selected phase should run as a subagent
when the `agent/runSubagent` tool is available.

## 8. Fill in an Evidence Bundle

Create a test evidence note from [docs/templates/evidence-bundle-template.md](../templates/evidence-bundle-template.md).

For the first test, include:

- OpenSpec spec or change link.
- Change summary.
- Commands run.
- Frontend results.
- Backend results.
- Container build or skip reason.
- Secret check result.
- Skipped checks and reason.
- Remaining confusion or risk.
- Review or approval owner if this were a real change.

At Level 3, capture lightweight evidence summaries for meaningful changes and
create a formal Evidence Bundle when risk, baseline status, release context, or
the user requires it. At Level 4, do not treat the Evidence Bundle as optional
for meaningful changes. At Level 2, a concise verification summary is enough
unless the user asks for evidence packaging.

## 9. Record feedback

Record what was confusing or missing. Useful feedback includes:

- Setup steps that failed.
- Commands that were unclear.
- Docs that were hard to find.
- Checks that skipped without enough explanation.
- OpenSpec or evidence fields that were unclear.
- Any place that looked like it required production infrastructure.

Keep feedback specific enough that the template can be fixed.

## Troubleshooting

- Frontend type warning for `vite/client`: run `make install-frontend-deps`, then reload the editor TypeScript server.
- Frontend install warning about Node version: use a current Node 20 or 22 release.
- Backend import error: run commands from the repo root and install backend dev dependencies with `make install-dev-python`.
- Local verification skips shell checks: install ShellCheck or use the documented Docker fallback.
- Docker CLI missing: install the Docker CLI and a Docker-compatible local container runtime.
- Docker daemon unavailable with Colima installed: run `colima start`.
- Container port conflict: stop the process using port `8000` or set another `BACKEND_PORT`.
- Container scan skipped: install or configure Docker Scout, Trivy, or Grype, or record the skip reason.
- Approval question: use [approval-routing-and-reentry.md](approval-routing-and-reentry.md). Human approval is still required.
