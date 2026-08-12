from datetime import datetime
from pydantic import BaseModel, field_validator


class DailyReportResponse(BaseModel):
    date: str
    total_users: int
    total_games: int
    total_correct_guesses: int
    win_rate: float


class UserReportEntry(BaseModel):
    date: str
    words_tried: int
    correct_guesses: int
    win_rate: float


class UserReportResponse(BaseModel):
    user_id: int
    display_name: str
    username: str
    total_games: int
    total_wins: int
    win_rate: float
    entries: list[UserReportEntry]


class UserListItem(BaseModel):
    id: int
    display_name: str
    username: str
    role: str
    total_games: int
    total_wins: int
    win_rate: float
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class AdminUpdateUser(BaseModel):
    display_name: str | None = None
    username: str | None = None
    role: str | None = None
    password: str | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if len(v) < 5:
            raise ValueError("Username must be at least 5 characters")
        if not v.isalpha():
            raise ValueError("Username must contain only letters")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str | None) -> str | None:
        if v is not None and v not in ("player", "admin"):
            raise ValueError("Role must be 'player' or 'admin'")
        return v


class AddWordRequest(BaseModel):
    word: str

    @field_validator("word")
    @classmethod
    def validate_word(cls, v: str) -> str:
        v = v.upper()
        if len(v) != 5:
            raise ValueError("Word must be exactly 5 letters")
        if not v.isalpha():
            raise ValueError("Word must contain only letters")
        return v


class PlatformStatsResponse(BaseModel):
    total_players: int
    total_games: int
    total_wins: int
    overall_win_rate: float
    games_today: int
    wins_today: int
    active_players_today: int
