import asyncio
import csv
import io
from typing import Any, Optional

import boto3
from botocore.exceptions import ClientError

from ..core.config import settings
from ..schemas.mau import MAUCsvRow


class S3Repository:
    def __init__(self) -> None:
        self._session_kwargs: dict[str, str] = {}
        if settings.AWS_S3_PROFILE:
            self._session_kwargs["profile_name"] = settings.AWS_S3_PROFILE

        self._role_arn = settings.AWS_S3_ROLE_ARN
        self._region = settings.AWS_S3_REGION
        self._client_lock = asyncio.Lock()
        self.client: Any | None = None
        self.bucket = settings.S3_MAU_BUCKET_NAME
        self.folder = settings.S3_MAU_FOLDER

    async def get_csv_file(self, key: str) -> Optional[list[MAUCsvRow]]:
        full_key = f"{self.folder}{key}"
        client = await self._get_client()
        try:
            response = await _async_s3_get(client, self.bucket, full_key)
        except client.exceptions.NoSuchKey:
            return None
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") == "NoSuchKey":
                return None
            raise

        content = (await _async_read_stream(response["Body"])).decode("utf-8")
        reader = csv.DictReader(io.StringIO(content), delimiter="\t")
        return [_parse_row(row) for row in reader]

    async def _get_client(self) -> Any:
        if self.client is not None:
            return self.client

        async with self._client_lock:
            if self.client is None:
                self.client = await asyncio.to_thread(
                    _build_s3_client,
                    self._session_kwargs,
                    self._role_arn,
                    self._region,
                )

        return self.client


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


async def _async_s3_get(client: Any, bucket: str, key: str) -> dict:
    return await asyncio.to_thread(client.get_object, Bucket=bucket, Key=key)


def _build_s3_client(session_kwargs: dict[str, str], role_arn: str, region: str) -> Any:
    session = boto3.Session(**session_kwargs)

    if role_arn:
        sts_client = session.client("sts", region_name=region)
        try:
            response = sts_client.assume_role(
                RoleArn=role_arn,
                RoleSessionName="S3RepositorySession",
                DurationSeconds=900,
            )
        except ClientError:
            return session.client("s3", region_name=region)

        creds = response["Credentials"]
        return boto3.client(
            "s3",
            aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"],
            aws_session_token=creds["SessionToken"],
            region_name=region,
        )

    return session.client("s3", region_name=region)


async def _async_read_stream(stream: Any) -> bytes:
    return await asyncio.to_thread(stream.read)
