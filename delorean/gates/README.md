# Delorean Gates

This folder defines Delorean gates and checks for solution delivery.

A gate is a check that can warn, block, or require a human-approved exception.

Use these rules:

- OpenSpec owns requirements, scenarios, proposals, design notes, and tasks.
- Delorean gates own delivery checks and decision rules.
- The gate catalog defines available checks.
- Per-change check results belong in `delorean/evidence/<change-id>/change-state.yaml`.
- The Evidence Bundle owns review-facing proof.
- GC web application baseline assessment uses STD-019, BAS-001, and the
  generated `architecture_docs/controls/` and `architecture_docs/baselines/`
  catalogs. Record local assessment status in change state and evidence; do not
  edit reusable baseline or control source docs in this repo.
- Human approval and waivers must be recorded through Delorean templates.
- Agents may prepare gate status, but they must not approve waivers, release, sensitive access, production actions, or risk acceptance.
