# Proposal

## Why

Current specs must describe shipped behavior. During PRD alignment, broader dashboard-summary and external-developer invitation requirements were grouped together with workspace and application-information gaps. Current repo evidence now shows that workspace CRUD, workspace membership, application-information, and workspace-scoped RP application management are shipped surfaces, external-developer invitation scope is now split into [openspec/changes/restore-external-developer-invitations](../restore-external-developer-invitations/proposal.md), and the concrete MVP dashboard-summary follow-on now lives under [openspec/changes/restore-dashboard-summary-surface](../restore-dashboard-summary-surface/proposal.md). This change now stays focused on PRD and current-spec reconciliation plus the dashboard handoff.

## Work Context And Assumptions

- Context: local developer and localhost planning default per STD-002.
- Data posture: fake, seeded, or test-only data for local verification.
- Scope boundary: this change tracks PRD scope that is not current in code. It does not approve production rollout or human governance decisions.
- Default planning assumption: current shipped code is the source of truth for `openspec/specs/`, while the PRD describes intended or historical scope that must be either reimplemented or corrected.
- Delivery assumption: if the remaining PRD scope stays intended product behavior, implementation should be split into smaller follow-on changes instead of building dashboard summary and invitation restoration in one monolithic slice.

## What Changes

- Record that the broader dashboard summary experience now moves under [openspec/changes/restore-dashboard-summary-surface](../restore-dashboard-summary-surface/proposal.md).
- Record that external developer invitation lifecycle and invited-developer RP-application-scoped access now move under [openspec/changes/restore-external-developer-invitations](../restore-external-developer-invitations/proposal.md).
- Remove the workspace, application-information, and workspace-scoped RP application gap from this change because those surfaces are now evidenced in current frontend routes, backend APIs, and current specs.
- Keep the source-of-truth decision and standards constraints visible for the dashboard follow-on work.

## Capabilities

### Modified Capabilities
- `partner-portal-access-and-dashboard`

## Impact

- Frontend routes, pages, and navigation for dashboard summary.
- Backend APIs for any dashboard summary expansion.
- PRD and OpenSpec alignment so current specs do not overstate missing behavior that is already shipped.
- Tests covering dashboard summary gaps.

## Open Questions

- Whether the default code-first current-spec assumption should be rejected in favor of treating the PRD as the authoritative description of already-shipped behavior.
