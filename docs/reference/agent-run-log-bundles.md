# Agent Run Log Bundles

Use this guide when you want to save enough local context from an agent run to review later in Codex, ChatGPT, or another assistant.

The bundle collector is intentionally local-first. By default it writes to `.delorean/agent-runs/`, which is ignored by Git. Raw agent logs, exported transcripts, terminal output, and model responses can contain secrets, personal information, credentials, local paths, or approval-sensitive details. Review bundles before sharing them or turning them into evidence.

## Create A Bundle

From the repo root:

```bash
make collect-agent-run
```

Add a useful name, notes, and one or more exported logs:

```bash
make collect-agent-run COLLECT_AGENT_RUN_ARGS='--name auth-debug --note "Asked agent to debug auth failure" --log ./agent-terminal.log'
```

Run the script directly when quoting is easier:

```bash
scripts/delorean/collect-agent-run.sh --name auth-debug --log ./agent-terminal.log --notes-file ./notes.md
```

The script creates a timestamped folder with:

- repo status, diffs, and changed worktree file contents for tracked and untracked text files,
- recent commits,
- selected tool versions,
- supplied notes,
- supplied log or transcript files,
- local `AGENTS.md` when present and available agent customization context unless `--no-agent-config` is used. In the upstream template this includes `agent-configs/`; in generated repos it includes materialized paths such as `.github/agents/`, `.github/prompts/`, `.github/skills/`, `.agents/skills/`, `.codex/`, and `.claude/`.

The script applies lightweight redaction to copied text files by default. This is only a guardrail. It does not replace manual review.

Changed worktree files are copied under `worktree/changed-files/` by default. This matters when an agent creates new files such as `openspec/changes/<change-id>/...`; plain `git diff` does not include untracked file contents. Use `--no-worktree-files` only when you intentionally want status and diffs without file snapshots.

## Save As Evidence

Use `--evidence` only when the bundle has been reviewed and is appropriate to keep under `delorean/evidence/agent-runs/`:

```bash
scripts/delorean/collect-agent-run.sh --name release-review --evidence --log ./review-transcript.log
```

Raw logs are not approval records. If the work needs formal evidence, summarize the useful parts in [docs/templates/evidence-bundle-template.md](../templates/evidence-bundle-template.md) and link the reviewed bundle only when it is safe to preserve.

## Working On Agents And Skills

When the task is to design, test, or improve local agent or skill files, treat those files as artifacts under review. In the upstream template source they live under `agent-configs/vscode/agents/` and `agent-configs/shared/skills/`; in generated VS Code solution repos they are materialized under `.github/agents/` and `.github/skills/`. They may be incomplete or wrong. The agent performing the work should follow the active system, developer, user, and local repo instruction file when one is present, then inspect the local agent and skill files as source material to improve.

Do not assume that a draft local agent or skill is authoritative for the current task just because it is included in a review bundle.
