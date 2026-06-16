import logging
from datetime import date, timedelta
from typing import Any, Optional

from redis.asyncio import Redis as AsyncRedis

from ..core.exceptions.cache_exceptions import MissingClientError
from ..repositories.s3_repository import S3Repository
from ..schemas.mau import MAUApplicationRecord, MAUCsvRow


class MAUService:
    def __init__(self, redis: Optional[AsyncRedis] = None) -> None:
        self.s3_repo = S3Repository()
        self._redis = redis

    @staticmethod
    def _cache_key(app_name: str) -> str:
        return f"mau:{app_name}"

    @staticmethod
    def _loaded_key(target_date: date) -> str:
        return f"mau:loaded:{target_date.isoformat()}"

    async def load_yesterday_mau_if_missing(self) -> bool:
        yesterday = date.today() - timedelta(days=1)
        return await self._load_date_if_missing(yesterday)

    async def load_mau_for_date(self, target_date: date) -> bool:
        return await self._load_date_if_missing(target_date)

    async def _load_date_if_missing(self, target_date: date) -> bool:
        loaded_key = self._loaded_key(target_date)
        exists = await self._cache().exists(loaded_key)
        if exists:
            logging.info("MAU data existed and skipped loading for date: %s", target_date)
            return False
        return await self._load_file_for_date(target_date)

    async def _load_file_for_date(self, file_date: date) -> bool:
        csv_key = f"date={file_date.isoformat()}/app_login_counts.csv"
        records = await self.s3_repo.get_csv_file(csv_key)
        if records is None:
            return False

        for r in records:
            app_key = self._cache_key(r.application_name)
            await self._cache().hset(app_key, r.date.isoformat(), r.to_cache_json())

        loaded_key = self._loaded_key(file_date)
        await self._cache().set(loaded_key, "1")
        return True

    async def get_mau_by_application(
        self,
        application_name: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> list[MAUApplicationRecord]:
        if end_date is None:
            end_date = date.today()
        if start_date is None:
            start_date = end_date - timedelta(days=30)

        app_key = self._cache_key(application_name)
        date_fields = [
            d.isoformat()
            for d in _date_range(start_date, end_date)
        ]
        if not date_fields:
            return []

        raw_values = await self._cache().hmget(app_key, date_fields)

        results: list[MAUApplicationRecord] = []
        for raw_val, d in zip(raw_values, date_fields):
            if raw_val is None:
                continue
            row = MAUCsvRow.from_cache_json(raw_val.decode())
            results.append(_row_to_record(row))

        return results

    def _cache(self) -> Any:
        if self._redis is not None:
            return self._redis
        from ..core.utils import cache as cache_mod

        if cache_mod.client is not None:
            return cache_mod.client
        raise MissingClientError("Redis cache client is not initialized")


def _date_range(start: date, end: date) -> list[date]:
    days = []
    current = start
    while current <= end:
        days.append(current)
        current += timedelta(days=1)
    return days


def _row_to_record(row: MAUCsvRow) -> MAUApplicationRecord:
    return MAUApplicationRecord(
        date=row.date,
        application_name=row.application_name,
        total_logins=row.total_logins,
        unique_users=row.unique_users,
        failed_logins=row.failed_logins,
        successful_logins=row.successful_logins,
        mtd_unique_users=row.mtd_unique_users,
    )
