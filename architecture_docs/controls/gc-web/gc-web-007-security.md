# GC-WEB-007: Security

Type: Control
Status: Active
Source: Government of Canada

## Intent

Identify and address security risks across design, implementation,
verification, and operations.

## Required Outcome

The application identifies and addresses security risks across design,
implementation, verification, and operations.

## Assessment

Confirm the application:

- validates input at trust boundaries
- authorizes access before exposing data or actions
- returns safe errors without internal technical details or sensitive data
- protects secrets, credentials, tokens, and security configuration
- uses secure transport for non-local environments
- avoids sensitive data in request URLs
- reviews dependency, container, CI, and deployment security where applicable
- records security risks, threat model decisions, and accepted residual risk

## Evidence Examples

- security review note
- threat model or threat mapping note
- dependency or image scan result
- tests for validation, authorization, and safe failures

## Related Standards

- [STD-013: Security and Privacy Basics](../../standards/std-013-security-and-privacy-basics.md)
- [STD-014: Secrets and Configuration](../../standards/std-014-secrets-and-configuration.md)
- [STD-016: Container Build and Deployment](../../standards/std-016-container-build-and-deployment.md)

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-GC-WEB-007-SECURITY](../../schemas/controls/gc-web-007-security.schema.yaml)
- Used for: helping agents and reviewers check security control assessment
  evidence, validation, authorization, safe errors, secrets, scans, deployment
  review, and residual risk.
- Notes: The schema contract supports this control. It does not replace this
  control as the source of truth.
