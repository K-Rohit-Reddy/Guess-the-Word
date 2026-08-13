import random
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.gameday import game_day
from app.models.user import User
from app.models.game import Game, Guess
from app.models.word import Word
from app.schemas.game import LetterResult, GuessResponse, GameResponse

MAX_DAILY_GAMES = 3
MAX_GUESSES = 5


async def start_game(user_id: int, db: AsyncSession) -> int:
    """Start a new game for the user."""
    today = game_day()
    
    # Check daily limit
    result = await db.execute(
        select(func.count(Game.id))
        .where(Game.user_id == user_id, Game.date == today)
    )
    games_today = result.scalar() or 0
    
    if games_today >= MAX_DAILY_GAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Daily limit reached. You can play a maximum of {MAX_DAILY_GAMES} games per day."
        )

    # Fetch words already played today
    result = await db.execute(
        select(Game.word_id)
        .where(Game.user_id == user_id, Game.date == today)
    )
    played_word_ids = result.scalars().all()

    # Pick a random word that hasn't been played today and is active
    query = select(Word).where(Word.is_active == True)
    if played_word_ids:
        query = query.where(Word.id.notin_(played_word_ids))
        
    result = await db.execute(query)
    available_words = result.scalars().all()
    
    if not available_words:
        # Fallback if somehow they've played all available words (unlikely with 20 words and 3/day limit, but safe)
        result = await db.execute(select(Word).where(Word.is_active == True))
        available_words = result.scalars().all()
        if not available_words:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No words available in the database."
            )
    
    selected_word = random.choice(available_words)
    
    # Create new game
    game = Game(user_id=user_id, word_id=selected_word.id)
    db.add(game)
    await db.commit()
    await db.refresh(game)
    
    return game.id


def evaluate_guess(target: str, guess: str) -> list[LetterResult]:
    """
    Evaluate a guess against the target word.
    First pass: identify exact matches (correct / green).
    Second pass: identify partial matches (present / orange).
    """
    results = [None] * 5
    target_letters_unmatched = []

    # First pass: Correct letters
    for i in range(5):
        if guess[i] == target[i]:
            results[i] = LetterResult(letter=guess[i], position=i, status="correct")
        else:
            target_letters_unmatched.append(target[i])
            
    # Second pass: Present letters
    for i in range(5):
        if results[i] is None:
            if guess[i] in target_letters_unmatched:
                results[i] = LetterResult(letter=guess[i], position=i, status="present")
                target_letters_unmatched.remove(guess[i])
            else:
                results[i] = LetterResult(letter=guess[i], position=i, status="absent")
                
    return results


async def submit_guess(game_id: int, guess_word: str, user_id: int, db: AsyncSession) -> GameResponse:
    """Process a user's guess for a game."""
    # Fetch game
    result = await db.execute(
        select(Game).where(Game.id == game_id, Game.user_id == user_id)
    )
    game = result.scalar_one_or_none()
    
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found."
        )
        
    if game.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Game is already finished (status: {game.status})."
        )
        
    # Fetch word
    result = await db.execute(select(Word).where(Word.id == game.word_id))
    word_obj = result.scalar_one_or_none()
    target_word = word_obj.word
    
    # Get current attempts
    result = await db.execute(
        select(func.count(Guess.id)).where(Guess.game_id == game.id)
    )
    attempt_count = result.scalar() or 0
    
    if attempt_count >= MAX_GUESSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Max guesses reached."
        )
        
    current_attempt = attempt_count + 1
    
    # Save the guess
    guess = Guess(game_id=game.id, guess_word=guess_word, attempt_number=current_attempt)
    db.add(guess)
    
    # Check win/loss
    if guess_word == target_word:
        game.status = "won"
    elif current_attempt == MAX_GUESSES:
        game.status = "lost"
        
    await db.commit()
    
    return await get_game_state(game.id, db)


async def get_game_state(game_id: int, db: AsyncSession) -> GameResponse:
    """Constructs the GameResponse by evaluating all guesses."""
    # Fetch game
    result = await db.execute(select(Game).where(Game.id == game_id))
    game = result.scalar_one_or_none()
    
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
        
    # Fetch word
    result = await db.execute(select(Word).where(Word.id == game.word_id))
    target_word = result.scalar_one().word
    
    # Fetch guesses
    result = await db.execute(
        select(Guess).where(Guess.game_id == game.id).order_by(Guess.attempt_number)
    )
    guesses = result.scalars().all()
    
    guess_responses = []
    for g in guesses:
        eval_results = evaluate_guess(target_word, g.guess_word)
        is_correct = all(r.status == "correct" for r in eval_results)
        guess_responses.append(
            GuessResponse(
                attempt_number=g.attempt_number,
                letters=eval_results,
                is_correct=is_correct
            )
        )
        
    return GameResponse(
        game_id=game.id,
        status=game.status,
        guesses=guess_responses,
        max_attempts=MAX_GUESSES,
        # Reveal the answer only once the game is over, never mid-play.
        word=target_word if game.status != "in_progress" else None,
    )
