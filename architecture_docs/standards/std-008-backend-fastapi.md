# STD-008: Backend FastAPI

Type: Standard
Status: Active

## Read This When

Use this for `backend/` routes, request models, response models, configuration, error handling, service logic, and backend tests.

Set the baseline for Python backend services built with FastAPI.

## Rules

- Use `backend/app/` as the service package.
- Use routers for endpoint groups.
- Use Pydantic models for request and response shapes.
- Use `response_model` where practical.
- Use `pydantic-settings` or `BaseSettings` for configuration.
- Keep route handlers thin.
- Keep business logic out of route handlers when the service grows.
- Put reusable behavior in service classes under `backend/app/services/`.
- Put route dependency providers in a dedicated dependency module when routes
  need shared service, auth, database, Redis, or request context wiring.
- When a service calls an external API or provider, follow
  [PAT-026: Outbound Service Adapter](../patterns/backend/pat-026-outbound-service-adapter.md).
  Inject the adapter through the project's dependency boundary, keep business
  orchestration in the service, and make timeout, retry or no-retry, and safe
  error-translation behavior explicit.
- Use [STD-020: Database Persistence](std-020-database-persistence.md) when
  backend work adds or changes relational persistence, models, migrations,
  repository/data-access code, or seed data.
- Use Redis-backed sessions, cache, queues, or rate limiting only when those
  modules are selected and explicitly configured with safe values for the
  declared work context.
- When a selected backend dependency is unavailable or access is not
  authorized, follow
  [PAT-025: Dependency Substitution](../patterns/full-stack/pat-025-dependency-substitution.md).
  Keep the substitute behind the same service, repository, client, session, or
  provider boundary, and do not silently activate it when real configuration
  fails.
- Use OIDC as the primary real authentication path.
- Treat a local password flow or signed test JWT as an explicitly configured
  development or test identity substitute. Keep it limited to approved
  development or test contexts and route it through the same backend session
  and authorization dependencies as the selected real identity path.
- Use the local role simulation pattern when local development needs fixture
  users or roles before the real role source is available.
- Use policy-backed authorization, such as Casbin, for RBAC and permission
  checks when protected routes need more than a simple authenticated user.
- Keep OpenAPI clear and reviewable.
- Do not expose stack traces or sensitive internals in responses.

## Examples

- Put app setup in `backend/app/main.py`.
- Put configuration in `backend/app/config.py`.
- Put routers in `backend/app/routers/`.
- Put Pydantic models in `backend/app/models/`.
- Put shared service logic in `backend/app/services/`.
- Put persistence models, schemas, migrations, and repository/data-access
  adapters in dedicated modules when the backend enables a database.
- Put error handling and logging helpers in `backend/app/utils/`.
- Keep OpenAPI docs enabled for local development.
- Keep docs protected or disabled outside local development.

## Checks

- [ ] Routes use routers and clear response models.
- [ ] Route handlers stay thin.
- [ ] Business logic lives in services once routes do more than assemble a response.
- [ ] Outbound integrations use an injected adapter, explicit bounded timeouts,
      and a reviewed retry or no-retry decision.
- [ ] Provider failures use centralized safe translation; raw upstream error
      bodies are not passed through, and any exposed upstream fields are
      specifically reviewed and allowlisted.
- [ ] Configuration comes from safe environment settings.
- [ ] Database, Redis, auth, RBAC, rate limiting, and job dependencies use an
      approved real target, an explicitly configured contract-compatible
      substitute, or a documented unavailable state or follow-on slice.
- [ ] Local unavailability alone does not make a target capability not
      applicable or change its application-owned contract.
- [ ] Dependency substitutes cannot activate through silent production fallback,
      and remaining real-integration verification is recorded.
- [ ] Local role simulation, when used, is disabled outside local development
      and does not replace backend authorization checks.
- [ ] Database work follows STD-020 when persistence is enabled.
- [ ] Error responses follow the standard API error shape.
- [ ] OpenAPI output is understandable.
- [ ] Tests cover meaningful success and failure paths.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-008-BACKEND-FASTAPI](../schemas/standards/std-008-backend-fastapi.schema.yaml)
- Used for: helping agents and reviewers check routers, Pydantic models,
  response models, thin route handlers, service and outbound adapter boundaries,
  safe configuration, local role simulation constraints, OpenAPI evidence, and
  backend tests.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
