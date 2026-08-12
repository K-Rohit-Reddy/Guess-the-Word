from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.gameday import game_day


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=False)
    status = Column(String(15), default="in_progress", nullable=False)  # in_progress, won, lost
    # default (app timezone) wins for ORM inserts; server_default only backs up raw SQL.
    date = Column(Date, default=game_day, server_default=func.current_date(), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Guess(Base):
    __tablename__ = "guesses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False, index=True)
    guess_word = Column(String(5), nullable=False)
    attempt_number = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
