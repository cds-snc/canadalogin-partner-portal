# Design

## Context

The repository currently ships authenticated onboarding, workspace CRUD, workspace membership, application-information management, workspace-scoped RP application management, owner-scoped RP application detail and credential flows, MAU reporting, generic error routing, platform administration routes, and structured error logging. The remaining PRD/current-code gap tracked by this change is the broader dashboard summary experience.

External-developer invitation lifecycle and acceptance planning now move under [openspec/changes/restore-external-developer-invitations](../restore-external-developer-invitations/proposal.md). This change keeps the remaining dashboard scope visible without reopening shipped workspace and application-information behavior as proposed-only work.

The concrete MVP dashboard plan now moves under [openspec/changes/restore-dashboard-summary-surface](../restore-dashboard-summary-surface/proposal.md). This change remains the source-of-truth and standards gate for that follow-on package.

This change should not be implemented as one broad monolith. Its implementation-ready outcome is either:

- PRD correction and archive with no code change, or
- a split into smaller follow-on implementation changes with clear route, API, data, IAM, and standards boundaries.

## Goals / Non-Goals

**Goals:**

- Keep current specs limited to code-backed behavior.
- Preserve the remaining PRD-described dashboard-summary scope as active OpenSpec work.
- Make it clear which requirements still need implementation, tests, or a PRD correction decision.

**Non-Goals:**

- No implementation work in this cleanup change.
- No archive of this change until code or source-of-truth corrections exist.
- No attempt to relitigate current workspace, application-information, or workspace-scoped RP application behavior that is already evidenced in repo routes, APIs, and tests.

## Decisions

### Decision 1: Treat unverified remaining PRD scope as proposed behavior

- Choice: move PRD-described behavior that is not evidenced in current code out of `openspec/specs/` and into this active change.
- Rationale: Level 2 still expects current specs to be accurate, so unverified behavior should not remain in current specs.

### Decision 2: Keep the remaining gap visible by capability instead of deleting it

- Choice: retain the missing scope as deltas against the affected capabilities.
- Rationale: the user asked for cleanup, not loss of intent. An active change keeps the behavior visible and traceable.

### Decision 3: Treat workspace and application-information baselines as current behavior

- Choice: remove workspace, application-information, and workspace-scoped RP application management from this gap change and keep those surfaces in current specs.
- Rationale: current frontend routes, backend APIs, migrations, and tests now evidence those behaviors.
- Trade-off: onboarding MVP2 planning can build directly on the current workspace baseline instead of treating it as a prerequisite gap.

### Decision 4: Use this change as a planning gate for dashboard follow-on work

- Choice: keep this change as the PRD and current-spec reconciliation gate, and hand the concrete MVP dashboard behavior to the dedicated follow-on change `restore-dashboard-summary-surface`.
- Rationale: invitation restoration already proved that splitting concrete implementation-ready planning out of this cleanup package keeps active changes smaller and clearer.

## Standards impact

```yaml
standards_impact:
	ui:
		applies: true
		decision: Any restored dashboard UI should use STD-005, STD-006, PAT-021, PAT-017, and PAT-023 instead of ad hoc cards or mixed-purpose pages.
		evidence: Follow-on changes must record a page-pattern decision and route plan before implementation.
		exceptions: []
	accessibility:
		applies: true
		decision: Restored dashboard pages must define keyboard, focus, heading, table, and feedback-state expectations before coding.
		evidence: Follow-on frontend tests and review fixtures.
		exceptions: []
	official_languages:
		applies: true
		decision: Restored dashboard copy must ship with English and French parity.
		evidence: Locale updates and route parity checks in follow-on changes.
		exceptions: []
	security_privacy:
		applies: true
		decision: Any dashboard summary expansion must avoid leaking unauthorized workspace or RP-application data.
		evidence: Follow-on authorization and failure-path tests.
		exceptions: []
	identity_access:
		applies: true
		decision: Any dashboard summary expansion must be reviewed against existing OIDC and RBAC behavior before implementation.
		evidence: Follow-on IAM-focused design and test tasks.
		exceptions: []
	information_management:
		applies: true
		decision: Any new dashboard summary records or cached aggregates must use explicit ownership and lifecycle expectations when persistence is introduced.
		evidence: Follow-on schema and migration review notes.
		exceptions: []
	verification:
		applies: true
		decision: This planning change validates the split and standards path; follow-on changes own executable verification.
		evidence: OpenSpec validation for this change and for each follow-on change.
		exceptions: []
	gc_web_application_baseline:
		applies: true
		decision: Any follow-on UI/API restoration should treat the work as a meaningful GC web application change.
		evidence: Baseline applicability captured in each follow-on change.
		exceptions: []
```

## Patterns to follow if implementation proceeds

- PAT-021 for any restored dashboard or authenticated overview page.
- PAT-017 for read-only dashboard summaries.
- PAT-023 for any queue, report, or tabular dashboard views.

## Slice Plan

### Slice 1: Source-of-truth resolution

- Outcome: the team agrees whether missing PRD scope should be reimplemented or removed from the PRD.
- Impacted areas: PRD wording, OpenSpec expectations, implementation backlog.
- Exit condition: current code remains the source of truth for current specs, and either PRD corrections or follow-on change IDs are chosen.

### Slice 2: Dashboard summary parity

- Outcome: the dashboard-summary follow-on package is named and carries the concrete MVP route, page-pattern, and summary behavior.
- Impacted areas: follow-on OpenSpec package, frontend dashboard route and page, any minimal current-user summary API refinements, tests.
- Notes: the dedicated follow-on currently lives at `restore-dashboard-summary-surface` and keeps `/your-applications` as a read-only service-home dashboard.

## Implementation readiness

- This change is not a direct implementation package.
- Ready when: Slice 1 completes and the team chooses either PRD correction or follow-on implementation changes.

- If implementation proceeds, recommended split order:
	1. `restore-dashboard-summary-surface` (created)
- Blockers:
	- the PRD and current code still diverge on whether dashboard summary beyond `/your-applications` is already shipped or still future work

## Open Questions

- Human decision required only if the default code-first current-spec assumption is rejected.
- Human decision required only if the recommended dashboard-only follow-on change is rejected.
