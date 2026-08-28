# TPL-014: Schema Contract Template

Type: Template
Status: Active

Use this template for shared architecture schema contracts. Assign the schema
contract ID using [STD-001: Document Identifiers](../../standards/std-001-document-identifiers.md)
before publishing.

Schema contracts are simple YAML files for agents and tools. They are
machine-readable work contracts, not full JSON Schema files. They help record
checks, evidence, exceptions, ADR triggers, and review information when shared
architecture guidance applies.

Not every check is machine-provable. Use `human_review`, `content_review`, or
`evidence_required` when the result depends on judgment, review notes, or
project evidence rather than a deterministic command.

Allowed `schema_type` values:

- `standard`
- `pattern`
- `control`
- `baseline`
- `decision`
- `evidence`

Allowed `check_type` values:

- `deterministic`
- `command`
- `file_review`
- `content_review`
- `human_review`
- `evidence_required`
- `advisory`

## Template

```yaml
schema_id: ARCH-SCHEMA-STD-000-EXAMPLE
schema_version: "0.1"
title: <Schema contract title>
status: draft
schema_type: standard

owner_doc_id: STD-000
owner_doc_type: standard
owner_doc_path: docs/standards/std-000-example.md

summary: >
  <Short description of what this schema contract helps agents and reviewers
  check or record.>

categories:
  - <category>
search_keywords:
  - <keyword>
applies_when:
  - <Scenario where this contract applies.>
do_not_use_when:
  - <Scenario where this contract should not be used.>

work_contexts:
  - local_developer
stack_profiles:
  - <stack profile, such as react, fastapi, postgres, or gcds>
artifact_types:
  - <artifact type, such as adr, verification_note, baseline_assessment>

related_standards:
  - STD-000
related_patterns:
  - PAT-000
related_controls:
  - GC-WEB-000
related_baselines:
  - BAS-000

required_inputs:
  - id: <input-id>
    description: <Information the agent, tool, or reviewer needs.>
    required: true
    source: <user request, project files, owner doc, catalog, or evidence record>

checks:
  - id: <check-id>
    description: <Check or review expectation.>
    required: true
    applies_when:
      - <Condition that makes this check apply.>
    check_type: content_review
    evidence:
      - <Evidence expected when this check applies.>
    failure_means: <What it means if the check fails or evidence is missing.>
    adr_required_when: <When a local project ADR is needed.>
    waiver_allowed: false

outputs:
  - id: <output-id>
    description: <Record, field, note, or review result this contract helps produce.>

evidence_expectations:
  - <Expected verification note, baseline assessment field, screenshot, command
    summary, review note, or linked project evidence.>

adr_triggers:
  - <Condition that should trigger a local project ADR.>

waiver_guidance:
  - <When a project-local Delorean waiver may be needed for a delivery gate.>

notes:
  - <Additional guidance for authors, agents, tools, or reviewers.>
```
