from sqlalchemy import Column, Integer, String
from app.core.database import Base


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, autoincrement=True)
    word = Column(String(5), unique=True, nullable=False, index=True)
