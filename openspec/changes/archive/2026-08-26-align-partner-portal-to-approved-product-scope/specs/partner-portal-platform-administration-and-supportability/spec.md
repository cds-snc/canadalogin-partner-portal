# Delta for partner portal platform administration and supportability

## ADDED Requirements

### Requirement: CL Admin manages canonical identity and access without mutable catalogs

CL Admin SHALL be able to search safe portal identity records, invite a
prospective partner user into one existing workspace and canonical partner
role, and add, replace, or revoke an existing user's permitted global and
workspace assignments through the focused Users and access surfaces.

Canonical role definitions, capability mappings, scope rules, and policy
subjects SHALL remain immutable system-owned configuration. Department
reference/association data needed for profile setup and workspace context MAY
be read or selected through its owning workflow, but the portal SHALL NOT
provide Department catalog CRUD, tier catalog CRUD, policy CRUD, or generic
identity-provider administration.

#### Scenario: CL Admin manages canonical user access

- **WHEN** a CL Admin uses Users and access or a focused invitation/assignment route
- **THEN** the portal supports safe user search, prospective-user invitation, existing-identity assignment, atomic role replacement, and revocation under the canonical delegation and integrity rules
- **AND** a new partner identity is not created as an enabled unbound user before invitation acceptance
- **AND** the workflow does not require a Department, tier, policy, or provider-administration record to be created

#### Scenario: Canonical authorization configuration cannot be mutated

- **WHEN** a CL Admin requests creation, mutation, or deletion of a canonical role definition, capability mapping, scope rule, direct-user policy subject, or reusable role
- **THEN** the portal rejects the operation
- **AND** the fixed four-role matrix remains unchanged
- **AND** `/roles` remains an immutable reference and not a CRUD module

#### Scenario: Department context remains available without catalog administration

- **WHEN** profile setup, workspace creation, or inherited partner context requires a Department reference
- **THEN** the owning workflow may read or select the supported Department reference
- **AND** the portal does not expose general create, edit, delete, tier, or policy-management actions from that reference

#### Scenario: Identity resolution stays behind a portal-owned contract

- **WHEN** a CL Admin searches for an existing identity while inviting or assigning access
- **THEN** the backend returns only the minimum safe portal identity and account-match fields required by that workflow
- **AND** it does not expose raw provider claims, provider subjects, groups, entitlements, login history, applications, audit queries, or secret-bearing fields
- **AND** provider metadata cannot grant a portal role

#### Scenario: Partner role cannot use central identity and access administration

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests a central CL Admin identity, assignment, catalog, or provider-administration route
- **THEN** the portal denies the request
- **AND** the partner role and workspace scope do not expand into global authority
- **AND** RP Admin retains only the lower-role invitation and assignment actions explicitly allowed inside the assigned workspace

## REMOVED Requirements

### Requirement: Platform administrators manage portal governance records

**Reason**: The requirement combines retained user/access work with Department
and tier catalog CRUD and policy-oriented platform governance that are not in
the approved MVP or onboarding PRD.

**Migration**: Use `CL Admin manages canonical identity and access without
mutable catalogs`, `Users and access presents canonical access rather than
provider internals`, and the role-assignment requirements. Preserve Department
association/reference where another approved workflow needs it; remove
catalog and policy CRUD.

### Requirement: Platform administration exposes IBM Security Verify management operations

**Reason**: A broad CL Admin pass-through for Verify users, applications,
groups, entitlements, logins, and audit queries is not required by the
approved product sources and would exceed the minimum identity/access boundary.

**Migration**: Remove the generic routes, allowlist, UI, capabilities, and
tests. Keep bounded Verify interactions only in the capabilities that own
authentication, safe identity binding, retained-RP metadata/adoption, and
authorized RP operations. None of those interactions grants portal roles or
crosses the CL Admin RP-secret boundary.

