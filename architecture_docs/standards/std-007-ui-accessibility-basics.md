# STD-007: UI Accessibility Basics

Type: Standard
Status: Active

## Read This When

Use this as the general accessibility standard for UI work.

This file covers accessibility expectations that apply whether or not the UI uses the GC Design System. It is the general accessibility standard, not the GC Design System usage standard.

Use [STD-005: Frontend GC Design System](std-005-frontend-gc-design-system.md) for Government of Canada component and design system usage.

Use [STD-006: GC UI Page Layout Rules](std-006-gc-ui-page-layout-rules.md)
for route and navigation-path design. Accessibility checks help verify that a
navigation model is usable, but they do not replace deciding how people find
tasks from `Home` or the service home.

## Rules

### Build For Real Use

- Use clear labels, headings, and instructions.
- Prefer semantic HTML and accessible component APIs.
- Make keyboard navigation possible for interactive controls.
- Keep focus states visible.
- Do not rely on color alone to explain meaning.

### Check Content And Layout

- Use plain language.
- Keep error messages specific and helpful.
- Make forms and controls easy to understand.
- Check small screens and zoomed views.

## Examples

- Use a visible text label or accessible name for every interactive control.
- Use a clear H1, ordered section headings, and field-level error text for forms.
- Use the GC Design System accessibility behavior when [STD-005: Frontend GC Design System](std-005-frontend-gc-design-system.md) applies.
- Use the approved page shell and navigation path when [STD-006: GC UI Page Layout Rules](std-006-gc-ui-page-layout-rules.md) applies.

## Checks

### Verify The Change

- Test the main path with keyboard only.
- Check labels and names for controls.
- Confirm important text has enough contrast.
- Confirm errors and status messages are available to assistive technologies when relevant.
- Capture verification for user-facing changes.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-007-UI-ACCESSIBILITY-BASICS](../schemas/standards/std-007-ui-accessibility-basics.schema.yaml)
- Used for: helping agents and reviewers check headings, labels, keyboard
  behavior, focus behavior, errors, status messages, contrast, semantic review,
  and accessibility exception triggers.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
