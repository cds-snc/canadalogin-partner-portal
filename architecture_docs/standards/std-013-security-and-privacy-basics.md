# STD-013: Security and Privacy Basics

Type: Standard
Status: Active

## Read This When

Use this for API, UI, data, authentication, authorization, logging, dependency, and verification changes.

Set a simple baseline for secure and privacy-aware delivery.

## Rules

- Know what data is sensitive and protect it.
- Validate external input.
- Authorize access before exposing data or actions.
- Keep secrets out of code, logs, examples, frontend bundles, tests, and verification.
- Return safe errors to clients.
- Bind local development servers and local container host ports to `127.0.0.1` by default.
- Treat security or privacy-impacting changes as traceable decisions.
- Keep dependencies and security-sensitive automation reviewable.
- Select or materially change identity, session, database, or cloud-security
  architecture through an applicable standard, pattern, project architecture,
  or explicit decision. Implementing an already selected architecture does not
  require a new decision merely because real integration code is added.
- When a required security-sensitive dependency is unavailable or outside
  authorized scope, any substitute must preserve the same application-owned
  trust, session, authorization, validation, and audit boundaries. Select it
  explicitly and prevent silent activation outside its approved contexts by
  following
  [PAT-025: Dependency Substitution](../patterns/full-stack/pat-025-dependency-substitution.md).
- When storing business records, personal information, identifiers, audit data,
  or authorization data in a database, follow
  [STD-020: Database Persistence](std-020-database-persistence.md) for ownership,
  integrity, retention, and delete semantics.

## Structure

### Sensitive Data Handling Record

Use this shape when a change handles personal information, authentication data,
authorization data, secrets, identifiers, audit data, logs, or exported records:

The values below are illustrative. Keep the field names stable, but adapt the
classification, source, storage location, logging posture, retention rule, and
controls to the data element.

```yaml
sensitive_data:
  data_element: personal_identifier
  classification: personal_information
  source: external_service
  stored_where:
    - application_database
  logged: redacted
  returned_to_client: false
  retention: follows project retention schedule
  controls:
    - validate input
    - restrict access by role
    - exclude from logs
```

Fields:

- `data_element`: field, object, claim, token, file, event, or record.
- `classification`: `public`, `internal`, `personal_information`,
  `sensitive_personal_information`, `secret`, `credential`, `token`,
  `audit_record`, or project-defined equivalent.
- `source`: user input, identity provider, backend API, database, external
  service, generated value, or log pipeline.
- `stored_where`: browser, backend session, cache, database, log store, object
  storage, third-party service, or none.
- `logged`: whether the raw value, hash, redacted value, or no value is logged.
- `returned_to_client`: whether the client receives the value.
- `retention`: retention rule, owner, or unknown.
- `controls`: validation, authorization, masking, hashing, encryption, access
  control, audit, deletion, or review controls.

## Examples

- Use least privilege for users, services, workflows, and tokens.
- Fail closed when authorization or validation is unclear.
- Use `backend/app/utils/global_error_handlers.py` for safe backend errors.
- Use `backend/app/utils/standardized_logging.py` to avoid logging sensitive query values.
- Capture security and privacy checks for meaningful changes.
- Escalate when risk, privacy impact, or approval path is unclear.

## Checks

- [ ] Authentication and authorization expectations are understood.
- [ ] Sensitive data elements have a handling record when the change introduces
      or changes them.
- [ ] Sensitive data is not exposed in responses, logs, tests, or verification.
- [ ] Database storage of sensitive or business data has ownership, retention,
      and delete semantics.
- [ ] Inputs are validated at trust boundaries.
- [ ] Frontend public config does not contain secrets.
- [ ] Local development services are not exposed on all network interfaces by default.
- [ ] Logs do not contain secrets or unnecessary personal information.
- [ ] Security-relevant failure paths are tested or documented.
- [ ] Security-sensitive substitutes preserve the selected trust and
      authorization boundaries and cannot activate through silent fallback.
- [ ] Implementing a selected security architecture is distinguished from
      accessing real credentials, providers, data, or infrastructure.
- [ ] Open risks, waivers, or approvals are recorded.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-013-SECURITY-PRIVACY-BASICS](../schemas/standards/std-013-security-and-privacy-basics.schema.yaml)
- Used for: helping agents and reviewers check sensitive data handling, input
  validation, authorization, safe errors, privacy impact, audit and logging
  review, local exposure, security-sensitive substitute boundaries, explicit
  fail-closed modes, and human decision evidence.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
