# TPL-010: Reference Architecture Template

Type: Template
Status: Active

Use this template for new `REF` documents. Assign the ID using [STD-001: Document Identifiers](../../standards/std-001-document-identifiers.md) before publishing.

## Document Header

```markdown
# REF-000: <Reference Architecture Name>

Type: Reference Architecture
Status: Draft
```

## Context

- <System, product, service, or delivery context this reference architecture fits.>
- <Primary constraints, assumptions, and non-goals.>

## Applicable Baselines

- <BAS-000: Baseline name>

## Views

- <Diagram, C4 view, deployment view, data view, sequence view, or operational view.>
- <Diagram-as-code source or link when available.>

## Baseline Coverage Map

Use `covered`, `partially_covered`, `project_specific`, or `not_applicable`.

| Control | Coverage | Reference Architecture Position | Project Evidence Still Needed |
|---|---|---|---|
| <CONTROL-ID> | <coverage> | <Default architecture posture.> | <Evidence, ADR, or assessment note.> |

## Required Standards

- <STD-000: Standard name>

## Related Patterns

- <PAT-000: Pattern name>

## Allowed Variations

- <Variation that still conforms to the reference architecture.>

## ADR Required When

- <Variation, accepted risk, deferred control, exception, or project-specific
  decision that must be recorded in an ADR.>

## Release Evidence

- <Evidence a project still needs even when following this reference architecture.>

## Checks

- [ ] <Check that confirms the reference architecture is applicable.>
- [ ] <Check that confirms applicable baselines and controls are mapped.>
- [ ] <Check that confirms required standards and related patterns were reviewed.>
- [ ] <Check that confirms variations, exceptions, and follow-up decisions are recorded.>
