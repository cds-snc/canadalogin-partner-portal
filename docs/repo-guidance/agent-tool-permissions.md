# Agent Tool Permissions

Use this as the starter recommendation for Codex command rules, GitHub Copilot command auto-approval settings, and similar agent tool permissions.

These recommendations are meant to reduce repeated prompts for routine repository work. They do not replace local verification, evidence, approvals, or human review. Generated VS Code solution repos include conservative workspace defaults under `.vscode/`; personal or organization-level settings can still be stricter.

Use [control-boundaries.md](control-boundaries.md) before expanding command approvals, API access, MCP server access, file scopes, sensitive-data access, or generated-evidence handling.

## Codex Rules

Codex's official durable command mechanism is a `.rules` file with `prefix_rule()` entries. The usual user-level file is:

```text
~/.codex/rules/default.rules
```

Codex also scans rules under trusted team or project config locations at startup. Restart Codex after changing rule files.

When Codex offers to add a command to the allow list, it writes a `prefix_rule()` entry to the user-level `default.rules` file. Rules are experimental, so keep repo guidance separate from user or organization policy.

Example rule:

```python
prefix_rule(
    pattern = ["rg"],
    decision = "allow",
    justification = "Read-only repository search is safe for routine agent work",
)
```

Test a rules file before relying on it:

```bash
codex execpolicy check --pretty --rules ~/.codex/rules/default.rules -- rg TODO
```

The Codex IDE extension uses the Codex CLI and shared Codex config for behavior such as approvals and sandbox settings, so Codex rules should apply there as well. GitHub Copilot in VS Code uses different settings and does not read Codex `.rules` files.

## GitHub Copilot In VS Code

For GitHub Copilot agent mode in VS Code, configure terminal command auto-approval in VS Code settings with `chat.tools.terminal.autoApprove`. Use `true` to auto-approve a command or pattern and `false` to require approval. Regular expressions are wrapped in `/` characters.

Use User Settings JSON for personal approvals. The template commits shared VS Code defaults because generated Delorean repos are expected to run the same routine local checks. If a solution team or organization has a stricter policy, edit or remove `.vscode/settings.json` in that solution repo.

Template-owned source and generated target:

- Upstream source: `agent-configs/vscode/vscode/settings.json`
- Generated VS Code target: `.vscode/settings.json`
- Related extension recommendation source: `agent-configs/vscode/vscode/extensions.json`
- Generated VS Code extension recommendation target: `.vscode/extensions.json`
- Related launch configuration source: `agent-configs/vscode/vscode/launch.json`
- Generated VS Code launch configuration target: `.vscode/launch.json`
- Related task source: `agent-configs/vscode/vscode/tasks.json`
- Generated VS Code task target: `.vscode/tasks.json`
- Related OpenSpec picker source: `scripts/delorean/select-openspec-change.sh`

The generated default enables terminal auto-approval for read-only repo
inspection, the non-mutating doctor command, the active OpenSpec change picker,
Delorean check scripts, check-oriented Make targets, OpenSpec validation,
frontend lint/type/test commands, template update dry-runs, and architecture-doc
refresh dry-runs. It keeps deletes, destructive Git, Docker, GitHub CLI,
setup/install/start, format-fix, MCP, container, deploy, publish, and release
commands approval-gated.

Small example workspace or user setting:

```json
{
  "chat.tools.terminal.autoApprove": {
    "/^rg\\b[^>|;&]*$/": true,
    "/^git (status|diff|log|show|rev-parse|ls-files|grep|blame)\\b[^>|;&]*$/": true,
    "/^scripts\\/delorean\\/doctor\\.sh$/": true,
    "/^scripts\\/delorean\\/select-openspec-change\\.sh( --(list|print|validate))?( --change-id [a-z0-9][a-z0-9._-]*)?$/": true,
    "/^scripts\\/delorean\\/run-(structure-checks|delorean-state-checks|format-checks|markdown-checks|shellcheck|lint|secret-checks|fast-tests|openapi-checks|frontend-standards-checks|ui-page-shell-checks|local-verification)\\.sh$/": true,
    "/^make doctor$/": true,
    "/^make\\s+validate-openspec-change\\s+CHANGE_ID=(\"[a-z0-9][a-z0-9._-]*\"|'[a-z0-9][a-z0-9._-]*'|[a-z0-9][a-z0-9._-]*)\\s*$/": true,
    "/^make\\s+-C\\s+(\"[^\"]+\"|'[^']+'|[^\\s>|;&]+)\\s+validate-openspec-change\\s+CHANGE_ID=(\"[a-z0-9][a-z0-9._-]*\"|'[a-z0-9][a-z0-9._-]*'|[a-z0-9][a-z0-9._-]*)\\s*$/": true,
    "/^source\\s+\\.venv\\/bin\\/activate\\s*$/": true,
    "/^\\.\\s+\\.venv\\/bin\\/activate\\s*$/": true,
    "/^(\\.venv\\/bin\\/python3?|python3?)\\s+-m\\s+pytest\\b[^>|;&]*$/": true,
    "/^source\\s+\\.venv\\/bin\\/activate\\s+&&\\s+(\\.venv\\/bin\\/python3?|python3?)\\s+-m\\s+pytest\\b[^>|;&]*$/": true,
    "/^make (update-from-template-dry-run|update-architecture-docs-dry-run|update-agent-configs-dry-run)$/": true,
    "rm": false,
    "rmdir": false,
    "del": false,
    "docker": false,
    "gh": false,
    "/^git (add|commit|push|pull|fetch|clone|reset|clean|checkout|switch|merge|rebase|restore)\\b.*$/": false
  }
}
```

VS Code also has `chat.tools.terminal.enableAutoApprove` to enable or disable terminal auto-approval, and this setting may be managed by an organization. VS Code matches patterns against individual subcommands by default; all subcommands must match an allow rule and must not match a deny rule. Use the Command Palette action `Chat: Manage Tool Approval` for non-terminal tool approvals. File edit approvals are separate from terminal command approvals.

Reference: [VS Code: Use tools with agents](https://code.visualstudio.com/docs/copilot/agents/agent-tools).

## Safe Default Commands

These commands are reasonable defaults for durable approval because they inspect local files or run committed local check adapters:

- repo navigation, file discovery, and read-only file inspection: `pwd`, `cd`, `ls`, `rg`, `rg --files`, `cat`, `sed -n`, `head`, `tail`, `nl`, `wc`, `stat`, `file`
- read-only `find` forms, such as `find . -type f -name "*.md" -print`; avoid broad `find` approvals when the tool cannot rule out `-delete`, `-exec`, or other write actions
- read-only Git inspection: `git status`, `git diff`, `git log`, `git show`, `git rev-parse`, `git ls-files`, `git grep`, `git blame`
- non-mutating local diagnostics: `make doctor`, `scripts/delorean/doctor.sh`
- active OpenSpec change picking: `make pick-openspec-change`, `make validate-active-openspec-change`, `scripts/delorean/select-openspec-change.sh --list`, `scripts/delorean/select-openspec-change.sh --print`, `scripts/delorean/select-openspec-change.sh --validate`
- local Python test setup and focused pytest runs: `source .venv/bin/activate`,
  `. .venv/bin/activate`, `python -m pytest <args>`, and
  `.venv/bin/python -m pytest <args>` without shell-control characters
- local verification adapters:
  - `scripts/delorean/run-structure-checks.sh`
  - `scripts/delorean/run-delorean-state-checks.sh`
  - `scripts/delorean/run-format-checks.sh`
  - `scripts/delorean/run-markdown-checks.sh`
  - `scripts/delorean/run-shellcheck.sh`
  - `scripts/delorean/run-lint.sh`
  - `scripts/delorean/run-secret-checks.sh`
  - `scripts/delorean/run-fast-tests.sh`
  - `scripts/delorean/run-openapi-checks.sh`
  - `scripts/delorean/run-frontend-standards-checks.sh`
  - `scripts/delorean/run-ui-page-shell-checks.sh`
  - `scripts/delorean/run-local-verification.sh`
- read-only or check-oriented Make targets: `make help`, `make help-all`, `make check-node`, `make check-openspec-cli`, `make validate-openspec-change CHANGE_ID=<id>`, `make -C <repo> validate-openspec-change CHANGE_ID=<id>`, `make fmt-ci-python`, `make lint-python`, `make run-pytest`, `make check-openapi`
- dry-run template refresh checks: `make update-from-template-dry-run`, `make update-existing-solution-dry-run`, `make update-architecture-docs-dry-run`, `make update-agent-configs-dry-run`

When an agent asks to run one of these repeatedly, prefer granting a durable command-prefix rule if the tool supports it.

## Useful After Local Setup

These commands are useful, but they may need dependencies, write generated output, or talk to a local container runtime. Approve them intentionally after the repo owner confirms the local setup:

- dependency and local bootstrap commands: `make setup`, `make setup-delorean`, `make install-node`, `make setup-python-venv`, `make install-frontend-deps`, `make install-dev-python`, `make install-openspec-cli`, `make check-delorean-setup`, `npm ci --prefix frontend`
- formatting or generated-output commands: `make fix`, `make autofix`, `make format-fix`, `scripts/delorean/run-autofix.sh`, `make fmt-python`, `make export-openapi`, `npm run format --prefix frontend`, `npm run fix --prefix frontend`
- local starter service commands: `make start-frontend`, `make start-backend`, `make start-dev`, `make dev`
- backend container checks: `scripts/delorean/run-container-checks.sh`, `make build-backend-container`, `make test-backend-container`, `make scan-backend-container`
- local agent-run capture: `make collect-agent-run`, `scripts/delorean/collect-agent-run.sh`
- template refresh helpers that update files: `make update-from-template`, `make update-existing-solution`, `make update-architecture-docs`, `make update-agent-configs`, `scripts/delorean/update-from-template.sh` without `--dry-run`, and `scripts/delorean/update-architecture-docs.sh` without `--dry-run`

## Keep Approval-Gated

The `dl-qa-commit-ready` and `dl-qa-push-ready` prompts should use the allowed
read-only Git inspection and local verification adapters where possible. Keep
the actual `git commit` and `git push` commands approval-gated unless the user
explicitly asks for that workflow and the target scope is clear.

Do not broadly auto-approve commands that can destroy data, publish artifacts, expose secrets, or affect remote systems:

- destructive file or Git commands, including `rm`, `git reset`, `git clean`, and broad `git restore`
- Git commands that publish or finalize work, including `git commit`, `git push`, and pull request creation, unless the user explicitly asks for that workflow
- commands that deploy, publish packages or images, mutate cloud resources, sync external systems, or change repository settings
- commands that pass secrets on the command line or print secret-bearing environment values
- broad `find` rules that also permit `-delete`, `-exec`, or write actions
- broad shell prefixes such as `sh`, `bash`, `zsh`, `python`, `python3`, `node`, or `npm` without a specific script or argument prefix
- OpenSpec mutation commands such as apply, sync, archive, or commands that commit generated OpenSpec changes, unless the user intentionally starts that authoring or release-readiness step and reviews the branch diff
- OpenSpec install or update commands that change global developer-machine tooling, unless the repo has intentionally opted into the official CLI
- commands that add new MCP servers, API clients, external data sources, network destinations, or sensitive-data access without a control-owner review

## Maintenance

Update this file when local scripts, Make targets, hooks, prompts, agents, skills, workflows, or MCP tool access guidance changes. Keep entries specific enough that a future solution repo can approve normal agent work without also approving deployment, destructive cleanup, or secret-handling commands.
