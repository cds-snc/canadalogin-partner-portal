---
name: grill-me-to-openspec-change
description: Convert a grill-me conversation plus real codebase evidence into a complete OpenSpec change with proposal, design, specs, and tasks ready for implementation.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: local
  version: "1.0"
---

Create an implementation-ready OpenSpec change from the current conversation and the real codebase.

This skill is based on openspec-propose, but adds one critical behavior:
- Ground every artifact in the current conversation context and verified repository evidence.

Output artifacts:
- proposal.md
- design.md
- specs/**/*.md
- tasks.md

When done: the change must be apply-ready.

---

## Core Principles

- Use the conversation as the primary intent source.
- Use codebase exploration to confirm feasibility, boundaries, constraints, and integration points.
- Do not invent architecture or APIs when the code contradicts assumptions.
- Ask questions only for true blockers, and ask one question at a time.
- Prefer momentum: make reasonable decisions when ambiguity is low.

---

## Input

Use the current conversation thread as input.

If the user did not provide a clear change intent, ask:
"What change should this OpenSpec proposal capture?"

Derive a kebab-case change name from user intent if not provided.

---

## Workflow

### 1) Resolve OpenSpec context

Run:

```bash
openspec list --json
```

If a relevant change already exists, ask whether to continue it or create a new one.

### 2) Build a context bundle from conversation + codebase

Before creating artifacts, produce a working context bundle containing:

- Problem statement (from user conversation)
- Explicit requirements and constraints
- Security and access constraints
- Affected user flows
- Affected backend/frontend modules
- Existing routes/endpoints/contracts
- Risks and unknowns

Required behavior:
- Validate assumptions by reading/searching relevant files.
- Capture concrete evidence (file paths, symbols, endpoint names) for key decisions.
- If uncertainty remains and materially affects design, ask one focused question.

### 3) Create or continue change scaffold

If creating new:

```bash
openspec new change "<name>"
```

Then run:

```bash
openspec status --change "<name>" --json
```

Use `changeRoot`, `artifactPaths`, and artifact dependency status from JSON.

### 4) Generate artifacts in dependency order (openspec-propose base)

Follow openspec-propose sequencing and instructions exactly:

- For each ready artifact:

```bash
openspec instructions <artifact-id> --change "<name>" --json
```

- Respect template, instruction, rules, and dependency context.
- Read completed dependency artifacts before writing dependent artifacts.
- Re-run status after each artifact and continue until all apply requirements are done.

### 5) Spec generation rules (critical)

From the proposal Capabilities section:

- Create one spec file per new capability at `specs/<capability>/spec.md`.
- For modified capabilities, create delta specs under existing capability names.
- Use requirement/scenario format exactly (`### Requirement`, `#### Scenario`).
- Write normative, testable statements (SHALL/MUST).
- Ensure every requirement has at least one scenario.

### 6) Completion gate

Run:

```bash
openspec status --change "<name>"
```

Success criteria:
- proposal done
- design done
- specs done
- tasks done
- change apply-ready

---

## How This Differs From openspec-propose

- You MUST mine and use the active conversation context before drafting artifacts.
- You MUST verify key assumptions against real codebase evidence.
- You SHOULD include explicit constraints discovered in code (auth model, route shape, endpoint behavior, data contracts, test expectations).
- You SHOULD call out unknowns and assumptions in design.md when evidence is incomplete.

This is not a generic proposal generator. It is a context-grounded change authoring workflow.

---

## Artifact Quality Checklist

Before finishing, confirm:

- Proposal reflects user intent from this conversation.
- Proposal capabilities map 1:1 to spec files created.
- Design decisions reference actual codebase constraints.
- Specs encode behavior, access control, and error boundaries where relevant.
- Tasks are implementation-ready, ordered by dependency, and test-inclusive.

---

## Output Summary

After completion, report:

- Change name
- Change location
- Artifacts created
- Key assumptions or open questions
- Ready signal: "All artifacts created and apply-ready."

Prompt the user with:
- "Run /opsx:apply or ask me to implement this change."

---

## Guardrails

- Never write application implementation code in this skill.
- Do not skip codebase verification for critical constraints.
- Do not copy instruction context/rules blocks into artifact output.
- If a true blocker remains, ask one concise question and continue.
