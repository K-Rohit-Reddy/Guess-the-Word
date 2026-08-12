from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case

from app.core.database import get_db
from app.core.gameday import game_day
from app.core.security import get_current_user
from app.models.user import User
from app.models.game import Game, Guess
from app.schemas.game import StartGameResponse, GuessRequest, GameResponse, GameHistoryItem, PlayerStatsResponse
from app.services.game_service import start_game, submit_guess, get_game_state, MAX_DAILY_GAMES

router = APIRouter()


@router.post("/start", response_model=StartGameResponse)
async def api_start_game(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    game_id = await start_game(user.id, db)
    return StartGameResponse(game_id=game_id, message="Game started successfully")





@router.get("/current", response_model=GameResponse)
async def get_current_game(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get the active in-progress game if any."""
    today = game_day()
    result = await db.execute(
        select(Game.id).where(Game.user_id == user.id, Game.status == "in_progress", Game.date == today)
    )
    game_id = result.scalar_one_or_none()
    
    if not game_id:
        raise HTTPException(status_code=404, detail="No active game")
        
    return await get_game_state(game_id, db)





@router.get("/history", response_model=list[GameHistoryItem])
async def get_history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Game).where(Game.user_id == user.id, Game.status != "in_progress").order_by(Game.date.desc(), Game.created_at.desc())
    )
    games = result.scalars().all()
    
    history = []
    for g in games:
        state = await get_game_state(g.id, db)
        history.append(
            GameHistoryItem(
                game_id=g.id,
                status=g.status,
                date=g.date.isoformat(),
                attempts=len(state.guesses),
                guesses=state.guesses
            )
        )
    return history


@router.get("/stats", response_model=PlayerStatsResponse)
async def get_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Total games and wins
    result = await db.execute(
        select(func.count(Game.id), func.sum(case((Game.status == 'won', 1), else_=0)))
        .where(Game.user_id == user.id, Game.status != "in_progress")
    )
    total_games, total_wins = result.one()
    total_games = total_games or 0
    total_wins = int(total_wins or 0)
    
    win_rate = (total_wins / total_games * 100) if total_games > 0 else 0.0
    
    # Games today
    today = game_day()
    result = await db.execute(
        select(func.count(Game.id)).where(Game.user_id == user.id, Game.date == today)
    )
    games_today = result.scalar() or 0
    
    # Calculate streak (basic implementation: wins in a row chronologically)
    result = await db.execute(
        select(Game.status).where(Game.user_id == user.id, Game.status != "in_progress").order_by(Game.created_at.desc())
    )
    statuses = result.scalars().all()
    
    current_streak = 0
    for s in statuses:
        if s == 'won':
            current_streak += 1
        else:
            break
            
    best_streak = 0
    temp_streak = 0
    for s in reversed(statuses):
        if s == 'won':
            temp_streak += 1
            best_streak = max(best_streak, temp_streak)
        else:
            temp_streak = 0
            
    return PlayerStatsResponse(
        total_games=total_games,
        total_wins=total_wins,
        win_rate=win_rate,
        current_streak=current_streak,
        best_streak=best_streak,
        games_today=games_today,
        games_remaining_today=max(0, MAX_DAILY_GAMES - games_today)
    )

@router.post("/{game_id}/guess", response_model=GameResponse)
async def api_submit_guess(
    game_id: int, 
    guess_req: GuessRequest, 
    user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    return await submit_guess(game_id, guess_req.word, user.id, db)

@router.get("/{game_id}", response_model=GameResponse)
async def get_game(game_id: int, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Verify ownership
    result = await db.execute(select(Game).where(Game.id == game_id, Game.user_id == user.id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Game not found")
        
    return await get_game_state(game_id, db)
