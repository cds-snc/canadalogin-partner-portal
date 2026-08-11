# References

Use this manifest to load accessibility references without duplicating the checklist in `SKILL.md`.

## Always Load

- STD-007: UI Accessibility Basics: local accessibility starter standard.
- STD-005: Frontend GC Design System: GC Design System starter standard.
- STD-017: Government of Canada Standards Review: broad GC standards impact check.

## Load For Frontend Code

- `frontend/`: frontend source, components, routes, tests, package configuration, and styles.
- [scripts/delorean/run-frontend-standards-checks.sh](../../../scripts/delorean/run-frontend-standards-checks.sh): local GC Design System usage guard.
- STD-004: Frontend React and TypeScript: React and TypeScript starter standard.

## Review Checklist

- Semantics: native elements before ARIA, one useful `h1`, logical heading order, meaningful landmarks, valid lists and tables.
- Keyboard: all controls reachable and operable, no positive `tabindex`, visible focus, modal focus containment, escape or close behavior where expected.
- Forms: programmatic labels, grouped radios and checkboxes, helpful validation messages, autocomplete for personal-data inputs where appropriate.
- Text alternatives: meaningful `alt` for informative images, empty `alt` only for decorative images, accessible names for icon-only controls.
- ARIA: valid attributes, state synchronized with UI, live regions for dynamic status, no focusable content hidden with `aria-hidden`.
- Language: page language and changed-language spans are present where needed; bilingual labels are not ambiguous for assistive technology.
- Visual and responsive: contrast, non-color status cues, reflow at small widths, text spacing tolerance, target size, no viewport scaling lockout.
- Canada.ca patterns: accessible download links, alerts with appropriate role or live region, table of contents in navigation where present, date modified and other page elements accessible.
- AAA advisory: identify AAA opportunities separately from AA blockers unless the work explicitly targets AAA.

## External Official References

- [WCAG 2 Overview](https://www.w3.org/WAI/standards-guidelines/wcag/): W3C overview of WCAG levels and supporting material.
- [WCAG 2.2 latest published version](https://www.w3.org/TR/WCAG22/): current W3C Recommendation text.
- [CAN/ASC - EN 301 549:2024 web requirements](https://accessible.canada.ca/creating-accessibility-standards/canasc-en-301-5492024-accessibility-requirements-ict-products-and-services/9-web): Canadian ICT accessibility web requirements.
- [GC Design System components](https://design-system.canada.ca/en/components/): component guidance and accessibility notes.

## External Skill Source

- [dougkeefe/gc-code-skills gc-review-a11y](https://github.com/dougkeefe/gc-code-skills/tree/main/skills/gc-review-a11y): public skill this local wrapper is adapted from.
