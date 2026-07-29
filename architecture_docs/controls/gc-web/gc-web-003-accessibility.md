# GC-WEB-003: Accessibility

Type: Control
Status: Active
Source: Government of Canada

## Intent

Build accessibility into design, implementation, content, and verification
rather than treating it as a late review activity.

## Required Outcome

The application builds accessibility into design, implementation, content, and
verification from the start.

## Assessment

Confirm the application:

- meets the applicable Government of Canada web accessibility expectations
- targets WCAG Level AA conformance required by the applicable federal policy or
  accessibility instrument
- preserves keyboard operation, focus order, visible focus, semantic headings,
  labels, landmarks, status messages, and accessible error handling
- ensures non-text content, documents, media, and downloadable files have
  accessible alternatives where required
- tests complete user processes, not only individual pages
- records skipped accessibility checks and remaining risk

## Evidence Examples

- accessibility checklist
- keyboard-only test result
- automated accessibility scan result
- screen reader review note where risk warrants it
- accessible document or media review note

## Related Standards

- [STD-007: UI Accessibility Basics](../../standards/std-007-ui-accessibility-basics.md)

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-GC-WEB-003-ACCESSIBILITY](../../schemas/controls/gc-web-003-accessibility.schema.yaml)
- Used for: helping agents and reviewers check accessibility control assessment
  evidence, skipped checks, complete-process review, and remaining risk.
- Notes: The schema contract supports this control. It does not replace this
  control as the source of truth.
