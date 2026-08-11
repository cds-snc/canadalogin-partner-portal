---
name: delorean-question-resolution
description: Resolve spec, design, planning, standards, and evidence questions from repo guidance before asking humans.
---

# Purpose

Resolve open questions from local specs, docs, architecture guidance, standards,
tests, contracts, and existing repo conventions before asking the user.

This skill supports the Spec and Plan phases. It turns a broad "grill me" pass
into a documented question-resolution pass that preserves true human decisions
as OpenSpec or design open questions.

# Use when

Use this skill when:

- a request, feature idea, OpenSpec change, or design note has unclear intent;
- an agent is about to ask broad clarification questions;
- design-readiness, implementation-readiness, standards impact, evidence needs,
  or affected artifacts are unclear;
- questions may be answerable from existing repo files, OpenSpec, generated
  architecture guidance, local standards, templates, tests, contracts, or
  approved documentation.

# Inputs

- Source request, brief, issue, OpenSpec change ID, design note, ADR, or
  scenario.
- Current OpenSpec artifacts when they exist.
- `delorean/evidence/<change-id>/change-state.yaml` when available and in
  scope.
- Known affected areas, such as UI, API, data, IAM, security, privacy,
  accessibility, information management, operations, tests, contracts, evidence,
  or release-readiness.
- Current work context and control boundary when known.

# Output Scope

This skill is adoption-level agnostic. The invoking agent decides whether to
update OpenSpec, change-state, gates, evidence, approval or waiver records,
release-readiness artifacts, or subagent handoffs based on
`delorean/config.yaml`, the user request, and the current phase.

# Question Classes

Classify each question as one of:

- `fact`: answerable from source artifacts, code, tests, contracts, standards,
  templates, or approved documentation.
- `safe_assumption`: locally safe default that follows STD-002: Work Contexts or
  existing repo conventions and does not expand the control boundary.
- `human_decision_required`: cannot be answered by repo evidence or safe local
  defaults because it needs approval, waiver, production intent, source-of-truth
  ownership, external integration ownership, real secrets, real data, policy
  exception, or business intent with multiple valid outcomes.

Do not treat best practice as a requirement unless it is backed by a standard,
OpenSpec artifact, existing repo convention, or explicit human decision.

# Answer Card Contract

Return one compact card per material question:

```text
Question resolution:
- Question:
- Answer:
- Sources:
- Confidence: high | medium | low
- Classification: fact | safe_assumption | human_decision_required
- Impacted artifacts:
- Remaining risk:
```

# Procedure

1. Identify the current phase, change ID, work context, and control boundary
   when available.
2. List the questions blocking spec, design, planning, implementation handoff,
   standards assessment, test planning, or evidence planning.
3. Split questions into discoverable facts, safe assumptions, and likely human
   decisions.
4. Resolve discoverable facts from the narrowest useful source set:
   - current OpenSpec proposal, design, tasks, and spec deltas;
   - current specs under `openspec/specs/`;
   - code, tests, contracts, docs, and existing conventions;
   - repo-guidance, local templates, and Delorean change-state;
   - generated `architecture_docs/` catalogs and ID-based standards, patterns,
     baselines, controls, ADR catalogs, and templates;
   - approved or official external documentation only when current product,
     policy, or compliance detail is required.
5. Record safe assumptions explicitly. Default to local developer / localhost,
   fake or test-only data, no real secrets, no production data, no deployment,
   and no external system changes when the request does not name an environment.
6. Preserve human-only decisions as open questions. Do not answer them on behalf
   of the user.
7. Recommend where resolved and unresolved questions should land:
   - `proposal.md` for intent, scope, work context, safe assumptions, and human
     decisions that affect whether the change should proceed;
   - `design.md` for approach, impacted artifacts, standards impact, ADR need,
     and implementation-readiness questions;
   - `tasks.md` for follow-up work, blocking questions, verification tasks,
     evidence tasks, and human-decision tasks;
   - `change-state.yaml` for Delorean phase, gate, control-boundary, evidence,
     approval, waiver, and re-entry state when in scope.
8. Route standards-specific uncertainty through `gc-standards` or the targeted
   `gc-review-*` skills when their concern is in scope.
9. Route OpenSpec structure or scenario repairs through `delorean-openspec`.
10. Route technical approach or slice repairs through `delorean-design`.
11. Ask the user only for `human_decision_required` questions or for questions
    that remain unanswerable after the repository/documentation pass.

# Expected Output

```text
Question-resolution result:
- Source request or change:
- Current phase:
- Work context:
- Control boundary:
- Questions reviewed:
- Questions resolved:
- Safe assumptions recorded:
- Human decisions required:
- Recommended artifact updates:
- Follow-up skills or agents:
- Blockers:
- Next recommended task:
```

# Escalate When

- A question affects production, shared environments, real secrets, real data,
  deployment, external systems, destructive actions, approval, waivers, or a
  wider permission boundary.
- A requirement conflicts with security, privacy, accessibility, official
  languages, information management, architecture, or baseline guidance.
- The answer requires a current external policy or product detail and no
  approved source is available.
- A human decision is needed before local work can proceed safely.
