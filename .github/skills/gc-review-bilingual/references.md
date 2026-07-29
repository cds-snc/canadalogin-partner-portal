# References

Use this manifest to load bilingual review references without duplicating the checklist in `SKILL.md`.

## Always Load

- STD-017: Government of Canada Standards Review: broad GC standards impact check.
- STD-005: Frontend GC Design System: frontend standard with user-facing content expectations.
- STD-007: UI Accessibility Basics: accessibility starter standard for language and accessible names.

## Load For Frontend Or Content

- `frontend/`: frontend source, routes, components, tests, styles, and package configuration.
- `docs/design/`: design notes and content decisions.
- `openspec/specs/` and `openspec/changes/`: behavior and scenario expectations.

## Review Checklist

- Translation coverage: English and French resources exist for release scope and keys match where structured translation files are used.
- Hardcoded strings: user-facing JSX, templates, labels, placeholders, titles, alt text, aria labels, validation text, status messages, and navigation text use the i18n pattern.
- Accessibility parity: non-visual text is translated; `lang` is set at page level and for changed-language spans when needed.
- Locale routing: links, redirects, and route params preserve language context and switch to equivalent content where possible.
- Language toggle: provided by the approved header pattern where required, links to equivalent content where possible, does not unexpectedly lose form/session state, and is not duplicated as a standalone body toggle unless an exception is recorded.
- Formatting: dates, times, numbers, and currency use locale-aware formatting.
- Translation quality markers: placeholder values, TODOs, suspicious identical long values, and missing keys are flagged for human review.
- Scope control: do not treat technical terms, product names, code samples, logs, tests, or non-user-facing identifiers as translation defects without context.

## External Official References

- [Official Languages Act](https://laws.justice.gc.ca/eng/acts/O-3.01/): current Justice Laws source.
- [GC Design System language toggle design](https://design-system.canada.ca/en/components/language-toggle/design/): header placement, requirements, and design guidance.
- [GC Design System language toggle code](https://design-system.canada.ca/en/components/language-toggle/code/): code guidance and `gcds-header` language-toggle support.
- [Policy on Communications and Federal Identity overview](https://www.canada.ca/en/government/system/government-communications/communications-community-office/communications-101-boot-camp-canadian-public-servants/government-canada-policy-communications-federal-identity.html): communications and federal identity policy context.
- [Guideline on Service and Digital](https://www.canada.ca/en/government/system/digital-government/guideline-service-digital.html): service and digital guidance; verify current instruments when compliance matters.

## External Skill Source

- [dougkeefe/gc-code-skills gc-review-bilingual](https://github.com/dougkeefe/gc-code-skills/tree/main/skills/gc-review-bilingual): public skill this local wrapper is adapted from.
