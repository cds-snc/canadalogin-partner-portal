---
name: review-gc-design-system-alignment
description: Review user-facing page work against the recorded page pattern decision, page shell, GC Design System or GCWeb/WET source, and evidence inputs.
---

# Purpose

Review whether a user-facing page follows the recorded page pattern decision, uses the expected approved template, keeps the page shell intact, and has enough evidence inputs for handoff.

# Inputs

- Changed files, pull request, implementation summary, or local page route.
- Page pattern decision.
- Page or route map when the feature has multiple user goals.
- Home page or service home route and shared menu entries.
- Primary task navigation paths.
- GC Design System component plan and custom UI exceptions.
- Design-system checklist.
- Desktop and mobile screenshots when available.
- Accessibility result and skipped-check notes.
- Exception list, if any.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load local standards and templates first, then official references only when the page type or shell behavior is unclear.

# Procedure

1. Confirm a page pattern decision exists before reviewing implementation.
2. Compare the implementation to the selected approved page pattern and approved template.
3. Check the page shell: header, footer, main content, skip link, H1, date modified when required, language toggle, breadcrumbs, search, shared menu, and navigation.
4. Confirm the language toggle is provided by the approved header pattern or `gcds-header` language-toggle support when bilingual routes exist. Flag duplicate standalone language toggles in the page body unless an exception is recorded.
5. Confirm the shared menu includes `Home` and the new page or parent task area. Flag pages that are reachable only by direct URL unless the decision records a deliberate exclusion reason.
6. Check that each primary task has a discoverable path from `Home` or service home to the destination route and back to the parent task area. Flag flows that rely on breadcrumbs, browser history, direct URLs, or unrelated pages as the primary navigation path.
7. Check page structure: when the feature has multiple user goals, confirm there is a task-oriented service home or task hub and separate destination routes or pages. Flag all-in-one pages that combine unrelated workflows without a recorded rationale.
8. Check GC Design System or GCWeb/WET component use against the target stack and the recorded component plan.
9. Flag raw HTML controls or alert roles when an approved component fits and no exception is recorded, including raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>`, `<header>`, `<footer>`, `<nav>`, `<label>`, `<fieldset>`, `<legend>`, or `role="alert"` usage.
10. Review forms, error states, labels, headings, links, buttons, focus, keyboard behavior, and bilingual needs where they apply.
11. Confirm custom UI exceptions are listed, specific, and tied to a human review path when needed.
12. Confirm evidence includes desktop screenshot, mobile screenshot, design-system checklist, accessibility result, checks run, skipped checks, and remaining risk.
13. Name concrete fixes or mark the handoff state.

# Output Format

```text
Design-system alignment review:
- Scope reviewed:
- Page pattern decision: present / missing
- Selected approved page pattern:
- Target stack:
- Overall status: pass / fail / warnings-only / incomplete
- Page shell:
- Task branching:
- Home page or service home:
- Primary task navigation paths:
- Navigation:
- Shared menu:
- GC component mapping:
- Forms:
- Design-system check:
- Accessibility result:
- Evidence:
- Exceptions:
- Findings:
- Required fixes:
- Handoff state: ready_for_evidence / changes_required / blocked / needs_human_review
```

# Escalation

Escalate when the page was built without a recorded decision, skips an approved page pattern, uses a blank custom layout without approval, removes mandatory page shell elements, omits `Home` or the new page from the shared menu without a recorded reason, relies on breadcrumbs, browser history, direct URLs, or unrelated pages as the primary navigation path, duplicates the header language toggle in page content without an exception, uses raw HTML controls or alert roles without a recorded exception, crams several distinct workflows onto one page without a recorded rationale, or has missing accessibility or evidence for a user-facing change.

# Source And Ownership

This is a local starter review skill. It produces review findings and evidence inputs for `delorean-evidence`; it does not approve exceptions, waivers, or release readiness.
