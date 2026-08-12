from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    SECRET_KEY: str = "change-me-in-production"
    DATABASE_URL: str  # required, lives only in backend/.env — never hardcode the password here
    SESSION_MAX_AGE: int = 86400  # 24 hours in seconds

    # Where "today" is, for the 3-games-per-day limit. Postgres runs in UTC, so
    # without this the daily reset lands at 05:30 IST instead of midnight.
    GAME_TIMEZONE: str = "Asia/Kolkata"

    ADMIN_USERNAME: str  # required — set in .env
    ADMIN_PASSWORD: str  # required — set in .env
    ADMIN_DISPLAY_NAME: str = "System Administrator"

    class Config:
        # Absolute, so running from any cwd still finds it now that DATABASE_URL is required.
        env_file = str(Path(__file__).resolve().parents[2] / ".env")
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
