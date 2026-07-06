#!/usr/bin/env bash
#
# build-and-push-backend.sh
#
# Builds the backend Docker image for linux/amd64 (matching ECS X86_64 Fargate),
# tags it for the ECR repository, and pushes it.
#
# Usage:
#   cd sample-aws-deploy/terraform
#   ./scripts/build-and-push-backend.sh <ecr_repository_url> <aws_region>
#
# Examples:
#   ./scripts/build-and-push-backend.sh 123456789012.dkr.ecr.ca-central-1.amazonaws.com/cl-pp-backend-scratch ca-central-1
#
# To get <ecr_repository_url>, run after Wave 1:
#   cd infra && terraform output ecr_repository_url

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <ecr_repository_url> <aws_region>"
  echo ""
  echo "Example:"
  echo "  $0 123456789012.dkr.ecr.ca-central-1.amazonaws.com/cl-pp-backend-scratch ca-central-1"
  exit 1
fi

ECR_URL="$1"
AWS_REGION="$2"
IMAGE_NAME="cl-pp-backend"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DOCKERFILE_DIR="$PROJECT_ROOT/backend"

echo "=== Building backend Docker image ==="
echo "  Platform:  linux/amd64"
echo "  Tag:       $ECR_URL:latest"
echo "  Source:    $DOCKERFILE_DIR"
echo ""

docker build \
  --no-cache \
  --pull \
  --platform linux/amd64 \
  -t "$IMAGE_NAME:latest" \
  -t "$ECR_URL:latest" \
  "$DOCKERFILE_DIR"

echo ""
echo "=== Authenticating with ECR ==="
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$(echo "$ECR_URL" | cut -d/ -f1)"

echo ""
echo "=== Pushing image to ECR ==="
docker push "$ECR_URL:latest"

echo ""
echo "=== Done! ==="
echo "Image pushed: $ECR_URL:latest"
echo ""
echo "Next steps:"
echo "  1. Sync Wave 2 env:  ./scripts/sync-deploy-env.sh"
echo "  2. Apply Wave 2:     cd deploy && terraform apply"
echo "  3. Force redeploy:   aws ecs update-service --cluster <cluster> --service <web-service> --force-new-deployment"
