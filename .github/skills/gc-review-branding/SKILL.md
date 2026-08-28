---
name: gc-review-branding
description: Review Government of Canada frontend code for GC Design System, Canada.ca layout, Federal Identity Program, mandatory header and footer elements, typography, color tokens, date modified, language toggle, breadcrumbs, site search, and design consistency. Use when asked for GC design review, Canada.ca styling, branding, FIP, GC Design System compliance, header, footer, layout, or visual standards review.
---

# Purpose

Review UI structure and styling for Government of Canada design, branding, and Canada.ca pattern alignment.

This is a pattern-based review skill. It does not replace departmental communications, Federal Identity Program, or design authority review.

# Local wrapper metadata

Source: Local template wrapper, adapted from public Government of Canada design review patterns and `dougkeefe/gc-code-skills`
Snapshot or version: Template starter, update when GC Design System, Canada.ca layout guidance, or local frontend standards change
Owner: Repo maintainers until replaced by a solution owner
Applies to phases: Plan, Implement, Verify, Release-ready
Skill perspective: Produces GC Design System, Canada.ca layout, FIP, custom UI exception, remediation, verification, and evidence inputs for Delorean phase skills and agents.
Invocation criteria: Use when GC Design System, Canada.ca layout, branding, FIP, header, footer, typography, color, page template, or custom UI exceptions need explicit review.
Pre-handoff checks: Scope, page type, findings, GC Design System usage, custom UI exceptions, verification recommendations, traceability, evidence inputs, and specialist-review needs are named.
Related local gates: STD-017: Government of Canada Standards Review, STD-005: Frontend GC Design System, STD-006: GC UI Page Layout Rules, [scripts/delorean/run-frontend-standards-checks.sh](../../../scripts/delorean/run-frontend-standards-checks.sh), [scripts/delorean/run-ui-page-shell-checks.sh](../../../scripts/delorean/run-ui-page-shell-checks.sh)
Refresh model: Review when GC Design System, Canada.ca layout guidance, FIP guidance, or local frontend standards change.

# Inputs

- Work request, diff, pull request, changed file list, or specific UI files.
- Known page type: standard, transactional, campaign, app shell, admin tool, or unknown.
- Known GC Design System components, custom component exceptions, and visual design notes.
- Known primary task navigation paths from `Home` or service home.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load local standards first and verify official references when mandatory page elements or policy details matter.

# Procedure

1. Identify page type, page pattern decision, and changed UI, layout, style, asset, or template files.
2. Read relevant header, footer, layout, route, component, asset, style, and theme files in full.
3. Check that the selected approved page pattern and page shell were followed.
4. Check that GC Design System components are used before custom equivalents.
5. Review Government of Canada signature, Canada wordmark, header-provided language toggle, search, menu, breadcrumbs, footer bands, privacy and terms links, typography, color tokens, date modified, and H1 treatment where they apply.
6. Flag duplicate standalone body language toggles unless an exception is recorded.
7. Check that multi-task services use a task-oriented entry page and separate destination routes instead of placing unrelated workflows on one page.
8. Check that primary task navigation paths are discoverable from `Home` or service home and do not rely on breadcrumbs, direct URLs, browser history, or unrelated pages as the main path.
9. Flag raw HTML controls or alert roles when an approved GC Design System component fits and no exception is recorded.
10. Flag mandatory element gaps separately from consistency warnings.
11. Record custom UI exceptions and whether the reason is clear enough for review.
12. Recommend concrete fixes and name follow-up accessibility, bilingual, and evidence checks.
13. Map findings to the source request, issue, OpenSpec spec or change, scenario ID, design note, or an explicit note that no traceability source was provided.
14. Prepare verification findings and evidence inputs for `delorean-evidence`, covering findings, custom UI exceptions, remediation status, checks run or skipped, residual risk, and any waiver or design/communications review need.
15. Mark the Delorean handoff state as `ready_for_evidence`, `changes_required`, `blocked`, or `needs_human_review`.

# Output Format

```text
GC design and branding review:
- Scope reviewed:
- Page type:
- Page pattern decision:
- Task branching:
- Primary task navigation paths:
- Header language toggle:
- Overall status: pass | fail | warnings-only | incomplete
- Delorean handoff state:
- Traceability:
- Findings:
  - <severity> <file:line> <issue> -> <recommended action>
- GC Design System components used:
- Raw HTML controls or custom navigation:
- Custom UI exceptions:
- Page shell checker:
- Verification recommended:
- Evidence inputs:
- Waiver, re-entry, approval, or specialist-review needs:
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

Escalate when mandatory Canada.ca elements are missing, GC Design System is bypassed without reason, Federal Identity Program assets are custom or unclear, a duplicate body language toggle replaces or repeats the header toggle without an exception, unrelated workflows are combined on one page without a recorded rationale, primary task navigation paths are unclear, raw HTML controls are used without a recorded exception, or the page type changes required header or footer behavior. Escalation is a Delorean re-entry or human-review signal; do not approve the exception inside this skill.

# Source And Ownership

This local skill is adapted from Government of Canada design review patterns and the public `dougkeefe/gc-code-skills` `gc-review-branding` skill. Keep attribution when reusing this structure and verify official sources before relying on compliance details.
