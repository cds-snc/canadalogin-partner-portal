# Control Boundaries

Use this when a workflow may use agents, skills, APIs, MCP servers, external tools, privileged commands, sensitive data, or generated evidence.

The security boundary applies to the whole delivery process, not only to AI behavior. People, agents, skills, prompts, APIs, MCP servers, CI jobs, validation tools, environments, and evidence stores should operate inside an explicit permission profile.

## Check Before Work Starts

### Default work context

If the user has not named an environment, use the local developer / localhost context from STD-002: Work Contexts. That means local services, fake or test-only data, no real secrets, no production data, no deployment, and no external system changes.

Only move from local work to a shared environment or production when the target, access path, data rules, secret source, rollback or cleanup path, and evidence expectations are known. Production also needs explicit human approval and release ownership.


### Durable names for reusable local work

Local-first does not mean local-only naming. When a local implementation,
spec, migration, API route, service, queue, bucket placeholder, feature flag,
environment variable, IAM role placeholder, or evidence artifact is intended to
survive into shared non-production or production, name it for the real domain
concept or intended environment path. Keep the local difference in values,
configuration, fixtures, or deployment parameters.

Use localhost-specific names only for disposable artifacts that will not be
promoted or reused. For reusable artifacts, avoid `local-*`, `test-*`,
`fake-*`, `demo-*`, and similar names in source-controlled identifiers unless
the name describes a genuinely disposable fixture. Production-suitable names
must not include real production hostnames, account IDs, credentials, secret
values, personal information, or live data.


Identify:

1. Work scope: system, repo, branch, files, services, environments, and artifacts in scope.
2. Permission profile: allowed tools, commands, agents, skills, repositories, file paths, APIs, MCP servers, and environments.
3. Denied scope: files, systems, data classes, commands, network targets, environments, or actions that are not allowed.
4. Auth path: required account, token, service principal, app registration, secret source, or approval path for each API, MCP server, runner, or environment.
5. Allowlists: approved agents, tools, APIs, MCP servers, commands, network destinations, data sources, and validation runners.
6. Data classification: public, internal, sensitive, personal information, secrets, credentials, production data, security findings, or incident material.
7. Sensitive-data handling: whether the workflow may read, write, summarize, export, log, or include sensitive data in prompts or evidence.
8. Audit expectations: which tool calls, approvals, permission changes, exceptions, waivers, and release-relevant events need evidence.
9. Exception path: who can approve expanded access, new tools, new MCP servers, sensitive-data use, or bypasses, and when the exception expires.
10. Naming posture: which created identifiers are reusable beyond localhost and therefore need durable domain or environment-path names, and which identifiers are disposable local fixtures.

## Required Output

When a control boundary matters, include:

- work context: local developer / localhost, shared non-production environment, or production
- permission profile name or summary
- allowed tools, APIs, MCP servers, and file scope
- denied or out-of-scope areas
- sensitive-data classification and handling rule
- naming rule for reusable artifacts versus disposable local fixtures
- required approvals or exceptions
- audit or Evidence Bundle entries to preserve
- open control gaps that block work or require escalation
- suggested safe default when a required non-local or production detail is missing
