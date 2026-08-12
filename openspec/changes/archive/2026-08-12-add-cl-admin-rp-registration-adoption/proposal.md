# Proposal: Add CL Admin RP Registration Adoption

## Why

MVP1 can leave locally stored RP application records without a workspace.
Those records retain stable local UUIDs, IBM application IDs, and portal audit
history, but the canonical four-role model requires every usable partner RP
application to belong to one established workspace. An unattended sync cannot
make that business decision and IBM owner metadata cannot be treated as portal
authority.

## What Changes

Provide a CL Admin workflow that adopts RP registrations already stored by
MVP1 after the corresponding partner workspaces have been created. The
workflow preserves each local RP record and explicitly links it to one
workspace while consuming only an allowlisted, non-secret metadata projection
from the separately governed IBM-interactions package.

## Work Context And Control Boundary

- Context: local developer / localhost under STD-002: Work Contexts.
- Allowed: repo-scoped OpenSpec, code, tests, fake IBM adapter responses, local
  fake records, and local verification.
- External dependency mode: IBM Verify is unavailable and unauthorized in this
  context; tests use an injected contract-compatible fake.
- Sensitive data: stable application identifiers and audit metadata are
  internal records. Raw identifiers are excluded from logs; secrets,
  credentials, owner-derived access, and real personal information are not
  used.
- Denied: real IBM calls, shared or production data, secrets, deployment,
  external mutation, approval, waiver, or release decisions.

## Resolved Decisions

- Launch will adopt existing MVP1 RP registrations.
- CL Admin performs adoption after creating partner workspaces.
- Candidates are existing, non-deleted local RP records with no workspace and
  a stable IBM application ID. The workflow does not bulk-create local records
  from every IBM application.
- CL Admin explicitly selects the destination workspace for each candidate.
- A selected candidate may request a safe metadata refresh on demand through a
  typed provider contract. The separate IBM-interactions package owns IBM
  credentials, SDK/network calls, raw-response mapping, and provider retry
  behavior; this package never calls or parses IBM directly.
- Only an allowlisted non-secret projection may fill missing local values.
  Existing non-empty portal values win and differences are shown for follow-up
  instead of being overwritten.
- Stable local RP UUIDs, IBM application IDs, portal audit history, and portal
  secret-lifecycle audit records are preserved.
- IBM owners, credentials, secret values, raw upstream payloads, and IBM audit
  history are never imported or used for portal authorization.
- The unattended mutating IBM synchronization job remains off outside
  local/test until this workflow is implemented and verified.

## Scope

- A CL Admin-only list of unassigned MVP1 RP registration candidates.
- A focused candidate review and workspace-link form.
- On-demand metadata preview through an injected safe-projection contract,
  with a fake local provider until the IBM-interactions package supplies the
  real adapter.
- Atomic and idempotent workspace linking with safe conflict behavior.
- Derivation of department from the selected workspace.
- Minimized audit of the adoption decision and fields filled.
- English/French UI, accessible status states, API/OpenAPI contracts, tests,
  and local fake-provider verification.

## Out Of Scope

- Automatically assigning users or roles.
- Deriving a workspace or role from IBM application owners.
- Importing secrets, credentials, owner records, or IBM audit history.
- Overwriting non-empty portal-authored values from IBM.
- Blind bulk import of IBM-only registrations without a retained local MVP1
  record.
- Re-enabling unattended non-local synchronization.
- Real IBM Verify, shared-environment, production, deployment, or cutover
  execution.
- Retention or physical deletion of legacy records.

## Dependencies And Sequencing

- Archived `define-four-role-authorization-model` establishes CL Admin and
  canonical workspace authority; this package is rebased against its merged
  current contract.
- refine-workspace-task-hub-and-registration-flow owns the final Workspaces
  information architecture. This change may implement its backend slice first,
  but its frontend routes must rebase against that package before archive.
- add-authenticated-home-and-navigation-groups owns the global route and
  navigation catalog consumed by the Workspaces parent task area.
- The separately governed IBM-interactions package owns every real IBM Verify
  call and raw provider response. This package owns the adoption allowlist and
  consumes only its typed, non-secret metadata projection; an unavailable
  provider fails safely. It does not block this local portal contract from
  being implemented and archived, but it does block shared or production use
  until the separate package supplies an authorized adapter.

## Capabilities

### Modified Capability

- partner-portal-workspace-and-rp-application-management

## Impact

- OpenSpec workspace/RP application management requirements.
- Backend RP application schemas, service orchestration, routes,
  authorization, audit, and tests.
- Frontend Workspaces task link, protected routes, typed fetch helpers, feature
  pages, bilingual content, state tests, and visual/accessibility evidence.
- Generated OpenAPI and TanStack Router artifacts.

## Risks

- Linking the wrong workspace could expose an RP application to the wrong
  partner. Mitigation: CL Admin-only explicit selection, confirmation,
  transaction locking, and audit.
- Provider metadata could overwrite curated local records or expose secrets.
  Mitigation: missing-only field fill, an explicit allowlist, safe preview,
  and no raw provider payload in API responses or logs.
- Concurrent adoption could link one RP to different workspaces. Mitigation:
  row locking, same-workspace idempotence, and different-workspace conflict.
