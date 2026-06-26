resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${var.app_name}-web-${var.environment}"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    App         = var.app_name
  }
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/${var.app_name}-worker-${var.environment}"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    App         = var.app_name
  }
}
