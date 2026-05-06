"""Backfill script: set enabled=True for users with department_id not null."""
from sqlalchemy import text

from ..core.db.database import get_sync_engine


def run():
    engine = get_sync_engine()
    with engine.begin() as conn:
        result = conn.execute(text("UPDATE \"user\" SET enabled = true WHERE department_id IS NOT NULL AND enabled = false"))
        print(f"Updated {result.rowcount} users to enabled=true")


if __name__ == "__main__":
    run()
