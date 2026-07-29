# Delorean Helper Scripts

Store small scripts used by active GitHub Actions workflows, local hooks, and template maintenance.

Keep scripts focused and easy to review.

Starter scripts:

- [run-structure-checks.sh](run-structure-checks.sh): confirms the starter template paths are present.
- [run-delorean-state-checks.sh](run-delorean-state-checks.sh): checks existing `delorean/evidence/*/change-state.yaml` files for basic required keys and matching change IDs.
- [run-autofix.sh](run-autofix.sh): runs configured safe auto-fixers such as frontend `npm run fix`, backend Black, Ruff when configured, and basic whitespace or final-newline fixes.
- [run-format-checks.sh](run-format-checks.sh)
- [run-markdown-checks.sh](run-markdown-checks.sh)
- [run-shellcheck.sh](run-shellcheck.sh)
- [run-lint.sh](run-lint.sh)
- [run-frontend-standards-checks.sh](run-frontend-standards-checks.sh): checks GC Design System packages, CSS import, component usage, and raw HTML control usage.
- [run-ui-page-shell-checks.sh](run-ui-page-shell-checks.sh): checks the starter frontend for required page shell and shared menu markers.
- [run-secret-checks.sh](run-secret-checks.sh)
- [run-fast-tests.sh](run-fast-tests.sh)
- [run-local-verification.sh](run-local-verification.sh)
- [collect-agent-run.sh](collect-agent-run.sh): saves a local review bundle from an agent run, including optional logs, repo context, and changed tracked or untracked text files.
- [check-openspec-scenario-preservation.js](check-openspec-scenario-preservation.js): checks modified OpenSpec requirement deltas so archive does not drop existing scenarios that should be preserved.
- [create-openspec-change.sh](create-openspec-change.sh): creates a local-first OpenSpec change package without needing the official OpenSpec CLI.
- [select-openspec-change.sh](select-openspec-change.sh): lists, picks, or validates an active OpenSpec change from `openspec/changes/`.
- [sync-codex-adapters.sh](sync-codex-adapters.sh): regenerates Codex role and prompt adapters from the VS Code agent and prompt source files, or checks that they are in sync.
- [update-architecture-docs.sh](update-architecture-docs.sh): refreshes generated `architecture_docs/` from `delorean_architecture` without running a broader template update.
- [update-from-template.sh](update-from-template.sh): pulls template-owned files from the upstream template into an existing solution repo. It can run from the solution repo root or from a separate template checkout with `--target`.

Active workflows and hooks should call these scripts instead of duplicating the checks inline.
