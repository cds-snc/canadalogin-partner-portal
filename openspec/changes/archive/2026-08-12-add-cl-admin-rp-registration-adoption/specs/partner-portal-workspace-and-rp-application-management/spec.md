# Delta for Partner Portal Workspace and RP Application Management

## ADDED Requirements

### Requirement: CL Admin reviews unassigned MVP1 RP registration candidates

The portal SHALL provide a CL Admin-only view of existing, non-deleted local RP
application records that have no workspace and have a stable IBM Verify
application ID. The candidate list SHALL use local portal data only and SHALL
NOT call IBM Verify for every row. It SHALL NOT expose internal database IDs,
application owners, credentials, secret values, raw provider payloads, or IBM
audit history.

#### Scenario: CL Admin opens the adoption candidate list

- **WHEN** an active CL Admin opens the existing-RP adoption task after partner workspaces have been created
- **THEN** the portal lists eligible unassigned local MVP1 RP records using public RP UUID, safe name, stable IBM application ID, and metadata-completeness state
- **AND** listing the candidates performs no IBM Verify request

#### Scenario: No unassigned registrations remain

- **WHEN** no active local RP record meets the adoption-candidate rules
- **THEN** the portal shows a localized empty state explaining that there are no registrations to link
- **AND** it provides a return path to Workspaces

#### Scenario: Partner role requests adoption candidates

- **WHEN** an RP Admin, RP User (Edit), Read Only, unauthenticated user, or user without active CL Admin requests the candidate route or API
- **THEN** the portal denies the request before returning candidate data or calling IBM Verify
- **AND** client-controlled role or owner values cannot satisfy the check

### Requirement: CL Admin previews safe missing metadata from IBM Verify

For one eligible candidate, the portal SHALL retrieve IBM Verify application
detail using the retained stable IBM application ID and reduce it to an
explicit allowlist of non-secret registration metadata. The preview SHALL
identify values that are missing locally and may be filled, values already
present locally and preserved, and non-empty differences requiring later
manual review.

Every real IBM Verify read or write SHALL remain owned by the separately
governed IBM-interactions package. This workflow SHALL consume only that
package's validated, typed non-secret projection and SHALL fail closed when no
adapter is available. The portal RP registration form and this adoption
workflow SHALL NOT call or update IBM Verify directly.

The portal SHALL NOT return or persist IBM application owners, client
credentials, current or rotated secret values, raw upstream payloads, or IBM
audit history. A non-empty portal value SHALL NOT be overwritten by the
preview or adoption operation.

#### Scenario: Selected candidate has missing non-secret metadata

- **WHEN** CL Admin opens an eligible candidate whose local record lacks allowlisted metadata and IBM Verify returns that metadata
- **THEN** the preview identifies the missing fields that can be filled during adoption
- **AND** it excludes owners, credentials, secrets, raw provider payloads, and IBM audit history

#### Scenario: IBM and portal contain different non-empty values

- **WHEN** IBM Verify returns an allowlisted value that differs from a non-empty local portal value
- **THEN** the preview preserves the portal value and identifies the field as a safe conflict for follow-up
- **AND** neither preview nor adoption silently overwrites the local value

#### Scenario: IBM Verify is unavailable or returns unsafe data

- **WHEN** the selected candidate cannot be retrieved, the provider is unavailable, or the response is malformed or contains secret-bearing fields
- **THEN** the portal returns a safe unavailable or retry state without exposing the upstream body
- **AND** the local candidate remains unmodified and unlinked

### Requirement: CL Admin explicitly links one retained RP to one workspace

The portal SHALL require CL Admin to select one active partner workspace before
adopting a candidate. The backend SHALL atomically revalidate and lock the RP
record and workspace, derive the department from the selected workspace, fill
only missing allowlisted non-secret fields, preserve the stable local RP UUID
and IBM application ID, and link the retained record to that workspace.

Existing portal audit history and MVP1 portal secret-lifecycle audit records
SHALL remain associated with the retained local RP UUID. IBM owner metadata
SHALL NOT assign a user, role, workspace, or portal permission.

#### Scenario: CL Admin adopts an eligible RP registration

- **WHEN** CL Admin confirms an eligible candidate, selects an active workspace, and supplies any required portal-only field that remains unresolved
- **THEN** the portal links the retained local RP record to that workspace and its department
- **AND** it fills only missing allowlisted non-secret metadata from the refreshed IBM projection
- **AND** it preserves the local RP UUID, IBM application ID, non-empty local values, and existing portal audit records

#### Scenario: Same workspace adoption request is retried

- **WHEN** the client repeats a completed adoption request for the same RP and workspace after an ambiguous or lost response
- **THEN** the portal returns the current adopted representation without creating a duplicate record or linkage side effect
- **AND** the existing local and audit identifiers remain unchanged

#### Scenario: Candidate was linked to a different workspace concurrently

- **WHEN** adoption revalidation finds that the RP record is already linked to a different workspace
- **THEN** the portal returns `409` with stable code `rp_application_already_linked`
- **AND** it does not move, clone, or partially update the RP record

#### Scenario: Selected workspace is unavailable

- **WHEN** the selected workspace is missing, deleted, or otherwise ineligible for partner bootstrap
- **THEN** the portal returns a safe validation or not-found response
- **AND** the RP record remains unlinked and unchanged

### Requirement: RP registration adoption is auditable and fail closed

The portal SHALL record the CL Admin adoption decision with actor, retained
local RP UUID, destination workspace UUID, outcome, correlation identifier,
timestamp, and safe changed-field names. Audit and operational logs SHALL NOT
contain secrets, credentials, owners, raw IBM payloads, unnecessary personal
information, or unhashed provider identifiers.

Authorization, candidate state, workspace state, IBM projection validation,
and transaction integrity SHALL all succeed before the workspace link becomes
effective.

#### Scenario: Successful adoption is audited

- **WHEN** a CL Admin adoption transaction commits
- **THEN** the portal records one minimized successful adoption event associated with the retained RP and workspace
- **AND** the event contains no secret, owner, credential, or raw provider data

#### Scenario: Unauthorized or invalid adoption fails before mutation

- **WHEN** authorization, candidate eligibility, workspace validation, provider validation, or concurrency checks fail
- **THEN** the portal creates no workspace link or partial metadata update
- **AND** it preserves the safe denied or failed outcome and applicable audit behavior
