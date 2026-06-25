output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "app_name" {
  description = "Application name"
  value       = var.app_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "ecs_web_security_group_id" {
  description = "ECS web security group ID"
  value       = aws_security_group.ecs_web.id
}

output "ecs_worker_security_group_id" {
  description = "ECS worker security group ID"
  value       = aws_security_group.ecs_worker.id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (host:port)"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.main.port
}

output "elasticache_endpoint" {
  description = "ElastiCache Redis primary endpoint (host:port)"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "ecs_cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_execution.arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task.arn
}

output "ecr_repository_url" {
  description = "ECR repository URL for backend Docker image"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_s3_bucket_id" {
  description = "S3 bucket name for frontend static files"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_s3_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name for frontend"
  value       = aws_s3_bucket.frontend.bucket_regional_domain_name
}

output "mau_s3_bucket_name" {
  description = "S3 bucket name for MAU data"
  value       = aws_s3_bucket.mau.id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "target_group_arn" {
  description = "ALB target group ARN"
  value       = aws_lb_target_group.web.arn
}

output "frontend_url" {
  description = "Application URL (single CloudFront — SPA from S3, /api/* to ALB)"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "api_url" {
  description = "Application URL (same as frontend — /api/* route)"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "db_password_secret_arn" {
  description = "Secrets Manager ARN for DB password"
  value       = aws_secretsmanager_secret.db_password.arn
}

output "oidc_client_secret_arn" {
  description = "Secrets Manager ARN for OIDC client secret"
  value       = aws_secretsmanager_secret.oidc_client_secret.arn
}

output "ibm_sv_admin_client_secret_arn" {
  description = "Secrets Manager ARN for IBM SV client secret"
  value       = aws_secretsmanager_secret.ibm_sv_admin_client_secret.arn
}

output "session_secret_arn" {
  description = "Secrets Manager ARN for session secret"
  value       = aws_secretsmanager_secret.session_secret.arn
}

output "cloudwatch_log_group_web" {
  description = "CloudWatch log group name for web service"
  value       = aws_cloudwatch_log_group.web.name
}

output "cloudwatch_log_group_worker" {
  description = "CloudWatch log group name for worker service"
  value       = aws_cloudwatch_log_group.worker.name
}
