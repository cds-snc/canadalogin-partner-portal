import csv
import io
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from ..core.config import settings
from ..schemas.mau import MAUCsvRow


class S3Repository:
    def __init__(self) -> None:
        session_kwargs = {}
        if settings.AWS_S3_PROFILE:
            session_kwargs["profile_name"] = settings.AWS_S3_PROFILE
        session = boto3.Session(**session_kwargs)

        if settings.AWS_S3_ROLE_ARN:
            sts_client = session.client("sts", region_name=settings.AWS_S3_REGION)
            try:
                response = sts_client.assume_role(
                    RoleArn=settings.AWS_S3_ROLE_ARN,
                    RoleSessionName="S3RepositorySession",
                    DurationSeconds=900,
                )
            except ClientError:
                self.client = session.client("s3", region_name=settings.AWS_S3_REGION)
            else:
                creds = response["Credentials"]
                self.client = boto3.client(
                    "s3",
                    aws_access_key_id=creds["AccessKeyId"],
                    aws_secret_access_key=creds["SecretAccessKey"],
                    aws_session_token=creds["SessionToken"],
                    region_name=settings.AWS_S3_REGION,
                )
        else:
            self.client = session.client("s3", region_name=settings.AWS_S3_REGION)
        self.bucket = settings.S3_MAU_BUCKET_NAME
        self.folder = settings.S3_MAU_FOLDER

    async def get_csv_file(self, key: str) -> Optional[list[MAUCsvRow]]:
        full_key = f"{self.folder}{key}"
        try:
            response = await _async_s3_get(self.client, self.bucket, full_key)
        except self.client.exceptions.NoSuchKey:
            return None

        content = response["Body"].read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        return [_parse_row(row) for row in reader]


def _parse_row(row: dict[str, str]) -> MAUCsvRow:
    from datetime import date as date_type

    date_parts = row["date"].split("-")
    return MAUCsvRow(
        application_name=row["application_name"],
        total_logins=int(row["total_logins"]),
        unique_users=int(row["unique_users"]),
        failed_logins=int(row["failed_logins"]),
        successful_logins=int(row["successful_logins"]),
        mtd_unique_users=int(row["mtd_unique_users"]),
        date=date_type(int(date_parts[0]), int(date_parts[1]), int(date_parts[2])),
    )


async def _async_s3_get(client: boto3.client, bucket: str, key: str) -> dict:
    import asyncio

    return await asyncio.to_thread(client.get_object, Bucket=bucket, Key=key)
