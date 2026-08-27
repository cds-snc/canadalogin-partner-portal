# GC-WEB-011: Logging, Monitoring, Analytics, And Operational Readiness

Type: Control
Status: Active
Source: Government of Canada

## Intent

Confirm operational evidence supports secure, reliable, and privacy-aware
operation.

## Required Outcome

The application has enough operational evidence to support secure, reliable,
and privacy-aware operation.

## Assessment

Confirm the application:

- uses structured logs with request or correlation identifiers where applicable
- avoids secrets and unnecessary personal information in logs
- records operational events, errors, audit events, and security-relevant events
  consistently
- defines monitoring, alerting, support, and incident response expectations for
  production services
- uses approved analytics only when privacy and notice requirements are met
- records service standards, support expectations, or operational limits where
  the service requires them

## Evidence Examples

- log event review
- monitoring checklist
- incident response note
- analytics privacy note
- production readiness checklist

## Related Standards

- [STD-011: Logging and Observability](../../standards/std-011-logging-and-observability.md)
- [STD-013: Security and Privacy Basics](../../standards/std-013-security-and-privacy-basics.md)
