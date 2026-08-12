from datetime import datetime
from pydantic import BaseModel, field_validator


class GuessRequest(BaseModel):
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


class LetterResult(BaseModel):
    letter: str
    position: int
    status: str  # "correct", "present", "absent"


class GuessResponse(BaseModel):
    attempt_number: int
    letters: list[LetterResult]
    is_correct: bool


class GameResponse(BaseModel):
    game_id: int
    status: str
    guesses: list[GuessResponse]
    max_attempts: int = 5
    word: str | None = None  # revealed only when the game is over


class StartGameResponse(BaseModel):
    game_id: int
    message: str


class GameHistoryItem(BaseModel):
    game_id: int
    status: str
    date: str
    attempts: int
    guesses: list[GuessResponse]


class PlayerStatsResponse(BaseModel):
    total_games: int
    total_wins: int
    win_rate: float
    current_streak: int
    best_streak: int
    games_today: int
    games_remaining_today: int
