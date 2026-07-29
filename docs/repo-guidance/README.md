# Repo Guidance

This folder is the repo map and rulebook. It is not a first-use reading path.

Use it when you are changing repo structure, ownership rules, update behavior,
agent/tool permissions, adoption level, OpenSpec routing, or architecture
document lookup. Agents and skills also load these files to avoid guessing
where work belongs.

## Files

- [Where things go](where-things-go.md)
- [Ownership and updates](ownership-and-updates.md)
- [Architecture docs](architecture-docs.md)
- [Adoption levels](adoption-levels.md)
- [OpenSpec and Delorean](openspec-and-delorean.md)
- [Control boundaries](control-boundaries.md)
- [Agent tool permissions](agent-tool-permissions.md)

Use:

- [docs-audience.md](docs-audience.md) when moving or consolidating Markdown.
- [where-things-go.md](where-things-go.md) when you need the local folder map.
- [ownership-and-updates.md](ownership-and-updates.md) when deciding which artifact owns a change.
- [architecture-docs.md](architecture-docs.md) when resolving architecture `STD-*`, `PAT-*`, `BAS-*`, `GC-WEB-*`, `TPL-*`, `REF-*`, or `ADR-*` IDs.
- [adoption-levels.md](adoption-levels.md) when changing Level 2, 3, or 4 expectations.
- [agent-tool-permissions.md](agent-tool-permissions.md) when adjusting recommended local agent command approvals or generated VS Code workspace recommendations, debug configurations, and shortcuts.
- [openspec-and-delorean.md](openspec-and-delorean.md) when connecting OpenSpec to evidence, approvals, waivers, and tests.
- [control-boundaries.md](control-boundaries.md) before expanding tool, API, MCP, file-scope, environment, sensitive-data, or audit boundaries.

Related reference:

- [docs/reference/agent-run-log-bundles.md](../reference/agent-run-log-bundles.md)
- [docs/reference/openspec-lifecycle.md](../reference/openspec-lifecycle.md)
- [docs/reference/update-from-template.md](../reference/update-from-template.md)
