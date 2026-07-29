---
name: delorean-evidence
description: Assemble or update a Delorean Evidence Bundle from verification results, findings, skipped checks, OpenSpec traceability, control-boundary notes, and release-readiness inputs when an agent or user explicitly needs evidence packaging.
---

# Purpose

Assemble or update the review-facing Evidence Bundle for a scoped change.

This skill packages evidence. It does not run tests, perform standards review,
approve waivers, accept risk, or decide release readiness. Other skills produce
evidence inputs; this skill turns those inputs into a coherent bundle when the
invoking agent says evidence packaging is in scope.

# Use when

Use this skill when the user or invoking agent asks to:

- create or update `delorean/evidence/<change-id>/evidence-bundle.md`
- consolidate verification results, skipped checks, screenshots, findings, and
  remediation status
- map evidence back to OpenSpec requirements, scenarios, issues, tests, gates,
  baseline controls, approvals, waivers, or release-readiness context
- prepare evidence for QA Support or Release Readiness

# Inputs

- Change ID, issue, pull request, or scenario reference.
- Verification summaries, commands run, command results, skipped checks, and
  skipped-check reasons.
- OpenSpec change path, current spec references, requirements, scenarios, and
  validation status when relevant.
- Findings and remediation status from `delorean-review`, `delorean-testing`,
  `delorean-ui`, `gc-standards`, or targeted `gc-review-*` skills.
- UI evidence such as page pattern decision, page shell checker result,
  screenshots, accessibility result, design-system checklist, and custom UI
  exceptions when relevant.
- Baseline assessment inputs such as BAS-001 applicability, affected
  `GC-WEB-*` controls, control evidence, deferred controls, exceptions,
  reference architecture relation, ADRs, and baseline gate status when relevant.
- Control-boundary notes, work context, permission exceptions, approval or
  waiver records, and release-readiness context when relevant.
- Existing Evidence Bundle path when one already exists.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load only the
template and local guidance needed for the current evidence package.

# Output Scope

This skill is adoption-level agnostic. The invoking agent decides whether an
Evidence Bundle is required by [delorean/config.yaml](../../../delorean/config.yaml),
the current phase, or the user's explicit request. At Level 2, prefer a concise
verification summary unless the user asks for evidence packaging.

# Procedure

1. Identify the change ID and target Evidence Bundle path. Use
   `delorean/evidence/<change-id>/evidence-bundle.md` unless the repo already
   has a different path for the change.
2. Read the existing Evidence Bundle if present. Preserve useful existing
   evidence and links.
3. Read the template at
   [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md)
   when creating a new bundle or when required sections are missing.
4. Gather only available evidence inputs. Do not invent command results,
   approvals, waivers, screenshots, or review outcomes.
5. Link evidence back to OpenSpec requirements, scenarios, issues, tests,
   contracts, baseline controls, screenshots, check output, approval records,
   waivers, or change-state when those artifacts exist.
6. Record skipped checks with clear reasons. A skipped check is not a pass.
7. Keep the Evidence Bundle review-facing: concise, factual, and link-heavy.
   Avoid copying full OpenSpec requirements, long logs, or large review outputs.
8. Mark gaps clearly as `missing`, `not run`, `not applicable`, or `needs
   owner` instead of hiding them.
9. When gate tracking or change-state is in scope, suggest updates to
   `change-state.yaml`; do not mark gates as passed unless evidence exists.
10. Do not approve release readiness, waivers, exceptions, production actions,
    sensitive-data access, or risk acceptance.

# Expected output

```text
Evidence packaging result:
- Change ID:
- Evidence Bundle path:
- Sources reviewed:
- Evidence added:
- Evidence gaps:
- Skipped checks recorded:
- OpenSpec links:
- Test or verification links:
- Findings and remediation status:
- Baseline assessment status:
- Affected controls:
- Approval or waiver links:
- Suggested gate or change-state updates:
- Remaining risks:
- Ready for QA Support or Release Readiness:
```

# Escalate when

- Evidence inputs conflict with implementation, OpenSpec, tests, or findings.
- Required evidence is missing for a release-readiness or approval-sensitive
  decision.
- A command result, screenshot, waiver, approval, or review outcome is claimed
  but no source exists.
- Sensitive data, real secrets, production data, or protected environment
  evidence would be included without an approved control boundary.

# Source and ownership

- This is a local template wrapper.
- Delorean core remains the source of truth for shared evidence expectations.
- Solution repos may customize local evidence examples, but should not silently
  change approval, waiver, risk acceptance, or release-readiness authority.
