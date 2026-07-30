## Why

Current specs must describe shipped behavior. During PRD alignment, several PRD-described MVP1 capabilities were written into `openspec/specs/` even though the current codebase does not expose matching end-to-end API and route surfaces for them. Those requirements should stay visible, but they belong in an active change until implementation and verification are complete or until the PRD is corrected.

## Work Context And Assumptions

- Context: local developer and localhost planning default per STD-002.
- Data posture: fake, seeded, or test-only data for local verification.
- Scope boundary: this change tracks PRD scope that is not current in code. It does not approve production rollout or human governance decisions.
- Default planning assumption: current shipped code is the source of truth for `openspec/specs/`, while the PRD describes intended or historical scope that must be either reimplemented or corrected.
- Delivery assumption: if the PRD scope remains intended product behavior, implementation should be split into smaller follow-on changes instead of building dashboard parity, workspace restoration, and invitation restoration in one monolithic slice.

## What Changes

- Track a broader dashboard summary experience that includes current-user profile context and workspace summaries in addition to current-user RP applications.
- Track workspace CRUD, workspace membership, application-information intake, and workspace-scoped RP application management as proposed behavior rather than current behavior.
- Track external developer invitation lifecycle and invited-developer RP-application-scoped access as proposed behavior rather than current behavior.
- Define the split and standards constraints for any follow-on implementation changes needed to restore those behaviors.

## Capabilities

### Modified Capabilities
- `partner-portal-access-and-dashboard`
- `partner-portal-workspace-and-rp-application-management`
- `partner-portal-external-developer-invitations-and-scoped-access`

## Impact

- Frontend routes, pages, and navigation for dashboard, workspaces, application information, and invitations.
- Backend APIs and persistence surfaces for workspaces, application information, invitations, and scoped invited-developer access.
- PRD and OpenSpec alignment so current specs do not overstate what the code ships today.
- Tests covering workspace management, application-information workflows, invitation flows, and role-scoped access.

## Open Questions

- Whether the default code-first current-spec assumption should be rejected in favor of treating the PRD as the authoritative description of already-shipped behavior.
- Which invited-developer behaviors beyond current-user RP application detail should be part of the first restored slice, if any.