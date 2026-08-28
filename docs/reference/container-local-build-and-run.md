# Container Local Build and Run

## Purpose

Use this guide to build, run, and check the starter backend container locally.

This is for local development and verification. The backend image is a starter image, not a full deployment definition.

## Audience

Primary audience: developers and repo maintainers working on the backend starter.

Also used by: AI agents when they need local container build or health-check guidance.

## Before you start

- Confirm the Docker CLI is installed.
- Confirm a Docker-compatible local container runtime is running.
- Review [backend/Dockerfile](../../backend/Dockerfile) and [backend/.dockerignore](../../backend/.dockerignore).
- Review STD-016: Container Build and Deployment.
- Do not pass real secrets on the command line.
- Do not bake secrets into images.
- Treat [backend/.env.example](../../backend/.env.example) as documentation only.

Supported local runtime examples include Colima with the Docker CLI, Docker Desktop if approved by the organization, or another approved Docker-compatible runtime.

Container checks are optional for this template. They may be skipped locally if a Docker-compatible local container runtime or a container scanner is not installed.

Many Mac developers use Apple Silicon. Container images used by the template should support `linux/arm64` as well as `linux/amd64` where practical. Architecture mismatches can cause `docker pull`, `docker build`, or `docker run` failures.

## Using Colima on macOS

Install Colima and the Docker CLI:

```bash
brew install colima docker
```

Start Colima:

```bash
colima start
```

Confirm Docker commands can reach the local runtime:

```bash
docker info
docker run --rm hello-world
```

Once Docker commands work, the Makefile container targets should work:

```bash
make build-backend-container
make test-backend-container
```

## Build the backend image

From the repo root, run:

```bash
make build-backend-container
```

This builds the image from the `backend/` context and tags it as:

```text
delorean-template-backend:local
```

The image installs runtime dependencies from [backend/requirements.txt](../../backend/requirements.txt). It does not install development dependencies from [backend/requirements-dev.txt](../../backend/requirements-dev.txt).

## Run the backend container

From the repo root, run:

```bash
make run-backend-container
```

This starts the container locally and maps the backend port:

```text
127.0.0.1:8000 -> container:8000
```

The host port binds to `127.0.0.1` by default. This keeps the service on the developer machine. Only expose a local container on all network interfaces when a developer intentionally needs that and records the reason for meaningful changes.

Stop the local container with:

```bash
make stop-backend-container
```

## Check the health endpoint

Run:

```bash
make test-backend-container
```

This starts the container if needed, checks `/health`, and stops the container if the command started it.

You can also check manually:

```bash
curl http://localhost:8000/health
```

## Environment variables

Safe local values include:

- `APP_ENV=local`
- `LOG_LEVEL=info`
- `REQUEST_ID_HEADER=X-Request-ID`

Do not pass real secrets on the command line. Do not put secrets in Dockerfiles, image layers, build args, committed config, or local examples.

For AWS deployment, use platform-managed secrets and IAM roles rather than static credentials.

## Logs

The starter backend logs to stdout and stderr so the local container runtime and deployment platform can collect logs.

View local container logs with:

```bash
docker logs delorean-template-backend
```

Do not log secrets, tokens, credentials, or unnecessary personal information.

## Container security basics

- Keep the image focused on runtime files.
- Use [backend/.dockerignore](../../backend/.dockerignore) to exclude local files, caches, secrets, certs, generated output, and tests.
- Expose only the backend port the service needs.
- Run as a non-root user where practical.
- Do not run privileged containers unless there is a documented, approved exception.
- Rebuild images when base images or dependencies need security updates.
- Scan images before production use when scanning is available.

Optional local scan:

```bash
make scan-backend-container
```

The scan target uses Docker Scout, Trivy, or Grype when available. If no scanner is installed or configured, it prints a skip message.

## Troubleshooting

- Docker CLI is missing: install the Docker CLI and an approved Docker-compatible local container runtime.
- Runtime is not running: start the local runtime, such as `colima start`, then rerun the Makefile target.
- Architecture mismatch: confirm the base image and built image support your local architecture, especially on Apple Silicon Macs.
- Port `8000` is already in use: stop the conflicting process or run with another `BACKEND_PORT`.
- Container already exists: run `make stop-backend-container`.
- Health check fails: run `docker logs delorean-template-backend` and check startup errors.
- Scanner is missing or not logged in: record the skip reason in evidence for meaningful changes.

## Links

- Backend README: [backend/README.md](../../backend/README.md)
- Backend Dockerfile: [backend/Dockerfile](../../backend/Dockerfile)
- Backend dockerignore: [backend/.dockerignore](../../backend/.dockerignore)
- Container standard: STD-016: Container Build and Deployment
- Secrets standard: STD-014: Secrets and Configuration
- Logging standard: STD-011: Logging and Observability
- Local verification guide: [docs/reference/local-verification.md](local-verification.md)
