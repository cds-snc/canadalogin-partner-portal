locals {
  computed_cors_origins = var.cors_origins != "" ? var.cors_origins : jsonencode(["https://${var.frontend_url}"])

  common_env = [
    { name = "ENVIRONMENT",         value = var.environment },
    { name = "APP_NAME",            value = var.app_name },
    { name = "APP_DESCRIPTION",     value = var.app_description },
    { name = "APP_VERSION",         value = var.app_version },
    { name = "CONTACT_NAME",        value = var.contact_name },
    { name = "CONTACT_EMAIL",       value = var.contact_email },
    { name = "LICENSE_NAME",        value = var.license_name },
    { name = "TERMS_VERSION",       value = var.terms_version },

    { name = "POSTGRES_USER",       value = var.postgres_user },
    { name = "POSTGRES_SERVER",     value = split(":", var.rds_endpoint)[0] },
    { name = "POSTGRES_PORT",       value = tostring(var.rds_port) },
    { name = "POSTGRES_DB",         value = var.postgres_db },

    { name = "SESSION_COOKIE_NAME",    value = var.session_cookie_name },
    { name = "SESSION_COOKIE_SECURE",  value = "true" },
    { name = "SESSION_COOKIE_DOMAIN",  value = "" },
    { name = "SESSION_MAX_AGE",        value = tostring(var.session_max_age) },
    { name = "SESSION_ROLLING",        value = tostring(var.session_rolling) },
    { name = "SESSION_COOKIE_SAMESITE", value = "lax" },

    { name = "REDIS_SESSION_HOST",    value = var.elasticache_endpoint },
    { name = "REDIS_SESSION_PORT",    value = "6379" },
    { name = "REDIS_SESSION_DB",      value = tostring(var.redis_session_db) },
    { name = "REDIS_SESSION_PASSWORD",value = "" },
    { name = "REDIS_SESSION_SSL",     value = tostring(var.redis_session_ssl) },
    { name = "REDIS_SESSION_PREFIX",  value = var.redis_session_prefix },
    { name = "REDIS_SESSION_GC_TTL",  value = tostring(var.redis_session_gc_ttl) },

    { name = "REDIS_CACHE_HOST",      value = var.elasticache_endpoint },
    { name = "REDIS_CACHE_PORT",      value = "6379" },
    { name = "REDIS_QUEUE_HOST",      value = var.elasticache_endpoint },
    { name = "REDIS_QUEUE_PORT",      value = "6379" },
    { name = "REDIS_RATE_LIMIT_HOST", value = var.elasticache_endpoint },
    { name = "REDIS_RATE_LIMIT_PORT", value = "6379" },

    { name = "OIDC_ENABLED",                   value = tostring(var.oidc_enabled) },
    { name = "OIDC_PROVIDER_NAME",             value = var.oidc_provider_name },
    { name = "OIDC_SERVER_METADATA_URL",       value = var.oidc_server_metadata_url },
    { name = "OIDC_CLIENT_ID",                 value = var.oidc_client_id },
    { name = "OIDC_SCOPES",                    value = var.oidc_scopes },
    { name = "OIDC_REDIRECT_URI",              value = "${var.api_url}/api/v1/auth/oidc/callback" },
    { name = "OIDC_REDIRECT_PATH",             value = "/api/v1/auth/oidc/callback" },
    { name = "OIDC_POST_LOGIN_REDIRECT",       value = "${var.frontend_url}${var.oidc_post_login_redirect}" },
    { name = "OIDC_POST_LOGOUT_REDIRECT_URI",  value = var.frontend_url },
    { name = "OIDC_ACCESS_DENIED_REDIRECT",    value = "${var.frontend_url}${var.oidc_access_denied_redirect}" },
    { name = "OIDC_GROUP_CLAIM_KEY",           value = var.oidc_group_claim_key },
    { name = "OIDC_ADMIN_GROUP_NAME",          value = var.oidc_admin_group_name },
    { name = "OIDC_APPLICATION_OWNERS_GROUP_NAME", value = var.oidc_application_owners_group_name },
    { name = "CLPP_ADMIN_ROLE_NAME",           value = var.clpp_admin_role_name },
    { name = "CLPP_APPLICATION_OWNERS_ROLE_NAME", value = var.clpp_application_owners_role_name },

    { name = "IBM_SV_ADMIN_BASE_URL",   value = var.ibm_sv_admin_base_url },
    { name = "IBM_SV_ADMIN_CLIENT_ID",  value = var.ibm_sv_admin_client_id },

    { name = "TIMEZONE",              value = var.timezone },
    { name = "LOAD_MAU_ENABLED",      value = tostring(var.load_mau_enabled) },

    { name = "CORS_ORIGINS", value = local.computed_cors_origins },
    { name = "CORS_METHODS", value = var.cors_methods },
    { name = "CORS_HEADERS", value = var.cors_headers },
    { name = "CLIENT_CACHE_MAX_AGE", value = tostring(var.client_cache_max_age) },

    { name = "AWS_S3_REGION",      value = var.aws_region },
    { name = "AWS_S3_ROLE_ARN",    value = var.aws_s3_role_arn },
    { name = "S3_MAU_BUCKET_NAME", value = var.mau_s3_bucket_name },
    { name = "S3_MAU_FOLDER",      value = var.s3_mau_folder },

    { name = "DEFAULT_RATE_LIMIT_LIMIT",  value = tostring(var.default_rate_limit_limit) },
    { name = "DEFAULT_RATE_LIMIT_PERIOD", value = tostring(var.default_rate_limit_period) },
    { name = "NO_COLOR", value = "1" },
  ]

  common_secrets = [
    { name = "POSTGRES_PASSWORD",          valueFrom = var.db_password_secret_arn },
    { name = "OIDC_CLIENT_SECRET",         valueFrom = var.oidc_client_secret_arn },
    { name = "IBM_SV_ADMIN_CLIENT_SECRET", valueFrom = var.ibm_sv_admin_client_secret_arn },
    { name = "SESSION_SECRET_KEY",         valueFrom = var.session_secret_arn },
  ]

  web_container = {
    name         = "web"
    image        = var.ecr_repository_url
    essential    = true
    command      = [
       "sh", "-c",
    "alembic -c /code/alembic.ini upgrade head && exec gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --forwarded-allow-ips='*' --timeout 300 --keep-alive 5 --max-requests 1000 --max-requests-jitter 100 --access-logfile - --error-logfile - --log-level info"
    ]
    portMappings = [
      { containerPort = 8000, protocol = "tcp" }
    ]
    environment = concat(local.common_env, [
      { name = "LOAD_MAU_ENABLED",      value = "false" },
      { name = "START_ARQ_ON_STARTUP",  value = "false" },
  
    ])
    secrets = local.common_secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = var.cloudwatch_log_group_web
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }


  worker_container = {
    name         = "worker"
    image        = var.ecr_repository_url
    essential    = true
    command      = ["arq", "app.core.worker.settings.WorkerSettings"]
    environment = concat(local.common_env, [
      { name = "LOAD_MAU_ENABLED",      value = "true" },
      { name = "START_ARQ_ON_STARTUP", value = "true" },
    ])
    secrets = local.common_secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = var.cloudwatch_log_group_worker
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }
}

# ----- Task definitions -----

resource "aws_ecs_task_definition" "web" {
  family                   = "${var.app_name}-web-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.web_cpu
  memory                   = var.web_memory
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = var.cpu_architecture
  }

  container_definitions = jsonencode([local.web_container])

  tags = {
    Environment = var.environment
    App         = var.app_name
  }
}

resource "aws_ecs_task_definition" "worker" {
  family                   = "${var.app_name}-worker-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.worker_cpu
  memory                   = var.worker_memory
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = var.cpu_architecture
  }

  container_definitions = jsonencode([local.worker_container])

  tags = {
    Environment = var.environment
    App         = var.app_name
  }
}

# ----- ECS services -----

resource "aws_ecs_service" "web" {
  name            = "${var.app_name}-web-${var.environment}"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [var.ecs_web_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "web"
    container_port   = 8000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = {
    Environment = var.environment
    App         = var.app_name
  }
}

resource "aws_ecs_service" "worker" {
  name            = "${var.app_name}-worker-${var.environment}"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [var.ecs_worker_security_group_id]
    assign_public_ip = false
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = {
    Environment = var.environment
    App         = var.app_name
  }
}
