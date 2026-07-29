# GC-WEB-010: APIs, Interoperability, And Data Exchange

Type: Control
Status: Active
Source: Government of Canada

## Intent

Confirm APIs and data exchange paths follow Government of Canada and local API
standards where they expose or consume service data.

## Required Outcome

APIs and data exchange paths follow Government of Canada and local API standards
where they expose or consume service data.

## Assessment

Confirm the application:

- prefers RESTful APIs unless a documented constraint requires another style
- uses stable resource-oriented URLs, HTTP methods, and status codes
- uses JSON and UTF-8 for text data unless a documented constraint applies
- defines typed request, response, and error models
- avoids leaking internal implementation details in API responses
- authenticates, authorizes, monitors, and audits protected API access
- versions APIs and publishes API contracts where consumers depend on them
- supports official-language data handling where applicable

## Evidence Examples

- OpenAPI output
- API contract review
- integration test
- API security test
- versioning and deprecation note

## Related Standards

- [STD-009: REST API](../../standards/std-009-api-rest.md)
- [STD-010: API Response and Error Models](../../standards/std-010-api-response-and-error-models.md)
- [STD-013: Security and Privacy Basics](../../standards/std-013-security-and-privacy-basics.md)

