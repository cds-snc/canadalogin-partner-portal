data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# ----- ECS task execution role (pulls images, creates logs) -----

resource "aws_iam_role" "ecs_execution" {
  name               = "${var.app_name}-ecs-execution-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_policy" "ecs_execution_secrets" {
  name        = "${var.app_name}-ecs-execution-secrets-${var.environment}"
  description = "Allow ECS execution role to read secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
        ]
        Resource = [
          aws_secretsmanager_secret.db_password.arn,
          aws_secretsmanager_secret.oidc_client_secret.arn,
          aws_secretsmanager_secret.ibm_sv_admin_client_secret.arn,
          aws_secretsmanager_secret.session_secret.arn,
          aws_secretsmanager_secret.redis_password.arn,
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
        ]
        Resource = ["*"]
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_secrets" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = aws_iam_policy.ecs_execution_secrets.arn
}

# ----- ECS task role (runtime permissions for the app) -----

resource "aws_iam_role" "ecs_task" {
  name               = "${var.app_name}-ecs-task-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json

  tags = {
    Environment = var.environment
  }
}

resource "aws_iam_policy" "task_s3_mau" {
  name        = "${var.app_name}-task-s3-mau-${var.environment}"
  description = "Allow ECS task to access MAU S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Effect = "Allow"
          Action = [
            "s3:GetObject",
            "s3:ListBucket",
          ]
          Resource = [
            aws_s3_bucket.mau.arn,
            "${aws_s3_bucket.mau.arn}/*",
          ]
        },
      ],
      var.aws_s3_role_arn != "" ? [
        {
          Effect   = "Allow"
          Action   = ["sts:AssumeRole"]
          Resource = [var.aws_s3_role_arn]
        }
      ] : []
    )
  })
}

resource "aws_iam_role_policy_attachment" "task_s3_mau" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = aws_iam_policy.task_s3_mau.arn
}
