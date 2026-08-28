---
name: dl-requirements-start
description: "Start an active OpenSpec change package from a rough brief, requirements note, issue, or pasted discovery notes."
---

# DL Start OpenSpec

## Recommended role

Delegate to the `spec-author` custom agent from
`.codex/agents/spec-author.toml` when specialized delegation materially
helps. Otherwise, follow this workflow in the current session.

## Purpose

Create the first active OpenSpec change package from a rough brief, requirements note, issue, meeting notes, or pasted discovery material.

Use this skill when the user is ready to start OpenSpec artifacts and wants the agent to choose a small, local-first slice. Use `dl-requirements-shape` instead when the intent is still too unclear to choose a change, capability, or first slice.

## Required Inputs

At least one of:

- Rough brief, requirements note, issue, or discovery notes.
- Product goal and affected users.
- Desired change ID or capability name.

Helpful but optional:

- Known in-scope and out-of-scope items.
- Known acceptance criteria.
- Target environment if it is not local developer / localhost.
- Existing architecture notes, current specs, contracts, tests, or evidence.

## Route

1. Read [README.md](../../../README.md), [GETTING_STARTED.md](../../../GETTING_STARTED.md), and [delorean/config.yaml](../../../delorean/config.yaml). If the solution repo has a local agent instruction file, read that too.
2. Read [docs/repo-guidance/where-things-go.md](../../../docs/repo-guidance/where-things-go.md), [docs/repo-guidance/architecture-docs.md](../../../docs/repo-guidance/architecture-docs.md), and [docs/repo-guidance/adoption-levels.md](../../../docs/repo-guidance/adoption-levels.md).
3. The Spec Author applies the configured adoption level before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
4. Use STD-002: Work Contexts. If the request does not name an environment, assume local developer / localhost, fake or test-only data, no real secrets, no production data, no deployment, and no external system changes.
5. Use [docs/repo-guidance/control-boundaries.md](../../../docs/repo-guidance/control-boundaries.md) when the brief involves agents, tools, APIs, MCP servers, privileged commands, sensitive data, generated evidence, environments, or audit expectations.
6. Use [docs/reference/openspec-lifecycle.md](../../../docs/reference/openspec-lifecycle.md) for active change lifecycle rules.
7. Use [.agents/skills/delorean-question-resolution/SKILL.md](../../../.agents/skills/delorean-question-resolution/SKILL.md) to resolve discoverable questions from repo guidance, OpenSpec, `architecture_docs`, code, tests, contracts, and approved docs before asking the user.
8. Use [.agents/skills/delorean-openspec/SKILL.md](../../../.agents/skills/delorean-openspec/SKILL.md) to create the OpenSpec package.
9. Use [docs/templates/openspec-change-package-template.md](../../../docs/templates/openspec-change-package-template.md) for the starter shape when useful.
10. Route architecture guidance by ID and title through the generated architecture catalogs. Load only the standards, patterns, baselines, controls, templates, reference architectures, or ADR indexes that fit the brief, such as GC standards, BAS-001, `GC-WEB-*` controls, accessibility, API, backend, frontend, audit, RBAC, OIDC, secret lifecycle, data, or logging guidance.
11. Create an active change under `openspec/changes/<change-id>/` with:
    - `proposal.md`
    - `design.md`
    - `tasks.md`
    - `specs/<capability>/spec.md`
12. Keep current specs in `openspec/specs/` unchanged until implementation and verification are complete and archive is explicitly in scope.
13. Stop after creating or updating the OpenSpec package unless the user explicitly asks to continue into implementation.

## Slice Selection Guidance

Pick the first slice that is:

- small enough to implement and verify locally;
- useful to a real user or system actor;
- traceable to one or more requirements and scenarios;
- safe with fake or fixture data;
- not dependent on production, real secrets, real personal data, live integrations, deployment, approvals, waivers, or wider permissions.

When the brief is broad, split the work in `design.md` and `tasks.md`. Put only the first recommended slice in the implementation handoff summary.

## Expected Output

```text
Start OpenSpec result:
- Source brief or issue:
- Change ID:
- Capability:
- Work context:
- Baseline applicability:
- Affected GC-WEB controls:
- Adoption level applied:
- OpenSpec change path:
- Files created or updated:
- Relevant architecture guidance:
- Resolved questions and safe assumptions:
- Human decisions required:
- First slice selected:
- Deferred slices:
- Local verification plan:
- Validation command or skipped reason:
- Blockers:
- Next recommended task:
```

## Guardrails

- Do not require a large prompt from the user when a pasted brief is enough to infer a safe local first slice.
- Do not ask broad questions before resolving discoverable facts from repo guidance, OpenSpec, architecture docs, code, tests, contracts, and approved docs.
- Do not create production, shared-environment, real-secret, real-data, deployment, approval, waiver, or release-readiness work unless the user explicitly asks and the required details are known.
- Do not treat best practice as a requirement unless it is backed by a standard, existing repo convention, OpenSpec artifact, or explicit human decision.
- Do not leave human-only decisions only in chat; record them as open questions in `proposal.md`, `design.md`, or `tasks.md`.
- Do not mark gates, evidence, approvals, waivers, risk acceptance, or production readiness as complete on behalf of a human.
- Do not treat OpenSpec as a replacement for tests, evidence, approvals, waivers, or release readiness.
- Do not create custom OpenSpec folder shapes for slices.
- Keep local wrappers thin and link to source-of-truth guidance by ID and title.
