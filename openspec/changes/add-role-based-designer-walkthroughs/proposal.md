# Proposal: Add role-based designer walkthroughs

## Summary

Enrich the guarded local-persona dataset with representative synthetic product
states and add a repeatable browser-recording workflow for role-based designer
walkthroughs.

## Why

The current local personas prove authorization boundaries, but their dataset is
too sparse for a useful design walkthrough. Contacts, invitation lifecycle
states, completed and draft RP configurations, Production-review states, and
usage-report rows are absent, so several implemented pages appear empty or
unavailable even though their core product behavior exists.

The project is not deployed and the intended designer does not have coding
tools. Regenerable videos provide an accessible way to review the current
role-specific experience while preserving the localhost-only security boundary.

## Work context and control boundary

- Local developer / localhost only.
- Repository-scoped edits, local PostgreSQL and Redis, local browser capture,
  and synthetic `local.example` fixture values are allowed.
- Shared environments, production, real identities, personal information,
  secrets, provider credentials, deployment, publishing, and external-system
  mutation are out of scope.
- IBM Security Verify, S3, GC Notify, Jira, and email delivery are not called or
  simulated as live integrations.
- Generated videos must not expose invitation URLs, token material, secret
  values, real contact details, or production identifiers.

## Resolved decisions

| Question                                         | Decision                                                                                                                                                                                                                                                       | Source                                                    | Classification  | Confidence |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------- | ---------- |
| Which personas are recorded?                     | CL Admin, RP Admin, RP User (Edit), Read Only, and a short no-access denial journey.                                                                                                                                                                           | `backend/src/app/core/local_persona_fixtures.py`          | fact            | high       |
| What counts as all pages?                        | Meaningful role-reachable task pages, excluding layout modules, redirects, compatibility shells, and destructive-only terminal actions.                                                                                                                        | Frontend route catalogs and current generated route tree  | safe assumption | high       |
| How is fake data isolated?                       | Extend the existing UUIDv5 namespace and exact local triple gate, but run walkthrough capture against a dedicated local PostgreSQL database and separate Redis logical databases so pre-existing developer fixtures and records are never reset for recording. | Current local-persona service, local runtime, and STD-020 | fact            | high       |
| Are schema changes needed?                       | No. Existing contact, invitation, RP configuration, and Production-review tables support the required records; MAU remains local Redis data.                                                                                                                   | Current SQLAlchemy models and MAU service                 | fact            | high       |
| Are external credential screens fully simulated? | No. Record them as unavailable/excluded because they require IBM Security Verify.                                                                                                                                                                              | Current repository dependency boundary                    | fact            | high       |
| What is the capture default?                     | English desktop WebM, reduced motion, deterministic journey order, and approximately six seconds after each settled page.                                                                                                                                      | User request and local Playwright capability              | safe assumption | high       |

## Scope

In scope:

- deterministic synthetic contacts and invitation lifecycle records;
- representative draft, completed, Test, Staging, and Production RP
  configuration states;
- pending and terminal Production-review examples;
- fixed-date local MAU cache rows that never call S3;
- exact seed validation, idempotency, partial-state detection, and cleanup for
  every new namespaced record;
- a repeatable role-based recording harness and human-readable recording index;
- focused tests and local verification; and
- generated role videos stored as disposable local artifacts by default; and
- a dedicated, non-production walkthrough persistence profile that does not
  require resetting the normal developer database or cache.

Out of scope:

- schema or Alembic changes;
- live or simulated IBM Security Verify credential mutation;
- retained-application adoption provider comparisons;
- email delivery, GC Notify, Jira actions, CATS evidence upload, deployment, or
  publishing;
- real personal information, real secrets, real tokens, or production data;
- mobile or fully duplicated French recordings in the first capture set.

## Requirements or scenarios affected

- Current spec: `openspec/specs/partner-portal-role-management/spec.md`
- Delta spec:
  `openspec/changes/add-role-based-designer-walkthroughs/specs/partner-portal-role-management/spec.md`
- Modified requirement: Local development provides deterministic
  canonical-role personas.
- Added requirement: Local development provides repeatable role walkthrough
  capture.

## Risks and mitigations

- PostgreSQL and Redis cannot share one transaction. A cache-seed failure must
  fail visibly, leave the database fixture state valid, and be safely repairable
  by rerunning the idempotent seed.
- Older local fixture catalogs can share stable parent identifiers with current
  records. Walkthrough capture therefore uses a dedicated local database and
  Redis logical databases instead of attempting to reinterpret or delete a
  developer's existing namespace.
- Videos can become stale as routes change. The tracked journey manifest and
  regenerable recorder keep route order and exclusions reviewable.
- Synthetic invitation and contact data can resemble personal information.
  Values use the reserved `local.example` domain and must remain visibly fake.
- A developer `.env` can point at shared persistence. The walkthrough target
  explicitly pins PostgreSQL and every Redis client to loopback endpoints,
  local credentials, and the dedicated database numbers before seeding.
- Recording every route module would be repetitive and misleading. The capture
  scope is limited to meaningful role-reachable experiences.

## OpenSpec lifecycle

- Lifecycle state: accepted active change.
- Change ID: `add-role-based-designer-walkthroughs`.
- Archive expectation: archive after implementation, video inspection, and
  local verification so the current role-management spec remains accurate.
