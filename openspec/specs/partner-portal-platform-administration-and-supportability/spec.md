# partner-portal-platform-administration-and-supportability

## Purpose
Define the current MVP1 platform administration and service-supportability baseline.

## Requirements

### Requirement: Platform administrators manage portal governance records
Platform administrators SHALL be able to manage users, roles, policies, departments, and tiers, including assignment of department, roles, and tier values to users.

#### Scenario: Platform admin maintains user governance data
- **WHEN** a platform admin uses the administration modules
- **THEN** the portal supports create, update, delete, search, and assignment flows for users and CRUD management flows for roles, policies, departments, and tiers

### Requirement: Platform administration exposes IBM Security Verify management operations
The backend SHALL expose IBM Security Verify administration capabilities needed for platform operations across users, applications, groups, entitlements, logins, and audit queries.

#### Scenario: Platform admin performs Verify-backed administration
- **WHEN** an authorized platform administrator uses a supported Verify-backed administration operation
- **THEN** the backend executes that operation through the IBM Security Verify integration surface and returns the standard portal API contract

### Requirement: Service health and error supportability are available
The system SHALL expose health and readiness endpoints and SHALL return a consistent error envelope for handled API failures.

#### Scenario: Operator checks service health
- **WHEN** an operator or deployment automation calls the health or readiness endpoint
- **THEN** the backend returns the service health or readiness status without requiring a normal authenticated portal workflow

#### Scenario: API failure returns the standard error contract
- **WHEN** a handled API error occurs
- **THEN** the response body uses the shared error envelope with code, message, details, and request identifier fields