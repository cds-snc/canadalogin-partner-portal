# Delta for partner portal platform administration and supportability

## MODIFIED Requirements

### Requirement: Platform administrators manage portal governance records

Canonical CL Admin users SHALL be able to create, update, delete, search, and
otherwise manage supported user records; assign and revoke fixed canonical
roles; and perform CRUD management for departments and tiers through the
administration modules.

Canonical authorization role definitions, capability mappings, scope rules,
and policy subjects SHALL be immutable system-owned configuration. The legacy
authorization-policy CRUD surface SHALL NOT allow CL Admin to add permissions
to a role, create direct-user subjects, or bypass the four-role matrix. Any
separate governance record described as a policy SHALL be explicitly
non-authorization metadata.

#### Scenario: Platform admin maintains user governance data

- **WHEN** a CL Admin uses the administration modules
- **THEN** the portal supports create, update, delete, search, and assignment flows for users and CRUD management flows for departments and tiers
- **AND** role administration permits only supported canonical assignment and revocation operations

#### Scenario: Canonical authorization policy cannot be mutated

- **WHEN** a CL Admin requests creation, mutation, or deletion of a canonical role definition, capability mapping, scope rule, or direct-user policy subject
- **THEN** the portal rejects the operation
- **AND** the fixed role matrix remains unchanged

#### Scenario: Partner role cannot use platform governance

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests a platform governance route or API
- **THEN** the portal denies the request
- **AND** the partner role and workspace scope do not expand into global authority

### Requirement: Platform administration exposes IBM Security Verify management operations

The backend SHALL expose the required IBM Security Verify administration
capabilities across users, applications, groups, entitlements, logins, and
audit queries only to canonical CL Admin. Each operation SHALL appear on an
explicit allowlist. Client-credential retrieval, RP secret reads, and secret
lifecycle operations SHALL be excluded from that allowlist regardless of the
CL Admin's upstream Verify privileges.

The backend SHALL reject an excluded operation before calling Verify and SHALL
redact secret-bearing fields from allowed administration responses. Upstream
Verify group claims SHALL NOT create CL Admin or partner authorization.

#### Scenario: Platform admin performs Verify-backed administration

- **WHEN** a CL Admin uses an allowlisted Verify-backed user, application, group, entitlement, login, or audit-query operation
- **THEN** the backend executes that operation through the IBM Security Verify integration surface
- **AND** it returns the standard portal API contract without treating upstream groups as portal roles

#### Scenario: CL Admin cannot use Verify to cross the RP secret boundary

- **WHEN** a CL Admin requests client credentials, an RP secret value, or an RP secret lifecycle operation through a platform or Verify-backed route
- **THEN** the backend denies the request before making a Verify call
- **AND** no allowed response contains a secret-bearing field

#### Scenario: Partner role cannot perform Verify-backed administration

- **WHEN** an RP Admin, RP User (Edit), or Read Only user requests a Verify-backed platform administration operation
- **THEN** the backend denies the operation
- **AND** no partner workspace assignment is treated as platform authority
