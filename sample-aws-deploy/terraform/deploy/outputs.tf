output "ecs_web_service_name" {
  description = "ECS web service name"
  value       = aws_ecs_service.web.name
}

output "ecs_worker_service_name" {
  description = "ECS worker service name"
  value       = aws_ecs_service.worker.name
}

output "web_task_definition_arn" {
  description = "Web task definition ARN (latest)"
  value       = aws_ecs_task_definition.web.arn
}

output "worker_task_definition_arn" {
  description = "Worker task definition ARN (latest)"
  value       = aws_ecs_task_definition.worker.arn
}
