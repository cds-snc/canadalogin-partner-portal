---
name: gc-review-bilingual
description: Review code for Government of Canada official languages and bilingual service support, including English/French translation coverage, hardcoded user-facing strings, translation key parity, locale-aware routes, language toggle behavior, localized date and number formatting, and translated accessibility attributes. Use when asked for bilingual, i18n, localization, French, English, OLA, official languages, translation parity, or content-language review.
---

# Purpose

Review user-facing code and content for bilingual service risks.

This is a pattern-based review skill. It does not replace official translation, legal review, or an Official Languages Act compliance assessment.

# Local wrapper metadata

Source: Local template wrapper, adapted from public Government of Canada official-language review patterns and `dougkeefe/gc-code-skills`
Snapshot or version: Template starter, update when official-languages expectations, i18n tooling, or local content standards change
Owner: Repo maintainers until replaced by a solution owner
Applies to phases: Plan, Implement, Verify, Release-ready
Skill perspective: Produces official-languages, translation-parity, i18n, remediation, verification, and evidence inputs for Delorean phase skills and agents.
Invocation criteria: Use when user-facing content, translation files, locale routing, language switching, hardcoded strings, or bilingual accessibility text need explicit review.
Pre-handoff checks: Scope, i18n pattern, translation sources, findings, translation follow-ups, verification recommendations, traceability, evidence inputs, and specialist-review needs are named.
Related local gates: STD-017: Government of Canada Standards Review, STD-005: Frontend GC Design System, [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md)
Refresh model: Review when official-languages expectations, translation workflow, locale routing, or local content standards change.

# Inputs

- Work request, diff, pull request, changed file list, or specific UI/content files.
- Known i18n framework, locale routing pattern, translation files, and language toggle behavior.
- Known scope for English, French, or bilingual release.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load only references that match the framework and files under review.

# Procedure

1. Detect changed UI, template, content, route, locale, translation, and configuration files.
2. Identify the i18n framework or translation pattern.
3. Locate English and French translation sources when present.
4. Check hardcoded user-facing strings, hardcoded accessibility text, key parity, placeholder translations, suspicious identical long values, locale-aware routing, language toggle equivalence, dynamic `lang`, and locale-aware date, number, and currency formatting.
5. For GC Design System pages, confirm the language toggle is provided by the header or `gcds-header` language-toggle support when bilingual routes exist. Flag duplicate standalone body toggles unless the page pattern decision records an exception.
6. Do not flag technical identifiers, CSS classes, import paths, test-only strings, log-only strings, or proper nouns as translation issues without context.
7. Separate release blockers from warnings and content follow-ups.
8. Recommend fixes that add or use translation keys without inventing final French copy unless the user asks for draft wording.
9. Map findings to the source request, issue, OpenSpec spec or change, scenario ID, content/design note, or an explicit note that no traceability source was provided.
10. Prepare verification findings and evidence inputs for `delorean-evidence`, covering findings, translation follow-ups, remediation status, checks run or skipped, residual risk, and any waiver or official-languages review need.
11. Mark the Delorean handoff state as `ready_for_evidence`, `changes_required`, `blocked`, or `needs_human_review`.

# Output Format

```text
Bilingual review:
- Scope reviewed:
- i18n framework or pattern:
- Translation files:
- Language toggle:
- Overall status: pass | fail | warnings-only | incomplete
- Delorean handoff state:
- Traceability:
- Findings:
  - <severity> <file:line> <issue> -> <recommended action>
- Translation follow-ups:
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

Escalate when content parity is unclear, a translation is missing for release-critical user flow, language switching may lose user data, or a qualified translator or official-languages reviewer is needed. Escalation is a Delorean re-entry or human-review signal; do not approve the exception inside this skill.

# Source And Ownership

This local skill is adapted from Government of Canada official-language review patterns and the public `dougkeefe/gc-code-skills` `gc-review-bilingual` skill. Keep attribution when reusing this structure and verify official sources before relying on compliance details.
