# Application Environments Vertical Slice Plan

## Objective

Build a read-only, database-driven Environments page at:

```text
/applications/$applicationUuid/environments
```

The UI calls them environments; the stored records are `ApplicationConfiguration` rows.

## Scope

- Use `ApplicationConfiguration` as the environment data source.
- Keep the feature separate from the `RPApplication` dashboard domain.
- Keep Switch application, Connect an environment, and environment titles non-navigating until their destination pages exist.
- Return the application display name with the paginated list response.

## Backend

1. Add response schemas for the application summary, environment rows, and pagination metadata.
2. Add a repository query joining `ApplicationConfiguration`, `Application`, `Tenant`, and `ApplicationConfigurationStatus`.
3. Filter soft-deleted rows and sort by `updated_at`, falling back to `created_at`.
4. Add a service that returns `NotFoundException` for a missing application.
5. Add `GET /api/v1/applications/{application_uuid}/environments?page=1&items_per_page=10`.
6. Protect the endpoint with the existing application-scoped `applications:read` authorization.

## Frontend

1. Add protected routes under `/applications/$applicationUuid`.
2. Add a typed fetch client and React Query hook.
3. Build the page with the established GCDS wrappers and localized copy.
4. Render the application name, page title, supporting content, inert Connect button, and application-environment section.
5. Render bordered environment rows with the partner label and localized last-modified date.
6. Use shared pagination when more than one page exists.

## Status Rules

- `submitted`: show a Submitted ribbon.
- `published` in the `production` tenant: show an In production ribbon.
- All other status and tenant combinations: no ribbon.

## Empty State

When no configurations exist:

- Keep the application header, explanatory copy, and Connect button.
- Show: `You have not created any application environments.`
- Omit the production-status disclosure, rows, ribbons, and pagination.

## Validation

- Backend: service and route tests for populated, empty, and missing-application outcomes.
- Frontend: fetch serialization, empty state, ribbon conditions, pagination, and authenticated route behavior.
- Run focused backend/frontend tests, frontend lint/build, and targeted backend static checks.
