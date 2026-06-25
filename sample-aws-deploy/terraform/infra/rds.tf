resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-${var.environment}"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name        = "${var.app_name}-rds"
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.app_name}-${var.environment}"

  engine         = "postgres"
  engine_version = var.postgres_engine_version
  instance_class = var.postgres_instance_class

  db_name  = var.postgres_db
  username = var.postgres_user
  password = random_password.db_password.result

  allocated_storage     = var.postgres_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  skip_final_snapshot   = true
  publicly_accessible   = false
  multi_az              = false
  db_subnet_group_name  = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = var.postgres_backup_retention_days
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  tags = {
    Environment = var.environment
    App         = var.app_name
  }
}
