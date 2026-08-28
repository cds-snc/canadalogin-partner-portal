---
id: dl-requirements-answer-questions
description: List OpenSpec open questions, resolve answerable ones from repo context, and collect human decisions through a focused conversation.
use_when:
  - An OpenSpec proposal, design, tasks file, or spec delta contains open questions or human decisions required.
  - The user wants to answer proposal questions before planning, implementation, verification, or archive.
  - The agent needs a back-and-forth conversation that records answers in the right OpenSpec artifact.
default_golden_paths:
  - intent_design_readiness
common_overlays:
  - question_resolution
required_inputs:
  - openspec_change_id_or_path
  - target_question_section_when_known
  - question_answering_goal
produces:
  - open_question_inventory
  - resolved_question_cards
  - human_decision_questions
  - updated_openspec_question_sections
agent: Spec Author
---

# DL Answer OpenSpec Questions

## Purpose

List open questions from an OpenSpec change, resolve anything answerable from
repo context, and run a focused human-feedback conversation for the decisions
that remain.

Use this prompt when `proposal.md`, `design.md`, `tasks.md`, or a spec delta
already has open questions and the next useful step is to collect answers
without turning the conversation into a broad requirements rewrite.

## Required Inputs

- OpenSpec change ID, path, proposal path, or current spec reference.
- Which question section to focus on, if known.
- Whether to update OpenSpec artifacts after each answered batch or only
  produce proposed edits for review.
- Any known owner, deadline, approval context, or non-local work context.

## Route

1. Read [README.md](../../README.md), [delorean/config.yaml](../../delorean/config.yaml), and the active OpenSpec package.
2. Read `proposal.md` first, then `design.md`, `tasks.md`, and spec deltas when they exist.
3. Use [docs/reference/openspec-lifecycle.md](../../docs/reference/openspec-lifecycle.md) to identify the lifecycle state.
4. Use STD-002: Work Contexts. If no environment is named, assume local developer / localhost, fake or test-only data, no real secrets, no production data, no deployment, and no external system changes.
5. Use [docs/repo-guidance/control-boundaries.md](../../docs/repo-guidance/control-boundaries.md) when a question affects agents, tools, APIs, MCP servers, privileged commands, sensitive data, generated evidence, environments, approval, waiver, deployment, or audit expectations.
6. Use [.github/skills/delorean-question-resolution/SKILL.md](../skills/delorean-question-resolution/SKILL.md) before asking the user. Resolve discoverable facts and safe assumptions from repo guidance, OpenSpec, architecture docs, code, tests, contracts, templates, and approved docs.
7. Use [.github/skills/delorean-openspec/SKILL.md](../skills/delorean-openspec/SKILL.md) when question answers require proposal, design, tasks, or scenario updates.
8. The Spec Author applies [delorean/config.yaml](../../delorean/config.yaml) before requiring change-state, gates, Evidence Bundles, approvals, waivers, release-readiness, MCP, or subagent outputs.
9. Read `delorean/evidence/<change-id>/change-state.yaml` when it exists and change-state is in scope.

## Conversation Loop

1. Inventory open questions from:
   - `## Open questions`
   - `## Open questions that block non-local work`
   - `Human decisions required`
   - unchecked `tasks.md` items that explicitly ask for a decision
   - question tables in proposal, design, tasks, or spec deltas
2. Group questions as:
   - `repo_answerable`
   - `safe_assumption`
   - `human_decision_required`
3. Answer `repo_answerable` and `safe_assumption` questions first, with sources and confidence.
4. Show the remaining human questions as a numbered list with the artifact path and what each question blocks.
5. Ask the user only the next small batch of human questions, usually one to three questions.
6. After the user answers, restate the interpreted decision and update or propose updates to the relevant OpenSpec section.
7. Repeat until no human-decision questions remain in the selected scope or the user pauses.

## Expected Output

```text
OpenSpec question-answering result:
- OpenSpec change path:
- Lifecycle state:
- Work context:
- Question sections scanned:
- Questions found:
- Repo-answerable questions resolved:
- Safe assumptions recorded:
- Human-decision questions remaining:
- Current conversation batch:
- OpenSpec files updated or proposed edits:
- Validation command or skipped reason:
- Blockers:
- Next recommended task:
```

For each human question, use this compact format:

```text
Question <number>:
- Artifact:
- Question:
- Why it needs human feedback:
- Blocks:
- Suggested answer shape:
```

## Guardrails

- Do not answer human-only decisions on behalf of the user.
- Do not treat best practice as a requirement unless it is backed by a standard, existing repo convention, OpenSpec artifact, or explicit human decision.
- Do not bury resolved answers only in chat; update or propose updates to `proposal.md`, `design.md`, or `tasks.md` when an active OpenSpec change is in scope.
- Do not rewrite broad requirements unless the answer directly changes scope, acceptance criteria, a scenario, or an implementation task.
- Do not move active OpenSpec deltas into `openspec/specs/` before implementation and verification are complete.
- Stop or ask before production, real secrets, real data, deployment, external system changes, approval, waivers, destructive changes, or wider permission boundaries.
