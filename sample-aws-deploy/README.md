# Sample AWS Deployment — CanadaLogin Partner Portal

Infrastructure-as-code using Terraform to deploy to an AWS scratch account.

## Architecture

```
                          ┌── S3 bucket (SPA)     ── default (*)
User ─── CloudFront ──────┤
                          └── ALB ─── ECS (web)   ── /api/*
                                       │
                                  ECS (worker)
                                 /            \
                          RDS PostgreSQL   ElastiCache Redis
```

**Single CloudFront distribution** serving both the SPA and API:

| Path | Origin | TLS |
|------|--------|-----|
| `/*` (default) | S3 bucket | CloudFront default cert |
| `/api/*` | ALB (HTTP) → ECS web | CloudFront default cert |

| Component       | AWS Service               | Details                            |
|-----------------|---------------------------|------------------------------------|
| Frontend (SPA)  | S3 + CloudFront default    | Static files, SPA error fallback   |
| Backend API     | CloudFront path → ALB → ECS | FastAPI via gunicorn + uvicorn    |
| Background jobs | ECS Fargate (worker)      | ARQ task processor, internal only  |
| Database        | RDS PostgreSQL 16         | Single-AZ, `db.t4g.micro`          |
| Cache/Queue     | ElastiCache Redis 7.1     | Single node, `cache.t4g.micro`     |
| CPU arch        | ECS Fargate X86_64        | Docker image built for `linux/amd64` |

### Why a single CloudFront distribution?

Serving the frontend and API from **different** CloudFront URLs causes a browser cookie problem:

1. The user logs in via OIDC. The backend sets a session cookie (`SameSite=Lax` by default) scoped to the API domain.
2. The browser redirects to the frontend URL. The SPA calls `GET /api/v1/user/me/` on the API domain via `fetch()` with `credentials: "include"`.
3. Since the frontend and API are on **different registrable domains** (different CloudFront hashes), the browser considers this a **cross-site** request. `SameSite=Lax` blocks the cookie → 401.

Using `SameSite=None` + `Secure` works around this, but modern browsers (Chrome 114+) increasingly restrict cross-site cookies regardless of `SameSite`:

- **Chrome Privacy Sandbox**: third-party cookies are being phased out
- **Safari ITP**: Intelligent Tracking Prevention blocks cross-site cookies by default

A **single CloudFront distribution** with path-based routing (`/api/*` → ALB) keeps the frontend and API on the **same origin**. The session cookie is sent naturally on all requests. No `SameSite=None`, no cross-site cookie blocking, no CORS headaches.

### Production with custom domains

This repo uses a **single CloudFront distribution** for scratch/dev accounts because CloudFront default domains (`<hash>.cloudfront.net`) are random and unrelated — cross-origin cookies would be blocked.

For **production**, use the standard pattern: **two CloudFront distributions with custom domains** under the same registered domain:

```
portal.canadalogin.canada.ca ─── CloudFront ─── S3 (SPA)
portal-api.canadalogin.canada.ca ─── CloudFront ─── ALB → ECS
```

Both subdomains share the registered domain `canadalogin.canada.ca`, so the browser considers them **same-site**. `SameSite=Lax` works with a scoped cookie — no cross-origin blocking.

**Changes needed for production:**

1. Split `cloudfront.tf` back to two distributions with `aliases`:

```hcl
resource "aws_cloudfront_distribution" "frontend" {
  aliases = ["portal.canadalogin.canada.ca"]
  # ... S3 origin, SPA fallback
}

resource "aws_cloudfront_distribution" "api" {
  aliases = ["portal-api.canadalogin.canada.ca"]
  # ... ALB origin, all cookies forwarded
}
```

2. Request ACM certificates in **us-east-1** (required for CloudFront) covering both domains.

3. Set the cookie domain in deploy config so it's shared across subdomains:

```hcl
session_cookie_domain = ".canadalogin.canada.ca"
```

This tells the browser to send the cookie to both `portal.canadalogin.canada.ca` and `portal-api.canadalogin.canada.ca` — same-site, no cross-origin issues, no `SameSite=None` needed.

## Terraform Waves

Deployment is split into two Terraform waves for clean separation of concerns:

| Wave | Directory | What it manages |
|------|-----------|-----------------|
| **Wave 1 — Infra** | `terraform/infra/` | VPC, RDS, ElastiCache, S3, ECR, IAM, Secrets, SGs, CloudWatch, ECS cluster, ALB, CloudFront |
| **Wave 2 — Deploy** | `terraform/deploy/` | ECS task definitions + services (web + worker) |

Wave 1 is provisioned once. Wave 2 is re-applied on each deploy (new Docker image, config change).

## Prerequisites

- AWS CLI with scratch account credentials configured (`~/.aws/credentials`)
- Terraform >= 1.5
- Docker
- `pnpm` (frontend build)

## Deploy Steps

### 1. Configure

```bash
export AWS_PROFILE=your-profile

cd sample-aws-deploy/terraform/infra
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — fill in OIDC client ID/secret, metadata URL, etc.
```

### 2. Wave 1 — Deploy Infrastructure

```bash
cd sample-aws-deploy/terraform/infra
terraform init
terraform plan   # review what will be created
terraform apply
```

Note these output values — you will need them in later steps:

| Output | Description |
|---|---|
| `frontend_url` | Application URL (`https://<id>.cloudfront.net`) |
| `api_url` | Same as `frontend_url` (single distribution) |
| `ecr_repository_url` | ECR repo for backend Docker image |
| `rds_endpoint` | RDS endpoint |
| `elasticache_endpoint` | ElastiCache endpoint |
| `frontend_s3_bucket_id` | S3 bucket for frontend static files |
| `ecs_cluster_name` | ECS cluster name |
| `ecs_web_service_name` | Web ECS service name (from Wave 2) |
| `ecs_worker_service_name` | Worker ECS service name (from Wave 2) |

Output values are also available after apply via:

```bash
cd sample-aws-deploy/terraform/infra
terraform output <output_name>
# Example: terraform output ecr_repository_url
#          terraform output frontend_url
```

**Important:** After applying, register the CloudFront URL as a callback URI in your OIDC provider:
- `{frontend_url}/api/v1/auth/oidc/callback`
- `{frontend_url}/auth-complete`

### 3. Sync Wave 2 Configuration

```bash
cd sample-aws-deploy/terraform
./scripts/sync-deploy-env.sh
```

This reads Wave 1 outputs and generates `deploy/terraform.tfvars` with all computed infrastructure references (RDS endpoint, ElastiCache endpoint, CloudFront URL, secret ARNs, etc.).

### 4. Build and push backend Docker image

Use the provided build script. It builds for `linux/amd64` (matching ECS X86_64 Fargate), tags for your ECR repo, and pushes:

```bash
cd sample-aws-deploy/terraform

# Get the ECR URL from Wave 1 outputs
ECR_URL=$(cd infra && terraform output -raw ecr_repository_url)

# Build and push
./scripts/build-and-push.sh "$ECR_URL" ca-central-1
```

**What the script does:**
1. Builds the Docker image from `backend/` targeting `linux/amd64`
   - If building on Apple Silicon (ARM64), Docker emulates the x86 instructions — this is slower but produces a compatible image
   - If building on an x86 machine, no emulation is needed
2. Tags the image as `<ecr_url>:latest`
3. Authenticates with ECR via `aws ecr get-login-password`
4. Pushes the image to ECR

**Manual equivalent (if you prefer not to use the script):**

```bash
cd backend

docker build --platform linux/amd64 \
  -t cl-pp-backend:latest \
  -t <ecr_repository_url>:latest .

aws ecr get-login-password --region ca-central-1 \
  | docker login --username AWS --password-stdin <account_id>.dkr.ecr.ca-central-1.amazonaws.com

docker push <ecr_repository_url>:latest
```

**Performance note on Apple Silicon (M1/M2/M3/M4):**

Building for `linux/amd64` on an ARM64 Mac uses Rosetta emulation inside the Docker build. The first build will be slower. To speed up iterative development, you can:
- Cache the Python packages layer — it rarely changes
- Use Docker's `--cache-from` with the ECR remote image
- For local dev/testing only, use `--platform linux/arm64` (but remember to switch back to `linux/amd64` before pushing to ECS)

### 5. Build frontend and upload to S3

Use the provided script:

```bash
cd sample-aws-deploy/terraform

# Builds frontend, syncs to S3, and invalidates CloudFront cache
./scripts/build-and-push-frontend.sh dev
```

**What the script does:**
1. Reads the CloudFront URL and S3 bucket name from infra outputs
2. Installs dependencies via `pnpm install --frozen-lockfile`
3. Builds the frontend (`pnpm build`) with `VITE_API_BASE_URL` **unset** — the SPA calls the same origin (single CloudFront distribution), so no explicit API base URL is needed
4. Syncs the `dist/` folder to the S3 bucket
5. Invalidates the CloudFront cache (`/*`) so the new build is served immediately

**Override any VITE_* variable** by setting it before the script:

```bash
VITE_APP_TITLE="My Staging App" VITE_SESSION_WARNING_AFTER_MINUTES=10 \
  ./scripts/build-and-push-frontend.sh staging
```

**Manual equivalent (if you prefer not to use the script):**

```bash
cd frontend

# Get URLs from Wave 1 outputs
FRONTEND_URL=$(cd ../sample-aws-deploy/terraform/infra && terraform output -raw frontend_url)
S3_BUCKET=$(cd ../sample-aws-deploy/terraform/infra && terraform output -raw frontend_s3_bucket_id)

# VITE_API_BASE_URL is intentionally unset — same-origin calls work without it
VITE_APP_ENVIRONMENT=development \
VITE_APP_TITLE="CanadaLogin Partner Portal" \
VITE_AUTH_POST_LOGIN_PATH=/dashboard \
VITE_SESSION_WARNING_AFTER_MINUTES=25 \
VITE_SESSION_COUNTDOWN_MINUTES=5 \
  pnpm build

aws s3 sync dist/ s3://$S3_BUCKET/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='$(echo $FRONTEND_URL | sed 's|https://||')'].Id | [0]" --output text) \
  --paths "/*"
```

### 6. Wave 2 — Deploy Application Services

```bash
cd sample-aws-deploy/terraform/deploy
terraform init
terraform apply
```

This creates/updates the ECS task definitions and services (web + worker) with the full configuration from Wave 1.

### 7. Force new deployment (pick up the new image)

The ECS services may not automatically pick up the new `:latest` image. Force a redeployment:

```bash
aws ecs update-service \
  --region ca-central-1 \
  --cluster $(cd infra && terraform output -raw ecs_cluster_name) \
  --service $(cd deploy && terraform output -raw ecs_web_service_name) \
  --force-new-deployment

aws ecs update-service \
  --region ca-central-1 \
  --cluster $(cd infra && terraform output -raw ecs_cluster_name) \
  --service $(cd deploy && terraform output -raw ecs_worker_service_name) \
  --force-new-deployment
```

### 8. Verify

- Frontend: `<frontend_url>` — should load the SPA
- API health: `<frontend_url>/api/v1/health` — should return `{"status": "ok"}`
- API docs: `<frontend_url>/docs` — should show Swagger UI

```bash
# Quick smoke test
curl -sI $(cd infra && terraform output -raw frontend_url) | head -5
curl -s $(cd infra && terraform output -raw frontend_url)/api/v1/health
```

## Redeploying (after code changes)

For subsequent deployments after the initial setup:

```bash
# 1. Build + push new Docker image
cd sample-aws-deploy/terraform
ECR_URL=$(cd infra && terraform output -raw ecr_repository_url)
./scripts/build-and-push.sh "$ECR_URL" ca-central-1

# 2. Rebuild frontend + sync to S3
./scripts/build-and-push-frontend.sh dev

# 3. Apply Wave 2 (updates task definitions with new image hash)
cd sample-aws-deploy/terraform/deploy
terraform apply

# 4. Force ECS to pick up the new task definition
cd ..
CLUSTER=$(cd infra && terraform output -raw ecs_cluster_name)
WEB_SVC=$(cd deploy && terraform output -raw ecs_web_service_name)
WRKR_SVC=$(cd deploy && terraform output -raw ecs_worker_service_name)
aws ecs update-service --region ca-central-1 --cluster "$CLUSTER" --service "$WEB_SVC" --force-new-deployment
aws ecs update-service --region ca-central-1 --cluster "$CLUSTER" --service "$WRKR_SVC" --force-new-deployment
```

## SSL / TLS

| Hop | Protocol | Notes |
|---|---|---|
| User → CloudFront | HTTPS | CloudFront default `*.cloudfront.net` cert |
| CloudFront → S3 | HTTPS | Origin Access Control |
| CloudFront → ALB | HTTP | Within AWS network |
| ALB → ECS | HTTP | Within VPC |
| ECS → RDS | TCP/5432 | Encrypted at rest, private subnet SG |
| ECS → ElastiCache | TCP/6379 | Private subnet SG |

## Configuration

Edit `terraform/infra/terraform.tfvars` (create from `terraform.tfvars.example`) to set:

| Variable | Description |
|---|---|
| `environment` | Deployment environment tag (e.g. `scratch`) |
| `oidc_client_id` | OIDC client ID from your IdP |
| `oidc_client_secret` | OIDC client secret (stored in Secrets Manager) |
| `oidc_server_metadata_url` | OIDC provider metadata URL |
| `ibm_sv_admin_base_url` | IBM Security Verify tenant URL |
| `ibm_sv_admin_client_id` | IBM SV admin API client ID |
| `ibm_sv_admin_client_secret` | IBM SV admin API secret |
| `aws_s3_role_arn` | IAM role ARN for cross-account S3 access (optional) |

**OIDC redirect URI**: automatically set to `<frontend_url>/api/v1/auth/oidc/callback`.
Register this in your OIDC provider.

**Post-login redirect**: automatically set to `<frontend_url>/auth-complete`.
Register `<frontend_url>/auth-complete` in your OIDC provider if needed.

## MAU Data Loading

An S3 bucket for MAU (Monthly Active Users) data is **always created** with a sample CSV:

```
s3://{app_name}-mau-{env}/ibm_verify/app_login_counts/date=2026-06-11/app_login_counts.csv
```

The sample CSV lives at `sample-aws-deploy/data/app_login_counts.csv` and contains realistic login stats for 5 applications. The ARQ cron job reads yesterday's partition — data is available for testing immediately. Edit the file before `terraform apply` to change sample data.

To use an external MAU bucket (e.g. from IBM SV production), set `aws_s3_role_arn` for cross-account access. The local bucket is always created for sample/testing data.

## Scripts Reference

| Script | Location | Purpose |
|--------|----------|---------|
| `sync-deploy-env.sh` | `terraform/scripts/` | Generate Wave 2 tfvars from Wave 1 outputs |
| `build-and-push.sh` | `terraform/scripts/` | Build backend Docker for linux/amd64 and push to ECR |
| `build-and-push-frontend.sh` | `terraform/scripts/` | Build frontend SPA, sync to S3, invalidate CloudFront |

## Clean Up

```bash
# Destroy Wave 2 first (no dependencies on it)
cd sample-aws-deploy/terraform/deploy
terraform destroy

# Then destroy Wave 1
cd sample-aws-deploy/terraform/infra
terraform destroy
```

Empty the S3 buckets first if `terraform destroy` fails on non-empty resources.
