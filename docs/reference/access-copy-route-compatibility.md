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

The canonical browser hierarchy is
`/workspaces/{workspaceUuid}/applications/{applicationInformationUuid}/rp-configurations/{rpConfigurationUuid}`.
The corresponding API hierarchy uses `application-information` for its
Application segment. Compatibility code must resolve and authorize the full
hierarchy before redirecting or delegating; an ambiguous, missing,
parent-mismatched, deleted, or unauthorized record uses the standard safe
unavailable result.

### Browser redirects retained for saved links

| Saved-link surface                                                                                                          | Canonical destination and current behavior                                                                                                                                                                                                                                                                 | Known in-repo caller or coverage                                                            | Removal precondition                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/your-applications`                                                                                                        | Redirects to `/workspaces` after partner authorization.                                                                                                                                                                                                                                                    | Compatibility route tests and potentially saved MVP1 links. No current navigation emits it. | Saved-link telemetry and a named rollout owner confirm the route can be sunset.                                            |
| `/your-applications/{rpConfigurationUuid}` plus supported configuration, credentials, MAU, usage, and registration suffixes | Resolves the accessible RP configuration, reconstructs its Workspace and Application ancestry, then redirects to the equivalent canonical nested route. Former `/department-setup` and generic `/edit` action links are excluded because no semantically equivalent selected-configuration action remains. | `legacy-rp-configuration-route.ts` and route tests. No current navigation emits these URLs. | Saved-link telemetry is negligible, every retained suffix has a communicated replacement, and sunset approval is recorded. |
| `/workspaces/{workspaceUuid}/application-information/**`                                                                    | Reauthorizes the Workspace and replaces the old browser namespace with `/applications/**`.                                                                                                                                                                                                                 | Compatibility route and authorization tests.                                                | Saved-link telemetry is negligible and a sunset is approved.                                                               |
| `/workspaces/{workspaceUuid}/applications/{legacyRpConfigurationUuid}{suffix}`                                              | Only when the UUID is not an Application, resolves it as an old RP configuration and redirects to its canonical nested route. A real Application always wins.                                                                                                                                              | Legacy resolver and route tests.                                                            | Old mixed-namespace links have been migrated or expired and traffic confirms the fallback is unused.                       |
| Application `/readiness`                                                                                                    | Redirects to `/checklist-and-evidence`; it does not recreate scoring, completion counts, or submit-ready state.                                                                                                                                                                                            | Route test and saved links only.                                                            | Saved-link telemetry is negligible and the checklist URL has been communicated.                                            |
| RP configuration `/progression`                                                                                             | Reauthorizes the selected hierarchy and redirects to `/copy` without creating a target or Production-review request.                                                                                                                                                                                       | Route test and saved links only. No current navigation emits it.                            | Saved-link telemetry is negligible and a sunset is approved.                                                               |
| Workspace `/members`                                                                                                        | Reauthorizes assignment management and redirects to the selected Workspace `/access` task hub.                                                                                                                                                                                                             | Workspace route-catalog and route tests.                                                    | Saved-link telemetry is negligible and the Access URL has been communicated.                                               |

### Deprecated backend adapters retained temporarily

| Deprecated API surface                                                                                                               | Canonical replacement and bounded behavior                                                                                                                                                                                                                      | Known in-repo caller or coverage                                                                                                                                                                                | Removal precondition                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST .../rp-configurations/{sourceUuid}/progression`                                                                                | `POST .../rp-configurations/{sourceUuid}/copy`. The adapter validates the former adjacent-environment request, delegates to the copy service and shared idempotency contract, and returns compatibility fields without defining a lifecycle or implicit review. | Backend compatibility tests; no frontend fetch function, hook, or page.                                                                                                                                         | External consumers migrate to Copy; a named shared-rollout owner, endpoint telemetry, consumer confirmation, and sunset approval exist.                                  |
| `GET/POST /workspaces/{workspaceUuid}/applications`                                                                                  | The nested Application RP-configuration collection. The adapter lists legacy flat results or uses the Application UUID in the create payload to delegate to the nested registration service.                                                                    | A legacy list hook and an unused create fallback remain in source; backend compatibility tests cover the contract.                                                                                              | Remove or migrate the in-repo fallbacks, confirm external consumers use nested collections, then approve a sunset from endpoint telemetry.                               |
| `GET .../applications/{rpConfigurationUuid}/configuration`, `GET/PATCH .../registration-draft`, and `POST .../registration/complete` | The same operations below `/application-information/{applicationInformationUuid}/rp-configurations/{rpConfigurationUuid}`. Parent Application ancestry is resolved server-side before delegation.                                                               | Registration-hook fallback branches and a legacy configuration hook remain; backend and frontend compatibility tests cover them. Current canonical pages supply the Application UUID and use nested operations. | Delete the fallback branches after saved legacy URLs no longer require them, confirm no external flat-route consumer remains, and approve the sunset.                    |
| `GET/POST/PATCH .../applications/{rpConfigurationUuid}/production-review`                                                            | The nested selected-configuration Production-review resource. It remains separate from registration completion and has only absent, pending, approved, or rejected meaning.                                                                                     | Backend compatibility tests; no current frontend caller.                                                                                                                                                        | External consumers migrate to the nested resource and shared telemetry plus release ownership approve removal.                                                           |
| `DELETE .../applications/{rpConfigurationUuid}`                                                                                      | `DELETE .../application-information/{applicationInformationUuid}/rp-configurations/{rpConfigurationUuid}` after server-side ancestry resolution.                                                                                                                | Frontend API compatibility test and backend tests; no current product page calls the flat delete function.                                                                                                      | Remove the dead frontend fetch function, confirm external consumers use the nested delete, and approve the sunset.                                                       |
| RP-scoped `GET/POST .../developer-invitations` and `POST .../{invitationUuid}/revoke` or `/reissue`                                  | Workspace `/invitations` collection and selected invitation actions. The adapter preserves the former RP filter for compatibility; current invitations grant a Workspace role and acceptance does not depend on an RP configuration.                            | A legacy hook/fetch module and backend compatibility tests; current Access and Users flows call the Workspace endpoints.                                                                                        | Remove the legacy hook/fetch functions, migrate external consumers to Workspace invitations, confirm no RP-scoped semantics are required, and approve the sunset.        |
| `GET .../applications/{rpConfigurationUuid}/usage/summary`                                                                           | Nested selected-configuration `/usage/summary`. The adapter resolves the parent Application before invoking the same scoped provider operation.                                                                                                                 | A legacy usage-hook fallback and backend/frontend compatibility tests.                                                                                                                                          | Remove the fallback, confirm external consumers use the nested resource, and approve the sunset from endpoint telemetry.                                                 |
| `GET /rp-applications/accessible/{rpConfigurationUuid}/oauth-setup`                                                                  | No broad Verify administration replacement. This read-only, grant-scoped RP-operation adapter returns a minimized non-secret provider/setup projection; current pages use the nested configuration view and focused credential operations.                      | Backend API, authorization, failure-order, and service tests; no frontend caller.                                                                                                                               | Confirm no external setup consumer remains and that the nested configuration and focused RP operations cover the use case, then record telemetry-backed sunset approval. |

### Compatibility contracts retired without redirects

| Retired surface                                                                                 | Result and rationale                                                                                                                                                                                                               | Replacement                                                                                                                                           |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET/PATCH /rp-applications/accessible/{rpConfigurationUuid}/department`                        | Not present in OpenAPI and returns the standard unavailable response. RP-configuration Department assignment is inherited from its Workspace, so redirecting or accepting record-level mutation would preserve the wrong behavior. | Department reference selection remains only in its owning profile/workspace workflows.                                                                |
| `/your-applications/{rpConfigurationUuid}/department-setup` and generic `/edit` browser actions | Resolve as unavailable. Redirecting either former mutation action to a read-only overview would falsely imply an equivalent task remains.                                                                                          | Use Workspace-inherited Department context and the specifically authorized configuration or Partner-environment actions exposed by the canonical hub. |
| Generic `GET/PATCH /workspaces/{workspaceUuid}/applications/{rpConfigurationUuid}`              | Not present. The untyped payload exposed internal/provider fields and the update could bypass dedicated draft version and completion rules.                                                                                        | Use the nested summary, configuration, registration-draft, top-level metadata, and delete operations as authorized for the intended action.           |
| Raw-token invitation acceptance routes and token path segments                                  | Not present. Raw invitation tokens are accepted only once by the prepare endpoint after the browser moves the fragment into a POST body; the later authenticated acceptance URL is tokenless.                                      | `/invitations/rp-applications/prepare#token=...` followed by `/invitations/rp-applications/accept`.                                                   |

Backend tests prove an equivalent old/new progression replay with the same
idempotency key resolves to one target. Tests also assert that the retired
Department and generic questionnaire contracts are absent from OpenAPI.

The shared-rollout owner, telemetry source/threshold, and removal date for the
retained adapters are intentionally **unassigned** in local scope. They require
a named shared target and human release ownership. Until those decisions and
each row's in-repo migration preconditions are satisfied, adapter removal is
blocked non-local work.

## Local verification data

Use only fake UUIDs, example domains, and synthetic personas. Do not place
invitation tokens, email addresses from shared environments, RP credentials,
private/offline key material, raw provider responses, or copied answer values
in route parameters, logs, screenshots, or evidence. The copy audit record is
limited to actor/target identifiers, target environment, policy version,
outcome, correlation ID, and timestamp.
