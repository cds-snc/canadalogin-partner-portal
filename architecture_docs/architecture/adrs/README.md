# Architecture Decision Records

Use this folder for durable project or reference-architecture decisions.

ADRs explain choices, trade-offs, deviations, accepted risks, and review
triggers. They should not duplicate baseline controls. Instead, they should name
the affected baseline, controls, and reference architecture.

Use [TPL-006: ADR Template](../../templates/architecture/tpl-006-adr-template.md)
for new ADRs.

## When An ADR Is Needed

Create or update an ADR when a decision:

- chooses a material architecture approach
- varies from an approved reference architecture
- does not follow an applicable standard, pattern, control, or baseline
  requirement
- changes how a baseline control is satisfied
- accepts risk, defers a control, or records a baseline exception
- changes identity, privacy, security, information management, hosting, data, or
  integration posture
- creates a decision that future teams should not rediscover from code alone

## Relationship To Baselines And Controls

An ADR should answer:

- which baseline applies
- which controls are affected
- whether the reference architecture still applies
- whether the decision creates an exception or deferred control
- what evidence is needed before the baseline gate can pass

## Non-Adoption And Waivers

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

## ADR Index

No ADRs have been published yet.
