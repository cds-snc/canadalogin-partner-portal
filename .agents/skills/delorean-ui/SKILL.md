---
name: delorean-ui
description: Refine user-facing UI decisions, page patterns, route structure, GC Design System alignment, accessibility, bilingual behaviour, and UI evidence.
---

# Purpose

Help plan, refine, implement, review, or repair user-facing UI work in a Delorean change.

This skill is the main UI focus skill. It uses the existing UI page pattern and GC review skills when needed.

# Use when

Use this skill when work touches:

- a user-facing page
- page layout
- route structure
- service home or task hub
- navigation
- shared menu
- forms
- multi-step flows
- header
- footer
- breadcrumbs
- language toggle
- GC Design System components
- custom UI exceptions
- accessibility evidence
- bilingual evidence
- UI screenshots
- UI review findings

# Modes

Use one of these modes:

- `select-page-pattern`
- `refine-ui-design`
- `fix-ui-implementation`
- `review-ui`
- `prepare-ui-evidence`
- `fix-accessibility`
- `fix-bilingual`
- `continue-ui-task`

# Inputs

- Change ID, issue, scenario, or task.
- Active OpenSpec change when available.
- `change-state.yaml` when available.
- Page or route affected.
- Current UI files.
- Page pattern decision when it exists.
- Design notes or screenshots when available.
- Accessibility, bilingual, or design-system findings when available.
- Work context and control boundary.

# Output Scope

This skill is adoption-level agnostic. The invoking agent decides whether Delorean process artifacts such as change-state, gates, evidence packaging, approval or waiver context, release-readiness context, or subagent handoffs are required. Use or suggest those artifacts only when they are provided, requested, or required by the invoking agent.

# Procedure

1. Identify the mode.
2. Identify the change ID and current Delorean phase.
3. Read active OpenSpec artifacts when available.
4. Read change-state and gate catalog when available and in scope.
5. Identify whether the UI change affects page structure or only a small implementation detail.
6. If page structure is affected, confirm or create a page pattern decision before implementation.
7. Confirm:
   - page role
   - page type
   - home page or service home
   - route map
   - primary task navigation paths
   - shared menu update
   - header and footer
   - language toggle behaviour
   - form pattern
   - GC Design System component mapping
   - custom UI exceptions
8. For implementation fixes, compare current UI files against the decision and the GC Design System component plan.
9. For review, use the existing `review-gc-design-system-alignment` skill.
10. For accessibility, bilingual, or branding issues, use the targeted `gc-review-*` skills.
11. Update OpenSpec `tasks.md` when UI tasks are added, completed, or reopened.
12. Update change-state when gates, evidence inputs, blockers, re-entry, or next task change and change-state is in scope.
13. Record evidence needs:
   - desktop screenshot
   - mobile screenshot
   - accessibility result
   - design-system checklist
   - custom UI exceptions
   - skipped checks and reasons

# Expected output

```text
UI refinement result:
- Change ID:
- Change-state path:
- Current Delorean phase:
- Mode:
- Page or route:
- Page pattern decision:
- Route map:
- Home or service home:
- Primary task navigation paths:
- Shared menu update:
- GC Design System component mapping:
- Custom UI exceptions:
- Accessibility status:
- Bilingual status:
- Files changed:
- Tasks updated:
- Gates updated:
- Evidence inputs or gaps:
- Findings:
- Required fixes:
- Re-entry needed:
- Next recommended task:
```

# Escalate when

- A page structure change lacks a page pattern decision.
- The UI uses raw HTML controls where a GC Design System component fits and no exception is recorded.
- Navigation relies on direct URLs, breadcrumbs, or browser history as the main path.
- The language toggle is duplicated or not tied to equivalent content.
- Accessibility or bilingual requirements are unclear.
- A human-approved exception is needed.
