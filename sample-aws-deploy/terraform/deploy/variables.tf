# All variables in this file are populated by sync-deploy-env.sh
# from Wave 1 (infra) outputs. Do not edit manually.

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

# ----- App metadata -----

variable "contact_name" {
  description = "Contact name for the application"
  type        = string
  default     = "CDS Auth team"
}

variable "contact_email" {
  description = "Contact email for the application"
  type        = string
  default     = "you@cds-sns.ca"
}

variable "app_description" {
  description = "Application description"
  type        = string
  default     = ""
}

variable "app_version" {
  description = "Application version"
  type        = string
  default     = "0.1"
}

variable "license_name" {
  description = "License name"
  type        = string
  default     = "MIT"
}

variable "terms_version" {
  description = "Terms version"
  type        = string
  default     = "v1"
}

# ----- Infra outputs (populated by sync script) -----

variable "ecs_cluster_id" {
  description = "ECS cluster ID (from infra)"
  type        = string
}

variable "ecs_execution_role_arn" {
  description = "ECS execution role ARN (from infra)"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ECS task role ARN (from infra)"
  type        = string
}

variable "target_group_arn" {
  description = "ALB target group ARN (from infra)"
  type        = string
}

variable "ecs_web_security_group_id" {
  description = "ECS web security group ID (from infra)"
  type        = string
}

variable "ecs_worker_security_group_id" {
  description = "ECS worker security group ID (from infra)"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs (from infra)"
  type        = list(string)
}

variable "ecr_repository_url" {
  description = "ECR repository URL (from infra)"
  type        = string
}

variable "rds_endpoint" {
  description = "RDS endpoint (from infra)"
  type        = string
}

variable "rds_port" {
  description = "RDS port (from infra)"
  type        = number
}

variable "elasticache_endpoint" {
  description = "ElastiCache endpoint (from infra)"
  type        = string
}

variable "frontend_url" {
  description = "Frontend CloudFront URL (from infra)"
  type        = string
}

variable "api_url" {
  description = "API CloudFront URL (from infra)"
  type        = string
}

variable "mau_s3_bucket_name" {
  description = "MAU S3 bucket name (from infra)"
  type        = string
}

variable "cloudwatch_log_group_web" {
  description = "CloudWatch log group for web (from infra)"
  type        = string
}

variable "cloudwatch_log_group_worker" {
  description = "CloudWatch log group for worker (from infra)"
  type        = string
}

# ----- Secrets (from infra) -----

variable "db_password_secret_arn" {
  description = "DB password secret ARN (from infra)"
  type        = string
}

variable "oidc_client_secret_arn" {
  description = "OIDC client secret ARN (from infra)"
  type        = string
}

variable "ibm_sv_admin_client_secret_arn" {
  description = "IBM SV admin client secret ARN (from infra)"
  type        = string
}

variable "session_secret_arn" {
  description = "Session secret ARN (from infra)"
  type        = string
}

# ----- Postgres -----

variable "postgres_user" {
  description = "RDS PostgreSQL master username"
  type        = string
  default     = "clpp_admin"
}

variable "postgres_db" {
  description = "RDS PostgreSQL database name"
  type        = string
  default     = "clpp"
}

# ----- OIDC -----

variable "oidc_enabled" {
  description = "Enable OIDC authentication"
  type        = bool
  default     = true
}

variable "oidc_provider_name" {
  description = "OIDC provider display name"
  type        = string
  default     = "CanadaLogin"
}

variable "oidc_server_metadata_url" {
  description = "OIDC provider metadata URL"
  type        = string
}

variable "oidc_client_id" {
  description = "OIDC client ID"
  type        = string
  sensitive   = true
}

variable "oidc_scopes" {
  description = "OIDC scopes"
  type        = string
  default     = "openid profile email"
}

variable "oidc_post_login_redirect" {
  description = "Frontend path to redirect after login"
  type        = string
  default     = "/auth-complete"
}

variable "oidc_access_denied_redirect" {
  description = "Frontend path for access denied"
  type        = string
  default     = "/access-denied"
}

variable "oidc_group_claim_key" {
  description = "JWT claim key for group membership"
  type        = string
  default     = "groupIds"
}

variable "oidc_admin_group_name" {
  description = "Group name for admin role"
  type        = string
  default     = "admin"
}

variable "oidc_application_owners_group_name" {
  description = "Group name for application owners"
  type        = string
  default     = "application owners"
}

variable "clpp_admin_role_name" {
  description = "Admin role name in app"
  type        = string
  default     = "admin"
}

variable "clpp_application_owners_role_name" {
  description = "Application owners role name in app"
  type        = string
  default     = "application owners"
}

# ----- IBM Security Verify -----

variable "ibm_sv_admin_base_url" {
  description = "IBM Security Verify admin API base URL"
  type        = string
  default     = ""
}

variable "ibm_sv_admin_client_id" {
  description = "IBM Security Verify admin API client ID"
  type        = string
  default     = ""
}

# ----- Session -----

variable "session_cookie_name" {
  description = "Session cookie name"
  type        = string
  default     = "app_session"
}

variable "session_cookie_domain" {
  description = "Session cookie domain"
  type        = string
  default     = ""
}

variable "session_max_age" {
  description = "Session max age in seconds"
  type        = number
  default     = 28800
}

variable "session_rolling" {
  description = "Enable session rolling"
  type        = bool
  default     = false
}

# ----- Redis session -----

variable "redis_session_db" {
  description = "Redis session database number"
  type        = number
  default     = 1
}

variable "redis_session_password" {
  description = "Redis session password"
  type        = string
  default     = ""
}

variable "redis_session_ssl" {
  description = "Use SSL for Redis session connection"
  type        = bool
  default     = false
}

variable "redis_session_prefix" {
  description = "Redis session key prefix"
  type        = string
  default     = "app.sessions."
}

variable "redis_session_gc_ttl" {
  description = "Redis session garbage collection TTL in seconds"
  type        = number
  default     = 2592000
}

# ----- CORS -----

variable "cors_origins" {
  description = "Allowed CORS origins (JSON array string). Leave empty to auto-compute from CloudFront URL."
  type        = string
  default     = ""
}

variable "cors_methods" {
  description = "Allowed CORS methods"
  type        = string
  default     = "[\"*\"]"
}

variable "cors_headers" {
  description = "Allowed CORS headers"
  type        = string
  default     = "[\"*\"]"
}

# ----- S3 MAU -----

variable "s3_mau_folder" {
  description = "Folder path within MAU bucket"
  type        = string
  default     = "ibm_verify/app_login_counts/"
}

variable "aws_s3_role_arn" {
  description = "IAM role ARN for cross-account MAU S3 access"
  type        = string
  default     = ""
}

# ----- ECS -----

variable "web_cpu" {
  description = "ECS web task CPU units"
  type        = number
  default     = 1024
}

variable "web_memory" {
  description = "ECS web task memory in MiB"
  type        = number
  default     = 2048
}

variable "worker_cpu" {
  description = "ECS worker task CPU units"
  type        = number
  default     = 256
}

variable "worker_memory" {
  description = "ECS worker task memory in MiB"
  type        = number
  default     = 512
}

variable "cpu_architecture" {
  description = "ECS Fargate CPU architecture"
  type        = string
  default     = "X86_64"
}

# ----- Misc -----

variable "timezone" {
  description = "Application timezone"
  type        = string
  default     = "America/Toronto"
}

variable "load_mau_enabled" {
  description = "Enable MAU data loading cron job"
  type        = bool
  default     = true
}

variable "start_arq_on_startup" {
  description = "Start ARQ worker within web process (should be false for ECS)"
  type        = bool
  default     = false
}

variable "client_cache_max_age" {
  description = "Client cache max age in seconds"
  type        = number
  default     = 30
}

variable "default_rate_limit_limit" {
  description = "Default rate limit requests"
  type        = number
  default     = 10
}

variable "default_rate_limit_period" {
  description = "Default rate limit period in seconds"
  type        = number
  default     = 3600
}

variable "session_cookie_samesite" {
  description = "Session cookie SameSite attribute"
  type        = string
  default     = "lax"
}

variable "session_cookie_secure" {
  description = "Session cookie secure flag"
  type        = bool
  default     = true
}

variable "oidc_post_logout_redirect_uri" {
  description = "Session cookie SameSite attribute"
  type        = string
  default     = "http://localhost:3000"
}


variable "oidc_redirect_path" {
  description = "Session cookie SameSite attribute"
  type        = string
  default     = "http://localhost:3000/auth-complete"
}

variable "oidc_redirect_url" {
  description = "Session cookie SameSite attribute"
  type        = string
  default     = "http://localhost:3000/auth-complete"
}