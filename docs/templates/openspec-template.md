# <Capability> Specification

Use this as a small helper template for an OpenSpec `spec.md` file.

For current behavior, place it under:

```text
openspec/specs/<capability>/spec.md
```

For a proposed change, place the delta under:

```text
openspec/changes/<change-id>/specs/<capability>/spec.md
```

Keep proposed or in-progress behavior under `openspec/changes/<change-id>/` until implementation and verification are complete. Lightweight developer readiness at Level 2, or release-readiness at higher levels, archives completed active changes with `openspec archive <change-id> --yes`, which updates `openspec/specs/` and moves the change package under `openspec/changes/archive/`.

OpenSpec is the functional spec and planning layer. Delorean evidence, approvals, waivers, and release readiness stay outside OpenSpec.

When the request does not name an environment, assume local developer / localhost work only. Record fake-data, no-secret, and no-production assumptions using STD-002: Work Contexts.

For active changes, keep implementation tasks plus review and verification checklist items in `openspec/changes/<change-id>/tasks.md`. Do not create a separate OpenSpec review checklist unless the solution intentionally adopts a custom schema.

## Purpose

Describe the capability and the user or system outcome.

## Requirements

### Requirement: <business-rule-id when useful> <name>

A short, testable requirement statement.

Traceability note: add a Delorean business-rule ID when the requirement represents a rule, for example `BR-123`.

#### Scenario: <scenario-id when useful> <name>

- GIVEN ...
- WHEN ...
- THEN ...

Traceability note: add a Delorean scenario ID when the scenario needs stable traceability, for example `SCN-123`.

#### Scenario: <scenario-id when useful> <name>

- GIVEN ...
- WHEN ...
- THEN ...

## Links

- OpenSpec change:
- Related issue:
- Related design:
- Related ADR:
- Evidence Bundle:
- Standards and patterns:
- Work context: local developer / localhost, shared non-production environment, or production
- Safe assumptions:
- Human decisions needed before non-local or production work:
- Lifecycle state:
- Validation command:
- Archive required before merge or release:

## Delta Spec Notes

When this file is used as a change delta, use OpenSpec delta headings such as:

- `## ADDED Requirements`
- `## MODIFIED Requirements`
- `## REMOVED Requirements`

Use `## MODIFIED Requirements` as a full replacement for the target
requirement. To append a scenario to an existing requirement, include the
current requirement text and every existing scenario that should remain, then
add the new scenario. Do not include only the new scenario unless the omitted
scenarios are intentionally being removed.

Keep implementation detail and checklist items in `design.md` or `tasks.md`, not in `spec.md`.
