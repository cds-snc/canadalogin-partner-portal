import csv
import io
from typing import Optional

import boto3

from ..core.config import settings
from ..schemas.mau import MAUCsvRow


class S3Repository:
    def __init__(self) -> None:
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION,
        )
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
