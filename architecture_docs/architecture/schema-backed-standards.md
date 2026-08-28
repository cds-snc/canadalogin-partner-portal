# Schema-Backed Standards

Type: Architecture Guidance
Status: Active

## Purpose

Schema-backed standards use simple machine-readable files to help agents and
tools apply standards consistently. The standard explains the rule in human
language. The schema contract defines the checks, evidence, exceptions, and
review information that should be recorded when the standard applies.

Schema contracts are support files. They make shared guidance easier to route,
check, and review, but they do not replace the standard, pattern, control,
baseline, ADR guidance, or template they support.

Use [Schema Contract Authoring](schema-contract-authoring.md) to create or
update a schema contract. Use
[TPL-014: Schema Contract Template](../templates/schemas/tpl-014-schema-contract-template.md)
for the contract shape.

## Responsibility Split

`delorean_architecture` owns shared architecture guidance:

- standards
- patterns
- controls
- baselines
- reference architecture guidance
- architecture templates
- shared schema contracts for those documents

`delorean_template` owns project-local Delorean process assets:

- process schemas under `delorean/schemas`
- prompt and agent wiring
- local gate definitions
- evidence bundles
- waiver records
- handoff and re-entry process records
- local validation scripts

Project repos may use both. They use generated `architecture_docs` for shared
standards and schema contracts, and `delorean/schemas` for local Delorean
process contracts.

## Source Of Truth

Human-readable documents remain the source of truth:

- a `STD` document explains the standard
- a `PAT` document explains the pattern
- a `GC-WEB` or other control document explains the control
- a `BAS` document explains the baseline
- an ADR records a durable project decision
- a verification note or baseline assessment records review evidence

If a schema contract and its supporting document disagree, follow the document
and update the schema contract.

Catalogs such as `docs/standards/catalog.yml`, `docs/patterns/catalog.yml`,
`docs/controls/catalog.yml`, and `docs/baselines/catalog.yml` are routing and
registry files. They help tools find the right guidance. They are not runtime
process schemas.

Use `docs/schemas/catalog.yml` as the searchable registry for shared
architecture schema contracts.

## Architecture-Owned Schema Contract Categories

Use these categories for schema contracts owned by this repo:

| Category | Supports | What it helps record |
|---|---|---|
| Standard schema contract | A `STD` document. | Applicable checks, evidence, exceptions, and review fields for the standard. |
| Pattern schema contract | A `PAT` document. | Fit criteria, required decisions, adaptation notes, and review evidence for using or varying from a pattern. |
| Control schema contract | A `GC-WEB` or other control document. | Applicability, control status, evidence expectations, exceptions, and related standards. |
| Baseline schema contract | A `BAS` document. | Baseline profile fields, referenced controls, assessment statuses, and review evidence expected for the baseline. |
| Decision schema contract | ADR-style decisions about following, varying from, or not following guidance. | Decision scope, affected guidance, reason, owner, trade-off, review trigger, and links. |
| Evidence schema contract | Architecture review evidence shapes, such as verification notes or baseline assessments. | Checks run, results, gaps, follow-up, assessment evidence, and related decisions. |

Do not define prompt, agent, skill, gate, re-entry, compliance-log, or other
runtime process schemas as architecture-owned schema contracts. Those belong in
`delorean_template`.

## How Agents And Reviewers Use Them

Agents and tools use schema contracts to:

- find the shared guidance that applies to a change
- ask for the right review information
- check that required fields are present
- keep standards impact, baseline assessment, ADR, and verification records
  shaped consistently
- point reviewers to missing evidence, missing decisions, or visible exceptions

Reviewers use the same contracts to see whether a project considered the right
standard, pattern, control, or baseline. The contract supports review; the
supporting document explains the rule.

## Local Evidence And ADRs

This repo may define reusable evidence shapes, such as verification note or
baseline assessment fields. The actual project evidence belongs in the project
repo or in the project-local Delorean process.

If a project decides not to follow an applicable standard or pattern, record the
reason in a local project ADR. The ADR should name the standard or pattern,
explain the reason, describe the risk or trade-off, identify the owner, and
state when the decision should be reviewed. If a delivery gate also needs a
waiver, record the waiver in the project-local Delorean evidence process.

Use this distinction:

- ADR: durable project decision about architecture, design, or standard
  variation.
- Waiver: delivery or gate exception for a specific check, time period, release,
  or risk acceptance.

The same approach applies when a project varies from an applicable control,
baseline requirement, or reusable pattern. Make the decision visible in a local
ADR, then use the project-local process for any gate waiver or time-limited
exception.

## Keep Out Of This Repo

Do not add project-local runtime process files to this repo. Keep reusable
runtime/process assets in `delorean_template`; project repos store their local
records and generated evidence:

- prompt, agent, skill, or workflow process schemas
- gate definitions and re-entry rules
- generated evidence bundles
- waiver records
- local validation scripts
- local CI output
- project-specific approval records
