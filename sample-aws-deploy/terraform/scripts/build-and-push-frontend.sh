#!/usr/bin/env bash
#
# build-and-push-frontend.sh
#
# Builds the frontend SPA and uploads it to the S3 bucket.
# Also invalidates the CloudFront cache so the new build is served immediately.
#
# Usage:
#   cd sample-aws-deploy/terraform
#   ./scripts/build-and-push-frontend.sh <environment_name>
#
# Examples:
#   ./scripts/build-and-push-frontend.sh scratch
#
# The script reads CloudFront URL and S3 bucket from infra/ outputs.
# Environment variables for the frontend build are set automatically:
#   VITE_API_BASE_URL   = derived from frontend_url (same-origin, so unset → auto)
#   All others use defaults from the frontend build pipeline.
#
# To override any VITE_* variable, set it before running the script:
#   VITE_APP_TITLE="My App" ./scripts/build-and-push-frontend.sh scratch

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <environment_name>"
  echo ""
  echo "Example:"
  echo "  $0 scratch"
  exit 1
fi

ENVIRONMENT="$1"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$SCRIPT_DIR/../infra"
FRONTEND_DIR="$SCRIPT_DIR/../../../frontend"

echo "=== Reading infra outputs ==="

if [ ! -f "$INFRA_DIR/.terraform/terraform.tfstate" ]; then
  echo "ERROR: infra/ has not been applied yet. Run 'cd infra && terraform init && terraform apply' first."
  exit 1
fi

FRONTEND_URL=$(cd "$INFRA_DIR" && terraform output -raw frontend_url)
S3_BUCKET=$(cd "$INFRA_DIR" && terraform output -raw frontend_s3_bucket_id)
API_URL=$(cd "$INFRA_DIR" && terraform output -raw api_url)

echo "  Frontend URL:  $FRONTEND_URL"
echo "  S3 bucket:     $S3_BUCKET"
echo "  API URL:       $API_URL"
echo ""

# Build the frontend
echo "=== Building frontend ==="
echo "  Directory: $FRONTEND_DIR"
echo "  VITE_APP_ENVIRONMENT=${ENVIRONMENT}"
echo "  VITE_API_BASE_URL=${API_URL}"
echo ""

cd "$FRONTEND_DIR"

# Set defaults for optional vars
: "${VITE_APP_ENVIRONMENT:=$ENVIRONMENT}"
: "${VITE_API_BASE_URL:=$API_URL}"
: "${VITE_APP_TITLE:=CanadaLogin Partner Portal}"
: "${VITE_AUTH_POST_LOGIN_PATH:=/dashboard}"
: "${VITE_SESSION_WARNING_AFTER_MINUTES:=25}"
: "${VITE_SESSION_COUNTDOWN_MINUTES:=5}"

pnpm install --frozen-lockfile

VITE_APP_ENVIRONMENT="$VITE_APP_ENVIRONMENT" \
VITE_API_BASE_URL="$VITE_API_BASE_URL" \
VITE_APP_TITLE="$VITE_APP_TITLE" \
VITE_AUTH_POST_LOGIN_PATH="$VITE_AUTH_POST_LOGIN_PATH" \
VITE_SESSION_WARNING_AFTER_MINUTES="$VITE_SESSION_WARNING_AFTER_MINUTES" \
VITE_SESSION_COUNTDOWN_MINUTES="$VITE_SESSION_COUNTDOWN_MINUTES" \
  pnpm build

echo ""
echo "=== Uploading to S3 ==="
aws s3 sync dist/ "s3://$S3_BUCKET/" --delete

echo ""
echo "=== Invalidating CloudFront cache ==="
CF_ID=$(cd "$INFRA_DIR" && terraform output -raw frontend_url | sed 's|https://||;s|\..*||')
# Get the full distribution ID from CloudFront by domain name
DOMAIN=$(cd "$INFRA_DIR" && terraform output -raw frontend_url | sed 's|https://||')
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Items[].Aliases.Items[?@], '') == \`true\` || DomainName == '$DOMAIN'].Id | [0]" --output text 2>/dev/null || true)

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" = "None" ]; then
  # Fallback: get the distribution by domain name
  DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='$DOMAIN'].Id | [0]" --output text)
fi

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
  echo "  Distribution ID: $DISTRIBUTION_ID"
  aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --output json --query 'Invalidation.Id'
else
  echo "  WARNING: Could not find CloudFront distribution ID for $DOMAIN"
  echo "  Skipping invalidation. You may need to invalidate manually."
fi

echo ""
echo "=== Done! ==="
echo "Frontend deployed to: $FRONTEND_URL"
echo "CloudFront invalidation may take a few minutes to propagate."
echo ""
echo "Next steps:"
echo "  1. Apply Wave 2:     cd deploy && terraform apply"
echo "  2. Force redeploy:   aws ecs update-service --cluster <cluster> --service <web-service> --force-new-deployment"
