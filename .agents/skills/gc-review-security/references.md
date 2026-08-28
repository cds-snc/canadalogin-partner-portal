# References

Use this manifest to load security references without duplicating the checklist in `SKILL.md`.

## Always Load

- STD-013: Security and Privacy Basics: local security and privacy starter standard.
- STD-014: Secrets and Configuration: secret and environment variable handling.
- STD-011: Logging and Observability: logs, request IDs, and operational context.

## Load For Backend Or API Work

- STD-008: Backend FastAPI: backend starter standard.
- STD-009: REST API: REST API starter standard.
- STD-010: API Response and Error Models: API response and error model standard.
- `backend/`, `openapi/`, and `tests/`: implementation, contracts, and checks.

## Review Checklist

- Access control: every server action and API endpoint has authentication and authorization appropriate to the resource.
- IDOR prevention: resource access verifies tenant, owner, role, or policy before returning or mutating data.
- Input validation: request bodies, query params, path params, headers, file names, and external payloads are schema-validated.
- Injection prevention: no raw SQL, command, template, path, or query construction from untrusted input without safe APIs.
- Privacy and PII: personal information is minimized, masked in logs/errors, protected in responses, and not placed in URLs.
- Secrets: no hardcoded credentials, tokens, keys, connection strings, or sensitive defaults; examples stay clearly fake.
- Session and transport: secure cookies, HTTPS assumptions, CSRF controls where relevant, and no token storage in localStorage for sensitive auth.
- Crypto: avoid weak algorithms for security purposes; use framework or platform primitives.
- Audit: security-significant events include actor, action, resource, outcome, and timestamp in structured logs.
- Errors: external responses do not disclose stack traces, implementation internals, or sensitive data.

## External Official References

- [ITSG-33](https://www.cyber.gc.ca/en/guidance/it-security-risk-management-lifecycle-approach-itsg-33): Canadian Centre for Cyber Security IT security risk-management guidance.
- [Privacy Act](https://laws.justice.gc.ca/eng/acts/P-21/): current Justice Laws source.
- [Guideline on Service and Digital](https://www.canada.ca/en/government/system/digital-government/guideline-service-digital.html): service, information, data, IT, and cyber security guidance; verify current instruments when compliance matters.

## External Skill Source

- [dougkeefe/gc-code-skills gc-review-security](https://github.com/dougkeefe/gc-code-skills/tree/main/skills/gc-review-security): public skill this local wrapper is adapted from.
