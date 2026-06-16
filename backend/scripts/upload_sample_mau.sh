#!/usr/bin/env bash
set -euo pipefail

RANDOM=42  # reproducible fake data

prompt() {
  local var_name="$1" prompt_text="$2" default_val="${3-}"
  if [[ -n "$default_val" ]]; then
    read -r -p "$prompt_text [$default_val]: " input
    printf -v "$var_name" "${input:-$default_val}"
  else
    read -r -p "$prompt_text: " input
    printf -v "$var_name" "$input"
  fi
}

rand() {
  local min="$1" max="$2"
  echo $(( RANDOM % (max - min + 1) + min ))
}

echo "============================================"
echo " MAU Sample CSV Uploader"
echo "============================================"
echo ""

prompt AWS_PROFILE  "AWS CLI profile" "cl-pp-dev"
prompt BUCKET       "S3 bucket name"
prompt FOLDER       "S3 folder prefix" "ibm_verify/app_login_counts/"
prompt APP_NAME     "Application name" "app-a"
prompt DAYS         "Number of days of fake data (1-30)" "7"

if ! [[ "$DAYS" =~ ^[0-9]+$ ]] || (( DAYS < 1 || DAYS > 30 )); then
  echo "ERROR: days must be a number between 1 and 30" >&2
  exit 1
fi

FOLDER="${FOLDER%/}"  # strip trailing slash

echo ""
echo "Generating $DAYS day(s) of data for app '$APP_NAME'..."
echo ""

mtd_base=$(rand 200 800)
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

upload_count=0
for (( i = DAYS - 1; i >= 0; i-- )); do
  d=$(date -u -v "-${i}d" +%Y-%m-%d 2>/dev/null || date -u -d "-${i} day" +%Y-%m-%d)

  total_logins=$(rand 50 500)
  unique_users=$(rand 20 150)
  failed_logins=$(rand 1 20)
  successful_logins=$(( total_logins - failed_logins ))
  mtd_unique_users=$(( mtd_base + $(rand 0 200) ))

  # update mtd_base slowly so it trends upward
  if (( RANDOM % 3 == 0 )); then
    mtd_base=$(( mtd_base + $(rand 10 50) ))
  fi

  csv_file="$tmpdir/${d}.csv"
  cat > "$csv_file" <<-CSV
application_name,total_logins,unique_users,failed_logins,successful_logins,mtd_unique_users,date
$APP_NAME,$total_logins,$unique_users,$failed_logins,$successful_logins,$mtd_unique_users,$d
CSV

  s3_key="${FOLDER}/date=${d}/app_login_counts.csv"
  echo "  Uploading date=$d ..."

  if aws s3 cp "$csv_file" "s3://${BUCKET}/${s3_key}" --profile "$AWS_PROFILE" --quiet; then
    echo "    -> s3://${BUCKET}/${s3_key}"
    (( upload_count++ ))
  else
    echo "    FAILED" >&2
  fi
done

echo ""
echo "============================================"
echo " Done — $upload_count file(s) uploaded"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. In backend/src/.env, set:"
echo "     AWS_S3_PROFILE=\"$AWS_PROFILE\""
echo "     S3_MAU_BUCKET_NAME=\"$BUCKET\""
echo "     S3_MAU_FOLDER=\"${FOLDER}/\""
echo "     (see backend/.env.sample for all MAU variables)"
echo "  2. Start the backend — the ARQ cron will pick up data for yesterday."
echo "     Or run load_mau_for_date(<date>) manually to test."
