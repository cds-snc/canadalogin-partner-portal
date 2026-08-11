# Proposal

## Why

The onboarding PRD and the current-user RP application model both require a way to bootstrap partner-side access without granting workspace membership. `CL Admin` users need to invite the initial one or two partner-side `RP Admin` users, and those `RP Admin` users then need a controlled way to invite their own staff with permitted roles. The repo already contains early invitation evidence, but not a finished product contract:

- bilingual invitation-acceptance copy exists in frontend locale files
- GC Notify configuration and a generic email sending service exist in backend configuration and services
- an archived migration defines an `rp_application_developer_invitation` record shape

There is still no dedicated active OpenSpec change for invitation lifecycle, acceptance, or app-scoped invited-developer access. The remaining invitation delta inside [openspec/changes/reconcile-prd-current-spec-gaps](../reconcile-prd-current-spec-gaps/proposal.md) is too broad to drive implementation or verification cleanly.

## Work Context And Assumptions

- Context: local developer and localhost planning default per STD-002.
- Data posture: fake, seeded, or test-only data for local verification.
- Scope boundary: this change defines invitation behavior, access scoping, and implementation planning for non-production work. It does not approve production rollout or external system credentials.
- Baseline assumption: workspace, application-information, and workspace-scoped RP application management are already current shipped baselines that this change can build on.
- Partner-context assumption: the first-release "partner" boundary is the existing workspace. A department may own more than one partner workspace, so department data remains reference metadata and not the authorization boundary. This change does not introduce a separate partner entity yet; the existing workspace acts as the durable first-release partner scope.
- First-release access-scope assumption: a granted invited role applies to the whole partner workspace. The first release does not split permissions by individual RP application inside that partner workspace.
- Invitation delivery assumption: the first release creates an invitation record and tokenized acceptance link without requiring automatic email delivery. GC Notify-backed delivery can remain a follow-on capability.
- Identity-match assumption: invitation acceptance requires the invited email address to match the email on the user's CanadaLogin account.
- Access-control assumption: invited developers authenticate with CanadaLogin, and follow-on implementation must check for pending invitations by matching email before applying the current OIDC group-based denial path.
- Access-context assumption: accepted invitees use the invitation's existing workspace or partner context and the RP applications under that scope instead of defining a separate partner or department during invitation acceptance.
- Capability-boundary assumption: [openspec/changes/advance-onboarding-governance-and-reporting](../advance-onboarding-governance-and-reporting/proposal.md) continues to own role-boundary guidance copy, while this change owns invitation lifecycle and access behavior.

## What Changes

- Add a dedicated active change for `partner-portal-external-developer-invitations-and-scoped-access`.
- Define bootstrap invitation behavior where `CL Admin` users invite the initial partner-side `RP Admin` users for a specific existing partner workspace, using one existing RP application in that workspace as the first-release management entry point if needed.
- Define ongoing invitation behavior where `RP Admin` users can invite their own staff within the same partner workspace context for `RP User (Edit)` and `Read Only`, but cannot assign more `RP Admin` users.
- Define invitation creation with an assigned invitation-scoped role for the target RP application.
- Define tokenized invitation acceptance rules, including valid, expired, revoked, invalid, and signed-in email-mismatch paths.
- Define first-login invitation checks that assign the invitation's scoped roles onto the local user record when the CanadaLogin account email matches a pending invitation.
- Define invited-developer access scoping so accepted invitees can reach only RP applications and invitation-management surfaces within the granted partner workspace scope.
- Define the route, API, data, IAM, and verification slices needed to implement the behavior.

## Capabilities

### New Capabilities
- `partner-portal-external-developer-invitations-and-scoped-access`

## Impact

- Frontend routes and pages for invitation management and invitation acceptance.
- Backend invitation APIs, token validation, access-control checks, and optional later GC Notify delivery wiring.
- Persistence for invitation lifecycle, status timestamps, token hashing, assigned invitation roles, local user-record role assignment, and partner-scoped invited-developer access linkage.
- OIDC or session-entry behavior for invited developers who do not satisfy the current upstream group gate.
- Tests covering invitation lifecycle, access scoping, denial paths, and bilingual invitation states.

## Open Questions

- Which exact current-user RP application actions for `RP Admin`, `RP User (Edit)`, and `Read Only` should remain deferred beyond the first-release permission set if implementation reveals hidden dependencies on the current owner-email access model.
