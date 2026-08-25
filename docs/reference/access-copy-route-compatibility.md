# Access And RP-Configuration Route Compatibility

This reference records the local route map, canonical copy contract, and
bounded compatibility surfaces introduced by
`refine-access-copy-and-shared-navigation`. The work is local-only at Delorean
Level 2; examples use synthetic identifiers and no real personal information,
credentials, secrets, provider payloads, or shared-environment data.

## Focused access routes

Central CL Admin user access uses these protected routes:

- `/users/{userUuid}`: compact selected-user task hub;
- `/users/{userUuid}/global-access`: global assignment summary;
- `/users/{userUuid}/workspace-access`: workspace assignment table;
- `/users/{userUuid}/workspace-access/new`: add an existing user to a
  workspace;
- `/users/{userUuid}/invitations`: pending invitations for the selected user.

Selected-workspace access uses these protected routes:

- `/workspaces/{workspaceUuid}/access`: task hub;
- `/access/assignments` and `/access/assignments/new`: assignment collection
  and creation;
- `/access/assignments/{assignmentUuid}`: one ancestry-checked assignment;
- `/access/invitations` and `/access/invitations/new`: invitation collection
  and creation;
- `/access/invitations/{invitationUuid}`: one ancestry-checked invitation.

`/workspaces/{workspaceUuid}/members` is a browser compatibility route. It
authorizes the selected workspace and redirects to its canonical `/access`
route without reading or mutating a record.

## Canonical configuration copy

The canonical API is:

```text
POST /api/v1/workspaces/{workspaceUuid}/application-information/{applicationInformationUuid}/rp-configurations/{sourceRpConfigurationUuid}/copy
Idempotency-Key: 018f6f83-0000-0000-0000-000000000902
```

The body requires `targetConfigurationName`, `targetPartnerEnvironment`, and
an explicit `targetEnvironment` of `test`, `staging`, or `production`. The
service authorizes the full workspace/Application/source ancestry, creates a
new version-1 draft, preserves source lineage, copies only the versioned
allowlist of reusable non-secret answers, and returns the new target UUID.
Copy never mutates the source, creates Production-review work, or implies
approval, deployment, or launch.

The browser route is the corresponding selected-record `/copy` route. It
defaults the target environment to the source environment but leaves all three
environments selectable. After success, the user resumes the new draft at the
earliest incomplete registration step.

## Compatibility inventory

The bounded compatibility surfaces are:

| Surface | Repository caller | Current behavior | Removal precondition |
|---|---|---|---|
| Browser `/progression` route | Saved links only; no canonical product link | Reauthorizes the selected hierarchy, then redirects to `/copy` without mutation | Shared traffic confirms saved-link use is negligible and a sunset is approved |
| Backend `POST .../progression` | Retained typed frontend fetch/hook and compatibility tests; no canonical page caller | Validates the legacy Test-to-Staging or Staging-to-Production transition, then invokes the canonical copy service and shared idempotency key | Named shared-rollout owner, endpoint telemetry, consumer confirmation, and sunset approval |
| Legacy progression response fields | Compatibility clients and tests | Returns the copied target with `selfServe: true` and no implicit `promotionStatus` | All compatibility consumers migrate to the copy response |

The repository currently has no user-facing page that calls the legacy POST
contract. Local tests prove an equivalent old/new replay with the same
idempotency key resolves to one target.

The shared-rollout owner, telemetry source/threshold, and removal date are
intentionally **unassigned** in local scope. They require a named shared target
and human release ownership before the adapter can be removed. Until that
decision is recorded, preserve both compatibility routes and treat adapter
removal as blocked non-local work.

## Local verification data

Use only fake UUIDs, example domains, and synthetic personas. Do not place
invitation tokens, email addresses from shared environments, RP credentials,
private/offline key material, raw provider responses, or copied answer values
in route parameters, logs, screenshots, or evidence. The copy audit record is
limited to actor/target identifiers, target environment, policy version,
outcome, correlation ID, and timestamp.
