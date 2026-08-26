# ADR-004: Application and RP Configuration Hierarchy

Type: Architecture Decision Record
Status: Accepted

## Date

2026-08-12

Scope-alignment amendment: 2026-08-25

## Context

The portal currently exposes workspace-owned `application_information` and
`rp_application` records as peer user concepts. In practice, Application
information contains the shared public service identity and onboarding
context, while each RP row contains one environment-specific technical
registration. The optional link between them and the duplicate
`/your-applications` projection obscure that relationship.

Partners may have several of their own deployment environments connected to
one CanadaLogin environment. Therefore an Application can require several RP
configurations targeting the same CanadaLogin Test, Staging, or Production
environment. Environment alone is not a usable configuration identity.

The current Application-information detail page also combines several user
goals and permission contexts, and contact records duplicate a person's name
by official language.

## Baseline and control impact

- Applicable baseline: `BAS-001: Government of Canada Web Application
  Baseline`.
- Affected controls: `GC-WEB-002`, `GC-WEB-003`, `GC-WEB-004`, `GC-WEB-005`,
  `GC-WEB-006`, `GC-WEB-007`, `GC-WEB-008`, `GC-WEB-009`, and `GC-WEB-010`.
- Baseline status impact: applies.
- Evidence needed before release: page-pattern and responsive evidence,
  accessibility and bilingual checks, migration integrity, API and
  authorization tests, privacy/PII review, audit minimization, and safe legacy
  redirect verification.

## Standard, pattern, control, or baseline decision

- Applicable guidance: `STD-002`, `STD-004` through `STD-010`, `STD-012`,
  `STD-013`, `STD-017` through `STD-020`, `PAT-001`, `PAT-012`, `PAT-013`,
  `PAT-014`, `PAT-017`, `PAT-019`, `PAT-020`, `PAT-022`, and `PAT-023`.
- Decision type: follows.
- Reason: the hierarchy reflects current ownership, removes duplicate
  experiences, supports several same-environment configurations, and splits
  unrelated page tasks while preserving server-owned workspace authorization.
- Risk or trade-off: current route and API names conflict with the new product
  vocabulary and require staged compatibility.
- Mitigation: expand/backfill/contract data migration, nested canonical routes,
  authorized redirect resolvers, explicit orphan mapping, and bounded API
  compatibility.
- Owner: Partner Portal product and engineering team.
- Review trigger: a requirement for Application-specific grants, a Partner
  entity spanning workspace boundaries, replacing the partner-defined
  environment label with a controlled taxonomy, or a provider model that no
  longer maps one RP record to one technical registration.
- Related schema contract: the applicable standards, patterns, controls, and
  baseline schemas referenced above.
- Related waiver or evidence record: none.

## Reference architecture impact

- Reference architecture: none currently approved for `BAS-001`.
- Relationship: not applicable.
- Variation summary: none.
- Follow-up needed in the reference architecture: none.

## Decision

The durable product hierarchy is:

```text
Department
└── Partner workspace
    └── Application
        ├── Application contacts
        ├── Checklist items and CATS evidence context
        └── RP configurations
            ├── Registration completion metadata
            └── Production-review records
```

The Partner workspace is the collaboration, tenancy, and authorization
boundary and remains associated with exactly one Department. Its canonical
role applies to every Application and RP configuration in that workspace.

The current `application_information` record is the Application parent. It
owns bilingual public service names, onboarding narrative, contacts, and the
item-level checklist/CATS context required to make missing artifacts visible.
It does not own an overall readiness score, completion count, submit-ready
state, or internal review notes/outcomes. The CATS evidence mechanism remains
an explicit product TBD: this ADR does not choose upload, external reference,
or both.

The current `rp_application` record is presented as one RP configuration. A
partner-visible RP configuration belongs to exactly one Application, targets
exactly one CanadaLogin environment, and has one required locale-neutral
configuration name. Each new partner-created RP configuration also has one
required locale-neutral Partner environment label describing the partner-side
deployment, such as `QA 2` or `Partner staging`. It is distinct from the
configuration name, CanadaLogin environment, and English/French Application
environment URLs. An Application may have any number of configurations in the
same CanadaLogin environment, and several Partner environments may connect to
that target. A configuration's stable UUID remains its identity; this decision
does not impose name or Partner-environment uniqueness.

An RP configuration has an editable incomplete registration draft and separate
technical completion metadata. Technical completion does not submit, review,
approve, deploy, or launch the configuration. Production review is a separate
explicit record for a selected Production configuration: absent until a
partner request creates `pending`, then `approved` or `rejected` only when a CL
Admin records the out-of-band outcome. Copying any source into Production
creates an independent draft and does not create or advance review state.

The portal stores Partner environment as top-level RP metadata and does not
infer it from configuration names, URLs, provider metadata, source records, or
CanadaLogin targets. Retained records without a trustworthy value remain
readable as `Not provided` until an authorized confirmation or separately
approved mapping supplies it. Progression or cloning selects one source
configuration, requires an explicit Partner environment for the distinct named
target, and records lineage; it never infers a unique target from environment
alone.

Application contacts use first name, last name, bilingual responsibility or
title values, email, and optional phone numbers. Person names are not
duplicated by official language for new canonical writes. Existing English and
French person-name fields remain available through non-lossy dual reads until
shared-target data and caller evidence permits a separate contraction; English
and French responsibility values remain supported.

The Application overview is a concise task hub. Details, Checklist and
evidence, Contacts, and RP configurations use focused child routes. Production
review is a focused action for one selected Production RP configuration, not an
Application-wide internal review destination.
RP configurations use a compact GCDS comparison table with contextual create
paths. Application deletion remains a secondary focused confirmation rather
than a user-facing Settings task. Checklist and evidence uses a compact
itemized breakdown without an aggregate score.
The duplicate `/your-applications` root is retired in favour of `/workspaces`,
with bounded authorized redirects for saved RP links.

Current table and versioned API names may remain compatibility implementation
details during staged migration. They do not define the user-facing domain.

## Options considered

### Option 1: Keep Application information and RP applications as workspace peers

- Benefits: smallest immediate code change.
- Costs: preserves duplicate names, long pages, optional parent links, and two
  list experiences.
- Risks: users continue to interpret one service and its technical
  configurations as unrelated records.

### Option 2: Make Application the parent with one RP per environment

- Benefits: simple three-environment diagram and uniqueness constraint.
- Costs: cannot represent partners with several clients or deployment
  environments connected to the same CanadaLogin environment.
- Risks: forces record reuse or overwrites and makes legitimate registrations
  impossible to distinguish.

### Option 3: Make Application the parent with many named RP configurations

- Benefits: matches partner deployment reality, makes ownership and labels
  explicit, keeps shared bilingual metadata in one place, and supports focused
  task pages.
- Costs: requires data, route, contract, terminology, and saved-link migration.
- Risks: incomplete parent/name backfill could hide or misroute legacy records;
  mitigated through explicit mapping and fail-closed cutover checks.

## Consequences

- Application becomes the main business/service aggregate in product language.
- RP configuration becomes the technical child and can repeat Partner and
  CanadaLogin environments; exact duplicate displayed identity triples use a
  short public reference while the stable UUID remains record identity.
- Registration completion and Production review are independent state domains;
  neither defines a generic Workspace/Application lifecycle.
- Item-level checklist/CATS visibility remains part of the Application, while
  aggregate readiness and internal review surfaces are retired.
- Workspace authorization remains broad across all child resources; this ADR
  does not create Application-specific grants.
- Public Application names are not recollected in each registration.
- Contacts require a deliberate, non-lossy migration from legacy bilingual
  fields.
- Current workspace RP URLs collide with the new Application route shape and
  require a staged authorized resolver.
- Provider candidates remain outside the partner hierarchy until adoption
  chooses a workspace and Application.
- Database table and API route renames are deferred until compatibility callers
  are retired.

## Baseline gate impact

At Delorean Level 2, the affected controls and expected evidence are recorded
in the active OpenSpec package. Formal baseline status, waiver, or release
approval is not created by this ADR. Any shared or production rollout requires
the target-specific migration, privacy, security, accessibility, bilingual,
and rollback evidence expected by the release process.

## Review triggers

- Workspace roles no longer apply uniformly to all Applications.
- One Application must span more than one Partner workspace.
- A persisted Partner organization becomes necessary above workspaces.
- Reporting or governance needs to replace the partner-defined environment
  label with a controlled taxonomy.
- CanadaLogin changes from one technical registration per RP record.
- Compatibility data or route constraints prevent the recorded hierarchy from
  being enforced safely.

## Links

- [Application hierarchy change](../../../openspec/changes/archive/2026-08-13-organize-applications-and-rp-configurations/)
- [Approved-scope alignment change](../../../openspec/changes/align-partner-portal-to-approved-product-scope/)
- [Partner Portal Onboarding PRD](../../plans/partner-portal-onboarding-prd.md)
- [Partner Portal MVP PRD](../../plans/partner-portal-mvp.md)
- `ADR-003: Casbin Authorization Model`
- `BAS-001: Government of Canada Web Application Baseline`
- `PAT-001: UI Page Patterns`
- `PAT-012: Alembic PostgreSQL Change`
- `PAT-017: Itemized Data Display`
- `PAT-022: Page Length and Splitting`
- `PAT-023: Frontend Data Table`
