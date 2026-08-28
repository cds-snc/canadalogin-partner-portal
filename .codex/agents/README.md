# Codex Custom Agents

Codex loads each standalone TOML file in this folder as a project-scoped custom
agent. The filename matches the agent's `name` for predictable handoffs.

| Agent | Purpose |
|---|---|
| [Builder General](builder-general.toml) | Support implementation for API, UI, data, backend, tooling, and mixed work with an implementation and testing loop. |
| [Coordinator](coordinator.toml) | Route incoming Delorean work to the right prompt, skill, or agent and keep handoffs clear. |
| [Delivery Planner](delivery-planner.toml) | Turn approved intent into practical OpenSpec task, verification, and evidence planning. |
| [QA Support](qa-support.toml) | Help verify a change and confirm evidence is clear, useful, and traceable. |
| [Release Readiness](release-readiness.toml) | Check whether verified work is ready for human release approval. |
| [Spec Author](spec-author.toml) | Shape or update OpenSpec and related design notes so intended behavior is clear and traceable. |

Each agent file must define non-empty `name`, `description`, and
`developer_instructions` strings. Keep reusable workflows under
`.agents/skills/`.
