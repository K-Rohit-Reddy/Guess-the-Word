from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user, verify_password, hash_password
from app.models.user import User
from app.schemas.settings import UsernameCheckResponse, UpdateProfileRequest, ChangePasswordRequest
from app.schemas.auth import UserResponse

router = APIRouter()


@router.get("/check-username/{username}", response_model=UsernameCheckResponse)
async def check_username(username: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == username))
    existing = result.scalar_one_or_none()
    
    return UsernameCheckResponse(username=username, available=existing is None)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    req: UpdateProfileRequest, 
    user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    if req.username and req.username != user.username:
        # Verify availability again
        result = await db.execute(select(User).where(User.username == req.username))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = req.username
        
    if req.display_name:
        user.display_name = req.display_name
        
    await db.commit()
    await db.refresh(user)
    
    return user


@router.put("/password")
async def update_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(req.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    user.hashed_password = hash_password(req.new_password)
    await db.commit()
    
    return {"message": "Password updated successfully"}
