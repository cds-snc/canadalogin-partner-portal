# STD-016: Container Build and Deployment

Type: Standard
Status: Active

## Read This When

Use this when a project adds a containerized backend service, a `Dockerfile`, a `.dockerignore`, image build commands, image scanning, or AWS container deployment notes.

Local container commands require a Docker-compatible local container runtime. Examples include Colima with the Docker CLI, Docker Desktop if approved by the organization, or another approved Docker-compatible runtime.

Set a small baseline for building and deploying backend services as containers.

## Rules

### Standard

- Use containers for backend services that deploy as containers.
- Keep each image small and focused on runtime needs.
- Use multi-stage builds when they help separate build dependencies from runtime files.
- Use a `.dockerignore` file to keep local files, caches, secrets, and generated output out of the image.
- Do not copy `.env` files, private keys, certificates, test caches, coverage output, `node_modules/`, or `.git/` into container images.
- Do not put secrets in Dockerfiles, image layers, build args, or committed config files.
- Use environment variables for runtime configuration.
- Real deployed secrets should come from the deployment platform, AWS Secrets Manager, AWS Systems Manager Parameter Store, or another approved secret store.
- Run as a non-root user where practical.
- Do not run containers as privileged unless there is a documented, approved exception.
- Expose only the port the service needs.
- Include or support a health endpoint.
- Log to stdout and stderr so the platform can collect logs.
- Do not write important runtime state inside the container filesystem.
- Pin or intentionally manage base image versions.
- Rebuild images when base images or dependencies need security updates.
- Scan images before production use when scanning is available.
- Publish to ECR or deploy to ECS only through approved project pipelines.

### AWS deployment readiness

- Backend containers intended for AWS should be ready for ECS or another approved AWS container service.
- Use task roles for AWS permissions instead of static AWS keys in the container.
- Use the task execution role only for execution needs such as pulling images and reading injected secrets.
- Use runtime secret injection for deployed secrets.
- Make health checks compatible with the AWS load balancer or service health check pattern.
- Ensure logs are suitable for CloudWatch or the chosen logging platform.
- Do not require local files or local certificates that will not exist in the deployed task.
- Align deployment automation with approved cloud security, IAM, registry, and deployment standards.

## Structure

### Runtime Service Contract

Use this shape when a backend service is packaged or reviewed as a container.
The values below are illustrative. Keep the field names stable, but adapt the
image, port, health endpoint, env vars, secret refs, readiness commands, and
platform notes to the service and deployment target.

```yaml
runtime_service:
  image: service-backend
  port: 8000
  health_endpoint: /health
  env_vars:
    - APP_ENV
    - LOG_LEVEL
  secret_refs:
    - SERVICE_CLIENT_SECRET
  user: non-root
  filesystem:
    writes_runtime_state: false
    writable_paths: []
  logs:
    destination: stdout_stderr
    structured: true
  readiness:
    local_build: make build-backend-container
    local_run: make test-backend-container
    scan: required before production
  platform_notes: Compatible with ECS task role and runtime secret injection.
```

Fields:

- `image`: image name or service image target.
- `port`: container port exposed by the service.
- `health_endpoint`: health or readiness endpoint.
- `env_vars`: non-secret runtime configuration names.
- `secret_refs`: secret names or references, not secret values.
- `user`: runtime user posture, usually `non-root`.
- `filesystem`: whether runtime state is written and which paths are writable.
- `logs`: destination and structure expectations.
- `readiness`: local build, run, scan, and deployment checks.
- `platform_notes`: ECS, ECR, load balancer, IAM, or runtime injection notes.
  Other approved platforms may use equivalent notes for their registry,
  identity, health check, and secret injection model.

## Examples

- Use `backend/Dockerfile` for the backend image when the project keeps the backend.
- Use `backend/.dockerignore` for backend image exclusions.
- Keep Docker CLI build and run commands in Makefile (`Makefile`) when the project adds them.
- Bind local host port mappings to `127.0.0.1` by default. The service inside the container may still bind to all container interfaces so Docker port mapping works.
- Support `linux/arm64` as well as `linux/amd64` where practical because many Mac developers use Apple Silicon. Architecture mismatches can cause image pull, build, or run failures.
- Keep local scripts as adapters, not as the source of container rules.
- Add container build checks to local verification or CI when useful.
- Record meaningful container build, scan, or skipped-check results.

## Checks

- [ ] The image includes only runtime files and needed dependencies.
- [ ] `.dockerignore` excludes local env files, keys, certs, caches, coverage, build output, `node_modules/`, and `.git/`.
- [ ] Secrets are provided at runtime and are not present in the Dockerfile, image layers, build args, or committed config.
- [ ] The service runs as non-root where practical and is not privileged.
- [ ] Local Docker CLI run commands bind host ports to `127.0.0.1` unless broader exposure is intentionally needed.
- [ ] The exposed port and health endpoint are documented.
- [ ] Containerized services have a runtime service contract when deployment or
      handoff is meaningful.
- [ ] Logs go to stdout and stderr and do not expose secrets.
- [ ] Base images and dependencies are pinned or intentionally managed.
- [ ] Image scanning, build results, skipped checks, and deployment readiness notes are recorded when meaningful.

## Related Schema Contracts

- Schema contract: [ARCH-SCHEMA-STD-016-CONTAINER-BUILD-DEPLOYMENT](../schemas/standards/std-016-container-build-and-deployment.schema.yaml)
- Used for: helping agents and reviewers check build context, ignore rules,
  runtime configuration, secret handling, runtime service contracts, image
  scanning or review evidence, and deployment readiness.
- Notes: The schema contract supports this standard. It does not replace this
  standard as the source of truth.
