# References

Use this manifest to load IAM references without duplicating the checklist in `SKILL.md`.

## Always Load

- STD-013: Security and Privacy Basics: local security and privacy starter standard.
- STD-014: Secrets and Configuration: secret and configuration handling.
- [.github/skills/gc-review-security/SKILL.md](../gc-review-security/SKILL.md): broader security review procedure when auth changes affect other controls.

## Load For Backend Or Frontend Auth

- `backend/`: backend auth routes, middleware, services, config, tests, and models.
- `frontend/`: frontend route guards, API clients, session UI, and token handling.
- `openapi/`: auth schemes and protected endpoint contracts.
- `tests/`: auth and authorization tests.

## Review Checklist

- Identity provider: issuer, authority, and discovery endpoint are explicit and approved or justified.
- OIDC/OAuth: discovery is preferred over hardcoded endpoints; issuer, audience, nonce/state, redirect URI, and token validation are handled by trusted libraries.
- Secrets: client secrets, signing keys, session secrets, and provider credentials come from environment or vaults, not source.
- Cookies and sessions: `HttpOnly`, `Secure`, `SameSite`, expiry, renewal, and absolute timeout are appropriate to data sensitivity.
- Token storage: sensitive tokens are not stored in localStorage or decoded in browser code for authorization decisions.
- Scopes and claims: request only needed scopes; process sensitive claims server-side; avoid logging or returning full token payloads.
- Logout: local session invalidation and federated sign-out are handled where required.
- RBAC: roles and permissions are validated server-side from trusted claims or server state; client-provided roles are ignored.
- Tests: include unauthenticated, unauthorized, cross-tenant or cross-owner, expired session, and logout behavior.

## External Official References

- [Directive on Identity Management - Appendix A: Standard on Identity and Credential Assurance](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=32612&section=html): identity and credential assurance levels.
- [Guideline on Cloud Authentication](https://www.canada.ca/en/government/system/digital-government/digital-government-innovations/cloud-services/guideline-cloud-authentication.html): cloud authentication implementation guidance.
- [Guideline on Service and Digital](https://www.canada.ca/en/government/system/digital-government/guideline-service-digital.html): digital identity and service guidance; verify current instruments when compliance matters.
- [ITSG-33](https://www.cyber.gc.ca/en/guidance/it-security-risk-management-lifecycle-approach-itsg-33): IT security risk-management guidance.

## External Skill Source

- [dougkeefe/gc-code-skills gc-review-iam](https://github.com/dougkeefe/gc-code-skills/tree/main/skills/gc-review-iam): public skill this local wrapper is adapted from.
