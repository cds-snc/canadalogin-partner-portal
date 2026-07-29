# GC-WEB-004: Official Languages And Plain Language

Type: Control
Status: Active
Source: Government of Canada

## Intent

Confirm user-facing content and service interactions support applicable English,
French, and plain-language expectations.

## Required Outcome

User-facing content and service interactions support English and French
requirements where the service is in scope for official languages obligations.

## Assessment

Confirm the application:

- provides equivalent English and French content, labels, errors, navigation,
  page titles, metadata, and transactional messages
- keeps language routes, `html[lang]`, language toggle destinations,
  breadcrumbs, and page titles aligned
- uses clear, task-focused content that follows Canada.ca content expectations
  where applicable
- avoids shipping placeholder, partial, stale, or machine-only translations as
  production content
- records any unilingual content, external-language link, or translation
  dependency as an exception or release constraint

## Evidence Examples

- translation files reviewed
- bilingual route check
- content review note
- language-toggle verification

## Related Standards

- [STD-005: Frontend GC Design System](../../standards/std-005-frontend-gc-design-system.md)
- [STD-006: GC UI Page Layout Rules](../../standards/std-006-gc-ui-page-layout-rules.md)

