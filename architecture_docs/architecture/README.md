# Architecture

Store architecture notes, diagrams, reference architectures, and decisions here.

Use [TPL-005: Architecture Note Template](../templates/architecture/tpl-005-architecture-note-template.md)
for small architecture notes.

Use [TPL-006: ADR Template](../templates/architecture/tpl-006-adr-template.md)
for durable architecture decisions.

Use [TPL-010: Reference Architecture Template](../templates/architecture/tpl-010-reference-architecture-template.md)
for reusable architecture references.

## Folders

- [adrs/](adrs/) stores durable architecture decision records.
- [reference/](reference/) stores reusable reference architectures.

## Baseline-To-Architecture Workflow

Use this workflow when starting or materially changing a Government of Canada or
CDS web application:

1. Identify the app type and service context.
2. Select the applicable baseline profile from [docs/baselines](../baselines/).
3. Review the controls referenced by that baseline from [docs/controls](../controls/).
4. Select a reference architecture from [reference/](reference/) when one fits.
5. Record ADRs for material choices, accepted risks, deferred controls,
   exceptions, or variations from the reference architecture.
6. Capture baseline assessment evidence before release.

## Document Roles

| Document type | Purpose |
|---|---|
| Standard | Defines the rule, governance, or process that applies. |
| Control | Defines a reusable assessable requirement or review expectation. |
| Baseline | Composes controls into an app-type profile. |
| Reference architecture | Defines a default architecture posture that satisfies a baseline profile. |
| ADR | Records a durable project or reference-architecture decision. |
| Verification note | Records evidence, gaps, skipped checks, and follow-up. |

## Schema-Backed Standards

Schema-backed standards are described in
[Schema-Backed Standards](schema-backed-standards.md).
Use [Schema Selection](schema-selection.md) to select standards, patterns,
controls, baselines, and related schema contracts for a change.
Use [Schema Contract Authoring](schema-contract-authoring.md) when creating or
updating shared architecture schema contracts.

In this repo, schema contracts help agents, tools, and reviewers apply shared
standards, patterns, controls, baselines, ADR guidance, and review evidence
shapes consistently. They do not replace the human-readable documents, which
remain the source of truth.

Project-local Delorean process schemas belong in `delorean_template` under
`delorean/schemas`. That includes process schemas for prompt and agent wiring,
evidence bundles, gates, waiver records, re-entry behavior, and validation
scripts.

## Traceability

For meaningful service changes, keep this chain visible:

```text
baseline -> controls -> reference architecture -> ADRs -> verification evidence
```

If a project follows a reference architecture, it can reuse that architecture's
default control coverage. Any material variation should be recorded in an ADR or
baseline assessment exception.

For schema-backed architecture work, also keep this chain visible:

```text
standard/pattern/control/baseline -> schema contract -> project ADR or review evidence
```
