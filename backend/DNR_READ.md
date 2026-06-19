# DNR Read Access

This document summarizes the read-only external access pattern used by the DNR team in [backend/src/migrations/versions/0008_add_dnr_view_and_permission.py](backend/src/migrations/versions/0008_add_dnr_view_and_permission.py).

The recommended approach is to expose only the required columns through a PostgreSQL view, grant `SELECT` on that view to a dedicated database role, and use AWS-native authentication for the external consumer. If password-based access is unavoidable, store the rotated credential in AWS Secrets Manager instead of embedding it in application config.

## Recommended Pattern

The best solution is to create a PostgreSQL view restricted to the required columns, grant SELECT-only privileges to a dedicated database role, and secure the connection using AWS IAM Database Authentication. Because the database and surrounding services run on AWS, IAM avoids permanent database passwords for external services.

If IAM cannot be used by the external service, the fallback is to store standard PostgreSQL credentials in AWS Secrets Manager and rotate them automatically.

## Reference

The current solution creates these objects:

- View: `public.vw_dnr_read_rp_application`
- Role: `dnr_rp_app_reader`

The view projects only the approved columns from `public.rp_application`:

- `department_id`
- `dnr_app_name` as `dnr_application_name`
- `ibm_sv_application_id` as `ibm_application_id`
- `created_at`
- `updated_at`

The view filters out soft-deleted rows with `WHERE is_deleted = FALSE`.

## SQL Implementation

Run the following script as a database administrator to isolate the data columns and restrict access:

```sql
-- 1. Create the secure restricted view
CREATE VIEW public.vw_dnr_read_rp_application AS
SELECT
    department_id,
    dnr_app_name AS dnr_application_name,
    ibm_sv_application_id AS ibm_application_id,
    created_at,
    updated_at
FROM public.rp_application
WHERE is_deleted = false;

-- 2. Create a dedicated read-only role for the external user
CREATE ROLE dnr_rp_app_reader;

-- 3. Grant usage on the schema
GRANT USAGE ON SCHEMA public TO dnr_rp_app_reader;

-- 4. Grant SELECT permission only on the view, not the underlying table
GRANT SELECT ON public.vw_dnr_read_rp_application TO dnr_rp_app_reader;
```

See [backend/src/migrations/versions/0008_add_dnr_view_and_permission.py](backend/src/migrations/versions/0008_add_dnr_view_and_permission.py). for more details.

## Best Authentication Solution: AWS IAM Auth

Since the external consumer runs on AWS services, use AWS IAM Database Authentication instead of standard passwords.

- How it works: the external service assumes an IAM role and uses the AWS SDK to generate a temporary IAM database auth token to log in as `dnr_rp_app_reader`.
- Why it's best: no hardcoded passwords, automatic token rotation, and centralized access control through AWS IAM policies.
- Alternative if IAM is not possible: use AWS Secrets Manager with automatic password rotation to store PostgreSQL credentials and grant the external service access to the secret.

## Step-by-Step Architecture Setup

1. Enable IAM Auth: ensure IAM Authentication is enabled on the Amazon RDS or Aurora PostgreSQL cluster.
2. Map IAM to Postgres:

```sql
CREATE USER dnr_rp_app_reader WITH LOGIN;
GRANT rds_iam TO dnr_rp_app_reader;
```

3. Attach IAM Policy: attach a policy to the external AWS service execution role that allows `rds-db:connect` for the database user.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "rds-db:connect"
            ],
            "Resource": [
                "arn:aws:rds-db:us-east-1:123456789012:dbuser:db-ABC123XYZ/dnr_rp_app_reader"
            ]
        }
    ]
}
```

4. Network Isolation: update the RDS security group to accept inbound traffic on port 5432 only from the external service security group or VPC CIDR.

## Summary of Benefits

- Column security: the external user cannot query unapproved columns such as `application_owner` or `uuid`.
- Table isolation: the user has no visibility or access rights to the core `public.rp_application` table.
- Zero password management: IAM authentication removes credential leak risk and avoids permanent database passwords.

## References

- PostgreSQL GRANT documentation: https://www.postgresql.org/docs/7.3/sql-grant.html
- AWS IAM database auth overview: https://cloudonaut.io/passwordless-database-authentication-for-aws-lambda/
- IAM federation example: https://vijayrkr.medium.com/aws-identity-federation-7c1210c6b5ae
- Secrets Manager fallback example: https://oneuptime.com/blog/post/2026-02-23-how-to-create-database-users-and-permissions-with-terraform/view
- Network isolation note: https://repost.aws/questions/QUO-fDlwFmSJqUM_4acxFcsQ/got-error-when-create-new-scheduler-with-eventbridge-the-execution-role-you-provide-must-allow-aws-eventbridge-scheduler-to-assume-the-role