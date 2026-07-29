---
name: gc-review-security
description: Review code changes for Government of Canada Protected B security and privacy risk, including access control, authorization, input validation, injection, PII handling, secrets, cryptography, secure cookies, audit logging, and ITSG-33 control-family alignment. Use when asked for security review, Protected B, ITSG-33, privacy, PII, access control, secure coding, audit logging, or release security readiness.
---

# Purpose

Review code changes for security and privacy risks that could block release or require security review.

This is a pattern-based review skill. It does not replace threat modeling, penetration testing, departmental security assessment, privacy review, or SA&A.

# Local wrapper metadata

Source: Local template wrapper, adapted from public Government of Canada security review patterns and `dougkeefe/gc-code-skills`
Snapshot or version: Template starter, update when security, privacy, Protected B, or local secure-coding standards change
Owner: Repo maintainers until replaced by a solution owner
Applies to phases: Plan, Verify, Release-ready
Skill perspective: Produces security and privacy findings, remediation guidance, verification inputs, residual-risk notes, and evidence inputs for Delorean phase skills and agents.
Invocation criteria: Use when security, privacy, PII, Protected B, trust boundary, access control, validation, secrets, logging, or release security readiness needs explicit review.
Pre-handoff checks: Scope, data/security context, findings, control references where useful, remediation guidance, verification recommendations, traceability, evidence inputs, and specialist-review needs are named.
Related local gates: STD-017: Government of Canada Standards Review, STD-013: Security and Privacy Basics, [scripts/delorean/run-secret-checks.sh](../../../scripts/delorean/run-secret-checks.sh), [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md)
Refresh model: Review when security/privacy standards, local controls, threat model expectations, or evidence requirements change.

# Inputs

- Work request, diff, pull request, changed file list, or specific backend/frontend/config files.
- Known data classification, personal information, authentication, authorization, logging, and deployment context.
- Existing threat model, privacy notes, or security evidence when available.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load local security standards first and official references when a compliance claim matters.

# Procedure

1. Detect changed code, API, auth, data, config, infrastructure, dependency, and logging files.
2. Read changed files and related handlers, middleware, services, models, schemas, tests, and configuration needed to understand the data path.
3. Check access control, authorization, IDOR risk, input validation, output encoding, injection risk, PII exposure, logging redaction, secrets, cookie flags, cryptographic choices, transport assumptions, audit logging, and error disclosure.
4. Map findings to control families where useful: AC, AU, IA, SC, SI, or Privacy Act/PII.
5. Distinguish release-blocking defects from warnings and review recommendations.
6. Recommend concrete remediation and follow-up tests or evidence.
7. Escalate suspected secret exposure immediately and recommend rotation without printing secret values.
8. Map findings to the source request, issue, OpenSpec spec or change, scenario ID, threat model, design note, or an explicit note that no traceability source was provided.
9. Prepare verification findings and evidence inputs for `delorean-evidence`, covering findings, remediation status, checks run or skipped, residual risk, and any waiver, security review, or privacy review need.
10. Mark the Delorean handoff state as `ready_for_evidence`, `changes_required`, `blocked`, or `needs_human_review`.

# Output Format

```text
Security review:
- Scope reviewed:
- Data/security context:
- Overall status: pass | fail | warnings-only | incomplete
- Delorean handoff state:
- Traceability:
- Findings:
  - <severity> <control/ref> <file:line> <issue> -> <recommended action>
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

Escalate when secrets are exposed, personal information may leak, access control is missing, authorization happens only client-side, audit logging is absent for sensitive actions, or a qualified security/privacy reviewer is needed. Escalation is a Delorean re-entry or human-review signal; do not approve the exception or accept residual risk inside this skill.

# Source And Ownership

This local skill is adapted from Government of Canada security review patterns and the public `dougkeefe/gc-code-skills` `gc-review-security` skill. Keep attribution when reusing this structure and verify official sources before relying on compliance details.
