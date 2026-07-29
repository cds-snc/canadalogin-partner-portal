# STD-002: Work Contexts

Type: Standard
Status: Active

## Read This When

Use this standard when a change mentions localhost, environments, deployment, secrets, data, external services, or production.

## Rules

### Default Rule

When the request does not clearly name an environment, assume:

- actions are performed from a local developer context,
- services run on `127.0.0.1` or `localhost`,
- data is fake, seeded, or test-only,
- real secrets are not available and must not be requested,
- no production action, deployment, archive, approval, or waiver is implied,
- real external or shared dependencies are not assumed to be available or
  authorized.

This default limits execution and access. It does not make the solution
architecture local-only or permit different API, domain, persistence, session,
or authorization contracts merely because implementation and verification run
locally.

### Context Types

| Context | What it means | Default posture | What must be known before using it |
|---|---|---|---|
| Local developer / localhost | Actions run on one developer machine, usually with local services and test data. Each required dependency is explicitly real, substituted, or unavailable. | Safe execution default when no environment is named. Select each dependency mode independently of work context, based on that dependency's availability and authorized access. | Repo paths, local ports, fake data shape, solution target, dependency modes, and local verification commands. |
| Shared non-production environment | Work touches a shared dev, test, staging, sandbox, or demo environment outside the developer machine. | Do not assume access. Prepare the change, but stop before deployment, changes, or real credentials. | Environment name, URL or account, data type, secret source, access owner, rollback or cleanup path, and verification expectations. |
| Production | Work touches real users, real production data, production secrets, production infrastructure, or production operations. | Treat as out of scope unless the user explicitly says production work is intended. | Human approval, change record, exact target, secret source, blast radius, rollback plan, monitoring, verification, and release owner. |

### Work Context And Dependency Mode

Work context answers where actions may run and what infrastructure, data,
secrets, or approvals may be accessed. Solution target and dependency mode
answer what architecture is being implemented and which configured
implementation currently supplies each capability. Decide them separately.

- Identify the target dependency and its application-facing contract before
  selecting an implementation mode.
- Use a real dependency only when its target is known, available, and access is
  authorized for the declared work context.
- Availability governs which implementation may be executed and verified in
  the current context; it does not prevent provider-neutral implementation of a
  known target contract or real adapter when that work is in delivery scope.
- When a required dependency is unavailable or outside authorized scope, use an
  explicitly configured stub, fake, simulator, local service, or other safe
  substitute when the contract is known. Local development will commonly
  substitute more dependencies, but shared non-production contexts may also
  use substitutes and local work may use an explicitly authorized sandbox.
- Keep real and substituted implementations behind the same application-owned
  boundary. Preserve canonical request, response, event, session, policy, and
  important failure semantics that the application depends on.
- Select dependency mode at configuration or composition boundaries. Do not
  spread work-context checks through domain behavior or user-interface logic.
- Never switch to a substitute merely because credentials are missing or a
  connection fails. Shared-environment substitution must be explicit.
  Production must reject development or test substitutes unless an explicit
  architecture decision defines a safe production mode.
- Record which dependencies were substituted, what the substitute proves, and
  which real-integration behavior remains unverified.

Use [PAT-025: Dependency Substitution](../patterns/full-stack/pat-025-dependency-substitution.md)
for the reusable implementation and verification shape.

## Structure

### Work Context Declaration

Use this shape when a change touches an environment, data source, secret,
external service, deployment, or approval boundary:

The values below are illustrative. Keep the field names stable, but adapt the
values to the actual context. For example, `context_type` can be
`local_developer`, `shared_non_production`, or `production`; `external_systems`
names target systems or is an empty list, while `dependency_modes` records which
real, local, substituted, or unavailable implementation supplies each target.

```yaml
work_context:
  context_type: local_developer
  environment: localhost
  solution_target: project_selected_runtime
  data_type: fake_seeded_or_test_only
  secrets_source: placeholders_only
  external_systems:
    - identity_provider
  dependency_modes:
    - dependency: identity_provider
      mode: simulator
      reason: target provider sandbox is unavailable and access is not authorized
      configuration: explicit provider-mode setting
      remaining_verification:
        - real provider redirect, callback, and claim mapping
  allowed_actions:
    - edit local files
    - run local tests
    - start local services
  stop_conditions:
    - real credentials are needed
    - shared environment deployment is requested
    - production data is required
  verification:
    - local unit tests
    - local browser check
```

Fields:

- `context_type`: `local_developer`, `shared_non_production`, or
  `production`.
- `environment`: local host, named environment, account, URL, or deployment
  target.
- `solution_target`: the project-selected runtime or architecture being
  implemented; it is independent from where the current actions run.
- `data_type`: fake, seeded, test-only, shared non-production, production,
  sensitive, or unknown.
- `secrets_source`: placeholders, local `.env`, CI secret, platform secret,
  managed secret store, or unknown.
- `external_systems`: target systems or an empty list.
- `dependency_modes`: real, local service, stub, fake, simulator, other
  substitute, or unavailable mode for each dependency, including the reason,
  configuration boundary, and remaining verification.
- `allowed_actions`: what the work may do in the named context.
- `stop_conditions`: what requires human approval, more information, or a new
  work context.
- `verification`: checks that are valid for the named context.

## Examples

### Recommended Local Defaults

Use these defaults unless the repo has a different local standard:

- frontend host: `127.0.0.1`
- frontend port: `3000`
- backend host: `127.0.0.1`
- backend port: `8000`
- API base URL for local frontend calls: `http://127.0.0.1:8000`
- local data: fake, seeded, fixture, or test-only data
- secrets: placeholders in `.env.example`; no real values in prompts, logs, code, or verification
- integrations: use an explicitly configured contract-compatible substitute
  when a required target dependency is unavailable or access is not authorized
- verification: local verification notes are not approval records

## Checks

### When To Escalate

Escalate or stop when the next step would:

- read, write, deploy to, or change a shared environment without a named target and access path,
- use real credentials, certificates, tokens, or production identifiers,
- affect production users, production data, production logs, production secrets, or production operations,
- create an approval, waiver, release decision, archive result, or verification record on behalf of a human,
- widen file scope, tool access, MCP access, network access, or data access beyond the current permission profile.

- [ ] The work context is named or the local developer default is used.
- [ ] The solution target is not redefined merely because actions run locally.
- [ ] Environment-sensitive work has a work context declaration.
- [ ] Each required dependency is recorded as real, substituted, or unavailable
      based on availability and authorized access.
- [ ] Substitutes preserve the target application contract, are explicitly
      configured, and cannot activate through silent production fallback.
- [ ] Verification records substituted behavior and remaining real-integration
      gaps.
- [ ] Shared-environment and production assumptions are explicit before work continues.
- [ ] Secrets, real data, and external system access are handled only when explicitly in scope.

## Related Standards And Patterns

- [STD-013: Security and Privacy Basics](std-013-security-and-privacy-basics.md)
- [STD-014: Secrets and Configuration](std-014-secrets-and-configuration.md)
- [STD-016: Container Build and Deployment](std-016-container-build-and-deployment.md)
- [PAT-025: Dependency Substitution](../patterns/full-stack/pat-025-dependency-substitution.md)

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-002-WORK-CONTEXTS](../schemas/standards/std-002-work-contexts.schema.yaml)
- Used for: helping agents and reviewers separate execution context from
  solution target, select dependency modes, identify stop conditions, and
  record evidence for secrets, real data, external systems, substitutions, and
  approval boundaries.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
