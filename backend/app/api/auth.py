import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import hash_password, verify_password, generate_session_id, sign_session_id, get_current_user, SESSION_COOKIE_NAME
from app.core.config import get_settings
from app.models.user import User
from app.models.session import Session as SessionModel
from app.schemas.auth import UserRegister, UserLogin, UserResponse, LoginResponse

router = APIRouter()
settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if username exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
        
    hashed = hash_password(user_data.password)
    
    new_user = User(
        display_name=user_data.display_name,
        username=user_data.username,
        hashed_password=hashed,
        role="player"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=LoginResponse)
async def login(login_data: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == login_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
        
    # Create session
    session_id = generate_session_id()
    now = datetime.datetime.now(datetime.timezone.utc)
    expires = now + datetime.timedelta(seconds=settings.SESSION_MAX_AGE)
    
    session = SessionModel(
        id=session_id,
        user_id=user.id,
        created_at=now,
        expires_at=expires
    )
    db.add(session)
    await db.commit()
    
    # Set cookie
    signed_id = sign_session_id(session_id)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=signed_id,
        httponly=True,
        max_age=settings.SESSION_MAX_AGE,
        expires=expires.strftime("%a, %d-%b-%Y %T GMT"),
        samesite="lax",
        secure=False  # True in production with HTTPS
    )
    
    user_response = UserResponse.model_validate(user)
    return LoginResponse(message="Login successful", user=user_response)


@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    from app.core.security import unsign_session_id
    signed_cookie = request.cookies.get(SESSION_COOKIE_NAME)
    
    if signed_cookie:
        session_id = unsign_session_id(signed_cookie)
        if session_id:
            # Delete from DB
            result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
            session = result.scalar_one_or_none()
            if session:
                await db.delete(session)
                await db.commit()
                
    response.delete_cookie(SESSION_COOKIE_NAME)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user
