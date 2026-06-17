# generic-error-route

## Purpose
Define a reusable generic frontend error route and variant behavior for error recovery flows. Purpose details can be expanded as implementation evolves.

## Requirements

### Requirement: Generic error route
The frontend SHALL provide a reusable generic error route at `/error`.

#### Scenario: User navigates to generic error route
- **WHEN** the user is redirected to `/error`
- **THEN** the application renders a generic error page instead of a route-not-found page

### Requirement: Typed error kind handling
The generic error route MUST accept an optional `kind` query parameter and support `not_found` and `unexpected` variants. Unknown or missing values MUST fall back to the default unexpected variant.

#### Scenario: Known not-found kind
- **WHEN** the user navigates to `/error?kind=not_found`
- **THEN** the page renders the not-found variant copy

#### Scenario: Known unexpected kind
- **WHEN** the user navigates to `/error?kind=unexpected`
- **THEN** the page renders the unexpected error variant copy

#### Scenario: Unknown kind value
- **WHEN** the user navigates to `/error?kind=anything-else`
- **THEN** the page renders the default unexpected error variant copy

### Requirement: Generic error page navigation actions
The generic error page MUST include primary and secondary recovery actions for navigation.

#### Scenario: Recover from generic error page
- **WHEN** the generic error page is displayed
- **THEN** the user can navigate to dashboard and to home from explicit actions

### Requirement: Localized generic error content
Generic error route copy MUST be provided in both English and French locale catalogs.

#### Scenario: French locale on generic error route
- **WHEN** application language is French and user is redirected to `/error?kind=unexpected`
- **THEN** the route displays French error title, body, and action labels
