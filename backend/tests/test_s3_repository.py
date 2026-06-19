import asyncio
from unittest.mock import MagicMock, call, patch

import pytest
from botocore.exceptions import ClientError

from src.app.core.config import settings
from src.app.repositories.s3_repository import S3Repository


class TestS3RepositoryInit:
    def test_default_credential_chain_when_no_role_arn(self) -> None:
        mock_s3 = MagicMock()
        mock_session = MagicMock()
        mock_session.client.return_value = mock_s3

        with patch.object(settings, "AWS_S3_ROLE_ARN", ""):
            with patch.object(settings, "AWS_S3_PROFILE", ""):
                with patch("src.app.repositories.s3_repository.boto3.Session", return_value=mock_session):
                    repo = S3Repository()
                    asyncio.run(repo._get_client())

        mock_session.client.assert_called_once_with("s3", region_name="ca-central-1")
        assert repo.bucket == settings.S3_MAU_BUCKET_NAME
        assert repo.folder == settings.S3_MAU_FOLDER

    def test_uses_profile_when_set(self) -> None:
        mock_s3 = MagicMock()
        mock_session = MagicMock()
        mock_session.client.return_value = mock_s3

        with patch.object(settings, "AWS_S3_ROLE_ARN", ""):
            with patch.object(settings, "AWS_S3_PROFILE", "cl-pp-dev"):
                with patch("src.app.repositories.s3_repository.boto3.Session") as mock_session_cls:
                    mock_session_cls.return_value = mock_session
                    repo = S3Repository()
                    asyncio.run(repo._get_client())

        mock_session_cls.assert_called_once_with(profile_name="cl-pp-dev")
        mock_session.client.assert_called_once_with("s3", region_name="ca-central-1")
        assert repo.bucket == settings.S3_MAU_BUCKET_NAME

    def test_assumes_role_when_role_arn_set(self) -> None:
        sts_response = {
            "Credentials": {
                "AccessKeyId": "ASIA_TEST",
                "SecretAccessKey": "test-secret",
                "SessionToken": "test-token",
                "Expiration": "2026-06-13T00:00:00Z",
            }
        }
        mock_sts = MagicMock()
        mock_sts.assume_role.return_value = sts_response

        mock_session = MagicMock()
        mock_session.client.return_value = mock_sts

        mock_s3 = MagicMock()

        role_arn = "arn:aws:iam::320765978564:role/cl-pp-mau-s3-read"

        with patch.object(settings, "AWS_S3_ROLE_ARN", role_arn):
            with patch.object(settings, "AWS_S3_PROFILE", ""):
                with patch("src.app.repositories.s3_repository.boto3.Session", return_value=mock_session):
                    with patch("src.app.repositories.s3_repository.boto3.client", return_value=mock_s3):
                        repo = S3Repository()
                        asyncio.run(repo._get_client())

        mock_session.client.assert_called_once_with("sts", region_name="ca-central-1")
        mock_sts.assume_role.assert_called_once_with(
            RoleArn=role_arn,
            RoleSessionName="S3RepositorySession",
            DurationSeconds=900,
        )

    def test_falls_back_to_session_client_when_assume_role_fails(self) -> None:
        mock_sts = MagicMock()
        mock_sts.assume_role.side_effect = ClientError(
            {"Error": {"Code": "AccessDenied", "Message": "Denied"}},
            "AssumeRole",
        )

        mock_s3 = MagicMock()
        mock_session = MagicMock()
        mock_session.client.side_effect = [mock_sts, mock_s3]

        role_arn = "arn:aws:iam::320765978564:role/cl-pp-mau-s3-read"

        with patch.object(settings, "AWS_S3_ROLE_ARN", role_arn):
            with patch.object(settings, "AWS_S3_PROFILE", ""):
                with patch("src.app.repositories.s3_repository.boto3.Session", return_value=mock_session):
                    repo = S3Repository()
                    client = asyncio.run(repo._get_client())

        assert client is mock_s3
        assert repo.client is mock_s3
        assert mock_session.client.mock_calls == [
            call("sts", region_name="ca-central-1"),
            call("s3", region_name="ca-central-1"),
        ]


class TestS3RepositoryGetCsvFile:
    @pytest.mark.asyncio
    async def test_returns_parsed_rows(self) -> None:
        csv_content = (
            "application_name,total_logins,unique_users,failed_logins,"
            "successful_logins,mtd_unique_users,date\n"
            "app-a,100,50,10,90,500,2026-06-11\n"
            "app-b,200,75,5,195,1000,2026-06-11\n"
        )
        mock_s3 = MagicMock()
        mock_s3.get_object.return_value = {
            "Body": MagicMock(**{"read.return_value": csv_content.encode("utf-8")}),
        }

        mock_session = MagicMock()
        mock_session.client.return_value = mock_s3

        rows = None
        with patch.object(settings, "AWS_S3_ROLE_ARN", ""):
            with patch.object(settings, "AWS_S3_PROFILE", ""):
                with patch("src.app.repositories.s3_repository.boto3.Session", return_value=mock_session):
                    repo = S3Repository()
                    rows = await repo.get_csv_file("date=2026-06-11/app_login_counts.csv")

        assert rows is not None
        assert len(rows) == 2
        assert rows[0].application_name == "app-a"
        assert rows[0].unique_users == 50
        assert rows[0].mtd_unique_users == 500
        assert rows[1].application_name == "app-b"
        assert rows[1].unique_users == 75
        assert rows[1].mtd_unique_users == 1000

        mock_s3.get_object.assert_called_once_with(
            Bucket=repo.bucket,
            Key=f"{repo.folder}date=2026-06-11/app_login_counts.csv",
        )

    @pytest.mark.asyncio
    async def test_returns_none_on_nosuchkey(self) -> None:
        from botocore.exceptions import ClientError

        mock_s3 = MagicMock()
        error = ClientError(
            {"Error": {"Code": "NoSuchKey", "Message": "Not found"}},
            "GetObject",
        )
        mock_s3.get_object.side_effect = error
        mock_s3.exceptions.NoSuchKey = ClientError

        mock_session = MagicMock()
        mock_session.client.return_value = mock_s3

        rows = None
        with patch.object(settings, "AWS_S3_ROLE_ARN", ""):
            with patch.object(settings, "AWS_S3_PROFILE", ""):
                with patch("src.app.repositories.s3_repository.boto3.Session", return_value=mock_session):
                    repo = S3Repository()
                    rows = await repo.get_csv_file("date=2026-06-11/missing.csv")

        assert rows is None
