# Codex Agent Adapters

<!-- delorean-template:codex-generated from agent-configs/vscode/agents/*.agent.md; run scripts/delorean/sync-codex-adapters.sh --write -->

These Codex role adapters are generated from the VS Code agent catalog. Edit the VS Code source files under `agent-configs/vscode/agents/`, then run `scripts/delorean/sync-codex-adapters.sh --write`.

Use these files as the role source for Codex subagents when the runtime exposes multi-agent delegation. If subagent delegation is not available, read the target file and continue in the current Codex session using that role contract.

## Agents

| Role | Description |
|---|---|
| [Builder General](builder-general.md) | Support implementation for API, UI, data, backend, tooling, and mixed work with an implementation and testing loop. |
| [Coordinator](coordinator.md) | Route incoming Delorean work to the right prompt, skill, or agent and keep handoffs clear. |
| [Delivery Planner](delivery-planner.md) | Turn approved intent into practical OpenSpec task, verification, and evidence planning. |
| [QA Support](qa-support.md) | Help verify a change and confirm evidence is clear, useful, and traceable. |
| [Release Readiness](release-readiness.md) | Check whether verified work is ready for human release approval. |
| [Spec Author](spec-author.md) | Shape or update OpenSpec and related design notes so intended behavior is clear and traceable. |

## Adapter Rules

- Do not edit these generated Codex adapters directly in the template.
- Do not add VS Code frontmatter or VS Code-specific tool names.
- Keep portable skills under `.agents/skills/`.
