---
name: gc-review-a11y
description: Review Government of Canada UI code for accessibility barriers, WCAG 2.2 AA and AAA considerations, CAN/ASC EN 301 549 web requirements, semantic HTML, ARIA, keyboard and focus behavior, text alternatives, labels, language attributes, responsive reflow, and Canada.ca or GC Design System accessibility patterns. Use when asked for accessibility, a11y, WCAG, screen reader, keyboard, focus, form accessibility, or pre-release UI accessibility review.
---

# Purpose

Review changed UI code for accessibility risk before implementation, verification, or release continues.

This is a pattern-based review skill. It does not replace manual testing with assistive technology or a formal accessibility audit.

# Local wrapper metadata

Source: Local template wrapper, adapted from public Government of Canada accessibility review patterns and `dougkeefe/gc-code-skills`
Snapshot or version: Template starter, update when WCAG, Canadian accessibility guidance, or local accessibility standards change
Owner: Repo maintainers until replaced by a solution owner
Applies to phases: Plan, Verify, Release-ready
Skill perspective: Produces accessibility findings, remediation guidance, verification inputs, and evidence inputs for Delorean phase skills and agents.
Invocation criteria: Use when user-facing UI, forms, keyboard behavior, focus behavior, screen-reader behavior, or WCAG conformance needs explicit review.
Pre-handoff checks: Scope, standard basis, findings, remediation guidance, verification recommendations, traceability, evidence inputs, and human-review needs are named.
Related local gates: STD-017: Government of Canada Standards Review, STD-007: UI Accessibility Basics, [scripts/delorean/run-frontend-standards-checks.sh](../../../scripts/delorean/run-frontend-standards-checks.sh)
Refresh model: Review when GC accessibility expectations, WCAG guidance, tooling, or local UI standards change.

# Inputs

- Work request, diff, pull request, changed file list, or specific UI files.
- Known page type, user workflow, language behavior, and device constraints.
- Existing accessibility test results when available.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load the local references first, then load official external sources when current requirements or conformance detail matters.

# Procedure

1. Detect scope from staged changes, unstaged changes, branch diff, or user-specified files.
2. Review only UI-relevant files unless the user asks for a broader scan.
3. Read changed files in full, plus related layout, routing, component, form, style, and test files needed to understand rendered behavior.
4. Check semantic HTML, landmarks, heading order, table structure, keyboard operation, focus behavior, labels, text alternatives, ARIA usage, language attributes, status announcements, reflow, target size, visual contrast cues, and Canada.ca download or alert patterns.
5. Separate likely blockers from warnings and enhancements. Treat WCAG A and AA failures as blockers unless a human reviewer has accepted an exception. Treat AAA items as advisory unless the work explicitly targets AAA.
6. Recommend the smallest practical fix that preserves GC Design System component usage where possible.
7. Name verification that should follow, such as unit tests, component tests, browser checks, axe checks, keyboard walkthroughs, or manual assistive-technology review.
8. Map findings to the source request, issue, OpenSpec spec or change, scenario ID, or an explicit note that no traceability source was provided.
9. Prepare verification findings and evidence inputs for `delorean-evidence`, covering findings, remediation status, checks run or skipped, residual risk, and any waiver or human accessibility review need.
10. Mark the Delorean handoff state as `ready_for_evidence`, `changes_required`, `blocked`, or `needs_human_review`.

# Output Format

```text
Accessibility review:
- Scope reviewed:
- Standard basis:
- Overall status: pass | fail | warnings-only | incomplete
- Delorean handoff state:
- Traceability:
- Findings:
  - <severity> <file:line> <issue> -> <recommended action>
- Good patterns observed:
- Verification recommended:
- Evidence inputs:
- Waiver, re-entry, or human-review needs:
```

# Delorean output

When the invoking agent requests Delorean process output for an active change, return this block:

```text
GC overlay result:
- Change ID:
- Change-state path:
- OpenSpec reference:
- Area reviewed:
- Overall status: pass / warning / fail / incomplete / not applicable
- Gate affected:
- Findings:
- Required fixes:
- Suggested OpenSpec task updates:
- Suggested change-state updates:
- Evidence inputs for `delorean-evidence`:
- Skipped checks and reasons:
- Waiver or exception needed:
- Re-entry needed:
- Re-entry phase:
- Re-entry reason:
```

Do not mark a finding as resolved unless the fix and evidence are present.

Do not approve waivers, exceptions, risk acceptance, production actions, sensitive-data access, or release readiness.

# Escalation

Escalate when the UI blocks keyboard access, hides content from assistive technology, omits required labels or language context, has unclear bilingual accessibility behavior, or needs a formal accessibility decision. Escalation is a Delorean re-entry or human-review signal; do not approve the exception inside this skill.

# Source And Ownership

This local skill is adapted from Government of Canada accessibility review patterns and the public `dougkeefe/gc-code-skills` `gc-review-a11y` skill. Keep attribution when reusing this structure and verify official sources before relying on compliance details.
