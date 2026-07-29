---
name: gc-review-iam
description: Review Government of Canada identity and access management code, including authentication flows, OIDC/OAuth configuration, identity providers, session cookies, timeout, token storage, logout, federated sign-out, scope minimization, claims handling, MFA or assurance considerations, and server-side RBAC. Use when asked for IAM, auth, login, OIDC, OAuth, session, token, role, RBAC, Entra ID, GCKey, Sign-In Canada, or identity review.
---

# Purpose

Review authentication and authorization implementation for identity, session, token, and role-management risk.

This is a pattern-based review skill. It does not replace identity assurance assessment, threat modeling, penetration testing, or departmental IAM approval.

# Local wrapper metadata

Source: Local template wrapper, adapted from public Government of Canada IAM review patterns and `dougkeefe/gc-code-skills`
Snapshot or version: Template starter, update when IAM guidance, identity provider patterns, auth architecture, or local security standards change
Owner: Repo maintainers until replaced by a solution owner
Applies to phases: Plan, Verify, Release-ready
Skill perspective: Produces authentication, authorization, session, token, role, remediation, verification, residual-risk, and evidence inputs for Delorean phase skills and agents.
Invocation criteria: Use when authn, authz, OIDC/OAuth, sessions, tokens, claims, scopes, roles, RBAC, logout, or identity assurance needs explicit review.
Pre-handoff checks: Scope, identity provider/session model, findings, remediation guidance, verification recommendations, traceability, evidence inputs, and IAM/security review needs are named.
Related local gates: STD-017: Government of Canada Standards Review, STD-013: Security and Privacy Basics, [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md)
Refresh model: Review when IAM guidance, auth architecture, identity provider setup, roles, or session standards change.

# Inputs

- Work request, diff, pull request, changed file list, or specific auth files.
- Known identity provider, assurance expectations, session model, roles, scopes, and data classification.
- Existing security, privacy, or IAM review notes when available.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load local security standards first and official references when assurance or identity details matter.

# Procedure

1. Detect authentication, authorization, middleware, session, OIDC/OAuth, environment, and config files.
2. Read auth-related code, route guards, middleware, frontend auth usage, backend role checks, token handlers, and tests needed to understand the flow.
3. Check identity provider configuration, issuer validation, discovery usage, hardcoded secrets, cookie flags, session timeout, token storage, scope minimization, frontend claim handling, logout, federated sign-out, server-side RBAC, and role source integrity.
4. Treat consumer identity providers, hardcoded secrets, browser-side sensitive token handling, and client-side-only authorization as high-risk findings unless documented as out of scope.
5. Recommend fixes using environment variables, vaults, OIDC discovery, server-side validation, secure cookies, least-privilege scopes, and auditable role checks.
6. Name tests or evidence needed to prove the auth behavior.
7. Map findings to the source request, issue, OpenSpec spec or change, scenario ID, threat model, design note, or an explicit note that no traceability source was provided.
8. Prepare verification findings and evidence inputs for `delorean-evidence`, covering findings, remediation status, checks run or skipped, residual risk, and any waiver, IAM review, or security review need.
9. Mark the Delorean handoff state as `ready_for_evidence`, `changes_required`, `blocked`, or `needs_human_review`.

# Output Format

```text
IAM review:
- Scope reviewed:
- Identity provider/session model:
- Overall status: pass | fail | warnings-only | incomplete
- Delorean handoff state:
- Traceability:
- Findings:
  - <severity> <file:line> <issue> -> <recommended action>
- Good patterns observed:
- Verification recommended:
- Evidence inputs:
- Waiver, re-entry, approval, or specialist-review needs:
```

# Delorean output

When the invoking agent requests Delorean process output for an active change, return this block:

```text
GC overlay result:
- Change ID:
- Change-state path:
- OpenSpec reference:
- Area reviewed:
- Overall status: pass / warning / fail / incomplete / not applicable
- Gate affected:
- Findings:
- Required fixes:
- Suggested OpenSpec task updates:
- Suggested change-state updates:
- Evidence inputs for `delorean-evidence`:
- Skipped checks and reasons:
- Waiver or exception needed:
- Re-entry needed:
- Re-entry phase:
- Re-entry reason:
```

Do not mark a finding as resolved unless the fix and evidence are present.

Do not approve waivers, exceptions, risk acceptance, production actions, sensitive-data access, or release readiness.

# Escalation

Escalate when identity provider approval is unclear, secrets are exposed, tokens are handled insecurely, roles are client-controlled, assurance expectations are unknown, or auth behavior needs human security review. Escalation is a Delorean re-entry or human-review signal; do not approve the exception or accept residual risk inside this skill.

# Source And Ownership

This local skill is adapted from Government of Canada IAM review patterns and the public `dougkeefe/gc-code-skills` `gc-review-iam` skill. Keep attribution when reusing this structure and verify official sources before relying on compliance details.
