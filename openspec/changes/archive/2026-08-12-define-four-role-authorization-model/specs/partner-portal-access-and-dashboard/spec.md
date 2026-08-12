# Delta for partner portal access and dashboard

## MODIFIED Requirements

### Requirement: First-time users complete department setup before normal portal use

The system SHALL require a signed-in user without a department assignment and
without an active canonical partner assignment or matching pending invitation
to complete department setup before accessing protected product routes outside
the profile onboarding flow.

A matching pending invitation SHALL take precedence over department setup only
for the invitation acceptance route. After acceptance, the canonical partner
workspace assignment SHALL provide the partner context and the user SHALL NOT
be redirected to self-service department setup. Terms acceptance and normal
authentication requirements remain applicable.

#### Scenario: User without department signs in

- **WHEN** a signed-in user has no department assignment, active canonical partner assignment, or matching pending invitation and requests a protected route outside onboarding flows
- **THEN** the user is redirected to /profile/setup before using current-user application or administrator routes

#### Scenario: Matching pending invitation precedes department setup

- **WHEN** a signed-in user without a department assignment matches a currently pending invitation
- **THEN** the portal permits only the invitation acceptance path before department setup
- **AND** other protected product routes remain unavailable until acceptance succeeds

#### Scenario: Canonical partner access does not require personal department setup

- **WHEN** a signed-in user without a personal department assignment has an active canonical partner workspace assignment
- **THEN** the portal uses the assigned workspace as partner context
- **AND** it does not redirect the user to /profile/setup
