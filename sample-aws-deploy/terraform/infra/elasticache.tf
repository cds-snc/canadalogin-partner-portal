resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.app_name}-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id          = "${var.app_name}-${var.environment}"
  description                   = "Redis for ${var.app_name} ${var.environment}"

  engine         = "redis"
  engine_version = var.redis_engine_version
  node_type      = var.redis_node_type
  num_cache_clusters = 1

  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.elasticache.id]
  automatic_failover_enabled = false
  multi_az_enabled           = false

  tags = {
    Environment = var.environment
    App         = var.app_name
  }
}
