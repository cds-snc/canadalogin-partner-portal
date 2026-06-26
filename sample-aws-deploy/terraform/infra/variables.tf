variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ca-central-1"
}

variable "environment" {
  description = "Environment name (for tagging and naming)"
  type        = string
  default     = "scratch"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "gc-signin-partner-portal"
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

variable "postgres_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "postgres_engine_version" {
  description = "RDS PostgreSQL engine version"
  type        = string
  default     = "16.14"
}

variable "postgres_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "postgres_backup_retention_days" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 7
}

# ----- Redis -----

variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t4g.micro"
}

variable "redis_engine_version" {
  description = "ElastiCache Redis engine version"
  type        = string
  default     = "7.1"
}

# ----- ECS -----

variable "web_cpu" {
  description = "ECS web task CPU units (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "web_memory" {
  description = "ECS web task memory in MiB"
  type        = number
  default     = 1024
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
  description = "ECS Fargate CPU architecture (ARM64 or X86_64)"
  type        = string
  default     = "X86_64"
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

variable "oidc_client_secret" {
  description = "OIDC client secret"
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

variable "ibm_sv_admin_client_secret" {
  description = "IBM Security Verify admin API client secret"
  type        = string
  default     = ""
  sensitive   = true
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

variable "redis_session_ssl" {
  description = "Use SSL for Redis session connection"
  type        = bool
  default     = true
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

# ----- Redis cache / queue / rate-limit -----
# These share the same ElastiCache instance. SSL is enabled by default
# to match transit_encryption_enabled = true on the ElastiCache resource.

variable "redis_cache_db" {
  description = "Redis database index for cache client"
  type        = number
  default     = 0
}

variable "redis_cache_ssl" {
  description = "Use TLS for Redis cache connection"
  type        = bool
  default     = true
}

variable "redis_queue_db" {
  description = "Redis database index for queue (ARQ) client"
  type        = number
  default     = 0
}

variable "redis_queue_ssl" {
  description = "Use TLS for Redis queue connection"
  type        = bool
  default     = true
}

variable "redis_rate_limit_db" {
  description = "Redis database index for rate-limiter client"
  type        = number
  default     = 0
}

variable "redis_rate_limit_ssl" {
  description = "Use TLS for Redis rate-limiter connection"
  type        = bool
  default     = true
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
  description = "IAM role ARN for cross-account MAU S3 access (if using external bucket)"
  type        = string
  default     = ""
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