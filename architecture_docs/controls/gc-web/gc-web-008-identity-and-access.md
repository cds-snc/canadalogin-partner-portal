# GC-WEB-008: Identity And Access

Type: Control
Status: Active
Source: Government of Canada

## Intent

Define identity, authentication, authorization, session, role, and logout
expectations before implementation when access is restricted or personal
information is handled.

## Required Outcome

The application defines identity, authentication, authorization, session, role,
and logout expectations before implementation when access is restricted or
personal information is handled.

## Assessment

Confirm the application:

- identifies user types, roles, scopes, and protected routes
- defines authentication and session boundaries
- enforces authorization on the server side for protected data and actions
- protects session cookies, tokens, and identity claims
- provides logout and session expiry behaviour appropriate to the risk
- records identity provider, federation, or credential decisions
- audits sensitive or privileged access where required

## Evidence Examples

- identity architecture decision
- role and permission matrix
- protected route test
- authorization failure-path tests
- session and logout verification note

## Related Standards

- [STD-013: Security and Privacy Basics](../../standards/std-013-security-and-privacy-basics.md)
