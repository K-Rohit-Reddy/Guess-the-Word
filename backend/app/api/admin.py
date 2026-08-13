from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case

from app.core.database import get_db
from app.core.gameday import game_day
from app.core.security import require_admin, hash_password
from app.models.user import User
from app.models.game import Game, Guess
from app.models.word import Word
from app.schemas.admin import (
    DailyReportResponse, UserReportResponse, UserReportEntry, 
    UserListItem, AdminUpdateUser, AddWordRequest, PlatformStatsResponse
)
from app.schemas.auth import UserResponse

router = APIRouter()


@router.get("/stats", response_model=PlatformStatsResponse)
async def get_platform_stats(
    admin: User = Depends(require_admin), 
    db: AsyncSession = Depends(get_db)
):
    # Total players
    result = await db.execute(select(func.count(User.id)).where(User.role == "player"))
    total_players = result.scalar() or 0
    
    # Total games and wins
    result = await db.execute(
        select(func.count(Game.id), func.sum(case((Game.status == 'won', 1), else_=0)))
        .where(Game.status != "in_progress")
    )
    total_games, total_wins = result.one()
    total_games = total_games or 0
    total_wins = int(total_wins or 0)
    
    win_rate = (total_wins / total_games * 100) if total_games > 0 else 0.0
    
    # Today's stats
    today = game_day()
    
    result = await db.execute(
        select(func.count(func.distinct(Game.user_id)), func.count(Game.id), func.sum(case((Game.status == 'won', 1), else_=0)))
        .where(Game.date == today)
    )
    active_players_today, games_today, wins_today = result.one()
    
    return PlatformStatsResponse(
        total_players=total_players,
        total_games=total_games,
        total_wins=total_wins,
        overall_win_rate=win_rate,
        games_today=games_today or 0,
        wins_today=int(wins_today or 0),
        active_players_today=active_players_today or 0
    )


@router.get("/report/daily", response_model=DailyReportResponse)
async def get_daily_report(
    date: str = Query(..., description="YYYY-MM-DD"),
    admin: User = Depends(require_admin), 
    db: AsyncSession = Depends(get_db)
):
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    result = await db.execute(
        select(func.count(func.distinct(Game.user_id)), func.count(Game.id), func.sum(case((Game.status == 'won', 1), else_=0)))
        .where(Game.date == target_date)
    )
    total_users, total_games, total_wins = result.one()
    total_users = total_users or 0
    total_games = total_games or 0
    total_wins = int(total_wins or 0)
    win_rate = (total_wins / total_games * 100) if total_games > 0 else 0.0
    
    return DailyReportResponse(
        date=date,
        total_users=total_users,
        total_games=total_games,
        total_correct_guesses=total_wins,
        win_rate=win_rate
    )


@router.get("/report/daily-range", response_model=list[DailyReportResponse])
async def get_daily_report_range(
    from_date: str = Query(...),
    to_date: str = Query(...),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    try:
        f_date = datetime.strptime(from_date, "%Y-%m-%d").date()
        t_date = datetime.strptime(to_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    result = await db.execute(
        select(
            Game.date,
            func.count(func.distinct(Game.user_id)),
            func.count(Game.id),
            func.sum(case((Game.status == 'won', 1), else_=0))
        )
        .where(and_(Game.date >= f_date, Game.date <= t_date))
        .group_by(Game.date)
        .order_by(Game.date.desc())
    )
    
    reports = []
    for row in result:
        d, users, games, wins = row
        wins = int(wins or 0)
        win_rate = (wins / games * 100) if games > 0 else 0.0
        reports.append(
            DailyReportResponse(
                date=d.isoformat(),
                total_users=users,
                total_games=games,
                total_correct_guesses=wins,
                win_rate=win_rate
            )
        )
    return reports


@router.get("/report/user/{user_id}", response_model=UserReportResponse)
async def get_user_report(
    user_id: int,
    from_date: str | None = None,
    to_date: str | None = None,
    admin: User = Depends(require_admin), 
    db: AsyncSession = Depends(get_db)
):
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get total stats
    result = await db.execute(
        select(func.count(Game.id), func.sum(case((Game.status == 'won', 1), else_=0)))
        .where(Game.user_id == user_id, Game.status != "in_progress")
    )
    total_games, total_wins = result.one()
    total_games = total_games or 0
    total_wins = int(total_wins or 0)
    win_rate = (total_wins / total_games * 100) if total_games > 0 else 0.0
    
    # Get per-day breakdown
    query = select(
        Game.date,
        func.count(Game.id),
        func.sum(case((Game.status == 'won', 1), else_=0))
    ).where(Game.user_id == user_id, Game.status != "in_progress")
    
    if from_date and to_date:
        try:
            f = datetime.strptime(from_date, "%Y-%m-%d").date()
            t = datetime.strptime(to_date, "%Y-%m-%d").date()
            query = query.where(and_(Game.date >= f, Game.date <= t))
        except ValueError:
            pass
            
    query = query.group_by(Game.date).order_by(Game.date.desc())
    
    result = await db.execute(query)
    entries = []
    for row in result:
        d, games, wins = row
        wins = int(wins or 0)
        entries.append(
            UserReportEntry(
                date=d.isoformat(),
                words_tried=games,
                correct_guesses=wins,
                win_rate=(wins / games * 100) if games > 0 else 0.0
            )
        )
        
    return UserReportResponse(
        user_id=target_user.id,
        display_name=target_user.display_name,
        username=target_user.username,
        total_games=total_games,
        total_wins=total_wins,
        win_rate=win_rate,
        entries=entries
    )


@router.get("/users", response_model=list[UserListItem])
async def list_users(
    search: str | None = None,
    sort_by: str = "created_at",
    order: str = "desc",
    admin: User = Depends(require_admin), 
    db: AsyncSession = Depends(get_db)
):
    query = select(
        User.id, User.display_name, User.username, User.role, User.created_at,
        func.count(Game.id).label("total_games"),
        func.sum(case((Game.status == 'won', 1), else_=0)).label("total_wins")
    ).outerjoin(Game, and_(Game.user_id == User.id, Game.status != "in_progress")).group_by(User.id)
    
    if search:
        search = f"%{search}%"
        query = query.where(User.display_name.ilike(search) | User.username.ilike(search))
        
    # Python sorting to calculate win rate properly and simplify
    result = await db.execute(query)
    
    items = []
    for row in result:
        uid, dname, uname, role, cat, t_games, t_wins = row
        t_wins = int(t_wins or 0)
        items.append({
            "id": uid,
            "display_name": dname,
            "username": uname,
            "role": role,
            "created_at": cat,
            "total_games": t_games,
            "total_wins": t_wins,
            "win_rate": (t_wins / t_games * 100) if t_games > 0 else 0.0
        })
        
    reverse = order == "desc"
    
    if sort_by == "name":
        items.sort(key=lambda x: x["display_name"].lower(), reverse=reverse)
    elif sort_by == "username":
        items.sort(key=lambda x: x["username"].lower(), reverse=reverse)
    elif sort_by == "games":
        items.sort(key=lambda x: x["total_games"], reverse=reverse)
    elif sort_by == "wins":
        items.sort(key=lambda x: x["total_wins"], reverse=reverse)
    elif sort_by == "win_rate":
        items.sort(key=lambda x: x["win_rate"], reverse=reverse)
    else:
        items.sort(key=lambda x: x["created_at"], reverse=reverse)
        
    return [UserListItem(**item) for item in items]


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    req: AdminUpdateUser,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if req.username and req.username != target_user.username:
        result = await db.execute(select(User).where(User.username == req.username))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
        target_user.username = req.username
        
    if req.display_name:
        target_user.display_name = req.display_name
    if req.role:
        target_user.role = req.role
    if req.password:
        target_user.hashed_password = hash_password(req.password)
        
    await db.commit()
    await db.refresh(target_user)
    return target_user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted"}


@router.get("/words")
async def get_words(admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Word).where(Word.is_active == True).order_by(Word.word))
    words = result.scalars().all()
    return [{"id": w.id, "word": w.word} for w in words]


@router.post("/words")
async def add_word(req: AddWordRequest, admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Word).where(Word.word == req.word))
    existing_word = result.scalar_one_or_none()
    
    if existing_word:
        if not existing_word.is_active:
            # Reactivate soft-deleted word
            existing_word.is_active = True
            await db.commit()
            return {"id": existing_word.id, "word": existing_word.word}
        else:
            raise HTTPException(status_code=400, detail="Word already exists")
        
    word = Word(word=req.word)
    db.add(word)
    await db.commit()
    await db.refresh(word)
    return {"id": word.id, "word": word.word}


from uuid import UUID

@router.delete("/words/{word_id}")
async def delete_word(word_id: UUID, admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Word).where(Word.id == word_id))
    word = result.scalar_one_or_none()
    if not word or not word.is_active:
        raise HTTPException(status_code=404, detail="Word not found")
        
    word.is_active = False
    await db.commit()
    return {"message": "Word deleted"}
