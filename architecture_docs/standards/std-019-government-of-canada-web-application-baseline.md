# STD-019: Government of Canada Web Application Baseline Governance

Type: Standard
Status: Active

## Read This When

Use this when creating, changing, reviewing, or releasing any Government of
Canada web application.

Use this before implementation when a change may affect public-facing or
internal-facing web UI, service workflows, APIs, data collection, identity,
security, privacy, information management, deployment, or release evidence.

Use this with [STD-017: Government of Canada Standards Review](std-017-gc-standards-review.md)
to decide when the active web application baseline applies and what evidence is
needed before release.

## Active Baseline

The active baseline is
[BAS-001: Government of Canada Web Application Baseline](../baselines/bas-001-government-of-canada-web-application-baseline.md).

Supporting files:

- [Control catalog](../controls/catalog.yml) provides the reusable control
  registry.
- [BAS-001 machine-readable profile](../baselines/bas-001-government-of-canada-web-application-baseline.controls.yml)
  provides a routing and automation view of the active baseline profile.
- [TPL-011: GC Web Application Baseline Assessment Template](../templates/review/tpl-011-gc-web-application-baseline-assessment-template.md)
  provides a fillable assessment record for releases and meaningful service
  changes.

## Rules

- Every Government of Canada web application MUST be assessed against the active
  baseline before first release.
- Meaningful changes to UI, content, APIs, data, identity, security, privacy,
  information management, deployment, or operations MUST update the baseline
  assessment for affected controls.
- Each baseline control MUST be recorded as `applies`, `not_applicable`,
  `deferred`, or `exception`.
- A baseline control that applies MUST have evidence before the baseline gate
  passes.
- A deferred control MUST name the owner, reason, target date or release, and
  risk accepted until completion.
- An exception MUST name the requirement, rationale, owner, approval path, and
  follow-up condition.
- Project, departmental, or program-specific standards MAY add stricter
  controls. They MUST NOT weaken the active baseline without a recorded
  exception.
- Controls SHOULD describe reusable obligations or review expectations.
  Baselines SHOULD compose controls into app-type profiles. Local release
  mechanics, project CI commands, team approvals, and one-off evidence belong in
  standards, templates, or project-owned assessment records.
- Reference architectures MAY be associated with a baseline to provide default
  control coverage for a supported app type.
- Reference architectures SHOULD include a baseline coverage map.
- Material variations from a reference architecture SHOULD be recorded in an
  ADR. Variations that create a deferred control, exception, or accepted
  baseline risk MUST be recorded in an ADR or baseline assessment record.
- Current Government of Canada policy instruments MUST be checked when
  compliance risk matters, because federal policy, standards, and guidance can
  change.

## Structure

### Baseline Assessment Record

Use this shape in implementation plans, PR descriptions, architecture notes, or
verification notes when a Government of Canada web application is created,
changed, or released.

```yaml
gc_web_application_baseline:
  baseline: BAS-001
  baseline_version: "2026.05"
  scope:
    application: example-service
    audience: public
    release_or_change: initial release
    assessed_by: delivery team
    assessed_on: 2026-05-12
  controls:
    GC-WEB-001:
      status: applies
      evidence:
        - service scope recorded
      exceptions: []
    GC-WEB-002:
      status: applies
      evidence:
        - GC Design System page shell used
        - desktop and mobile screenshots captured
      exceptions: []
  gate:
    result: pass
    open_risk: none
    release_owner: service owner
```

Use stable control statuses:

- `applies`: the control is in scope and evidence is required.
- `not_applicable`: the control is out of scope and the reason is recorded.
- `deferred`: the control is accepted later with an owner and target.
- `exception`: the control will not be met as written and has an approval path.

### Baseline Gate

The baseline gate is the local release decision that confirms applicable
baseline controls have evidence or explicitly accepted risk.

The baseline gate MUST include:

- completed applicability record for all controls in the active baseline
- evidence for each applicable control
- recorded exceptions, deferred controls, skipped checks, and residual risks
- owner approval for any release with open baseline risk
- verification appropriate to the change, such as tests, screenshots, review
  notes, CI results, accessibility checks, security checks, or standards impact
  evidence

## Examples

- Use the control documents for control intent.
- Use the baseline document for app-type applicability.
- Use the machine-readable control catalog when automation needs stable IDs,
  titles, categories, and related standards.
- Use the machine-readable baseline profile when automation needs the list of
  controls for an app type.
- Use a reference architecture when the project matches a supported app type and
  needs a default architecture posture for satisfying baseline controls.
- Use the assessment template when a release or meaningful service change needs
  a human-readable baseline decision.
- Do not add project-specific release evidence to the baseline itself.
- Do not treat baseline gate mechanics as `GC-WEB-*` controls.

## Checks

- [ ] The active baseline is identified.
- [ ] All active baseline controls have a status.
- [ ] Applicable controls have evidence.
- [ ] Deferred controls have an owner, target, and accepted risk.
- [ ] Exceptions have rationale, owner, approval path, and follow-up condition.
- [ ] The standards impact block is complete for meaningful service changes.
- [ ] The baseline gate result is recorded before release.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-019-GC-WEB-APPLICATION-BASELINE](../schemas/standards/std-019-gc-web-application-baseline.schema.yaml)
- Used for: helping agents and reviewers check baseline selection, control
  assessment, release readiness evidence, deferred controls, exceptions, open
  risks, and ADR triggers.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
