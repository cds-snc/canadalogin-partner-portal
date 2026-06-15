# MAU (Monthly Active User) Data Settings

## Overview

The CanadaLogin Partner Portal loads Monthly Active User (MAU) data from CSV files stored in an AWS S3 bucket.
An ARQ background worker runs hourly (7 AM – 7 PM UTC) to fetch the previous day's file, parse it, and cache
each row in Redis. The API serves cached data by application name and date range.

### Data flow

```
Scratch AWS Account (data owner)      Dev/Prod AWS Account (app runner)
┌─────────────────────┐               ┌──────────────────────────────────┐
│ S3 Bucket           │               │ Partner Portal (ECS / local)     │
│  └─ {folder}/       │  STS AssumeRole│   ┌─────────────────────────┐   │
│     └─ date=YYYY-   │◄──────────────│───│ boto3 S3Repository      │   │
│        MM-DD/       │               │   │   ↓ csv.DictReader      │   │
│         app_login_  │               │   │   ↓ MAUCsvRow model     │   │
│         counts.csv  │               │   │   ↓ Redis cache          │   │
└─────────────────────┘               │   └─────────────────────────┘   │
                                      └──────────────────────────────────┘
```

Two AWS accounts are involved:

| Account | Role |
|---------|------|
| **Scratch / Data account** | Owns the S3 bucket. Bucket policy grants read access to the dev/prod IAM role. |
| **Dev / Prod account** | Runs the Partner Portal. An IAM role (`cl-pp-mau-s3-read`) is assumed via STS by the ECS task (prod) or SSO user (local). |

---

## CSV Format

### Columns

```
application_name,total_logins,unique_users,failed_logins,successful_logins,mtd_unique_users,date
```

| Column | Type | Description |
|--------|------|-------------|
| `application_name` | `str` | RP application identifier |
| `total_logins` | `int >= 0` | Total login attempts for the day |
| `unique_users` | `int >= 0` | Daily unique users |
| `failed_logins` | `int >= 0` | Failed login attempts |
| `successful_logins` | `int >= 0` | Successful login attempts |
| `mtd_unique_users` | `int >= 0` | Month-to-date unique users (stored as MAU per application per date) |
| `date` | `date` | UTC date in `YYYY-MM-DD` format |

### S3 key convention

```
s3://{bucket}/{folder}/date={yyyy-mm-dd}/app_login_counts.csv
```

Default folder: `ibm_verify/app_login_counts/` (configurable via `S3_MAU_FOLDER`).

### Sample data

```csv
application_name,total_logins,unique_users,failed_logins,successful_logins,mtd_unique_users,date
app-a,150,42,5,145,850,2026-06-14
app-b,320,88,12,308,2100,2026-06-14
app-c,95,28,3,92,640,2026-06-14
app-a,165,48,7,158,1015,2026-06-15
app-b,340,92,10,330,2440,2026-06-15
app-c,105,31,2,103,745,2026-06-15
```

### Code reference

- Schema / parsing: `backend/src/app/schemas/mau.py` (`MAUCsvRow`)
- S3 fetching: `backend/src/app/repositories/s3_repository.py`
- Worker job: `backend/src/app/core/worker/functions.py` (`load_mau_data`)
- Redis caching: `backend/src/app/services/mau_service.py`

---

## Production Setup

The following infrastructure must exist before MAU data can be loaded. These are typically provisioned
via Terraform / CloudFormation — the snippets below serve as reference.

### 1. Scratch account — S3 bucket

Create a bucket that will hold the daily CSV files.

### 2. Dev account — IAM role

Create an IAM role (e.g. `cl-pp-mau-s3-read`) in the **dev/prod account**.

**Trust policy** — allows the ECS task role (or SSO users in local dev) to assume this role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::{DEV_ACCOUNT_ID}:role/{ECS_TASK_ROLE}",
          "arn:aws:iam::{DEV_ACCOUNT_ID}:root"
        ]
      },
      "Action": "sts:AssumeRole",
      "Condition": {}
    }
  ]
}
```

> For local dev, include `"arn:aws:iam::{DEV_ACCOUNT_ID}:root"` so that any SSO-authenticated
> user in the dev account with `sts:AssumeRole` permissions can assume the role.

**Permissions policy** — grants read access to the scratch bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::{SCRATCH_BUCKET_NAME}",
        "arn:aws:s3:::{SCRATCH_BUCKET_NAME}/*"
      ]
    }
  ]
}
```

### 3. Scratch account — Bucket policy

Attach this policy to the S3 bucket in the **scratch account** to allow the dev account's IAM role
to read objects:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::{DEV_ACCOUNT_ID}:role/cl-pp-mau-s3-read"
      },
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::{SCRATCH_BUCKET_NAME}",
        "arn:aws:s3:::{SCRATCH_BUCKET_NAME}/*"
      ]
    }
  ]
}
```

---

## Local Dev Setup

### Prerequisites

- AWS CLI (`aws --version`)
- `jq` (`jq --version`)
- Access to the dev AWS account (for SSO) **or** direct credentials for the scratch account
- The scratch account's S3 bucket must already exist (see [Production Setup](#production-setup) above)

### Step 1 — Configure AWS SSO profile (dev account)

Run `aws configure sso` and follow the prompts:

```
SSO session name (Recommended): cl-pp-dev
SSO start URL [None]: https://d-123456789b.awsapps.com/start
SSO region [None]: ca-central-1
SSO registration scopes [None]: sso:account:access

There are 5 AWS accounts available to you.
Using the account ID 122345465656
There are 3 roles available to you.
Using the role name "AWSReadOnlyAccess" -- for upload, you need role have permission to upload to S3 bucket
Default client Region [None]: ca-central-1
CLI default output format (json if not specified) [None]:
Profile name [AWSReadOnlyAccess-123345]: cl-pp-dev
```

> Your SSO URL, account ID, and role names will differ. Replace accordingly.

After configuration completes, authenticate the session:

```bash
aws sso login --profile cl-pp-dev
```

This opens a browser window for SSO login. The profile stays authenticated for the duration set by your IdP (typically 8–12 hours).

### Step 2 — Upload sample MAU CSV data

Use the upload script to generate and place fake data on S3:

```bash
./scripts/upload_sample_mau.sh
```

The script will prompt for:
- **AWS profile** — the SSO profile from Step 1 (e.g. `cl-pp-dev`)
- **S3 bucket name** — the scratch account's bucket
- **S3 folder prefix** — defaults to `ibm_verify/app_login_counts/`
- **Application name** — e.g. `app-a`
- **Number of days** — 1 to 30 days of fake data (going back from yesterday)

Each generated CSV is uploaded to:
```
s3://{bucket}/{folder}/date={yyyy-mm-dd}/app_login_counts.csv
```

### Step 3 — Configure backend `.env`

Open `backend/src/.env` and set the MAU-related variables. Refer to `backend/.env.sample` for the
full list of defaults:

```ini
AWS_S3_REGION="ca-central-1"
AWS_S3_ROLE_ARN="arn:aws:iam::123456789:role/cl-pp-mau-s3-read"
AWS_S3_PROFILE="cl-pp-dev"                       # uncomment and set to your SSO profile
S3_MAU_BUCKET_NAME="your-mau-data-bucket"
S3_MAU_FOLDER="ibm_verify/app_login_counts/"
```

> The `AWS_S3_PROFILE` variable tells boto3 which local profile to use. If set, the SDK creates
> a session with that profile, then calls `sts:AssumeRole` using the configured `AWS_S3_ROLE_ARN`.
> If `AssumeRole` fails (e.g. in a pure scratch-account setup), it falls back to using the
> profile's own S3 credentials.

### Step 4 — Verify

Start the backend and trigger the MAU load manually:

```bash
# From backend/ directory
UV_PROJECT_ENVIRONMENT=../.venv uv run python -c "
import asyncio
from redis.asyncio import Redis
from app.services.mau_service import MAUService
from datetime import date

async def check():
    redis = Redis.from_url('redis://localhost:6379/0')
    svc = MAUService(redis=redis)
    ok = await svc.load_mau_for_date(date(2026, 6, 15))
    print(f'Loaded: {ok}')
    records = await svc.get_mau_by_application('app-a')
    for r in records:
        print(f'{r.date}: {r.total_logins} logins, {r.mtd_unique_users} MAU')
    await redis.aclose()

asyncio.run(check())
"
```

Or wait for the ARQ cron job (runs at the start of every hour, 7 AM – 7 PM UTC) to pick it up
automatically.

---

## Environment Configuration Reference

All MAU-related settings are defined in `backend/src/app/core/config.py` (`S3Settings` class)
and documented in `backend/.env.sample`. Key variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AWS_S3_REGION` | Yes | `ca-central-1` | AWS region for S3 and STS |
| `AWS_S3_ROLE_ARN` | Yes | `""` | ARN of the IAM role to assume for S3 read access |
| `AWS_S3_PROFILE` | Local only | `""` | Local AWS CLI profile name (e.g. `cl-pp-dev`) |
| `S3_MAU_BUCKET_NAME` | Yes | `""` | S3 bucket containing MAU CSV files |
| `S3_MAU_FOLDER` | Yes | `ibm_verify/app_login_counts/` | Folder prefix inside the bucket |

Do **not** commit secrets or `.env` files to source control.
