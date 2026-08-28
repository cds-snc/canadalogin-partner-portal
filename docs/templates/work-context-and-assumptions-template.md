# Work Context And Assumptions

Use this when a change needs clear local, shared-environment, or production boundaries.

## Work Context

- Local developer / localhost: yes by default unless the request says otherwise.
- Shared non-production environment: not used yet unless a target is named.
- Production: not in scope unless a human explicitly approves production work.

## Known Facts

- Source request:
- Related issue, OpenSpec change, or design note:
- Affected area:
- Known constraints:

## Safe Assumptions

- The first implementation and verification path is local-only.
- Test data, fixtures, mocks, or stubs are acceptable until a real non-production target is named.
- Real secrets, production identifiers, and production data must not be used.
- Reusable artifacts should use durable domain or environment-path names, not localhost-only names. Keep local-only names for disposable fixtures, local config values, and examples that will not be promoted.
- Local evidence inputs are not approval records.

## Naming For Reuse

- Reusable code, API, database, queue, feature flag, service, environment variable, documentation, and evidence identifiers:
- Disposable local fixture or example identifiers:
- Environment-specific values that stay in config, `.env.local`, fixtures, or deployment parameters:
- Names that must wait for a named shared environment or production decision:

## Suggested Options

Recommended option:

- Build or update the local spec, code, tests, and evidence inputs first.

Other options:

- Prepare a shared non-production plan and leave deployment blocked until the target environment, access path, data rules, and rollback path are known.
- Prepare a production-readiness checklist only. Do not perform production work until approval, target, rollback, monitoring, and evidence expectations are known.

## Human Decisions Needed

Before shared non-production work:

- Target environment:
- Access owner:
- Secret source:
- Data classification:
- Rollback or cleanup path:

Before production work:

- Production target:
- Human approval record:
- Change or release owner:
- Rollback plan:
- Monitoring and evidence expectations:

## Traceability

- OpenSpec spec or change:
- Requirements or business rules:
- Scenarios:
- Tests or checks:
- Evidence Bundle:
- Approval or waiver record:
