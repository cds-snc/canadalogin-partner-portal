# STD-014: Secrets and Configuration

Type: Standard
Status: Active

## Read This When

Use this when adding environment variables, local configuration, CI settings, deployment settings, logging, or secret handling.

Keep configuration clear and keep secrets out of source control, logs, frontend bundles, and generated outputs.

## Rules

- Use environment variables for deploy-specific configuration.
- Use local `.env` files only for local development.
- Do not commit real `.env` files.
- Commit `.env.example` or `.env.template` with safe placeholder values only.
- Document each meaningful environment variable with the configuration entry
  shape.
- Keep `backend/.env.example` and `frontend/.env.example` safe.
- Treat frontend `VITE_*` values as public build-time config, not secrets.
- Use environment variables, CI secrets, platform secrets, or managed secret stores for backend secrets.
- Never hardcode tokens, passwords, private keys, connection strings, or credentials in source code.
- Rotate any secret that is accidentally committed.
- Do not log secrets or sensitive configuration values.

## Structure

### Configuration Entry

Use this shape when documenting environment variables, runtime settings, CI
settings, or deployment configuration:

The values below are illustrative. Keep the field names stable, but adapt the
name, scope, source, validation, and notes to the actual setting. This shape can
describe frontend public config, backend runtime config, CI settings, container
settings, and managed secret references.

```yaml
name: SERVICE_API_URL
scope: frontend
required: true
default: null
source: environment
secret: false
owner: platform
validation: Must be an http or https URL.
example_value: http://127.0.0.1:8000
runtime_notes: Used by the application to call the service API.
```

Fields:

- `name`: exact variable or setting name.
- `scope`: `frontend`, `backend`, `ci`, `container`, `terraform`, or
  `platform`.
- `required`: whether the app can start or build without the value.
- `default`: safe default, or `null` when no default should exist.
- `source`: `environment`, `.env`, `ci_secret`, `platform_secret`,
  `managed_secret_store`, or `build_arg`.
- `secret`: `true` only when the value must be protected.
- `owner`: team or system responsible for setting and rotating the value.
- `validation`: type, allowed values, format, or range.
- `example_value`: safe placeholder for `.env.example`.
- `runtime_notes`: short usage and deployment notes.

### Env Example

Example env files should contain only safe placeholders:

The names below are examples only. Use project-specific names that make the
runtime owner and purpose clear.

```dotenv
SERVICE_API_URL=http://127.0.0.1:8000
LOG_LEVEL=INFO
SERVICE_CLIENT_SECRET=replace-with-local-placeholder
```

Do not put real local, shared, or production secrets in example files.

## Examples

- Use `frontend/.env.example` for public frontend build-time settings.
- Use `backend/.env.example` for safe backend local settings.
- Use `backend/app/config.py` for backend environment configuration.
- Keep local `.env` files ignored by .gitignore.
- Use clear names such as `APP_ENV`, `LOG_LEVEL`, `VITE_API_BASE_URL`, or `REQUEST_ID_HEADER`.
- Use secret scanning or push protection where available.

## Checks

- [ ] Real secrets are not committed.
- [ ] Example env files contain only safe placeholders.
- [ ] Meaningful environment variables are documented with the configuration
      entry shape.
- [ ] Frontend `VITE_*` variables do not contain private values.
- [ ] Backend secrets come from an approved runtime secret source.
- [ ] Logs do not expose secrets, tokens, credentials, or sensitive config.
- [ ] Any leaked secret has a rotation plan and verification note.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-014-SECRETS-CONFIGURATION](../schemas/standards/std-014-secrets-and-configuration.schema.yaml)
- Used for: helping agents and reviewers check source safety, configuration
  separation, fake examples, local defaults, frontend public config, deployed
  secret handling, and rotation evidence.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
