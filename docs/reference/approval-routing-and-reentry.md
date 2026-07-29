# Approval Routing And Re-Entry

Use this guide when work needs a human decision, a change request, an exception, or a clear re-entry phase.

## Audience

Primary audience: developers, reviewers, approvers, and repo maintainers.

Also used by: AI agents and orchestration tools as local workflow guidance.

This guide does not replace prompt metadata, skill contracts, agent contracts, approval templates, or repo-guidance files.

## Decision States

Approved:

- The work can continue to the next phase.
- Record the evidence reviewed and the approver.

Changes requested:

- The work can continue only after specific changes are made.
- Record what must change and where the work should re-enter.

Blocked:

- The work cannot continue until a blocker is removed.
- Record the blocker, owner, and next review point.

Exception requested:

- The work may continue only if an explicit waiver is approved.
- Use [delorean/templates/waiver-template.md](../../delorean/templates/waiver-template.md).

## Choose The Re-Entry Phase

- Use Spec when the problem, outcome, scenario, or business rule is unclear.
- Use Plan when the approach, contract, impacted artifacts, or approval path needs rework.
- Use Implement when code, docs, contracts, or local artifacts need changes.
- Use Verify when tests, evidence, or independent checks need to be rerun.
- Use Release-ready when rollout or readiness is the only remaining concern.

## Re-Entry Reason Codes

Use one of these codes in [delorean/templates/approval-response-template.md](../../delorean/templates/approval-response-template.md) when re-entry is needed:

- `intent_gap`: the requested outcome, scenario, business rule, or acceptance intent is unclear or changed.
- `design_gap`: the design direction, architecture note, ADR, or design package is missing or not ready.
- `plan_gap`: the plan does not explain scope, impacted artifacts, risk, sequencing, or verification clearly enough.
- `implementation_gap`: the implementation does not match the agreed spec, plan, standards, or design.
- `evidence_gap`: the tests, checks, coverage notes, or Evidence Bundle are missing or not strong enough.
- `approval_gap`: the work needs a human decision, approval, or exception before continuing.
- `artifact_drift`: code, tests, OpenSpec, OpenAPI, docs, or evidence no longer match each other.
- `design_drift`: the implementation or local decision has moved away from the approved design or architecture direction.

## Record The Reason

Use [delorean/templates/approval-response-template.md](../../delorean/templates/approval-response-template.md).

Keep the reason short and specific:

- what was decided
- what evidence was reviewed
- why the selected re-entry phase is needed
- who owns the follow-up
