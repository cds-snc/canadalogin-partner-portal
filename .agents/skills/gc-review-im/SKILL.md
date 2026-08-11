---
name: gc-review-im
description: Review Government of Canada information management concerns in schemas, models, migrations, repositories, and data lifecycle code, including record metadata, classification, language, creator/date fields, retention and disposition, soft delete, audit trail, searchability, discoverability, ATIP support, and Library and Archives obligations. Use when asked for IM, records, retention, disposition, metadata, lifecycle, auditability, database schema, model, migration, or ATIP review.
---

# Purpose

Review data structures and lifecycle code for information-management risk.

This is a pattern-based review skill. It does not replace records management, ATIP, legal, or Library and Archives review.

# Local wrapper metadata

Source: Local template wrapper, adapted from public Government of Canada information-management review patterns and `dougkeefe/gc-code-skills`
Snapshot or version: Template starter, update when records, retention, ATIP, data lifecycle, or local information-management standards change
Owner: Repo maintainers until replaced by a solution owner
Applies to phases: Plan, Verify, Release-ready
Skill perspective: Produces records, metadata, retention, disposition, data-lifecycle, remediation, verification, residual-risk, and evidence inputs for Delorean phase skills and agents.
Invocation criteria: Use when schemas, models, migrations, repositories, records, retention, disposition, deletion, auditability, metadata, or data lifecycle need explicit review.
Pre-handoff checks: Scope, business records, findings, remediation guidance, verification recommendations, traceability, evidence inputs, and records/ATIP/legal/retention review needs are named.
Related local gates: STD-017: Government of Canada Standards Review, STD-011: Logging and Observability, [docs/templates/evidence-bundle-template.md](../../../docs/templates/evidence-bundle-template.md)
Refresh model: Review when records, retention, data lifecycle, ATIP, auditability, or metadata expectations change.

# Inputs

- Work request, diff, pull request, changed file list, or specific schema/model/data-access files.
- Known business record types, retention expectations, classification, language needs, and audit requirements.
- Existing architecture, privacy, or evidence inputs when available.

# Reference Loading

Use [references.md](references.md) as the loading manifest. Load local standards first and official references when records or retention detail matters.

# Procedure

1. Detect changed database schemas, migrations, ORM models, repositories, services, deletion paths, status transitions, and audit logging code.
2. Read relevant data model and lifecycle code in full.
3. Identify business records versus transient technical data.
4. Check metadata, creator, creation date, language, classification, retention or disposition, soft delete, hard delete, audit trail, status transition logging, descriptive field names, indexes for discovery, and bilingual storage needs.
5. Distinguish mandatory record concerns from design recommendations.
6. Recommend data model, migration, service, or evidence updates with traceability to OpenSpec and tests where relevant.
7. Map findings to the source request, issue, OpenSpec spec or change, scenario ID, architecture/design note, data change plan, or an explicit note that no traceability source was provided.
8. Prepare verification findings and evidence inputs for `delorean-evidence`, covering findings, remediation status, checks run or skipped, residual risk, and any waiver, records, ATIP, legal, or retention review need.
9. Mark the Delorean handoff state as `ready_for_evidence`, `changes_required`, `blocked`, or `needs_human_review`.

# Output Format

```text
Information management review:
- Scope reviewed:
- Business records identified:
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

Escalate when record status is unclear, hard deletion may remove business records, retention rules are unknown, personal information retention is affected, or a records/ATIP advisor decision is needed. Escalation is a Delorean re-entry or human-review signal; do not approve the exception or accept residual risk inside this skill.

# Source And Ownership

This local skill is adapted from Government of Canada information-management review patterns and the public `dougkeefe/gc-code-skills` `gc-review-im` skill. Keep attribution when reusing this structure and verify official sources before relying on compliance details.
