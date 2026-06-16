import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from ...core.config import settings

logger = logging.getLogger(__name__)
_TZ = ZoneInfo(settings.TIMEZONE)


def is_in_hour_window(start_hour: int, end_hour: int) -> bool:
    now_et = datetime.now(_TZ)
    in_window = start_hour <= now_et.hour <= end_hour
    if not in_window:
        logger.debug("Skipping: current ET hour %d outside window %d-%d", now_et.hour, start_hour, end_hour)
    return in_window
