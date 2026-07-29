# Schema Templates

Use these templates when creating shared architecture schema contracts.

Schema contracts in this repo are simple YAML work contracts for agents and
tools. They support standards, patterns, controls, baselines, ADR-style
decisions, and architecture review evidence shapes. They are not full JSON
Schema files and they do not replace the documents they support.

- [TPL-014: Schema Contract Template](tpl-014-schema-contract-template.md)

Project-local Delorean process schemas, prompt and agent wiring, gates, waiver
records, evidence bundles, handoff records, re-entry records, and validation
scripts belong in `delorean_template`; project repos store their local records
and generated evidence.
