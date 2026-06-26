# ----- Frontend S3 bucket (SPA static files) -----

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.app_name}-frontend-${var.environment}"

  tags = {
    Environment = var.environment
    App         = var.app_name
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Suspended"
  }
}

# ----- MAU data S3 bucket (always created for sample data) -----

resource "aws_s3_bucket" "mau" {
  bucket = "${var.app_name}-mau-${var.environment}"

  tags = {
    Environment = var.environment
    App         = var.app_name
  }
}

resource "aws_s3_bucket_public_access_block" "mau" {
  bucket = aws_s3_bucket.mau.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_object" "mau_sample" {
  bucket       = aws_s3_bucket.mau.id
  key          = "${var.s3_mau_folder}date=2026-06-11/app_login_counts.csv"
  source       = "${path.module}/../../data/app_login_counts.csv"
  content_type = "text/csv"

  tags = {
    Environment = var.environment
    App         = var.app_name
  }
}
