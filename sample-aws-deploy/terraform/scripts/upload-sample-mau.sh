#!/usr/bin/env bash
#
# upload-sample-mau.sh
#
# Generates 30 days of sample MAU login-count CSVs (ending yesterday) and
# uploads each day's file to the MAU S3 bucket under the Hive-style partition
# key the application expects:
#
#   s3://<mau_s3_bucket_name>/<s3_mau_folder>date=YYYY-MM-DD/app_login_counts.csv
#
# Bucket name, folder prefix, and region are read from infra/ terraform outputs.
# The shape of the generated data mirrors data/app_login_counts.csv.
#
# Usage:
#   cd sample-aws-deploy/terraform
#   ./scripts/upload-sample-mau.sh [--dry-run]
#
# Options:
#   --dry-run   Generate CSVs and print what would be uploaded; skip aws s3 cp.
#
# Examples:
#   ./scripts/upload-sample-mau.sh --dry-run
#   ./scripts/upload-sample-mau.sh
#
# Prerequisites:
#   - AWS CLI configured with credentials that can write to the MAU bucket
#   - Terraform state present in infra/ (terraform init && terraform apply)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$SCRIPT_DIR/../infra"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: $0 [--dry-run]"
      exit 1
      ;;
  esac
done

if [ "$DRY_RUN" = true ]; then
  echo "*** DRY-RUN mode — no files will be uploaded ***"
  echo ""
fi

# ---------------------------------------------------------------------------
# Date helpers (macOS BSD date vs GNU date)
# ---------------------------------------------------------------------------
if date -v-1d +%Y-%m-%d > /dev/null 2>&1; then
  days_ago()   { date -v"-${1}d" +%Y-%m-%d; }
  date_month() { date -jf "%Y-%m-%d" "$1" +%m; }
  date_dow()   { date -jf "%Y-%m-%d" "$1" +%u; }   # 1=Mon ... 7=Sun
else
  days_ago()   { date -d "${1} days ago" +%Y-%m-%d; }
  date_month() { date -d "$1" +%m; }
  date_dow()   { date -d "$1" +%u; }
fi

# ---------------------------------------------------------------------------
# 1. Read terraform outputs from infra/
# ---------------------------------------------------------------------------
echo "=== Reading infra outputs ==="

if [ ! -f "$INFRA_DIR/.terraform/terraform.tfstate" ]; then
  echo "ERROR: infra/ has not been applied yet. Run 'cd infra && terraform init && terraform apply' first."
  exit 1
fi

MAU_BUCKET=$(cd "$INFRA_DIR" && terraform output -raw mau_s3_bucket_name)
AWS_REGION=$(cd "$INFRA_DIR" && terraform output -raw aws_region)

# s3_mau_folder is not a terraform output — read its default from infra/variables.tf
MAU_FOLDER=$(awk '/variable "s3_mau_folder"/{f=1} f && /default/{gsub(/.*= *"|".*/, ""); print; exit}' \
  "$INFRA_DIR/variables.tf")
MAU_FOLDER="${MAU_FOLDER:-ibm_verify/app_login_counts/}"

echo "  Bucket : $MAU_BUCKET"
echo "  Folder : $MAU_FOLDER"
echo "  Region : $AWS_REGION"

# ---------------------------------------------------------------------------
# 2. Generate one CSV with 30 days of rows, uploaded to date=<yesterday>
# ---------------------------------------------------------------------------
echo ""
echo "=== Generating sample CSV (30 days of data -> date=$(days_ago 1)) ==="
echo ""

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

YESTERDAY=$(days_ago 1)
OUT_CSV="$TMP_DIR/app_login_counts.csv"
S3_KEY="${MAU_FOLDER}date=${YESTERDAY}/app_login_counts.csv"
S3_DEST="s3://${MAU_BUCKET}/${S3_KEY}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# rand_between <lo> <hi>  =>  random integer in [lo, hi]
rand_between() {
  local lo=$1 hi=$2 range
  range=$(( hi - lo + 1 ))
  echo $(( lo + RANDOM % range ))
}

# weekday_mult <dow>  =>  multiplier *10  (Mon=12 ... Sun=2)
weekday_mult() {
  case "$1" in
    1) echo 12 ;; 2) echo 11 ;; 3) echo 10 ;;
    4) echo 10 ;; 5) echo  9 ;; 6) echo  3 ;;
    7) echo  2 ;; *) echo 10 ;;
  esac
}

# ---------------------------------------------------------------------------
# App definitions: parallel arrays  (name | daily baseline)
# ---------------------------------------------------------------------------
APP_NAMES=(
  "GC Sign In - Profile Management App"
  "Flow Application"
  "GCS Migration Solution"
  "yiwei test SLO OIDC app"
)
APP_BASE=( 20 80 30 60 10 )

# MTD unique-user running totals (one per app index, reset each month)
MTD=( 0 0 0 0 )
CURRENT_MONTH=""

CSV_HEADER="application_name,total_logins,unique_users,failed_logins,successful_logins,mtd_unique_users,date"
echo "$CSV_HEADER" > "$OUT_CSV"

# ---------------------------------------------------------------------------
# Generate rows for all 30 days into one CSV (oldest first -> yesterday)
# ---------------------------------------------------------------------------
for n in $(seq 30 -1 1); do
  DAY=$(days_ago "$n")
  MONTH=$(date_month "$DAY")
  DOW=$(date_dow "$DAY")
  MULT=$(weekday_mult "$DOW")

  # Reset MTD counters on month boundary
  if [ "$MONTH" != "$CURRENT_MONTH" ]; then
    CURRENT_MONTH="$MONTH"
    MTD=( 0 0 0 0 )
  fi

  for i in "${!APP_NAMES[@]}"; do
    APP="${APP_NAMES[$i]}"
    BASE="${APP_BASE[$i]}"

    # VAC only appears ~30% of days
    if [ "$i" -eq 3 ] && [ $(( RANDOM % 10 )) -ge 3 ]; then
      continue
    fi

    # total ~ base * mult/10, with +-20% jitter
    SCALED=$(( BASE * MULT / 10 ))
    VARIANCE=$(( SCALED / 5 + 1 ))
    TOTAL=$(( SCALED - VARIANCE / 2 + RANDOM % (VARIANCE + 1) ))
    [ "$TOTAL" -lt 1 ] && TOTAL=1

    # unique in [55%, 85%] of total
    UPCT=$(rand_between 55 85)
    UNIQUE=$(( TOTAL * UPCT / 100 ))
    [ "$UNIQUE" -lt 1 ] && UNIQUE=1

    # failed in [0%, 8%] of total
    FPCT=$(rand_between 0 8)
    FAILED=$(( TOTAL * FPCT / 100 ))
    SUCCESSFUL=$(( TOTAL - FAILED ))

    MTD[$i]=$(( MTD[$i] + UNIQUE ))

    ROW="${APP},${TOTAL},${UNIQUE},${FAILED},${SUCCESSFUL},${MTD[$i]},${DAY}"
    echo "$ROW" >> "$OUT_CSV"
    echo "$ROW"
  done
done

echo ""
echo "Would upload to: ${S3_DEST}"
printf '%*s\n' "${#S3_DEST}" '' | tr ' ' '-'
echo ""

# ---------------------------------------------------------------------------
# 3. Upload (or stop here for dry-run)
# ---------------------------------------------------------------------------
if [ "$DRY_RUN" = true ]; then
  echo "=== Dry-run complete — rerun without --dry-run to upload. ==="
else
  echo "=== Uploading to $S3_DEST ==="

  aws s3 cp "$OUT_CSV" "$S3_DEST" \
    --region "$AWS_REGION" \
    --content-type "text/csv"

  echo "  Uploaded $S3_DEST"
  echo ""
  echo "=== Done! ==="
fi
