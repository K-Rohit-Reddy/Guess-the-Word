from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from app.core.config import get_settings


def game_day(now: datetime | None = None) -> date:
    """The day the 3-games-per-day limit resets on, in the app's timezone.

    Postgres runs in UTC, so its current_date rolls over at 05:30 IST. Games are
    inserted with this value and every read filters on it, so writes and reads
    always agree on where midnight is.
    """
    now = now or datetime.now(timezone.utc)
    return now.astimezone(ZoneInfo(get_settings().GAME_TIMEZONE)).date()
