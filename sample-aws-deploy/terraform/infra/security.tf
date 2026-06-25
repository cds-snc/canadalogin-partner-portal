resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-${var.environment}"
  description = "ALB security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "HTTP from CloudFront and health checks"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-alb"
    Environment = var.environment
  }
}

resource "aws_security_group" "ecs_web" {
  name        = "${var.app_name}-ecs-web-${var.environment}"
  description = "ECS web service security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Traffic from ALB"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-ecs-web"
    Environment = var.environment
  }
}

resource "aws_security_group" "ecs_worker" {
  name        = "${var.app_name}-ecs-worker-${var.environment}"
  description = "ECS worker service security group"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-ecs-worker"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-${var.environment}"
  description = "RDS PostgreSQL security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "PostgreSQL from ECS web and worker"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [
      aws_security_group.ecs_web.id,
      aws_security_group.ecs_worker.id,
    ]
  }

  tags = {
    Name        = "${var.app_name}-rds"
    Environment = var.environment
  }
}

resource "aws_security_group" "elasticache" {
  name        = "${var.app_name}-elasticache-${var.environment}"
  description = "ElastiCache Redis security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Redis from ECS web and worker"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [
      aws_security_group.ecs_web.id,
      aws_security_group.ecs_worker.id,
    ]
  }

  tags = {
    Name        = "${var.app_name}-elasticache"
    Environment = var.environment
  }
}
