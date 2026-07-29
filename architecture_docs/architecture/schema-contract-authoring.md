# Schema Contract Authoring

Type: Architecture Guidance
Status: Active

Use this guide when creating or updating a shared architecture schema contract
for a standard, pattern, control, baseline, ADR decision shape, or architecture
review evidence shape.

Schema contracts are simple YAML work contracts for agents and tools. They are
not full JSON Schema files. They support review, routing, evidence capture, and
visible project decisions. They do not replace the owner document.

Use [TPL-014: Schema Contract Template](../templates/schemas/tpl-014-schema-contract-template.md)
for new schema contracts.

## Method

1. Identify the owner document.

   Name the `STD`, `PAT`, control, `BAS`, ADR guidance, or review template the
   schema contract supports. Record its ID, type, and path.

2. Copy only the checks that need consistent review or evidence.

   Focus on the parts agents and reviewers need to route, check, or record
   consistently. Do not turn every sentence into a check.

3. Do not copy the whole standard.

   The owner document remains the source of truth. The schema contract should
   point back to it and summarize only the operational review shape.

4. Mark the check type.

   Use the smallest useful check type:

   - `deterministic`: a tool can prove the result from structured files.
   - `command`: a command can produce the result or evidence.
   - `file_review`: a reviewer or tool inspects file presence, path, metadata,
     or structure.
   - `content_review`: a reviewer or tool inspects written content.
   - `human_review`: a person must judge the result.
   - `evidence_required`: the work must provide evidence, but this repo does not
     define the runtime check.
   - `advisory`: the check guides review but does not block by itself.

   Not every check is machine-provable. Use human review or evidence-required
   checks when judgment, screenshots, review notes, or project evidence are
   needed.

5. Add search metadata so agents can find it.

   Include categories, keywords, applies-when entries, do-not-use-when entries,
   work contexts, stack profiles, artifact types, and related document IDs.

6. Add ADR triggers for project decisions not to follow the guidance.

   Use `adr_triggers` when a project should record a durable local decision.
   Common triggers include varying from an applicable standard, replacing a
   pattern with another approach, accepting a control risk, or deciding a
   baseline requirement is not applicable.

7. Add waiver guidance when a delivery gate may need a project-local waiver.

   `waiver_guidance` should explain when a project-local Delorean process may
   need a waiver for a specific check, time period, release, or accepted risk.
   Do not create waiver process schemas in this repo.

8. Add the schema contract to `docs/schemas/catalog.yml`.

   Keep the catalog as a routing index, not a duplicate of the schema contract.

   Suggested entry shape:

   ```yaml
   documents:
     - id: ARCH-SCHEMA-STD-000-EXAMPLE
       title: <Schema contract title>
       schema_type: standard
       status: draft
       path: docs/schemas/standards/std-000-example.schema.yaml
       owner_doc_id: STD-000
       owner_doc_type: standard
       owner_doc_path: docs/standards/std-000-example.md
       primary_category: <category>
       categories:
         - <category>
       applies_when:
         - <Short routing trigger.>
   ```

9. Add `schema_refs` to the owner document catalog entry.

   Add the schema contract ID and path to the relevant owner catalog entry, such
   as `docs/standards/catalog.yml`, `docs/patterns/catalog.yml`,
   `docs/controls/catalog.yml`, or `docs/baselines/catalog.yml`.

   Suggested field shape:

   ```yaml
   schema_refs:
     - id: ARCH-SCHEMA-STD-000-EXAMPLE
       path: docs/schemas/standards/std-000-example.schema.yaml
       used_for:
         - checking selected implementation evidence
         - recording standard exceptions or ADR triggers
   ```

10. Add a Related schema contracts section to the owner document.

    The section should name the schema contract, what it is used for, the
    expected project location for local records, and any notes. Keep the section
    short and clear that the schema contract supports the document.

## ADR And Waiver Distinction

Use an ADR when the project is making a durable architecture, design, or
standard-variation decision.

Use a waiver when a delivery or gate process needs a time-limited or
release-specific exception for a check, release, or accepted risk.

A schema contract may name both:

- `adr_required_when` for durable local decisions
- `waiver_allowed` and `waiver_guidance` for project-local Delorean process
  exceptions

This repo may define the reusable decision and evidence shape.
`delorean_template` owns the local waiver process shape; project repos store
their local waiver and evidence records.

## Keep The Contract Small

A good schema contract is short enough for agents and reviewers to use during
work. Prefer fewer high-value checks over a long checklist that repeats the
owner document.
