resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "random_id" "session_secret" {
  byte_length = 32
}

# ----- DB password -----

resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.app_name}-db-password-${var.environment}"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

# ----- OIDC client secret -----

resource "aws_secretsmanager_secret" "oidc_client_secret" {
  name = "${var.app_name}-oidc-client-secret-${var.environment}"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "oidc_client_secret" {
  secret_id     = aws_secretsmanager_secret.oidc_client_secret.id
  secret_string = var.oidc_client_secret
}

# ----- IBM SV admin client secret -----

resource "aws_secretsmanager_secret" "ibm_sv_admin_client_secret" {
  name = "${var.app_name}-ibm-sv-secret-${var.environment}"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "ibm_sv_admin_client_secret" {
  secret_id     = aws_secretsmanager_secret.ibm_sv_admin_client_secret.id
  secret_string = var.ibm_sv_admin_client_secret
}

# ----- Redis password -----

resource "random_password" "redis_password" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "redis_password" {
  name = "${var.app_name}-redis-password-${var.environment}"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "redis_password" {
  secret_id     = aws_secretsmanager_secret.redis_password.id
  secret_string = random_password.redis_password.result
}

# ----- Session secret (fallback key) -----

resource "aws_secretsmanager_secret" "session_secret" {
  name = "${var.app_name}-session-secret-${var.environment}"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "session_secret" {
  secret_id     = aws_secretsmanager_secret.session_secret.id
  secret_string = random_id.session_secret.b64_url
}
