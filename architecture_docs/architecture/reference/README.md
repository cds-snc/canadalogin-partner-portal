# Reference Architectures

Use this folder for reusable reference architectures.

A reference architecture is an approved default way to satisfy one or more
baseline profiles. It should map architecture choices to controls without
duplicating the control text.

Use [TPL-010: Reference Architecture Template](../../templates/architecture/tpl-010-reference-architecture-template.md)
for new reference architectures.

## Relationship To Baselines And Controls

A baseline defines the controls to assess for an app type. A reference
architecture defines a default implementation posture that covers some or all of
those controls.

Reference architectures should include:

- applicable baselines
- supported app types and non-goals
- architecture views
- required standards and patterns
- a baseline coverage map
- allowed variations
- variations that require ADRs
- evidence still required at release time

## Coverage Language

Use these terms in control coverage maps:

- `covered`: the reference architecture supplies the default approach.
- `partially_covered`: the reference architecture supplies part of the approach,
  but the project still needs a decision or evidence.
- `project_specific`: the project must decide or evidence this control.
- `not_applicable`: the control does not apply to this reference architecture.

## Reference Architecture Index

No reference architectures have been published yet.
