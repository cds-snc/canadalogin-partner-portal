# OpenAPI

Store OpenAPI specs here when the solution exposes an API.

This starter commits a minimal FastAPI-generated contract at
[openapi.json](openapi.json). It documents the starter backend health endpoint:

```text
GET /health
```

Refresh the contract from the repo root after backend route or response model
changes:

```bash
make export-openapi
```

This writes `openapi/openapi.json`. Review the generated contract before
committing it.

Check that the committed contract still matches the backend app:

```bash
make check-openapi
```

The pre-push hook and PR validation call the OpenAPI freshness check when
backend API or OpenAPI files change. If a solution removes the starter backend
or does not expose an API, update or remove this contract intentionally and
adjust the local check mode to match the solution.
