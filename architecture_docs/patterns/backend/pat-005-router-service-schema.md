# PAT-005: Router, Service, Schema

Type: Pattern
Status: Active

## Problem

Backend endpoints need a repeatable route, service, and schema split so HTTP concerns, behavior, and contracts stay easy to review.

## Use When

- Adding a backend endpoint or endpoint group.
- A route does more than return a static response.

## Do Not Use When

- The route is a one-line health check with no behavior or dependency needs.

## Trade-Offs

- Adds files for simple endpoints, but keeps behavior, HTTP concerns, and contracts separated as the API grows.
- Very small health checks may not need the full split.

## Approach

1. Put the route in `backend/app/routers/`.
2. Put request and response models in `backend/app/models/` or a dedicated
   schema module.
3. Put behavior in a service under `backend/app/services/`.
4. Put dependency providers in `backend/app/dependencies.py` or a focused
   dependency module.
5. Keep the route responsible for HTTP concerns: dependencies, status codes,
   response model, and calling the service.
6. Keep the service responsible for business behavior and orchestration.
7. When the service calls an external API or provider, follow
   [PAT-026: Outbound Service Adapter](pat-026-outbound-service-adapter.md).
   Inject the adapter through the dependency boundary instead of calling a
   provider SDK or raw HTTP client from the route.
8. Export or check OpenAPI when the route shape changes.

### Expected Files

- `backend/app/routers/<resource>.py`: APIRouter endpoints.
- `backend/app/models/<resource>.py`: Pydantic models when needed.
- `backend/app/services/<resource>_service.py`: service behavior.
- `backend/app/dependencies.py`: service provider or shared dependency.
- `backend/tests/test_<resource>.py`: route and service tests.

## Checks

### Tests

- Route returns the expected response model.
- Service handles the core behavior.
- Service orchestration uses a mock, fake, or stub adapter when an outbound
  integration applies.
- Expected client errors are safe.
- Unexpected errors use the global safe error shape.
- OpenAPI contract is refreshed when needed.

### Verification

- Pytest output.
- API contract diff when routes or models change.
- Skipped contract-check rationale.

### Stop Conditions

- Authorization, data ownership, or error semantics are unclear.
- The work would touch real external systems or secrets without the target,
  credentials, data, side effects, and approval scope being explicit.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-PAT-005-ROUTER-SERVICE-SCHEMA](../../schemas/patterns/pat-005-router-service-schema.schema.yaml)
- Used for: helping agents and reviewers check route, service, schema,
  dependency, error, OpenAPI, and backend test boundaries.
- Notes: The schema contract supports this pattern. It does not replace this
  pattern as the source of truth.
